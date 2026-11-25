import { Component, inject, type OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addCircleOutline } from 'ionicons/icons';

import { mapSupabaseError } from '../../../../core/errors/supabase-error.mapper';
import { ToastService } from '../../../../core/ui/toast.service';
import type { Recinto } from '../../../../domain/models';
import { EstadoVistaComponent } from '../../../../shared/components/estado-vista/estado-vista.component';
import { ProvincialStore } from '../../services/provincial.store';

@Component({
  selector: 'app-recintos',
  imports: [
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonInput,
    IonButton,
    IonIcon,
    IonSpinner,
    IonText,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    EstadoVistaComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Recintos Electorales</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Nuevo recinto</ion-card-title>
          <ion-card-subtitle>Las JRV se generan automáticamente al crear el recinto</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="grid-2">
              <div class="field-group">
                <ion-input
                  formControlName="provincia"
                  label="Provincia"
                  labelPlacement="stacked"
                  fill="outline"
                ></ion-input>
              </div>
              <div class="field-group">
                <ion-input
                  formControlName="canton"
                  label="Cantón"
                  labelPlacement="stacked"
                  fill="outline"
                ></ion-input>
              </div>
            </div>

            <div class="field-group">
              <ion-input
                formControlName="parroquia"
                label="Parroquia"
                labelPlacement="stacked"
                fill="outline"
                placeholder="Ej. Iñaquito"
              ></ion-input>
              @if (mostrarError('parroquia')) {
                <ion-text color="danger" class="field-error">La parroquia es obligatoria.</ion-text>
              }
            </div>

            <div class="field-group">
              <ion-input
                formControlName="nombre"
                label="Nombre del recinto"
                labelPlacement="stacked"
                fill="outline"
                placeholder="Ej. Unidad Educativa..."
              ></ion-input>
              @if (mostrarError('nombre')) {
                <ion-text color="danger" class="field-error">El nombre del recinto es obligatorio.</ion-text>
              }
            </div>

            <div class="field-group">
              <ion-input
                formControlName="numJrv"
                label="Cantidad de JRV"
                labelPlacement="stacked"
                fill="outline"
                type="number"
                min="1"
                max="200"
              ></ion-input>
              @if (mostrarError('numJrv')) {
                <ion-text color="danger" class="field-error">Ingresa un número entre 1 y 200.</ion-text>
              }
            </div>

            <ion-button type="submit" expand="block" [disabled]="guardando()">
              @if (guardando()) {
                <ion-spinner name="crescent" slot="start"></ion-spinner>
                Creando recinto...
              } @else {
                <ion-icon slot="start" name="add-circle-outline"></ion-icon>
                Crear recinto
              }
            </ion-button>
          </form>
        </ion-card-content>
      </ion-card>

      <h3 class="section-title">Recintos precargados y creados</h3>

      <app-estado-vista
        [estado]="store.recintos()"
        mensajeCargando="Cargando recintos..."
        mensajeVacio="No hay recintos registrados."
      >
        <ion-list inset="true">
          @for (r of listaRecintos(); track r.id) {
            <ion-item>
              <ion-label>
                <h2>{{ r.nombre }}</h2>
                <p>{{ r.provincia }} · {{ r.canton }} · {{ r.parroquia }}</p>
              </ion-label>
              <ion-badge slot="end" color="primary">{{ r.numJrv }} JRV</ion-badge>
            </ion-item>
          }
        </ion-list>
      </app-estado-vista>
    </ion-content>
  `,
  styles: `
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.6rem;
    }
    .field-group {
      margin-bottom: 0.85rem;
    }
    .field-error {
      display: block;
      font-size: 0.78rem;
      margin-top: 0.2rem;
    }
    .section-title {
      margin: 1.25rem 0.5rem 0.5rem;
      font-size: 1rem;
      font-weight: 600;
    }
  `,
})
export class RecintosPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly store = inject(ProvincialStore);
  private readonly toast = inject(ToastService);

  readonly guardando = signal(false);
  private readonly enviado = signal(false);

  readonly form = this.fb.nonNullable.group({
    provincia: ['Pichincha', [Validators.required]],
    canton: ['Quito', [Validators.required]],
    parroquia: ['', [Validators.required]],
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    numJrv: [3, [Validators.required, Validators.min(1), Validators.max(200)]],
  });

  constructor() {
    addIcons({ addCircleOutline });
  }

  ngOnInit(): void {
    void this.store.cargarRecintos();
  }

  listaRecintos(): Recinto[] {
    const est = this.store.recintos();
    return est.tipo === 'exito' ? est.datos : [];
  }

  mostrarError(campo: 'parroquia' | 'nombre' | 'numJrv'): boolean {
    const ctrl = this.form.controls[campo];
    return ctrl.invalid && (ctrl.touched || this.enviado());
  }

  async onSubmit(): Promise<void> {
    this.enviado.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    try {
      const val = this.form.getRawValue();
      const creado = await this.store.crearRecinto({
        ...val,
        numJrv: Number(val.numJrv),
        lat: null,
        lng: null,
      });
      this.form.patchValue({ parroquia: '', nombre: '', numJrv: 3 });
      this.enviado.set(false);
      await this.toast.exito(`Recinto "${creado.nombre}" creado con ${creado.numJrv} JRV.`);
    } catch (error) {
      const appErr = mapSupabaseError(error);
      await this.toast.error(appErr.mensajeUsuario);
    } finally {
      this.guardando.set(false);
    }
  }
}
