import { Component, OnInit, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface ChatMessage {
  role: 'bot' | 'user';
  text: string;
  actions?: ChatAction[];
  time: string;
}

interface ChatAction {
  label: string;
  route?: string;
  command?: string;
  icon: string;
}

interface BotRule {
  keywords: string[];
  response: string;
  actions?: ChatAction[];
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss']
})
export class ChatbotComponent implements OnInit, AfterViewChecked {
  @ViewChild('messageList') messageList!: ElementRef;

  isOpen = signal(false);
  isTyping = signal(false);
  messages = signal<ChatMessage[]>([]);
  inputText = '';
  private shouldScroll = false;

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    setTimeout(() => this.greet(), 800);
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  private scrollToBottom(): void {
    try {
      this.messageList.nativeElement.scrollTop = this.messageList.nativeElement.scrollHeight;
    } catch {}
  }

  toggle(): void { this.isOpen.update(v => !v); }

  private now(): string {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private addMessage(msg: ChatMessage): void {
    this.messages.update(m => [...m, msg]);
    this.shouldScroll = true;
  }

  private greet(): void {
    const role = this.auth.getRole();
    const name = this.auth.currentUser()?.name?.split(' ')[0] ?? 'there';
    const greetings: Record<string, string> = {
      ADMIN: `Hello ${name}! 👋 I'm your IMS assistant. I can help you manage users, review suppliers, check inventory alerts, and navigate the system. What do you need?`,
      MANAGER: `Hi ${name}! 👋 I'm here to help you manage your warehouse. I can help with purchase orders, stock issues, staff management, and reports. What can I do for you?`,
      STAFF: `Hey ${name}! 👋 I'm your IMS assistant. I can help you with stock issues, receiving POs, checking inventory, and more. What do you need?`,
      SUPPLIER: `Hello ${name}! 👋 I'm here to help with your purchase orders, product linking, and account status. How can I assist you?`
    };

    const quickActions = this.getQuickActions();
    this.addMessage({
      role: 'bot',
      text: greetings[role ?? ''] ?? `Hello ${name}! How can I help you today?`,
      actions: quickActions,
      time: this.now()
    });
  }

  private getQuickActions(): ChatAction[] {
    const role = this.auth.getRole();
    const actionMap: Record<string, ChatAction[]> = {
      ADMIN: [
        { label: 'Dashboard', icon: 'bi-speedometer2', route: '/admin/dashboard' },
        { label: 'Pending Suppliers', icon: 'bi-truck', route: '/admin/suppliers' },
        { label: 'Low Stock', icon: 'bi-exclamation-triangle', route: '/admin/inventory' },
        { label: 'Reports', icon: 'bi-bar-chart-line', route: '/admin/reports' }
      ],
      MANAGER: [
        { label: 'Pending Issues', icon: 'bi-clipboard-check', route: '/manager/stock-issues' },
        { label: 'Create PO', icon: 'bi-cart-plus', route: '/manager/purchase-orders' },
        { label: 'My Inventory', icon: 'bi-archive', route: '/manager/inventory' },
        { label: 'Staff', icon: 'bi-people', route: '/manager/staff' }
      ],
      STAFF: [
        { label: 'New Issue', icon: 'bi-plus-circle', route: '/staff/stock-issues' },
        { label: 'Receive PO', icon: 'bi-cart-check', route: '/staff/purchase-orders' },
        { label: 'Inventory', icon: 'bi-archive', route: '/staff/inventory' },
        { label: 'My Reports', icon: 'bi-bar-chart-line', route: '/staff/reports' }
      ],
      SUPPLIER: [
        { label: 'My POs', icon: 'bi-cart-check', route: '/supplier/purchase-orders' },
        { label: 'My Products', icon: 'bi-box-seam', route: '/supplier/my-products' },
        { label: 'My Reports', icon: 'bi-bar-chart-line', route: '/supplier/reports' },
        { label: 'Profile', icon: 'bi-person-circle', route: '/supplier/profile' }
      ]
    };
    return actionMap[role ?? ''] ?? [];
  }

  sendMessage(): void {
    const text = this.inputText.trim();
    if (!text) return;
    this.inputText = '';

    this.addMessage({ role: 'user', text, time: this.now() });
    this.isTyping.set(true);

    setTimeout(() => {
      this.isTyping.set(false);
      const response = this.getResponse(text.toLowerCase());
      this.addMessage({ role: 'bot', text: response.text, actions: response.actions, time: this.now() });
    }, 600 + Math.random() * 400);
  }

  onActionClick(action: ChatAction): void {
    if (action.route) {
      this.router.navigate([action.route]);
      this.isOpen.set(false);
    }
    if (action.command) {
      this.inputText = action.command;
      this.sendMessage();
    }
  }

  private getResponse(text: string): { text: string; actions?: ChatAction[] } {
    const role = this.auth.getRole() ?? '';

    const rules: BotRule[] = this.getRulesForRole(role);

    for (const rule of rules) {
      if (rule.keywords.some(k => text.includes(k))) {
        return { text: rule.response, actions: rule.actions };
      }
    }

    // Generic fallback
    return {
      text: `I'm not sure about that. Here are some things I can help you with:`,
      actions: this.getQuickActions()
    };
  }

  private getRulesForRole(role: string): BotRule[] {
    const common: BotRule[] = [
      {
        keywords: ['hello', 'hi', 'hey', 'help'],
        response: `I'm here! Here are quick actions for you:`,
        actions: this.getQuickActions()
      },
      {
        keywords: ['logout', 'sign out', 'exit'],
        response: `To logout, click your profile avatar in the sidebar and choose "Logout". See you next time! 👋`
      },
      {
        keywords: ['theme', 'dark', 'light', 'mode'],
        response: `You can toggle between dark and light mode using the moon/sun icon in the top bar. 🌙`
      }
    ];

    const adminRules: BotRule[] = [
      {
        keywords: ['supplier', 'approve', 'pending supplier'],
        response: `You can review and approve pending suppliers in the Suppliers section.`,
        actions: [{ label: 'Go to Suppliers', icon: 'bi-truck', route: '/admin/suppliers' }]
      },
      {
        keywords: ['user', 'manager', 'staff', 'create user', 'add user'],
        response: `You can create managers and staff from the Users section.`,
        actions: [{ label: 'Manage Users', icon: 'bi-people', route: '/admin/users' }]
      },
      {
        keywords: ['warehouse', 'create warehouse'],
        response: `Create and manage warehouses, assign managers from the Warehouses section.`,
        actions: [{ label: 'Go to Warehouses', icon: 'bi-building', route: '/admin/warehouses' }]
      },
      {
        keywords: ['low stock', 'alert', 'reorder', 'stock alert'],
        response: `You can view low stock alerts in Inventory. Auto-draft POs are created when stock hits reorder levels.`,
        actions: [
          { label: 'View Inventory', icon: 'bi-archive', route: '/admin/inventory' },
          { label: 'View Reports', icon: 'bi-bar-chart-line', route: '/admin/reports' }
        ]
      },
      {
        keywords: ['report', 'analytics', 'chart', 'trend'],
        response: `Full system analytics are available in Reports — inventory summary, PO reports, supplier performance, stock trends and more.`,
        actions: [{ label: 'Open Reports', icon: 'bi-bar-chart-line', route: '/admin/reports' }]
      },
      {
        keywords: ['product', 'category', 'sku'],
        response: `You can manage products and categories from the respective sections.`,
        actions: [
          { label: 'Products', icon: 'bi-box-seam', route: '/admin/products' },
          { label: 'Categories', icon: 'bi-tags', route: '/admin/categories' }
        ]
      },
      {
        keywords: ['purchase order', 'po', 'order'],
        response: `You have full visibility into all purchase orders across all warehouses.`,
        actions: [{ label: 'View All POs', icon: 'bi-cart-check', route: '/admin/purchase-orders' }]
      },
      {
        keywords: ['movement', 'stock movement', 'audit', 'trail'],
        response: `Stock movements give you a complete audit trail of every inventory change.`,
        actions: [{ label: 'View Movements', icon: 'bi-arrow-left-right', route: '/admin/stock-movements' }]
      }
    ];

    const managerRules: BotRule[] = [
      {
        keywords: ['stock issue', 'issue', 'si', 'approve issue', 'pending issue'],
        response: `You can review and approve/reject pending stock issues from your staff here.`,
        actions: [{ label: 'Review Issues', icon: 'bi-clipboard-check', route: '/manager/stock-issues' }]
      },
      {
        keywords: ['purchase order', 'po', 'create po', 'send po'],
        response: `You can create purchase orders and send them to approved suppliers.`,
        actions: [{ label: 'Purchase Orders', icon: 'bi-cart-check', route: '/manager/purchase-orders' }]
      },
      {
        keywords: ['staff', 'add staff', 'create staff'],
        response: `You can manage your warehouse staff — create accounts, activate or deactivate them.`,
        actions: [{ label: 'My Staff', icon: 'bi-people', route: '/manager/staff' }]
      },
      {
        keywords: ['inventory', 'stock', 'warehouse stock'],
        response: `View current stock levels in your warehouse — filter by low stock or search products.`,
        actions: [{ label: 'View Inventory', icon: 'bi-archive', route: '/manager/inventory' }]
      },
      {
        keywords: ['movement', 'stock movement', 'audit'],
        response: `Stock movements show all in/out activity in your warehouse.`,
        actions: [{ label: 'Stock Movements', icon: 'bi-arrow-left-right', route: '/manager/stock-movements' }]
      },
      {
        keywords: ['report', 'analytics', 'trend'],
        response: `Your warehouse reports include stock trends, staff activity, low stock alerts and more.`,
        actions: [{ label: 'Reports', icon: 'bi-bar-chart-line', route: '/manager/reports' }]
      }
    ];

    const staffRules: BotRule[] = [
      {
        keywords: ['stock issue', 'issue', 'create issue', 'new issue', 'si'],
        response: `Here's how to create a stock issue:\n1. Click "New Stock Issue"\n2. Add products and quantities\n3. Submit for manager approval\n4. Once approved, execute the stock out`,
        actions: [{ label: 'My Stock Issues', icon: 'bi-clipboard-check', route: '/staff/stock-issues' }]
      },
      {
        keywords: ['receive', 'po', 'purchase order', 'shipped'],
        response: `Shipped purchase orders ready to be received are in Purchase Orders. Click "Receive" to update inventory.`,
        actions: [{ label: 'Purchase Orders', icon: 'bi-cart-check', route: '/staff/purchase-orders' }]
      },
      {
        keywords: ['inventory', 'stock', 'available'],
        response: `View current stock levels in your warehouse — including available and reserved quantities.`,
        actions: [{ label: 'View Inventory', icon: 'bi-archive', route: '/staff/inventory' }]
      },
      {
        keywords: ['report', 'my report', 'history'],
        response: `Your personal reports show your issue history, totals, and warehouse stock trends.`,
        actions: [{ label: 'My Reports', icon: 'bi-bar-chart-line', route: '/staff/reports' }]
      }
    ];

    const supplierRules: BotRule[] = [
      {
        keywords: ['purchase order', 'po', 'accept', 'reject', 'ship'],
        response: `View all POs sent to you. You can accept, reject (with reason), or mark as shipped.`,
        actions: [{ label: 'My POs', icon: 'bi-cart-check', route: '/supplier/purchase-orders' }]
      },
      {
        keywords: ['product', 'link', 'price', 'my product'],
        response: `Browse products in your approved categories and link them with your purchase price and lead time.`,
        actions: [{ label: 'My Products', icon: 'bi-box-seam', route: '/supplier/my-products' }]
      },
      {
        keywords: ['profile', 'company', 'gst', 'approval', 'status'],
        response: `Your company profile and approval status are in My Profile. Contact admin if you need profile changes.`,
        actions: [{ label: 'My Profile', icon: 'bi-person-circle', route: '/supplier/profile' }]
      },
      {
        keywords: ['report', 'revenue', 'history'],
        response: `Your PO history, status breakdown, and revenue analytics are in Reports.`,
        actions: [{ label: 'My Reports', icon: 'bi-bar-chart-line', route: '/supplier/reports' }]
      }
    ];

    const roleRules: Record<string, BotRule[]> = {
      ADMIN: [...common, ...adminRules],
      MANAGER: [...common, ...managerRules],
      STAFF: [...common, ...staffRules],
      SUPPLIER: [...common, ...supplierRules]
    };

    return roleRules[role] ?? common;
  }

  onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.sendMessage(); }
  }
}