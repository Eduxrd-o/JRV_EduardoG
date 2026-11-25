import { Component, inject, type OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
  type RefresherCustomEvent,
  type SelectCustomEvent,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { createOutline, logOutOutline, refreshOutline } from 'ionicons/icons';

import { AuthService } from '../../../../core/auth/auth.service';
import { mapSupabaseError } from '../../../../core/errors/supabase-error.mapper';
import { ToastService } from '../../../../core/ui/toast.service';
import type { EstadoJrv, Jrv, Perfil } from '../../../../domain/models';
import { EstadoVistaComponent } from '../../../../shared/components/estado-vista/estado-vista.component';
import { RecintoStore } from '../../services/recinto.store';

@Component({
  selector: 'app-recinto-mesas',
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
    IonCardContent,
    IonBadge,
    IonSelect,
    IonSelectOption,
    EstadoVistaComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Mesas del Recinto</ion-title>
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
        <span>Coordinador de Recinto · C.I. {{ auth.perfil()?.cedula }}</span>
      </div>

      <app-estado-vista
        [estado]="store.mesas()"
        mensajeCargando="Cargando mesas del recinto..."
        mensajeVacio="No hay JRV registradas para este recinto."
      >
        @for (mesa of listaMesas(); track mesa.id) {
          <ion-card>
            <ion-card-header>
              <div class="mesa-header">
                <ion-card-title>JRV #{{ mesa.numero }}</ion-card-title>
                <ion-badge [color]="colorEstado(mesa.estado)">{{ mesa.estado }}</ion-badge>
              </div>
            </ion-card-header>

            <ion-card-content>
              <ion-select
                label="Veedor asignado"
                labelPlacement="stacked"
                fill="outline"
                placeholder="Sin asignar"
                [value]="mesa.veedorId ?? ''"
                (ionChange)="onAsignarVeedor(mesa.id, $event)"
              >
                <ion-select-option value="">— Sin asignar —</ion-select-option>
                @for (v of listaVeedores(); track v.id) {
                  <ion-select-option [value]="v.id">
                    {{ v.apellidos }} {{ v.nombres }} ({{ v.cedula }})
                  </ion-select-option>
                }
              </ion-select>

              <div class="acciones-acta">
                <ion-button
                  size="small"
                  fill="outline"
                  [routerLink]="['/recinto/acta', mesa.id, 'alcalde']"
                >
                  <ion-icon slot="start" name="create-outline"></ion-icon>
                  Alcalde
                </ion-button>
                <ion-button
                  size="small"
                  fill="outline"
                  [routerLink]="['/recinto/acta', mesa.id, 'prefecto']"
                >
                  <ion-icon slot="start" name="create-outline"></ion-icon>
                  Prefecto
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
      gap: 0.5rem;
      margin-top: 0.75rem;
    }
  `,
})
export class RecintoMesasPage implements OnInit {
  readonly auth = inject(AuthService);
  readonly store = inject(RecintoStore);
  private readonly toast = inject(ToastService);

  constructor() {
    addIcons({ refreshOutline, logOutOutline, createOutline });
  }

  ngOnInit(): void {
    void this.store.cargarTodo();
  }

  listaMesas(): Jrv[] {
    const est = this.store.mesas();
    return est.tipo === 'exito' ? est.datos : [];
  }

  listaVeedores(): Perfil[] {
    const est = this.store.veedores();
    return est.tipo === 'exito' ? est.datos : [];
  }

  recargar(): void {
    void this.store.cargarTodo();
  }

  async onRefresh(event: RefresherCustomEvent): Promise<void> {
    await this.store.cargarTodo();
    await event.target.complete();
  }

  async onAsignarVeedor(jrvId: string, event: SelectCustomEvent): Promise<void> {
    const val = String(event.detail.value ?? '');
    const veedorId = val.length > 0 ? val : null;
    try {
      await this.store.asignarVeedor(jrvId, veedorId);
      await this.toast.exito(veedorId ? 'Veedor asignado a la JRV.' : 'Asignación removida.');
    } catch (error) {
      const appErr = mapSupabaseError(error);
      await this.toast.error(appErr.mensajeUsuario);
    }
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
