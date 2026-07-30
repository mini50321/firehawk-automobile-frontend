import { Component, inject } from '@angular/core';
import { CurrencyPipe, DecimalPipe, TitleCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

import { Car } from '../../models/car.model';

@Component({
  selector: 'app-car-details-dialog',
  imports: [MatDialogModule, MatButtonModule, CurrencyPipe, DecimalPipe, TitleCasePipe],
  templateUrl: './car-details-dialog.html',
  styleUrl: './car-details-dialog.scss',
})
export class CarDetailsDialog {
  protected readonly car = inject<Car>(MAT_DIALOG_DATA);
}
