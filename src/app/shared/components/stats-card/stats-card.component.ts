import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stats-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stat-card stat-{{color}}">
      <div class="d-flex align-items-center justify-content-between mb-3">
        <div class="stat-icon"><i class="bi {{icon}}"></i></div>
        <span class="stat-trend" *ngIf="trend !== null" [class.text-success]="trend! >= 0" [class.text-danger]="trend! < 0">
          <i class="bi" [class.bi-arrow-up-right]="trend! >= 0" [class.bi-arrow-down-right]="trend! < 0"></i>
          {{ trend! >= 0 ? '+' : '' }}{{ trend }}%
        </span>
      </div>
      <div class="stat-value">{{ value | number }}</div>
      <div class="stat-label mt-1">{{ label }}</div>
      <i class="bi {{icon}} stat-bg-icon"></i>
    </div>
  `
})
export class StatsCardComponent {
  @Input() label = '';
  @Input() value: number = 0;
  @Input() icon = 'bi-graph-up';
  @Input() color: 'primary'|'success'|'warning'|'danger'|'info'|'secondary' = 'primary';
  @Input() trend: number | null = null;
}