import { Component, signal } from '@angular/core';
import { RouterOutlet, NavigationEnd, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { filter } from 'rxjs';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule, SidebarComponent, TopbarComponent],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent {
  sidebarCollapsed = signal(false);
  mobileSidebarOpen = signal(false);
  pageTitle = signal('Dashboard');

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => {
      // Auto-close mobile sidebar on navigation
      this.mobileSidebarOpen.set(false);
      // Derive page title from URL
      const url = this.router.url.split('/').pop() ?? '';
      const title = url.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      this.pageTitle.set(title || 'Dashboard');
    });
  }

  toggleSidebar(): void {
    if (window.innerWidth <= 768) {
      this.mobileSidebarOpen.update(v => !v);
    } else {
      this.sidebarCollapsed.update(v => !v);
    }
  }

  closeMobileSidebar(): void { this.mobileSidebarOpen.set(false); }
}