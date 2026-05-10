import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-header">
      <h5 class="modal-title">
        <i class="bi {{icon}} me-2" [style.color]="iconColor"></i>{{ title }}
      </h5>
      <button type="button" class="btn-close" (click)="modal.dismiss()"></button>
    </div>
    <div class="modal-body">
      <p class="mb-0" [innerHTML]="message"></p>
      <div *ngIf="requireInput" class="mt-3">
        <label class="ims-form-label">{{ inputLabel }}</label>
        <textarea class="ims-form-control" rows="3" [(ngModel)]="inputValue" [placeholder]="inputPlaceholder"></textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-ims-outline btn" (click)="modal.dismiss()">Cancel</button>
      <button class="btn btn-{{confirmClass}}" (click)="confirm()" [disabled]="requireInput && !inputValue.trim()">
        {{ confirmLabel }}
      </button>
    </div>
  `
})
export class ConfirmModalComponent {
  @Input() title = 'Confirm';
  @Input() message = 'Are you sure?';
  @Input() icon = 'bi-question-circle';
  @Input() iconColor = 'var(--ims-warning)';
  @Input() confirmLabel = 'Confirm';
  @Input() confirmClass = 'danger';
  @Input() requireInput = false;
  @Input() inputLabel = 'Reason';
  @Input() inputPlaceholder = 'Enter reason...';
  inputValue = '';

  constructor(public modal: NgbActiveModal) {}

  confirm(): void {
    this.modal.close(this.requireInput ? this.inputValue : true);
  }
}