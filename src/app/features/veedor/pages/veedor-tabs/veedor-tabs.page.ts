import { Component } from '@angular/core';
import { IonIcon, IonLabel, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { clipboardOutline } from 'ionicons/icons';

@Component({
  selector: 'app-veedor-tabs',
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="mesas">
          <ion-icon name="clipboard-outline"></ion-icon>
          <ion-label>Mis Mesas</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
})
export class VeedorTabsPage {
  constructor() {
    addIcons({ clipboardOutline });
  }
}
