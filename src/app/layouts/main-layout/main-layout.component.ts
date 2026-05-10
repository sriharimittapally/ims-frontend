import { Component, signal } from '@angular/core';
import { RouterOutlet, ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { filter, map } from 'rxjs';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule, SidebarComponent, TopbarComponent],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent {
  sidebarCollapsed = signal(false);
  pageTitle = signal('Dashboard');

  constructor(private router: Router, private route: ActivatedRoute) {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => {
        const url = this.router.url.split('/').pop() ?? '';
        return url.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      })
    ).subscribe(title => this.pageTitle.set(title));
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }
}