import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

export type NotifType =
  | 'LOW_STOCK'
  | 'PO_UPDATE'
  | 'SI_UPDATE'
  | 'SI_SUBMITTED'
  | 'SI_APPROVED'
  | 'SI_ISSUED'
  | 'SI_REJECTED'
  | 'SUPPLIER_APPROVAL'
  | 'SYSTEM';

export interface AppNotification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  route?: string;
  read: boolean;
  createdAt: string;
  // Which roles should receive this notification
  targetRoles?: ('ADMIN' | 'MANAGER' | 'STAFF' | 'SUPPLIER')[];
}

// ── BroadcastChannel event envelope ────────────────────────────────────────────
interface BroadcastEvent {
  notif: AppNotification;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  // Per-user storage key so each role's inbox is separate
  private get KEY(): string {
    return `ims_notif_${this.currentRole()}`;
  }

  private readonly MAX = 60;

  notifications = signal<AppNotification[]>([]);
  unreadCount = signal<number>(0);

  // BroadcastChannel lets tabs/windows of different users exchange events
  private readonly channel =
    typeof BroadcastChannel !== 'undefined'
      ? new BroadcastChannel('ims_notifications')
      : null;

  constructor(private router: Router) {
    this.load();
    this.listenBroadcast();
  }

  // ── Role helpers ─────────────────────────────────────────────────────────────

  private currentRole(): string {
    try {
      const token = localStorage.getItem('ims_token');
      if (!token) return 'UNKNOWN';
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role ?? 'UNKNOWN';
    } catch {
      return 'UNKNOWN';
    }
  }

  // ── Storage ──────────────────────────────────────────────────────────────────

  private load(): void {
    try {
      const raw = localStorage.getItem(this.KEY);
      const all: AppNotification[] = raw ? JSON.parse(raw) : [];
      this.notifications.set(all);
      this.unreadCount.set(all.filter((n) => !n.read).length);
    } catch {
      this.notifications.set([]);
      this.unreadCount.set(0);
    }
  }

  private save(list: AppNotification[]): void {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(list));
    } catch {}
    this.notifications.set(list);
    this.unreadCount.set(list.filter((n) => !n.read).length);
  }

  // ── BroadcastChannel ─────────────────────────────────────────────────────────

  /**
   * Listen for notifications broadcast from other tabs/portals.
   * When another portal (e.g. manager) creates a PO, it broadcasts the
   * notification with targetRoles=['SUPPLIER']. The supplier tab picks it up
   * and stores it in its own inbox.
   */
  private listenBroadcast(): void {
    if (!this.channel) return;
    this.channel.onmessage = (event: MessageEvent<BroadcastEvent>) => {
      const notif = event.data?.notif;
      if (!notif) return;
      const role = this.currentRole() as
        | 'ADMIN'
        | 'MANAGER'
        | 'STAFF'
        | 'SUPPLIER';
      // Only store if this user's role is in targetRoles (or targetRoles not set = broadcast to all)
      if (!notif.targetRoles || notif.targetRoles.includes(role)) {
        this.storeLocally(notif);
      }
    };
  }

  private storeLocally(notif: AppNotification): void {
    const list = this.notifications();
    // Deduplicate by id
    if (list.some((n) => n.id === notif.id)) return;
    const updated = [{ ...notif, read: false }, ...list].slice(0, this.MAX);
    this.save(updated);
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  /**
   * Add a notification.
   * - It is stored in the current user's inbox.
   * - If targetRoles includes other roles, it is broadcast so those portals
   *   receive it too (works across tabs in same browser session).
   */
  add(notif: Omit<AppNotification, 'id' | 'read' | 'createdAt'>): void {
    const newItem: AppNotification = {
      ...notif,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      read: false,
      createdAt: new Date().toISOString(),
    };

    // Store for current user
    const currentRole = this.currentRole() as
      | 'ADMIN'
      | 'MANAGER'
      | 'STAFF'
      | 'SUPPLIER';
    if (!newItem.targetRoles || newItem.targetRoles.includes(currentRole)) {
      const list = this.notifications();
      this.save([newItem, ...list].slice(0, this.MAX));
    }

    // Broadcast to other tabs so they can pick it up
    this.channel?.postMessage({ notif: newItem } satisfies BroadcastEvent);
  }

  markRead(id: string): void {
    this.save(
      this.notifications().map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }

  markAllRead(): void {
    this.save(this.notifications().map((n) => ({ ...n, read: true })));
  }

  remove(id: string): void {
    this.save(this.notifications().filter((n) => n.id !== id));
  }

  clearAll(): void {
    this.save([]);
  }

  navigate(notif: AppNotification): void {
    this.markRead(notif.id);
    if (notif.route) this.router.navigate([notif.route]);
  }

  // ── Display helpers ───────────────────────────────────────────────────────────

  getTypeIcon(type: NotifType): string {
    const m: Record<string, string> = {
      LOW_STOCK: 'bi-exclamation-triangle-fill',
      PO_UPDATE: 'bi-cart-check-fill',
      SI_UPDATE: 'bi-arrow-left-right',
      SI_SUBMITTED: 'bi-send-fill',
      SI_APPROVED: 'bi-check-circle-fill',
      SI_ISSUED: 'bi-check2-all',
      SI_REJECTED: 'bi-x-circle-fill',
      SUPPLIER_APPROVAL: 'bi-person-check-fill',
      SYSTEM: 'bi-info-circle-fill',
    };
    return m[type] ?? 'bi-bell-fill';
  }

  getTypeColor(type: NotifType): string {
    const m: Record<string, string> = {
      LOW_STOCK: 'var(--ims-danger)',
      PO_UPDATE: 'var(--ims-info)',
      SI_SUBMITTED: 'var(--ims-warning)',
      SI_APPROVED: 'var(--ims-info)',
      SI_ISSUED: 'var(--ims-success)',
      SI_REJECTED: 'var(--ims-danger)',
      SUPPLIER_APPROVAL: 'var(--ims-primary)',
      SYSTEM: 'var(--ims-text-muted)',
      SI_UPDATE: 'var(--ims-secondary)',
    };
    return m[type] ?? 'var(--ims-primary)';
  }

  timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
    });
  }
}
