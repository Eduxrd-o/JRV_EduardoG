import { Component, inject, type OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonTitle,
  IonToolbar,
  type RefresherCustomEvent,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { documentTextOutline, logOutOutline, refreshOutline } from 'ionicons/icons';

import { AuthService } from '../../../../core/auth/auth.service';
import type { EstadoJrv, Jrv } from '../../../../domain/models';
import { EstadoVistaComponent } from '../../../../shared/components/estado-vista/estado-vista.component';
import { VeedorMesasStore } from '../../services/veedor-mesas.store';

@Component({
  selector: 'app-mis-mesas',
  imports: [
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonBadge,
    EstadoVistaComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Mis Mesas JRV</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="recargar()" aria-label="Actualizar">
            <ion-icon slot="icon-only" name="refresh-outline"></ion-icon>
          </ion-button>
          <ion-button (click)="salir()" aria-label="Cerrar sesión">
            <ion-icon slot="icon-only" name="log-out-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-refresher slot="fixed" (ionRefresh)="onRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="perfil-bar">
        <strong>{{ auth.perfil()?.nombres }} {{ auth.perfil()?.apellidos }}</strong>
        <span>Veedor · C.I. {{ auth.perfil()?.cedula }}</span>
      </div>

      <app-estado-vista
        [estado]="store.estado()"
        mensajeCargando="Cargando tus mesas asignadas..."
        mensajeVacio="Aún no tienes JRV asignadas. Solicita a tu coordinador de recinto que te asigne una mesa."
      >
        @for (mesa of mesas(); track mesa.id) {
          <ion-card>
            <ion-card-header>
              <div class="mesa-header">
                <ion-card-title>JRV #{{ mesa.numero }}</ion-card-title>
                <ion-badge [color]="colorEstado(mesa.estado)">{{ mesa.estado }}</ion-badge>
              </div>
              <ion-card-subtitle>Registra o corrige las actas de esta junta</ion-card-subtitle>
            </ion-card-header>

            <ion-card-content>
              <div class="acciones-acta">
                <ion-button
                  expand="block"
                  fill="solid"
                  [routerLink]="['/veedor/acta', mesa.id, 'alcalde']"
                >
                  <ion-icon slot="start" name="document-text-outline"></ion-icon>
                  Acta Alcalde
                </ion-button>

                <ion-button
                  expand="block"
                  fill="outline"
                  [routerLink]="['/veedor/acta', mesa.id, 'prefecto']"
                >
                  <ion-icon slot="start" name="document-text-outline"></ion-icon>
                  Acta Prefecto
                </ion-button>
              </div>
            </ion-card-content>
          </ion-card>
        }
      </app-estado-vista>
    </ion-content>
  `,
  styles: `
    .perfil-bar {
      display: flex;
      flex-direction: column;
      padding: 0.75rem 1rem;
      background: var(--ion-color-light);
      border-radius: 10px;
      margin-bottom: 1rem;
      font-size: 0.9rem;
    }
    .perfil-bar span {
      color: var(--ion-color-medium);
      font-size: 0.82rem;
    }
    .mesa-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .acciones-acta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.6rem;
    }
  `,
})
export class MisMesasPage implements OnInit {
  readonly auth = inject(AuthService);
  readonly store = inject(VeedorMesasStore);

  constructor() {
    addIcons({ refreshOutline, logOutOutline, documentTextOutline });
  }

  ngOnInit(): void {
    void this.store.cargarMesas();
  }

  mesas(): Jrv[] {
    const est = this.store.estado();
    return est.tipo === 'exito' ? est.datos : [];
  }

  recargar(): void {
    void this.store.cargarMesas();
  }

  async onRefresh(event: RefresherCustomEvent): Promise<void> {
    await this.store.cargarMesas();
    await event.target.complete();
  }

  colorEstado(estado: EstadoJrv): string {
    switch (estado) {
      case 'COMPLETA':
        return 'success';
      case 'OBSERVADA':
        return 'warning';
      case 'PARCIAL':
        return 'tertiary';
      default:
        return 'medium';
    }
  }

  async salir(): Promise<void> {
    await this.auth.cerrarSesion();
  }
}
