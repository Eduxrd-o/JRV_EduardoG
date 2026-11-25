import { Component } from '@angular/core';
import { IonIcon, IonLabel, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { barChartOutline, businessOutline, mapOutline, peopleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-provincial-tabs',
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="dashboard">
          <ion-icon name="bar-chart-outline"></ion-icon>
          <ion-label>Dashboard</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="recintos">
          <ion-icon name="business-outline"></ion-icon>
          <ion-label>Recintos</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="coordinadores">
          <ion-icon name="people-outline"></ion-icon>
          <ion-label>Coordinadores</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="gps">
          <ion-icon name="map-outline"></ion-icon>
          <ion-label>Mapa GPS</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
})
export class ProvincialTabsPage {
  constructor() {
    addIcons({ barChartOutline, businessOutline, peopleOutline, mapOutline });
  }
}
