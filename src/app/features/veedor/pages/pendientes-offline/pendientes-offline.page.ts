import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonLabel,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  cloudDoneOutline,
  cloudOfflineOutline,
  syncOutline,
  trashOutline,
  warningOutline,
} from 'ionicons/icons';

import { OUTBOX_SYNC_PORT } from '../../../../core/di/repository.tokens';
import type { EstadoSyncLocal } from '../../../../domain/models';

/**
 * ADR-006 (R10): Gestión visual de la cola de pendientes offline y resolución de conflictos por versión.
 */
@Component({
  selector: 'app-pendientes-offline',
  imports: [
    DatePipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonChip,
    IonLabel,
    IonSpinner,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonBadge,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Actas Pendientes</ion-title>
        <ion-buttons slot="end">
          <ion-button
            (click)="sincronizar()"
            [disabled]="!outbox.enLinea() || outbox.sincronizando()"
            aria-label="Sincronizar ahora"
          >
            @if (outbox.sincronizando()) {
              <ion-spinner name="crescent"></ion-spinner>
            } @else {
              <ion-icon slot="icon-only" name="sync-outline"></ion-icon>
            }
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="net-bar">
        <ion-chip [color]="outbox.enLinea() ? 'success' : 'warning'">
          <ion-icon [name]="outbox.enLinea() ? 'cloud-done-outline' : 'cloud-offline-outline'"></ion-icon>
          <ion-label>{{ outbox.enLinea() ? 'Conectado' : 'Sin conexión (Modo offline)' }}</ion-label>
        </ion-chip>

        <ion-button
          size="small"
          (click)="sincronizar()"
          [disabled]="!outbox.enLinea() || outbox.sincronizando()"
        >
          <ion-icon slot="start" name="sync-outline"></ion-icon>
          Sincronizar
        </ion-button>
      </div>

      @if (outbox.registros().length === 0) {
        <div class="empty-box">
          <ion-icon name="cloud-done-outline" class="empty-icon"></ion-icon>
          <p>No hay actas pendientes en la cola local.</p>
        </div>
      } @else {
        @for (item of outbox.registros(); track item.clientUuid) {
          <ion-card>
            <ion-card-header>
              <div class="card-top">
                <ion-card-title>
                  JRV #{{ item.jrvNumero }} · {{ item.dignidad === 'alcalde' ? 'Alcaldía' : 'Prefectura' }}
                </ion-card-title>
                <ion-badge [color]="colorEstado(item.estado)">{{ item.estado }}</ion-badge>
              </div>
              <ion-card-subtitle>
                Guardada: {{ item.creadoEn | date: 'short' }} · Sufragantes: {{ item.totalSufragantes }}
              </ion-card-subtitle>
            </ion-card-header>

            <ion-card-content>
              @if (item.ultimoError) {
                <div class="err-box">
                  <ion-icon name="warning-outline" color="warning"></ion-icon>
                  <span>{{ item.ultimoError }}</span>
                </div>
              }

              @if (item.estado === 'conflicto') {
                <p class="conflict-help">
                  Prevalece la corrección del coordinador en el servidor, o puedes enviar tu versión local.
                </p>
                <div class="conflict-actions">
                  <ion-button
                    size="small"
                    color="primary"
                    (click)="conservarServidor(item.clientUuid)"
                  >
                    Conservar servidor
                  </ion-button>
                  <ion-button
                    size="small"
                    fill="outline"
                    color="warning"
                    (click)="forzarLocal(item.clientUuid)"
                  >
                    Enviar versión local
                  </ion-button>
                </div>
              } @else if (item.estado === 'sincronizada' || item.estado === 'error') {
                <ion-button
                  size="small"
                  fill="clear"
                  color="medium"
                  (click)="eliminar(item.clientUuid)"
                >
                  <ion-icon slot="start" name="trash-outline"></ion-icon>
                  Quitar de la lista
                </ion-button>
              }
            </ion-card-content>
          </ion-card>
        }
      }
    </ion-content>
  `,
  styles: `
    .net-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .empty-box {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--ion-color-medium);
    }
    .empty-icon {
      font-size: 3rem;
      margin-bottom: 0.5rem;
    }
    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
    }
    .err-box {
      display: flex;
      align-items: flex-start;
      gap: 0.4rem;
      font-size: 0.84rem;
      margin-bottom: 0.6rem;
      color: var(--ion-color-warning-shade);
    }
    .conflict-help {
      font-size: 0.82rem;
      color: var(--ion-color-medium-shade);
      margin: 0 0 0.6rem;
    }
    .conflict-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
    }
  `,
})
export class PendientesOfflinePage {
  readonly outbox = inject(OUTBOX_SYNC_PORT);

  constructor() {
    addIcons({ cloudDoneOutline, cloudOfflineOutline, syncOutline, trashOutline, warningOutline });
  }

  sincronizar(): void {
    void this.outbox.sincronizarPendientes();
  }

  conservarServidor(clientUuid: string): void {
    void this.outbox.resolverConflictoConservarServidor(clientUuid);
  }

  forzarLocal(clientUuid: string): void {
    void this.outbox.resolverConflictoForzarLocal(clientUuid);
  }

  eliminar(clientUuid: string): void {
    void this.outbox.eliminarRegistro(clientUuid);
  }

  colorEstado(estado: EstadoSyncLocal): string {
    switch (estado) {
      case 'sincronizada':
        return 'success';
      case 'conflicto':
        return 'warning';
      case 'error':
        return 'danger';
      case 'sincronizando':
        return 'tertiary';
      default:
        return 'medium';
    }
  }
}
