import { Component, inject } from '@angular/core';
import { IonBadge, IonIcon, IonLabel, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { clipboardOutline, cloudUploadOutline } from 'ionicons/icons';

import { OUTBOX_SYNC_PORT } from '../../../../core/di/repository.tokens';

@Component({
  selector: 'app-veedor-tabs',
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonBadge],
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="mesas">
          <ion-icon name="clipboard-outline"></ion-icon>
          <ion-label>Mis Mesas</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="pendientes">
          <ion-icon name="cloud-upload-outline"></ion-icon>
          <ion-label>Pendientes</ion-label>
          @if (outbox.cantidadPendientes() > 0) {
            <ion-badge color="warning">{{ outbox.cantidadPendientes() }}</ion-badge>
          }
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
})
export class VeedorTabsPage {
  readonly outbox = inject(OUTBOX_SYNC_PORT);

  constructor() {
    addIcons({ clipboardOutline, cloudUploadOutline });
  }
}
