import { DatePipe } from '@angular/common';
import {
  type AfterViewInit,
  Component,
  computed,
  effect,
  type ElementRef,
  inject,
  type OnDestroy,
  type OnInit,
  signal,
  viewChild,
} from '@angular/core';
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
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
  type SelectCustomEvent,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { openOutline, warningOutline } from 'ionicons/icons';
import * as L from 'leaflet';

import type { ActaGpsItem, AvanceRecintoRow } from '../../../../domain/models';
import { EstadoVistaComponent } from '../../../../shared/components/estado-vista/estado-vista.component';
import { ProvincialStore } from '../../services/provincial.store';

/**
 * ADR-009 + Acta de consenso (R4):
 * Mapa interactivo consumiendo la API pública de OpenStreetMap mediante Leaflet (sin claves de pago)
 * + lista detallada de coordenadas GPS y actas con "Ubicación no comprobable".
 */
@Component({
  selector: 'app-mapa-gps',
  imports: [
    DatePipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSelect,
    IonSelectOption,
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
        <ion-title>Mapa y Coordenadas GPS</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-select
        label="Filtrar por recinto"
        labelPlacement="stacked"
        fill="outline"
        [value]="recintoFiltro()"
        (ionChange)="onRecinto($event)"
        class="filtro-recinto"
      >
        <ion-select-option value="TODOS">Todos los recintos</ion-select-option>
        @for (r of recintos(); track r.recintoId) {
          <ion-select-option [value]="r.recintoId">{{ r.recintoNombre }}</ion-select-option>
        }
      </ion-select>

      <div #mapContainer class="map-container"></div>

      <app-estado-vista
        [estado]="store.dashboard()"
        mensajeCargando="Cargando ubicaciones de actas..."
        mensajeVacio="No existen actas registradas todavía."
      >
        @if (actasFiltradas().length === 0) {
          <p class="empty-msg">No hay actas registradas para este recinto.</p>
        } @else {
          @for (item of actasFiltradas(); track item.actaId) {
            <ion-card>
              <ion-card-header>
                <div class="gps-header">
                  <ion-card-title>{{ item.recintoNombre }} · JRV #{{ item.jrvNumero }}</ion-card-title>
                  <ion-badge [color]="item.estado === 'OBSERVADA' ? 'warning' : 'success'">
                    {{ item.estado }}
                  </ion-badge>
                </div>
                <ion-card-subtitle>
                  {{ item.dignidad === 'alcalde' ? 'Alcaldía' : 'Prefectura' }} ·
                  {{ item.actualizadoEn | date: 'short' }}
                </ion-card-subtitle>
              </ion-card-header>
              <ion-card-content>
                @if (item.ubicacionComprobable && item.lat !== null && item.lng !== null) {
                  <p class="coord-text">
                    Lat: {{ item.lat.toFixed(5) }} · Lng: {{ item.lng.toFixed(5) }}
                    @if (item.precisionM !== null) {
                      <span>(±{{ item.precisionM }} m)</span>
                    }
                  </p>
                  <ion-button
                    size="small"
                    fill="outline"
                    [href]="'https://www.google.com/maps?q=' + item.lat + ',' + item.lng"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ion-icon slot="start" name="open-outline"></ion-icon>
                    Abrir en Google Maps
                  </ion-button>
                } @else {
                  <div class="no-gps">
                    <ion-icon name="warning-outline" color="warning"></ion-icon>
                    <span>Ubicación no comprobable (registrada sin señal GPS)</span>
                  </div>
                }
              </ion-card-content>
            </ion-card>
          }
        }
      </app-estado-vista>
    </ion-content>
  `,
  styles: `
    .filtro-recinto {
      margin-bottom: 0.75rem;
    }
    .map-container {
      width: 100%;
      height: 260px;
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 1rem;
      border: 1px solid var(--ion-color-light-shade);
    }
    .gps-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
    }
    .coord-text {
      margin: 0 0 0.5rem;
      font-size: 0.86rem;
    }
    .no-gps {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.85rem;
      color: var(--ion-color-warning-shade);
    }
    .empty-msg {
      text-align: center;
      color: var(--ion-color-medium);
      margin-top: 1rem;
    }
  `,
})
export class MapaGpsPage implements OnInit, AfterViewInit, OnDestroy {
  readonly store = inject(ProvincialStore);
  readonly mapContainer = viewChild<ElementRef<HTMLDivElement>>('mapContainer');
  readonly recintoFiltro = signal<string>('TODOS');

  private map: L.Map | null = null;
  private markersLayer: L.LayerGroup | null = null;

  readonly recintos = computed<AvanceRecintoRow[]>(() => {
    const est = this.store.dashboard();
    return est.tipo === 'exito' ? est.datos.avance : [];
  });

  readonly actasFiltradas = computed<ActaGpsItem[]>(() => {
    const est = this.store.dashboard();
    if (est.tipo !== 'exito') {
      return [];
    }
    const f = this.recintoFiltro();
    return f === 'TODOS' ? est.datos.actasGps : est.datos.actasGps.filter((a) => a.recintoId === f);
  });

  constructor() {
    addIcons({ openOutline, warningOutline });
    effect(() => {
      const items = this.actasFiltradas();
      this.actualizarMarcadores(items);
    });
  }

  ngOnInit(): void {
    if (this.store.dashboard().tipo === 'inactivo') {
      void this.store.cargarDashboard();
    }
  }

  ngAfterViewInit(): void {
    const container = this.mapContainer()?.nativeElement;
    if (!container) {
      return;
    }

    // Centro inicial: Quito, Pichincha
    this.map = L.map(container).setView([-0.1807, -78.4678], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);

    this.markersLayer = L.layerGroup().addTo(this.map);
    this.actualizarMarcadores(this.actasFiltradas());

    setTimeout(() => this.map?.invalidateSize(), 300);
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = null;
  }

  onRecinto(event: SelectCustomEvent): void {
    this.recintoFiltro.set(String(event.detail.value ?? 'TODOS'));
  }

  private actualizarMarcadores(items: ActaGpsItem[]): void {
    if (!this.map || !this.markersLayer) {
      return;
    }
    this.markersLayer.clearLayers();

    const puntos: [number, number][] = [];
    for (const item of items) {
      if (item.ubicacionComprobable && item.lat !== null && item.lng !== null) {
        puntos.push([item.lat, item.lng]);
        L.circleMarker([item.lat, item.lng], {
          radius: 8,
          color: item.estado === 'OBSERVADA' ? '#e0a800' : '#0d6efd',
          fillOpacity: 0.8,
        })
          .bindPopup(
            `<strong>${item.recintoNombre}</strong><br/>JRV #${item.jrvNumero} (${item.dignidad})<br/>Estado: ${item.estado}`,
          )
          .addTo(this.markersLayer);
      }
    }

    if (puntos.length > 0) {
      this.map.fitBounds(L.latLngBounds(puntos), { padding: [30, 30], maxZoom: 15 });
    }
  }
}
