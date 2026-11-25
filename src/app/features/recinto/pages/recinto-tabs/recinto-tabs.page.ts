import { Component } from '@angular/core';
import { IonIcon, IonLabel, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { documentTextOutline, gridOutline, peopleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-recinto-tabs',
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="mesas">
          <ion-icon name="grid-outline"></ion-icon>
          <ion-label>Mesas JRV</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="veedores">
          <ion-icon name="people-outline"></ion-icon>
          <ion-label>Veedores</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="actas">
          <ion-icon name="document-text-outline"></ion-icon>
          <ion-label>Actas</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
})
export class RecintoTabsPage {
  constructor() {
    addIcons({ gridOutline, peopleOutline, documentTextOutline });
  }
}
