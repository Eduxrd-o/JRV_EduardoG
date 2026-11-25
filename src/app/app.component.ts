import { Component, inject, type OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';

import { OUTBOX_SYNC_PORT } from './core/di/repository.tokens';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  private readonly outbox = inject(OUTBOX_SYNC_PORT, { optional: true });

  ngOnInit(): void {
    void this.outbox?.iniciarMonitoreo();
  }
}
