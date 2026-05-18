import { Component, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, AppNotification } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.scss']
})
export class NotificationBellComponent {
  isOpen = false;

  constructor(public svc: NotificationService, private el: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDocClick(e: Event): void {
    if (!this.el.nativeElement.contains(e.target)) this.isOpen = false;
  }

  toggle(): void { this.isOpen = !this.isOpen; }

  onNotifClick(n: AppNotification): void {
    this.svc.navigate(n);
    this.isOpen = false;
  }

  clearAll(): void { this.svc.clearAll(); }
  markAllRead(): void { this.svc.markAllRead(); }
  remove(e: Event, id: string): void { e.stopPropagation(); this.svc.remove(id); }
}