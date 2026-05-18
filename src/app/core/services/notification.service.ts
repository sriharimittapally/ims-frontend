import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

export interface AppNotification {
  id: string;
  type: 'LOW_STOCK' | 'PO_UPDATE' | 'SI_UPDATE' | 'SI_SUBMITTED' | 'SI_APPROVED' |
        'SI_ISSUED' | 'SI_REJECTED' | 'SUPPLIER_APPROVAL' | 'SYSTEM';
  title: string;
  message: string;
  route?: string;
  read: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly KEY = 'ims_notifications';
  private readonly MAX = 50;

  notifications = signal<AppNotification[]>([]);
  unreadCount   = signal<number>(0);

  constructor(private router: Router) {
    this.load();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(this.KEY);
      const all: AppNotification[] = raw ? JSON.parse(raw) : [];
      this.notifications.set(all);
      this.unreadCount.set(all.filter(n => !n.read).length);
    } catch {
      this.notifications.set([]);
      this.unreadCount.set(0);
    }
  }

  private save(list: AppNotification[]): void {
    localStorage.setItem(this.KEY, JSON.stringify(list));
    this.notifications.set(list);
    this.unreadCount.set(list.filter(n => !n.read).length);
  }

  add(notif: Omit<AppNotification, 'id' | 'read' | 'createdAt'>): void {
    const list = this.notifications();
    const newItem: AppNotification = {
      ...notif,
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      read: false,
      createdAt: new Date().toISOString()
    };
    const updated = [newItem, ...list].slice(0, this.MAX);
    this.save(updated);
  }

  markRead(id: string): void {
    const updated = this.notifications().map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    this.save(updated);
  }

  markAllRead(): void {
    const updated = this.notifications().map(n => ({ ...n, read: true }));
    this.save(updated);
  }

  remove(id: string): void {
    const updated = this.notifications().filter(n => n.id !== id);
    this.save(updated);
  }

  clearAll(): void {
    this.save([]);
  }

  navigate(notif: AppNotification): void {
    this.markRead(notif.id);
    if (notif.route) this.router.navigate([notif.route]);
  }

  getTypeIcon(type: AppNotification['type']): string {
    const m: Record<string, string> = {
      LOW_STOCK: 'bi-exclamation-triangle-fill',
      PO_UPDATE: 'bi-cart-check-fill',
      SI_UPDATE: 'bi-arrow-left-right',
      SI_SUBMITTED: 'bi-send-fill',
      SI_APPROVED: 'bi-check-circle-fill',
      SI_ISSUED: 'bi-check2-all',
      SI_REJECTED: 'bi-x-circle-fill',
      SUPPLIER_APPROVAL: 'bi-person-check-fill',
      SYSTEM: 'bi-info-circle-fill'
    };
    return m[type] ?? 'bi-bell-fill';
  }

  getTypeColor(type: AppNotification['type']): string {
    const m: Record<string, string> = {
      LOW_STOCK: 'var(--ims-danger)',
      PO_UPDATE: 'var(--ims-info)',
      SI_SUBMITTED: 'var(--ims-warning)',
      SI_APPROVED: 'var(--ims-info)',
      SI_ISSUED: 'var(--ims-success)',
      SI_REJECTED: 'var(--ims-danger)',
      SUPPLIER_APPROVAL: 'var(--ims-primary)',
      SYSTEM: 'var(--ims-text-muted)'
    };
    return m[type] ?? 'var(--ims-primary)';
  }

  timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }
}