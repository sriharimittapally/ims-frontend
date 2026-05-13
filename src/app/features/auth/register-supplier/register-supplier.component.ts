import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register-supplier',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './register-supplier.component.html',
  styleUrls: ['./register-supplier.component.scss']
})
export class RegisterSupplierComponent {
  form: FormGroup;
  loading = false;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {
    this.form = this.fb.group({
      name:     ['', Validators.required],
      email:    ['', [Validators.required, Validators.email]],
      // Backend requires min 8 characters
      password: ['', [Validators.required, Validators.minLength(8)]],
      phone:    ['', [Validators.pattern(/^[+]?[0-9]{10,15}$/)]]
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.auth.registerSupplier(this.form.value).subscribe({
      next: (res) => {
        this.toastr.success(
          `Account created! Your code: ${res.data}. Please login.`,
          'Registration Successful',
          { timeOut: 6000 }
        );
        this.router.navigate(['/auth/login']);
      },
      error: () => { this.loading = false; }
    });
  }

  get name()     { return this.form.get('name')!; }
  get email()    { return this.form.get('email')!; }
  get password() { return this.form.get('password')!; }
  get phone()    { return this.form.get('phone')!; }
}