import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { AdminAuth } from '../../../../core/services/admin-auth';
import { Feedback } from '../../../../core/services/feedback';
import { AutomobileRepository } from '../../services/automobile-repository';
import { Car, Origin } from '../../models/car.model';
import { ORIGIN_OPTIONS } from '../../models/car-options.model';

const required = Validators.required;

@Component({
  selector: 'app-car-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './car-form.html',
  styleUrl: './car-form.scss',
})
export class CarForm {
  private readonly repository = inject(AutomobileRepository);
  private readonly adminAuth = inject(AdminAuth);
  private readonly feedback = inject(Feedback);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly hasKey = this.adminAuth.hasKey;
  protected readonly submitting = signal(false);

  protected readonly originOptions = ORIGIN_OPTIONS;

  protected readonly keyForm = this.formBuilder.nonNullable.group({
    key: ['', required],
  });

  protected readonly form = this.formBuilder.group({
    name: this.formBuilder.nonNullable.control('', required),
    origin: this.formBuilder.control<Origin | null>(null, required),
    mpg: this.formBuilder.control<number | null>(null, [required, Validators.min(0)]),
    cylinders: this.formBuilder.control<number | null>(null, [required, Validators.min(1)]),
    displacement: this.formBuilder.control<number | null>(null, [required, Validators.min(0)]),
    horsepower: this.formBuilder.control<number | null>(null, Validators.min(0)),
    weight: this.formBuilder.control<number | null>(null, [required, Validators.min(0)]),
    acceleration: this.formBuilder.control<number | null>(null, [required, Validators.min(0)]),
    modelYear: this.formBuilder.control<number | null>(null, [required, Validators.min(1900)]),
  });

  protected unlock(): void {
    if (this.keyForm.invalid) {
      return;
    }
    this.adminAuth.setKey(this.keyForm.getRawValue().key.trim());
    this.keyForm.reset({ key: '' });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.feedback.show('Please fix the highlighted fields before submitting.');
      return;
    }

    const key = this.adminAuth.getKey();
    if (!key) {
      this.feedback.show('Enter the admin key first.');
      return;
    }

    // Cast: the form types every field as `T | null` (its empty state), but each required
    // field's validator guarantees a non-null value once form.valid is true — horsepower is the
    // only genuinely optional/nullable field in the Automobile model itself.
    const value = this.form.getRawValue() as unknown as Omit<Car, 'id'>;

    this.submitting.set(true);
    this.repository.createCar(value, key).subscribe({
      next: (car) => {
        this.submitting.set(false);
        this.feedback.show(`Added "${car.name}" to the dataset.`);
        void this.router.navigate(['/']);
      },
      error: (error: HttpErrorResponse) => {
        this.submitting.set(false);
        if (error.status === 401) {
          this.adminAuth.clearKey();
          this.feedback.show('That admin key was rejected — please re-enter it.');
        }
        // Any other error is already surfaced by the global HTTP error interceptor.
      },
    });
  }
}
