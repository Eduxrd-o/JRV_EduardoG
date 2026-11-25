import { Component, inject, signal } from '@angular/core';
import {
  type AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  type ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import {
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
  IonInput,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { keyOutline, logOutOutline, saveOutline } from 'ionicons/icons';

import { AuthService } from '../../../../core/auth/auth.service';
import { mapSupabaseError } from '../../../../core/errors/supabase-error.mapper';
import { ToastService } from '../../../../core/ui/toast.service';
import { nuevaClaveValidator } from '../../../../shared/validators/electoral.validators';

function clavesCoincidenValidator(group: AbstractControl): ValidationErrors | null {
  const nueva = group.get('nuevaClave')?.value;
  const confirmar = group.get('confirmarClave')?.value;
  if (!confirmar) {
    return null;
  }
  return nueva === confirmar ? null : { clavesDistintas: true };
}

@Component({
  selector: 'app-cambiar-clave',
  imports: [
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonInput,
    IonSpinner,
    IonText,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Cambio de Contraseña</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="salir()" aria-label="Cerrar sesión">
            <ion-icon slot="icon-only" name="log-out-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="form-wrapper">
        <ion-card>
          <ion-card-header>
            <ion-card-title>Actualización obligatoria</ion-card-title>
            <ion-card-subtitle>
              Por seguridad (R3), debes reemplazar la contraseña inicial por una nueva de al menos 8 caracteres.
            </ion-card-subtitle>
          </ion-card-header>

          <ion-card-content>
            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <div class="field-group">
                <ion-input
                  formControlName="nuevaClave"
                  label="Nueva contraseña"
                  labelPlacement="stacked"
                  fill="outline"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                >
                  <ion-icon slot="start" name="key-outline" aria-hidden="true"></ion-icon>
                </ion-input>
                @if (mostrarError('nuevaClave')) {
                  <ion-text color="danger" class="field-error">
                    @if (form.controls.nuevaClave.hasError('required')) {
                      La nueva contraseña es obligatoria.
                    } @else if (form.controls.nuevaClave.hasError('claveIgualInicial')) {
                      No puedes reutilizar la contraseña inicial Ecuador2026.
                    } @else {
                      Debe tener al menos 8 caracteres.
                    }
                  </ion-text>
                }
              </div>

              <div class="field-group">
                <ion-input
                  formControlName="confirmarClave"
                  label="Confirmar contraseña"
                  labelPlacement="stacked"
                  fill="outline"
                  type="password"
                  placeholder="Repite la nueva contraseña"
                >
                  <ion-icon slot="start" name="key-outline" aria-hidden="true"></ion-icon>
                </ion-input>
                @if (mostrarError('confirmarClave') || (form.hasError('clavesDistintas') && enviado())) {
                  <ion-text color="danger" class="field-error">
                    @if (form.controls.confirmarClave.hasError('required')) {
                      Confirma tu nueva contraseña.
                    } @else {
                      Las contraseñas no coinciden.
                    }
                  </ion-text>
                }
              </div>

              @if (errorMensaje()) {
                <div class="error-banner" role="alert">
                  <ion-text color="danger">{{ errorMensaje() }}</ion-text>
                </div>
              }

              <ion-button type="submit" expand="block" [disabled]="cargando()">
                @if (cargando()) {
                  <ion-spinner name="crescent" slot="start"></ion-spinner>
                  Guardando...
                } @else {
                  <ion-icon slot="start" name="save-outline"></ion-icon>
                  Guardar nueva contraseña
                }
              </ion-button>
            </form>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: `
    .form-wrapper {
      max-width: 440px;
      margin: 1rem auto;
    }
    .field-group {
      margin-bottom: 1rem;
    }
    .field-error {
      display: block;
      font-size: 0.8rem;
      margin-top: 0.3rem;
      padding-left: 0.25rem;
    }
    .error-banner {
      background: rgba(var(--ion-color-danger-rgb), 0.1);
      border-left: 3px solid var(--ion-color-danger);
      padding: 0.65rem 0.75rem;
      border-radius: 6px;
      margin-bottom: 1rem;
      font-size: 0.85rem;
    }
  `,
})
export class CambiarClavePage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly cargando = signal(false);
  readonly errorMensaje = signal<string | null>(null);
  readonly enviado = signal(false);

  readonly form = this.fb.nonNullable.group(
    {
      nuevaClave: ['', [Validators.required, nuevaClaveValidator()]],
      confirmarClave: ['', [Validators.required]],
    },
    { validators: [clavesCoincidenValidator] },
  );

  constructor() {
    addIcons({ keyOutline, saveOutline, logOutOutline });
  }

  mostrarError(campo: 'nuevaClave' | 'confirmarClave'): boolean {
    const ctrl = this.form.controls[campo];
    return ctrl.invalid && (ctrl.touched || this.enviado());
  }

  async onSubmit(): Promise<void> {
    this.enviado.set(true);
    this.errorMensaje.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    try {
      await this.auth.cambiarClaveObligatoria(this.form.controls.nuevaClave.value);
      await this.toast.exito('Contraseña actualizada correctamente.');
      await this.router.navigateByUrl(this.auth.rutaInicialPorRol(), { replaceUrl: true });
    } catch (error) {
      const appErr = mapSupabaseError(error);
      this.errorMensaje.set(appErr.mensajeUsuario);
      await this.toast.error(appErr.mensajeUsuario);
    } finally {
      this.cargando.set(false);
    }
  }

  async salir(): Promise<void> {
    await this.auth.cerrarSesion();
  }
}
