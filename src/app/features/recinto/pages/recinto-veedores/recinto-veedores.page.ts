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
import { personAddOutline } from 'ionicons/icons';

import { mapSupabaseError } from '../../../../core/errors/supabase-error.mapper';
import { ToastService } from '../../../../core/ui/toast.service';
import type { Perfil } from '../../../../domain/models';
import { EstadoVistaComponent } from '../../../../shared/components/estado-vista/estado-vista.component';
import {
  cedulaEcuatorianaValidator,
  telefonoEcuatorianoValidator,
} from '../../../../shared/validators/electoral.validators';
import { RecintoStore } from '../../services/recinto.store';

@Component({
  selector: 'app-recinto-veedores',
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
        <ion-title>Veedores del Recinto</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Crear nuevo veedor</ion-card-title>
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
                placeholder="10 dígitos"
              ></ion-input>
              @if (mostrarError('cedula')) {
                <ion-text color="danger" class="field-error">Ingresa una cédula ecuatoriana válida.</ion-text>
              }
            </div>

            <div class="field-grid">
              <div class="field-group">
                <ion-input
                  formControlName="nombres"
                  label="Nombres"
                  labelPlacement="stacked"
                  fill="outline"
                ></ion-input>
                @if (mostrarError('nombres')) {
                  <ion-text color="danger" class="field-error">Obligatorio.</ion-text>
                }
              </div>

              <div class="field-group">
                <ion-input
                  formControlName="apellidos"
                  label="Apellidos"
                  labelPlacement="stacked"
                  fill="outline"
                ></ion-input>
                @if (mostrarError('apellidos')) {
                  <ion-text color="danger" class="field-error">Obligatorio.</ion-text>
                }
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
                placeholder="veedor@ejemplo.com"
              ></ion-input>
              @if (mostrarError('email')) {
                <ion-text color="danger" class="field-error">Ingresa un correo electrónico válido.</ion-text>
              }
            </div>

            <ion-button type="submit" expand="block" [disabled]="guardando()">
              @if (guardando()) {
                <ion-spinner name="crescent" slot="start"></ion-spinner>
                Creando cuenta...
              } @else {
                <ion-icon slot="start" name="person-add-outline"></ion-icon>
                Crear veedor
              }
            </ion-button>
          </form>
        </ion-card-content>
      </ion-card>

      <h3 class="section-title">Veedores registrados</h3>

      <app-estado-vista
        [estado]="store.veedores()"
        mensajeCargando="Cargando veedores..."
        mensajeVacio="Aún no has creado veedores para este recinto."
      >
        <ion-list inset="true">
          @for (v of listaVeedores(); track v.id) {
            <ion-item>
              <ion-label>
                <h2>{{ v.apellidos }} {{ v.nombres }}</h2>
                <p>C.I. {{ v.cedula }} · {{ v.telefono }}</p>
                <p>{{ v.email }}</p>
              </ion-label>
              <ion-badge slot="end" [color]="v.debeCambiarClave ? 'warning' : 'success'">
                {{ v.debeCambiarClave ? 'Clave inicial' : 'Activo' }}
              </ion-badge>
            </ion-item>
          }
        </ion-list>
      </app-estado-vista>
    </ion-content>
  `,
  styles: `
    .field-group {
      margin-bottom: 0.85rem;
    }
    .field-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.6rem;
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
export class RecintoVeedoresPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly store = inject(RecintoStore);
  private readonly toast = inject(ToastService);

  readonly guardando = signal(false);
  private readonly enviado = signal(false);

  readonly form = this.fb.nonNullable.group({
    cedula: ['', [Validators.required, cedulaEcuatorianaValidator()]],
    nombres: ['', [Validators.required, Validators.minLength(2)]],
    apellidos: ['', [Validators.required, Validators.minLength(2)]],
    telefono: ['', [Validators.required, telefonoEcuatorianoValidator()]],
    email: ['', [Validators.required, Validators.email]],
  });

  constructor() {
    addIcons({ personAddOutline });
  }

  ngOnInit(): void {
    void this.store.cargarVeedores();
  }

  listaVeedores(): Perfil[] {
    const est = this.store.veedores();
    return est.tipo === 'exito' ? est.datos : [];
  }

  mostrarError(campo: 'cedula' | 'nombres' | 'apellidos' | 'telefono' | 'email'): boolean {
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
      const creado = await this.store.crearVeedor(val);
      this.form.reset();
      this.enviado.set(false);
      await this.toast.exito(`Veedor ${creado.nombres} creado (clave inicial Ecuador2026).`);
    } catch (error) {
      const appErr = mapSupabaseError(error);
      await this.toast.error(appErr.mensajeUsuario);
    } finally {
      this.guardando.set(false);
    }
  }
}
