import { Component, inject, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { map } from 'rxjs';

import { Toolbar } from '../toolbar/toolbar';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, MatSidenavModule, MatListModule, Toolbar],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayout {
  private readonly breakpointObserver = inject(BreakpointObserver);

  protected readonly title = environment.appName;

  protected readonly isHandset = toSignal(
    this.breakpointObserver.observe(Breakpoints.Handset).pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  private readonly sidenav = viewChild.required(MatSidenav);

  protected toggleSidenav(): void {
    void this.sidenav().toggle();
  }
}
