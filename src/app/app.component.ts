import { Component } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ChatbotComponent } from './shared/components/chatbot/chatbot.component';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, ChatbotComponent],
  template: `
    <router-outlet />
    <app-chatbot *ngIf="auth.isLoggedIn()" />
  `
})
export class AppComponent {
  constructor(public auth: AuthService) {}
}