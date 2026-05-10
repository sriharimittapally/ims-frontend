import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { CategoryService } from '../../../core/services/category.service';
import { CategoryResponse } from '../../../core/models/category.model';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-category-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './category-management.component.html',
  styleUrls: ['./category-management.component.scss']
})
export class CategoryManagementComponent implements OnInit {
  categories: CategoryResponse[] = [];
  loading = true;
  showModal = false;
  editMode = false;
  editId: number | null = null;
  submitLoading = false;
  form: FormGroup;

  constructor(private svc: CategoryService, private modal: NgbModal, private toastr: ToastrService, private fb: FormBuilder) {
    this.form = this.fb.group({ name: ['', Validators.required], description: ['', Validators.required] });
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.svc.getAll().subscribe({ next: res => { this.categories = res.data; this.loading = false; }, error: () => { this.loading = false; } });
  }

  openCreate(): void { this.editMode = false; this.editId = null; this.form.reset(); this.showModal = true; }

  openEdit(c: CategoryResponse): void { this.editMode = true; this.editId = c.id; this.form.patchValue({ name: c.name, description: c.description }); this.showModal = true; }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitLoading = true;
    const obs = this.editMode ? this.svc.update(this.editId!, this.form.value) : this.svc.create(this.form.value);
    obs.subscribe({ next: () => { this.toastr.success(this.editMode ? 'Category updated' : 'Category created'); this.showModal = false; this.submitLoading = false; this.load(); }, error: () => { this.submitLoading = false; } });
  }

  toggle(c: CategoryResponse): void {
    const action = c.status === 'ACTIVE' ? 'deactivate' : 'activate';
    const ref = this.modal.open(ConfirmModalComponent);
    ref.componentInstance.title = `${action} Category`;
    ref.componentInstance.message = `${action} <strong>${c.name}</strong>?`;
    ref.componentInstance.confirmClass = action === 'deactivate' ? 'danger' : 'success';
    ref.componentInstance.confirmLabel = action.charAt(0).toUpperCase() + action.slice(1);
    ref.result.then(() => {
      const obs = c.status === 'ACTIVE' ? this.svc.deactivate(c.id) : this.svc.activate(c.id);
      obs.subscribe({ next: () => { this.toastr.success(`Category ${action}d`); this.load(); } });
    }).catch(() => {});
  }
}