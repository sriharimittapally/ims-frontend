import { Component, OnInit, OnDestroy, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit, OnDestroy {
  menuOpen = false;
  scrolled = false;
  currentYear = new Date().getFullYear();

  // Modal state
  showModal: 'login' | 'register' | null = null;
  authLoading = false;
  showPassword = false;

  // Forms
  loginForm: FormGroup;
  registerForm: FormGroup;
  loginError = '';

  // Counters
  counters = [
    { label: 'Warehouses Managed', end: 500,    suffix: '+', current: 0, icon: 'bi-building' },
    { label: 'Products Tracked',   end: 50000,  suffix: '+', current: 0, icon: 'bi-box-seam' },
    { label: 'POs Processed',      end: 120000, suffix: '+', current: 0, icon: 'bi-cart-check' },
    { label: 'Uptime',             end: 99.9,   suffix: '%', current: 0, icon: 'bi-shield-check' }
  ];

  features = [
    { icon: 'bi-speedometer2',    color: '#6366f1', title: 'Real-Time Dashboards',   desc: 'Role-specific KPIs, live stock levels, and movement analytics.' },
    { icon: 'bi-truck',           color: '#10b981', title: 'Supplier Portal',         desc: 'Self-service supplier registration, product linking and PO management.' },
    { icon: 'bi-archive',         color: '#f59e0b', title: 'Smart Inventory',        desc: 'Auto low-stock alerts, reorder drafts, and full movement tracking.' },
    { icon: 'bi-bar-chart-line',  color: '#ef4444', title: 'Rich Analytics',          desc: 'Trend charts, supplier performance, staff activity and custom reports.' },
    { icon: 'bi-shield-lock',     color: '#06b6d4', title: 'Role-Based Security',     desc: 'JWT-authenticated access with admin, manager, staff and supplier scoping.' },
    { icon: 'bi-arrow-left-right', color: '#8b5cf6', title: 'Full Audit Trail',      desc: 'Every movement timestamped — PO receipts to final stock issues.' }
  ];

  roles = [
    { name: 'Administrator', icon: 'bi-shield-fill', color: '#ef4444', desc: 'Full system control — users, warehouses, products, suppliers, and all analytics.' },
    { name: 'Manager',       icon: 'bi-person-badge-fill', color: '#6366f1', desc: 'Warehouse operations — POs, stock issue approvals, staff management, and reports.' },
    { name: 'Staff',         icon: 'bi-person-fill-gear', color: '#10b981', desc: 'Daily operations — receive POs, create stock issues, view inventory.' },
    { name: 'Supplier',      icon: 'bi-truck', color: '#f59e0b', desc: 'External portal — product linking, pricing, and purchase order management.' }
  ];

  private animationFrame: number | null = null;
  private counterStarted = false;

  constructor(
    public theme: ThemeService,
    private auth: AuthService,
    private router: Router,
    private toastr: ToastrService,
    private fb: FormBuilder
  ) {
    this.loginForm = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    this.registerForm = this.fb.group({
      name:     ['', Validators.required],
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      phone:    ['']
    });
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled = window.scrollY > 40;
    this.tryStartCounters();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { this.showModal = null; }

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) { this.auth.redirectByRole(); return; }
    setTimeout(() => this.tryStartCounters(), 500);
  }

  ngOnDestroy(): void {
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
  }

  openLogin():    void { this.showModal = 'login';    this.loginForm.reset();    }
  openRegister(): void { this.showModal = 'register'; this.registerForm.reset(); }
  closeModal():   void { this.showModal = null; }


submitLogin(): void {
  if (this.loginForm.invalid) { this.loginForm.markAllAsTouched(); return; }
  this.authLoading = true;
  this.loginError = '';
  this.auth.login(this.loginForm.value).subscribe({
    next: () => {
      this.authLoading = false;
      this.loginError = '';
      this.toastr.success('Welcome back!');
      this.auth.redirectByRole();
    },
    error: (err) => {
      this.authLoading = false;
      if (err.status === 401) {
        this.loginError = 'Invalid email or password. Please check your credentials and try again.';
      } else if (err.status === 403) {
        this.loginError = 'Your account has been deactivated. Please contact your administrator.';
      } else {
        this.loginError = 'Unable to connect to the server. Please try again.';
      }
    }
  });
}

  submitRegister(): void {
    if (this.registerForm.invalid) { this.registerForm.markAllAsTouched(); return; }
    this.authLoading = true;
    this.auth.registerSupplier(this.registerForm.value).subscribe({
      next: (res) => {
        this.authLoading = false;
        this.toastr.success(`Registration successful! Your code: ${res.data}. Please sign in.`, 'Welcome', { timeOut: 6000 });
        this.showModal = 'login';
      },
      error: () => { this.authLoading = false; }
    });
  }

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    this.menuOpen = false;
  }

  private tryStartCounters(): void {
    if (this.counterStarted) return;
    const el = document.getElementById('stats-section');
    if (!el) return;
    if (el.getBoundingClientRect().top < window.innerHeight) {
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
      this.counters.forEach(c => c.current = parseFloat((c.end * ease).toFixed(c.end < 100 ? 1 : 0)));
      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      } else {
        this.counters.forEach(c => c.current = c.end);
      }
    };
    this.animationFrame = requestAnimationFrame(animate);
  }

  get lf() { return this.loginForm.controls; }
  get rf() { return this.registerForm.controls; }
}