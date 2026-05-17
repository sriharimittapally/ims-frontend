import { Component, OnInit, OnDestroy, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit, OnDestroy {
  menuOpen = false;
  scrolled = false;
  currentYear = new Date().getFullYear();

  // Animated counters
  counters = [
    { label: 'Warehouses Managed',   end: 500,    suffix: '+', current: 0, icon: 'bi-building' },
    { label: 'Products Tracked',     end: 50000,  suffix: '+', current: 0, icon: 'bi-box-seam' },
    { label: 'Orders Processed',     end: 1200000, suffix: '+', current: 0, icon: 'bi-cart-check' },
    { label: 'Uptime Guaranteed',    end: 99.9,   suffix: '%', current: 0, icon: 'bi-shield-check' }
  ];

  features = [
    {
      icon: 'bi-speedometer2',
      gradient: 'grad-indigo',
      title: 'Real-Time Dashboard',
      desc: 'Live KPIs, stock levels, and movement trends across every warehouse — refreshed in real time.'
    },
    {
      icon: 'bi-truck',
      gradient: 'grad-emerald',
      title: 'Supplier Portal',
      desc: 'External suppliers register, link products with custom pricing, and manage purchase orders independently.'
    },
    {
      icon: 'bi-archive',
      gradient: 'grad-amber',
      title: 'Smart Stock Control',
      desc: 'Auto-reserve stock on PO creation, track movements end-to-end, and trigger reorder alerts proactively.'
    },
    {
      icon: 'bi-bar-chart-line',
      gradient: 'grad-rose',
      title: 'Deep Analytics',
      desc: 'Multi-dimensional reports: stock trends, supplier performance, staff activity, top products, and more.'
    },
    {
      icon: 'bi-shield-lock',
      gradient: 'grad-cyan',
      title: 'Role-Based Security',
      desc: 'Granular access control across Admin, Manager, Staff, and Supplier — every action is authenticated and scoped.'
    },
    {
      icon: 'bi-arrow-left-right',
      gradient: 'grad-violet',
      title: 'Full Audit Trail',
      desc: 'Every stock movement is timestamped and attributed — from PO receipt to final stock issue.'
    }
  ];

  roles = [
    {
      name: 'Administrator',
      icon: 'bi-shield-fill',
      color: '#ef4444',
      bgGrad: 'grad-rose-card',
      capabilities: [
        'Manage all users, warehouses, categories and products',
        'Approve or reject supplier registrations',
        'View system-wide inventory and analytics',
        'Full purchase order visibility across all warehouses'
      ]
    },
    {
      name: 'Manager',
      icon: 'bi-person-badge-fill',
      color: '#6366f1',
      bgGrad: 'grad-indigo-card',
      capabilities: [
        'Manage staff within own warehouse',
        'Create and send purchase orders to suppliers',
        'Approve or reject stock issue requests',
        'Warehouse-level reports and movement tracking'
      ]
    },
    {
      name: 'Staff',
      icon: 'bi-person-fill-gear',
      color: '#10b981',
      bgGrad: 'grad-emerald-card',
      capabilities: [
        'Receive incoming purchase orders into inventory',
        'Create and submit stock issue requests',
        'View current warehouse stock levels',
        'Personal issue history and trend reports'
      ]
    },
    {
      name: 'Supplier',
      icon: 'bi-truck',
      color: '#f59e0b',
      bgGrad: 'grad-amber-card',
      capabilities: [
        'Self-register and complete company profile',
        'Browse and link products by approved categories',
        'Set purchase pricing and lead time per product',
        'Accept, reject, and ship purchase orders'
      ]
    }
  ];

  workflow = [
    { step: '01', icon: 'bi-person-plus',     title: 'Onboard & Configure',  desc: 'Admin creates warehouses, categories, products. Suppliers self-register and submit for approval.' },
    { step: '02', icon: 'bi-link-45deg',      title: 'Link & Price',         desc: 'Approved suppliers browse products in their categories and link with custom pricing and lead times.' },
    { step: '03', icon: 'bi-cart-plus',       title: 'Order & Fulfil',       desc: 'Managers create POs and send to suppliers. Suppliers accept, reject, or mark as shipped.' },
    { step: '04', icon: 'bi-inbox-fill',      title: 'Receive & Update',     desc: 'Staff receives shipped POs. Inventory auto-updates with stock movements recorded and timestamped.' },
    { step: '05', icon: 'bi-arrow-left-right', title: 'Issue & Track',       desc: 'Staff creates stock issues, manager approves. Stock reserved and issued with full audit trail.' },
    { step: '06', icon: 'bi-bar-chart-fill',  title: 'Analyse & Optimise',   desc: 'All roles access role-scoped analytics — trends, performance, and reorder intelligence.' }
  ];

  private animationFrame: number | null = null;
  private counterStarted = false;

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled = window.scrollY > 40;
    this.tryStartCounters();
  }

  ngOnInit(): void {
    setTimeout(() => this.tryStartCounters(), 300);
  }

  ngOnDestroy(): void {
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
  }

  private tryStartCounters(): void {
    if (this.counterStarted) return;
    const statsEl = document.getElementById('stats-section');
    if (!statsEl) return;
    const rect = statsEl.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
      this.counterStarted = true;
      this.animateCounters();
    }
  }

  private animateCounters(): void {
    const duration = 2000;
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      this.counters.forEach(c => {
        c.current = parseFloat((c.end * ease).toFixed(c.end < 100 ? 1 : 0));
      });
      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      } else {
        this.counters.forEach(c => c.current = c.end);
      }
    };
    this.animationFrame = requestAnimationFrame(animate);
  }

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    this.menuOpen = false;
  }
}