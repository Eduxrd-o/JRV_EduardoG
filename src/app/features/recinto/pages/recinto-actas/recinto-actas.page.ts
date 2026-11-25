import { Component, computed, inject, type OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
  type SegmentCustomEvent,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { createOutline, locationOutline, warningOutline } from 'ionicons/icons';

import type { Acta, EstadoActa } from '../../../../domain/models';
import { EstadoVistaComponent } from '../../../../shared/components/estado-vista/estado-vista.component';
import { RecintoStore } from '../../services/recinto.store';

@Component({
  selector: 'app-recinto-actas',
  imports: [
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonBadge,
    IonButton,
    IonIcon,
    EstadoVistaComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Actas del Recinto</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-segment [value]="filtro()" (ionChange)="onFiltro($event)">
        <ion-segment-button value="TODAS">
          <ion-label>Todas</ion-label>
        </ion-segment-button>
        <ion-segment-button value="OBSERVADA">
          <ion-label>Observadas</ion-label>
        </ion-segment-button>
        <ion-segment-button value="VALIDADA">
          <ion-label>Validadas</ion-label>
        </ion-segment-button>
      </ion-segment>

      <app-estado-vista
        [estado]="store.actas()"
        mensajeCargando="Cargando actas del recinto..."
        mensajeVacio="Aún no se han registrado actas en este recinto."
      >
        @for (acta of actasFiltradas(); track acta.id) {
          <ion-card>
            <ion-card-header>
              <div class="acta-header">
                <ion-card-title>{{ acta.dignidad === 'alcalde' ? 'Alcaldía' : 'Prefectura' }} (v{{ acta.version }})</ion-card-title>
                <ion-badge [color]="colorEstado(acta.estado)">{{ acta.estado }}</ion-badge>
              </div>
              <ion-card-subtitle>
                Total sufragantes: {{ acta.totalSufragantes }} · Nulos: {{ acta.nulos }} · Blancos: {{ acta.blancos }}
              </ion-card-subtitle>
            </ion-card-header>

            <ion-card-content>
              <div class="gps-row">
                @if (acta.gps.ubicacionComprobable && acta.gps.lat !== null) {
                  <ion-icon name="location-outline" color="success"></ion-icon>
                  <span>GPS: {{ acta.gps.lat.toFixed(5) }}, {{ acta.gps.lng?.toFixed(5) }}</span>
                } @else {
                  <ion-icon name="warning-outline" color="warning"></ion-icon>
                  <span>Ubicación no comprobable</span>
                }
              </div>

              @if (acta.observacion) {
                <p class="obs-text"><strong>Observación:</strong> {{ acta.observacion }}</p>
              }

              <ion-button
                expand="block"
                fill="outline"
                size="small"
                [routerLink]="['/recinto/acta', acta.jrvId, acta.dignidad]"
              >
                <ion-icon slot="start" name="create-outline"></ion-icon>
                Corregir datos y foto
              </ion-button>
            </ion-card-content>
          </ion-card>
        }
      </app-estado-vista>
    </ion-content>
  `,
  styles: `
    ion-segment {
      margin-bottom: 1rem;
    }
    .acta-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .gps-row {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.85rem;
      margin-bottom: 0.6rem;
    }
    .obs-text {
      font-size: 0.85rem;
      color: var(--ion-color-warning-shade);
      margin: 0 0 0.75rem;
    }
  `,
})
export class RecintoActasPage implements OnInit {
  readonly store = inject(RecintoStore);
  readonly filtro = signal<'TODAS' | EstadoActa>('TODAS');

  readonly actasFiltradas = computed<Acta[]>(() => {
    const est = this.store.actas();
    if (est.tipo !== 'exito') {
      return [];
    }
    const f = this.filtro();
    return f === 'TODAS' ? est.datos : est.datos.filter((a) => a.estado === f);
  });

  constructor() {
    addIcons({ createOutline, locationOutline, warningOutline });
  }

  ngOnInit(): void {
    void this.store.cargarActas();
  }

  onFiltro(event: SegmentCustomEvent): void {
    this.filtro.set((event.detail.value as 'TODAS' | EstadoActa) ?? 'TODAS');
  }

  colorEstado(estado: EstadoActa): string {
    switch (estado) {
      case 'VALIDADA':
        return 'success';
      case 'CORREGIDA':
        return 'tertiary';
      case 'OBSERVADA':
        return 'warning';
    }
  }
}
