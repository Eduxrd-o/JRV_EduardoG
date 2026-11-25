import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonIcon,
  IonInput,
  IonNote,
  IonSpinner,
  IonText,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { lockClosedOutline, logInOutline, personOutline, shieldCheckmarkOutline } from 'ionicons/icons';

import { AuthService } from '../../../../core/auth/auth.service';
import { mapSupabaseError } from '../../../../core/errors/supabase-error.mapper';
import { ToastService } from '../../../../core/ui/toast.service';
import { cedulaEcuatorianaValidator } from '../../../../shared/validators/electoral.validators';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    RouterLink,
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
    IonNote,
  ],
  template: `
    <ion-content class="ion-padding auth-bg">
      <div class="auth-container">
        <div class="brand-header">
          <ion-icon name="shield-checkmark-outline" class="brand-icon"></ion-icon>
          <h1>Control Electoral JRV</h1>
          <p>Escrutinio Electoral · Acceso Autorizado</p>
        </div>

        <ion-card>
          <ion-card-header>
            <ion-card-title>Iniciar sesión</ion-card-title>
            <ion-card-subtitle>Ingresa con tu cédula ecuatoriana</ion-card-subtitle>
          </ion-card-header>

          <ion-card-content>
            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <div class="field-group">
                <ion-input
                  formControlName="cedula"
                  label="Cédula"
                  labelPlacement="stacked"
                  fill="outline"
                  type="tel"
                  inputmode="numeric"
                  maxlength="10"
                  placeholder="Ej. 1710034065"
                >
                  <ion-icon slot="start" name="person-outline" aria-hidden="true"></ion-icon>
                </ion-input>
                @if (mostrarError('cedula')) {
                  <ion-text color="danger" class="field-error">
                    @if (form.controls.cedula.hasError('required')) {
                      La cédula es obligatoria.
                    } @else {
                      Ingresa una cédula ecuatoriana válida de 10 dígitos.
                    }
                  </ion-text>
                }
              </div>

              <div class="field-group">
                <ion-input
                  formControlName="password"
                  label="Contraseña"
                  labelPlacement="stacked"
                  fill="outline"
                  type="password"
                  placeholder="Ingresa tu contraseña"
                >
                  <ion-icon slot="start" name="lock-closed-outline" aria-hidden="true"></ion-icon>
                </ion-input>
                @if (mostrarError('password')) {
                  <ion-text color="danger" class="field-error">La contraseña es obligatoria.</ion-text>
                }
              </div>

              @if (errorMensaje()) {
                <div class="error-banner" role="alert">
                  <ion-text color="danger">{{ errorMensaje() }}</ion-text>
                </div>
              }

              <ion-button
                type="submit"
                expand="block"
                class="submit-btn"
                [disabled]="cargando()"
              >
                @if (cargando()) {
                  <ion-spinner name="crescent" slot="start"></ion-spinner>
                  Verificando...
                } @else {
                  <ion-icon slot="start" name="log-in-outline"></ion-icon>
                  Ingresar
                }
              </ion-button>
            </form>

            <div class="auth-links">
              <ion-button fill="clear" size="small" routerLink="/auth/recuperar">
                ¿Olvidaste tu contraseña?
              </ion-button>
              <ion-note class="no-signup-note">
                El registro público no está habilitado. Tu coordinador crea tu cuenta.
              </ion-note>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: `
    .auth-bg {
      --background: var(--ion-color-light);
    }
    .auth-container {
      max-width: 420px;
      margin: 2rem auto 0;
    }
    .brand-header {
      text-align: center;
      margin-bottom: 1.25rem;
    }
    .brand-icon {
      font-size: 3.25rem;
      color: var(--ion-color-primary);
    }
    .brand-header h1 {
      margin: 0.4rem 0 0.2rem;
      font-size: 1.45rem;
      font-weight: 700;
    }
    .brand-header p {
      margin: 0;
      color: var(--ion-color-medium);
      font-size: 0.9rem;
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
    .submit-btn {
      margin-top: 0.5rem;
    }
    .auth-links {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-top: 1rem;
      gap: 0.4rem;
      text-align: center;
    }
    .no-signup-note {
      font-size: 0.78rem;
      line-height: 1.3;
    }
  `,
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly cargando = signal(false);
  readonly errorMensaje = signal<string | null>(null);
  private readonly enviado = signal(false);

  readonly form = this.fb.nonNullable.group({
    cedula: ['', [Validators.required, cedulaEcuatorianaValidator()]],
    password: ['', [Validators.required]],
  });

  constructor() {
    addIcons({ shieldCheckmarkOutline, personOutline, lockClosedOutline, logInOutline });
  }

  mostrarError(campo: 'cedula' | 'password'): boolean {
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
      const { cedula, password } = this.form.getRawValue();
      const perfil = await this.auth.iniciarSesionConCedula(cedula, password);

      if (perfil.debeCambiarClave) {
        await this.toast.advertencia('Debes cambiar tu contraseña inicial antes de continuar.');
        await this.router.navigateByUrl('/auth/cambiar-clave', { replaceUrl: true });
        return;
      }

      await this.toast.exito(`Bienvenido, ${perfil.nombres}`);
      await this.router.navigateByUrl(this.auth.rutaInicialPorRol(perfil.rol), { replaceUrl: true });
    } catch (error) {
      const appErr = mapSupabaseError(error);
      this.errorMensaje.set(appErr.mensajeUsuario);
      await this.toast.error(appErr.mensajeUsuario);
    } finally {
      this.cargando.set(false);
    }
  }
}
