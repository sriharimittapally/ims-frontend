import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, NotificationBellComponent],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss']
})
export class TopbarComponent {
  @Input() pageTitle = '';
  @Input() sidebarCollapsed = false;
  @Output() toggleSidebar = new EventEmitter<void>();

  constructor(public theme: ThemeService, public auth: AuthService) {}

  getPortalName(): string {
    const m: Record<string,string> = {
      ADMIN:'Admin Portal', MANAGER:'Manager Portal',
      STAFF:'Staff Portal', SUPPLIER:'Supplier Portal'
    };
    return m[this.auth.getRole() ?? ''] ?? 'IMS Portal';
  }

  getRoleColor(): string {
    const m: Record<string,string> = {
      ADMIN:'#ef4444', MANAGER:'#6366f1', STAFF:'#10b981', SUPPLIER:'#f59e0b'
    };
    return m[this.auth.getRole() ?? ''] ?? '#6366f1';
  }
}