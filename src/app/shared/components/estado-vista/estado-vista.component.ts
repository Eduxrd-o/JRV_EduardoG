import { Component, input } from '@angular/core';
import { IonButton, IonIcon, IonSkeletonText, IonSpinner } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { alertCircleOutline, documentOutline, refreshOutline } from 'ionicons/icons';

import type { Estado } from '../../../domain/models';

/**
 * ADR-005 (R9): Componente compartido para renderizar estados explícitos
 * (cargando, vacío, error con reintento y éxito) de forma uniforme en toda la app.
 */
@Component({
  selector: 'app-estado-vista',
  imports: [IonSpinner, IonSkeletonText, IonButton, IonIcon],
  template: `
    @switch (estado().tipo) {
      @case ('cargando') {
        <div class="estado-box">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
          <p class="estado-texto">{{ mensajeCargando() }}</p>
          <div class="skeleton-list">
            <ion-skeleton-text [animated]="true" style="width: 100%; height: 52px; border-radius: 8px"></ion-skeleton-text>
            <ion-skeleton-text [animated]="true" style="width: 90%; height: 52px; border-radius: 8px"></ion-skeleton-text>
            <ion-skeleton-text [animated]="true" style="width: 95%; height: 52px; border-radius: 8px"></ion-skeleton-text>
          </div>
        </div>
      }
      @case ('vacio') {
        <div class="estado-box">
          <ion-icon name="document-outline" class="estado-icono"></ion-icon>
          <p class="estado-texto">{{ mensajeVacio() }}</p>
        </div>
      }
      @case ('error') {
        <div class="estado-box estado-error">
          <ion-icon name="alert-circle-outline" class="estado-icono" color="danger"></ion-icon>
          <p class="estado-texto">{{ mensajeError() }}</p>
          @if (puedeReintentar()) {
            <ion-button fill="outline" color="danger" size="small" (click)="ejecutarReintento()">
              <ion-icon slot="start" name="refresh-outline"></ion-icon>
              Reintentar
            </ion-button>
          }
        </div>
      }
      @case ('exito') {
        <ng-content />
      }
      @default {}
    }
  `,
  styles: `
    .estado-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 2rem 1.25rem;
      gap: 0.75rem;
    }
    .estado-icono {
      font-size: 3rem;
      color: var(--ion-color-medium);
    }
    .estado-texto {
      margin: 0;
      color: var(--ion-color-medium-shade);
      font-size: 0.95rem;
      max-width: 320px;
    }
    .estado-error .estado-texto {
      color: var(--ion-color-danger-shade);
    }
    .skeleton-list {
      width: 100%;
      max-width: 480px;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }
  `,
})
export class EstadoVistaComponent {
  readonly estado = input.required<Estado<unknown>>();
  readonly mensajeCargando = input<string>('Cargando información...');
  readonly mensajeVacio = input<string>('No hay registros para mostrar.');

  constructor() {
    addIcons({ alertCircleOutline, documentOutline, refreshOutline });
  }

  mensajeError(): string {
    const est = this.estado();
    return est.tipo === 'error' ? est.mensaje : '';
  }

  puedeReintentar(): boolean {
    const est = this.estado();
    return est.tipo === 'error' && typeof est.reintentar === 'function';
  }

  ejecutarReintento(): void {
    const est = this.estado();
    if (est.tipo === 'error' && est.reintentar) {
      est.reintentar();
    }
  }
}
