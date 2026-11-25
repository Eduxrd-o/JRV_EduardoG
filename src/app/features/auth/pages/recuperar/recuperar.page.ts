import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonBackButton,
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
import { checkmarkCircleOutline, mailOutline, sendOutline } from 'ionicons/icons';

import { AuthService } from '../../../../core/auth/auth.service';
import { mapSupabaseError } from '../../../../core/errors/supabase-error.mapper';
import { ToastService } from '../../../../core/ui/toast.service';

@Component({
  selector: 'app-recuperar',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
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
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/auth/login"></ion-back-button>
        </ion-buttons>
        <ion-title>Recuperar Contraseña</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="form-wrapper">
        <ion-card>
          <ion-card-header>
            <ion-card-title>Restablecer acceso</ion-card-title>
            <ion-card-subtitle>
              Ingresa el correo registrado en tu cuenta para recibir un enlace de recuperación.
            </ion-card-subtitle>
          </ion-card-header>

          <ion-card-content>
            @if (exitoEnviado()) {
              <div class="success-box">
                <ion-icon name="checkmark-circle-outline" color="success" class="success-icon"></ion-icon>
                <p>
                  Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña en pocos
                  minutos.
                </p>
                <ion-button expand="block" routerLink="/auth/login">Volver al inicio de sesión</ion-button>
              </div>
            } @else {
              <form [formGroup]="form" (ngSubmit)="onSubmit()">
                <div class="field-group">
                  <ion-input
                    formControlName="correo"
                    label="Correo electrónico"
                    labelPlacement="stacked"
                    fill="outline"
                    type="email"
                    placeholder="usuario@ejemplo.com"
                  >
                    <ion-icon slot="start" name="mail-outline" aria-hidden="true"></ion-icon>
                  </ion-input>
                  @if (mostrarError()) {
                    <ion-text color="danger" class="field-error">Ingresa un correo electrónico válido.</ion-text>
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
                    Enviando...
                  } @else {
                    <ion-icon slot="start" name="send-outline"></ion-icon>
                    Enviar enlace de recuperación
                  }
                </ion-button>
              </form>
            }
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
    .success-box {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
    }
    .success-icon {
      font-size: 3rem;
    }
  `,
})
export class RecuperarPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly cargando = signal(false);
  readonly errorMensaje = signal<string | null>(null);
  readonly exitoEnviado = signal(false);
  private readonly enviado = signal(false);

  readonly form = this.fb.nonNullable.group({
    correo: ['', [Validators.required, Validators.email]],
  });

  constructor() {
    addIcons({ mailOutline, sendOutline, checkmarkCircleOutline });
  }

  mostrarError(): boolean {
    const ctrl = this.form.controls.correo;
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
      await this.auth.recuperarClavePorCorreo(this.form.controls.correo.value);
      this.exitoEnviado.set(true);
      await this.toast.exito('Solicitud de recuperación enviada.');
    } catch (error) {
      const appErr = mapSupabaseError(error);
      this.errorMensaje.set(appErr.mensajeUsuario);
      await this.toast.error(appErr.mensajeUsuario);
    } finally {
      this.cargando.set(false);
    }
  }
}
