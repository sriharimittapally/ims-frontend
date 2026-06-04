import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { CategoryService } from '../../../core/services/category.service';
import { CategoryResponse } from '../../../core/models/category.model';

@Component({
  selector: 'app-category-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './category-management.component.html',
  styleUrls: ['./category-management.component.scss']
})
export class CategoryManagementComponent implements OnInit {
  categories: CategoryResponse[] = [];
  filtered: CategoryResponse[] = [];
  loading = true;
  searchText = '';

  showModal = false;
  editMode = false;
  editId: number | null = null;
  submitLoading = false;
  form: FormGroup;

  constructor(private svc: CategoryService, private toastr: ToastrService, private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required]
    });
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.svc.getAll().subscribe({
      next: r => { this.categories = r.data; this.applyFilter(); this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

applyFilter(): void {
  let list = this.categories;

  if (this.searchText) {
    const q = this.searchText.toLowerCase();
    list = list.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
    );
  }

  // Latest to oldest
  list.sort(
    (a, b) =>
      new Date(b.createdAt || '1970-01-01').getTime() -
      new Date(a.createdAt || '1970-01-01').getTime()
  );

  this.filtered = list;
}

  onSearch(e: Event): void { this.searchText = (e.target as HTMLInputElement).value; this.applyFilter(); }

  openCreate(): void { this.editMode = false; this.editId = null; this.form.reset(); this.showModal = true; }

  openEdit(c: CategoryResponse): void {
    this.editMode = true; this.editId = c.id;
    this.form.patchValue({ name: c.name, description: c.description });
    this.showModal = true;
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitLoading = true;
    const obs = this.editMode ? this.svc.update(this.editId!, this.form.value) : this.svc.create(this.form.value);
    obs.subscribe({
      next: () => {
        this.toastr.success(this.editMode ? 'Category updated' : 'Category created');
        this.showModal = false; this.submitLoading = false; this.load();
      },
      error: () => { this.submitLoading = false; }
    });
  }

  toggle(c: CategoryResponse): void {
    const obs = c.status === 'ACTIVE' ? this.svc.deactivate(c.id) : this.svc.activate(c.id);
    obs.subscribe({
      next: () => { this.toastr.success(`Category ${c.status === 'ACTIVE' ? 'deactivated' : 'activated'}`); this.load(); }
    });
  }
}