import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly THEME_KEY = 'ims_theme';
  isDark = signal<boolean>(false);

  constructor() {
    const saved = localStorage.getItem(this.THEME_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = saved ? saved === 'dark' : prefersDark;
    this.setTheme(dark);
  }

  toggle(): void {
    this.setTheme(!this.isDark());
  }

  private setTheme(dark: boolean): void {
    this.isDark.set(dark);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem(this.THEME_KEY, dark ? 'dark' : 'light');
  }
}