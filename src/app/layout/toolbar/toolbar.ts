import { Component, input, output } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconButton } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-toolbar',
  imports: [MatToolbarModule, MatIconButton, MatIconModule],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.scss',
})
export class Toolbar {
  readonly title = input.required<string>();
  readonly menuToggle = output<void>();
}
