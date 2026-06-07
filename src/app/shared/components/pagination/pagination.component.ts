import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ims-pagination-bar" *ngIf="totalItems > 0">

      <!-- Left: summary + page-size picker -->
      <div class="pgn-summary">
        <span class="pgn-count">
          Showing
          <strong>{{ rangeStart }}–{{ rangeEnd }}</strong>
          of
          <strong>{{ totalItems }}</strong>
        </span>

        <div class="pgn-size-wrap">
          <label class="pgn-size-label">Rows</label>
          <select class="pgn-size-select" [ngModel]="pageSize"
                  (ngModelChange)="onSizeChange($event)">
            <option *ngFor="let s of pageSizeOptions" [value]="s">{{ s }}</option>
          </select>
        </div>
      </div>

      <!-- Right: page buttons -->
      <nav class="pgn-nav" aria-label="Table pagination">

        <!-- First -->
        <button class="pgn-btn" [disabled]="currentPage === 1"
                (click)="go(1)" title="First page" aria-label="First page">
          <i class="bi bi-chevron-double-left"></i>
        </button>

        <!-- Prev -->
        <button class="pgn-btn" [disabled]="currentPage === 1"
                (click)="go(currentPage - 1)" title="Previous" aria-label="Previous page">
          <i class="bi bi-chevron-left"></i>
        </button>

        <!-- Page numbers -->
        <ng-container *ngFor="let p of visiblePages">
          <span *ngIf="p === -1" class="pgn-ellipsis">…</span>
          <button *ngIf="p !== -1"
                  class="pgn-btn pgn-num"
                  [class.pgn-active]="p === currentPage"
                  (click)="go(p)"
                  [attr.aria-current]="p === currentPage ? 'page' : null">
            {{ p }}
          </button>
        </ng-container>

        <!-- Next -->
        <button class="pgn-btn" [disabled]="currentPage === totalPages"
                (click)="go(currentPage + 1)" title="Next" aria-label="Next page">
          <i class="bi bi-chevron-right"></i>
        </button>

        <!-- Last -->
        <button class="pgn-btn" [disabled]="currentPage === totalPages"
                (click)="go(totalPages)" title="Last page" aria-label="Last page">
          <i class="bi bi-chevron-double-right"></i>
        </button>

      </nav>
    </div>
  `,
  styleUrls: ['./pagination.component.scss'],
})
export class PaginationComponent implements OnChanges {
  /** Total number of items (after filtering) */
  @Input() totalItems = 0;
  /** Current active page (1-based) */
  @Input() currentPage = 1;
  /** How many rows per page */
  @Input() pageSize = 10;
  /** Options for the page-size dropdown */
  @Input() pageSizeOptions: number[] = [5, 10, 25, 50];

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  totalPages = 1;
  visiblePages: number[] = [];
  rangeStart = 0;
  rangeEnd = 0;

  ngOnChanges(_: SimpleChanges): void {
    this.recalc();
  }

  private recalc(): void {
    this.totalPages = Math.max(1, Math.ceil(this.totalItems / this.pageSize));
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    this.rangeStart = Math.min(this.totalItems, (this.currentPage - 1) * this.pageSize + 1);
    this.rangeEnd   = Math.min(this.totalItems,  this.currentPage        * this.pageSize);
    this.visiblePages = this.buildPages();
  }

  go(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.pageChange.emit(page);
  }

  onSizeChange(size: number): void {
    this.pageSizeChange.emit(+size);
  }

  private buildPages(): number[] {
    const total = this.totalPages;
    const cur   = this.currentPage;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages: number[] = [1];

    if (cur > 3) pages.push(-1); // left ellipsis

    const start = Math.max(2, cur - 1);
    const end   = Math.min(total - 1, cur + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (cur < total - 2) pages.push(-1); // right ellipsis
    pages.push(total);
    return pages;
  }
}