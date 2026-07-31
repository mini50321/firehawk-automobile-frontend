import { Component, inject, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { map } from 'rxjs';

import { Toolbar } from '../toolbar/toolbar';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-main-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    Toolbar,
  ],
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

  /** On handset, the sidenav overlays the page — close it once a nav link is chosen. */
  protected closeSidenavOnHandset(): void {
    if (this.isHandset()) {
      void this.sidenav().close();
    }
  }
}
