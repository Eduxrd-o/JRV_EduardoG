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
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
  type SelectCustomEvent,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { personAddOutline } from 'ionicons/icons';

import { mapSupabaseError } from '../../../../core/errors/supabase-error.mapper';
import { ToastService } from '../../../../core/ui/toast.service';
import type { Perfil, Recinto } from '../../../../domain/models';
import { EstadoVistaComponent } from '../../../../shared/components/estado-vista/estado-vista.component';
import {
  cedulaEcuatorianaValidator,
  telefonoEcuatorianoValidator,
} from '../../../../shared/validators/electoral.validators';
import { ProvincialStore } from '../../services/provincial.store';

@Component({
  selector: 'app-coordinadores',
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
    IonSelect,
    IonSelectOption,
    IonButton,
    IonIcon,
    IonSpinner,
    IonText,
    IonBadge,
    EstadoVistaComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Coordinadores de Recinto</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Crear coordinador de recinto</ion-card-title>
          <ion-card-subtitle>Contraseña inicial: Ecuador2026 (cambio obligatorio)</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="field-group">
              <ion-input
                formControlName="cedula"
                label="Cédula ecuatoriana"
                labelPlacement="stacked"
                fill="outline"
                type="tel"
                maxlength="10"
              ></ion-input>
              @if (mostrarError('cedula')) {
                <ion-text color="danger" class="field-error">Ingresa una cédula ecuatoriana válida.</ion-text>
              }
            </div>

            <div class="grid-2">
              <div class="field-group">
                <ion-input formControlName="nombres" label="Nombres" labelPlacement="stacked" fill="outline"></ion-input>
              </div>
              <div class="field-group">
                <ion-input formControlName="apellidos" label="Apellidos" labelPlacement="stacked" fill="outline"></ion-input>
              </div>
            </div>

            <div class="field-group">
              <ion-input
                formControlName="telefono"
                label="Teléfono celular"
                labelPlacement="stacked"
                fill="outline"
                type="tel"
                maxlength="10"
                placeholder="09XXXXXXXX"
              ></ion-input>
              @if (mostrarError('telefono')) {
                <ion-text color="danger" class="field-error">Debe iniciar en 09 y tener 10 dígitos.</ion-text>
              }
            </div>

            <div class="field-group">
              <ion-input
                formControlName="email"
                label="Correo electrónico"
                labelPlacement="stacked"
                fill="outline"
                type="email"
              ></ion-input>
              @if (mostrarError('email')) {
                <ion-text color="danger" class="field-error">Correo inválido.</ion-text>
              }
            </div>

            <div class="field-group">
              <ion-select
                formControlName="recintoId"
                label="Recinto asignado"
                labelPlacement="stacked"
                fill="outline"
                placeholder="Selecciona un recinto"
              >
                @for (r of listaRecintos(); track r.id) {
                  <ion-select-option [value]="r.id">{{ r.nombre }} ({{ r.parroquia }})</ion-select-option>
                }
              </ion-select>
              @if (mostrarError('recintoId')) {
                <ion-text color="danger" class="field-error">Selecciona un recinto.</ion-text>
              }
            </div>

            <ion-button type="submit" expand="block" [disabled]="guardando()">
              @if (guardando()) {
                <ion-spinner name="crescent" slot="start"></ion-spinner>
                Creando coordinador...
              } @else {
                <ion-icon slot="start" name="person-add-outline"></ion-icon>
                Crear y asignar coordinador
              }
            </ion-button>
          </form>
        </ion-card-content>
      </ion-card>

      <h3 class="section-title">Coordinadores registrados</h3>

      <app-estado-vista
        [estado]="store.coordinadores()"
        mensajeCargando="Cargando coordinadores..."
        mensajeVacio="Aún no existen coordinadores de recinto."
      >
        @for (c of listaCoordinadores(); track c.id) {
          <ion-card>
            <ion-card-header>
              <div class="coord-header">
                <ion-card-title>{{ c.apellidos }} {{ c.nombres }}</ion-card-title>
                <ion-badge [color]="c.debeCambiarClave ? 'warning' : 'success'">
                  {{ c.debeCambiarClave ? 'Clave inicial' : 'Activo' }}
                </ion-badge>
              </div>
              <ion-card-subtitle>C.I. {{ c.cedula }} · {{ c.email }}</ion-card-subtitle>
            </ion-card-header>
            <ion-card-content>
              <ion-select
                label="Recinto asignado"
                labelPlacement="stacked"
                fill="outline"
                [value]="c.recintoId ?? ''"
                (ionChange)="onReasignarRecinto(c.id, $event)"
              >
                @for (r of listaRecintos(); track r.id) {
                  <ion-select-option [value]="r.id">{{ r.nombre }}</ion-select-option>
                }
              </ion-select>
            </ion-card-content>
          </ion-card>
        }
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
    .coord-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
    }
  `,
})
export class CoordinadoresPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly store = inject(ProvincialStore);
  private readonly toast = inject(ToastService);

  readonly guardando = signal(false);
  private readonly enviado = signal(false);

  readonly form = this.fb.nonNullable.group({
    cedula: ['', [Validators.required, cedulaEcuatorianaValidator()]],
    nombres: ['', [Validators.required, Validators.minLength(2)]],
    apellidos: ['', [Validators.required, Validators.minLength(2)]],
    telefono: ['', [Validators.required, telefonoEcuatorianoValidator()]],
    email: ['', [Validators.required, Validators.email]],
    recintoId: ['', [Validators.required]],
  });

  constructor() {
    addIcons({ personAddOutline });
  }

  ngOnInit(): void {
    void this.store.cargarRecintos();
    void this.store.cargarCoordinadores();
  }

  listaRecintos(): Recinto[] {
    const est = this.store.recintos();
    return est.tipo === 'exito' ? est.datos : [];
  }

  listaCoordinadores(): Perfil[] {
    const est = this.store.coordinadores();
    return est.tipo === 'exito' ? est.datos : [];
  }

  mostrarError(campo: 'cedula' | 'nombres' | 'apellidos' | 'telefono' | 'email' | 'recintoId'): boolean {
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
      const creado = await this.store.crearCoordinador(val);
      this.form.reset();
      this.enviado.set(false);
      await this.toast.exito(`Coordinador ${creado.nombres} creado (clave inicial Ecuador2026).`);
    } catch (error) {
      const appErr = mapSupabaseError(error);
      await this.toast.error(appErr.mensajeUsuario);
    } finally {
      this.guardando.set(false);
    }
  }

  async onReasignarRecinto(coordinadorId: string, event: SelectCustomEvent): Promise<void> {
    const recintoId = String(event.detail.value ?? '') || null;
    try {
      await this.store.asignarRecintoACoordinador(coordinadorId, recintoId);
      await this.toast.exito('Recinto reasignado correctamente.');
    } catch (error) {
      const appErr = mapSupabaseError(error);
      await this.toast.error(appErr.mensajeUsuario);
    }
  }
}
