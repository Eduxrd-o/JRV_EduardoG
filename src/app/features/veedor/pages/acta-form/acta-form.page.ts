import { Component, computed, inject, input, type OnInit, signal } from '@angular/core';
import { FormBuilder, type FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonSpinner,
  IonText,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  cameraOutline,
  checkmarkCircleOutline,
  imagesOutline,
  locationOutline,
  saveOutline,
  warningOutline,
} from 'ionicons/icons';

import { AuthService } from '../../../../core/auth/auth.service';
import { mapSupabaseError } from '../../../../core/errors/supabase-error.mapper';
import { ToastService } from '../../../../core/ui/toast.service';
import type { ResultadoCalidadImagen } from '../../../../device/image-quality.util';
import type { Dignidad, Estado, GpsActa } from '../../../../domain/models';
import { evaluarConsistenciaActa } from '../../../../domain/rules';
import { EstadoVistaComponent } from '../../../../shared/components/estado-vista/estado-vista.component';
import { ActaFormService, type ContextoActa } from '../../services/acta-form.service';
import { VeedorMesasStore } from '../../services/veedor-mesas.store';

@Component({
  selector: 'app-acta-form',
  imports: [
    ReactiveFormsModule,
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
    IonButton,
    IonIcon,
    IonInput,
    IonItem,
    IonCheckbox,
    IonTextarea,
    IonBadge,
    IonText,
    IonSpinner,
    EstadoVistaComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button [defaultHref]="rutaRetorno()"></ion-back-button>
        </ion-buttons>
        <ion-title>Acta · {{ tituloDignidad() }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <app-estado-vista [estado]="estadoCarga()" mensajeCargando="Cargando formulario del acta...">
        @if (contexto(); as ctx) {
          <div class="meta-bar">
            <span><strong>JRV #{{ ctx.jrv.numero }}</strong> · {{ tituloDignidad() }}</span>
            @if (ctx.actaExistente) {
              <ion-badge color="tertiary">
                {{ ctx.actaExistente.estado }} (v{{ ctx.actaExistente.version }})
              </ion-badge>
            } @else {
              <ion-badge color="medium">Nueva</ion-badge>
            }
          </div>

          <!-- 1. FOTOGRAFIA Y NITIDEZ (R7 / ADR-003) -->
          <ion-card>
            <ion-card-header>
              <ion-card-title>1. Fotografía del acta</ion-card-title>
              <ion-card-subtitle>Se verifica nitidez con Laplaciano antes de aceptarla</ion-card-subtitle>
            </ion-card-header>
            <ion-card-content>
              <div class="photo-actions">
                <ion-button expand="block" (click)="tomarFoto('camera')" [disabled]="capturandoFoto()">
                  <ion-icon slot="start" name="camera-outline"></ion-icon>
                  Cámara
                </ion-button>
                <ion-button expand="block" fill="outline" (click)="tomarFoto('gallery')" [disabled]="capturandoFoto()">
                  <ion-icon slot="start" name="images-outline"></ion-icon>
                  Galería
                </ion-button>
              </div>

              @if (errorNitidez()) {
                <div class="alert-box alert-danger">
                  <ion-icon name="warning-outline"></ion-icon>
                  <span>{{ errorNitidez() }}</span>
                </div>
              }

              @if (calidadFoto(); as cal) {
                @if (cal.nitida) {
                  <div class="alert-box alert-success">
                    <ion-icon name="checkmark-circle-outline"></ion-icon>
                    <span>Foto nítida aceptada (varianza: {{ cal.varianza }}, brillo: {{ cal.brilloMedio }}).</span>
                  </div>
                }
              }

              @if (fotoPreviewUrl()) {
                <img [src]="fotoPreviewUrl()" alt="Vista previa del acta" class="foto-preview" />
              }
            </ion-card-content>
          </ion-card>

          <!-- 2. UBICACION GPS (R7 / ADR-003 + Consenso) -->
          <ion-card>
            <ion-card-header>
              <ion-card-title>2. Ubicación GPS</ion-card-title>
              <ion-card-subtitle>Coordenadas guardadas en el registro del acta</ion-card-subtitle>
            </ion-card-header>
            <ion-card-content>
              <ion-button expand="block" fill="outline" (click)="obtenerGps()" [disabled]="capturandoGps()">
                @if (capturandoGps()) {
                  <ion-spinner name="crescent" slot="start"></ion-spinner>
                  Obteniendo GPS...
                } @else {
                  <ion-icon slot="start" name="location-outline"></ion-icon>
                  Capturar ubicación GPS
                }
              </ion-button>

              @if (gpsActual().ubicacionComprobable && gpsActual().lat !== null) {
                <div class="alert-box alert-success">
                  <ion-icon name="checkmark-circle-outline"></ion-icon>
                  <span>
                    GPS comprobado: {{ gpsActual().lat?.toFixed(5) }}, {{ gpsActual().lng?.toFixed(5) }}
                    (±{{ gpsActual().precisionM }} m)
                  </span>
                </div>
              } @else {
                <div class="alert-box alert-warning">
                  <ion-icon name="warning-outline"></ion-icon>
                  <span>
                    <strong>Ubicación no comprobable:</strong>
                    {{ advertenciaGps() ?? 'Sin lectura GPS aún. Puedes reintentar o guardar con esta etiqueta.' }}
                  </span>
                </div>
              }
            </ion-card-content>
          </ion-card>

          <!-- 3. CONTEO DE VOTOS (R6 / ADR-005) -->
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <ion-card>
              <ion-card-header>
                <ion-card-title>3. Resultados del acta</ion-card-title>
                <ion-card-subtitle>Ingresa votos por las 5 organizaciones, nulos, blancos y total</ion-card-subtitle>
              </ion-card-header>
              <ion-card-content>
                <div formArrayName="votos">
                  @for (cand of ctx.candidaturas; track cand.id; let i = $index) {
                    <div class="vote-row">
                      <ion-input
                        [formControlName]="i"
                        [label]="cand.organizacionNombre + ' — ' + cand.nombre"
                        labelPlacement="stacked"
                        fill="outline"
                        type="number"
                        inputmode="numeric"
                        min="0"
                        max="999"
                      ></ion-input>
                    </div>
                  }
                </div>

                <div class="totals-grid">
                  <ion-input
                    formControlName="nulos"
                    label="Votos nulos"
                    labelPlacement="stacked"
                    fill="outline"
                    type="number"
                    inputmode="numeric"
                    min="0"
                    max="999"
                  ></ion-input>

                  <ion-input
                    formControlName="blancos"
                    label="Votos blancos"
                    labelPlacement="stacked"
                    fill="outline"
                    type="number"
                    inputmode="numeric"
                    min="0"
                    max="999"
                  ></ion-input>
                </div>

                <div class="vote-row">
                  <ion-input
                    formControlName="totalSufragantes"
                    label="Total de sufragantes (según acta)"
                    labelPlacement="stacked"
                    fill="outline"
                    type="number"
                    inputmode="numeric"
                    min="0"
                    max="5000"
                  ></ion-input>
                </div>

                <!-- Resumen en vivo de consistencia -->
                <div
                  class="alert-box"
                  [class.alert-success]="evaluacionEnVivo().diferencia === 0 && evaluacionEnVivo().valida"
                  [class.alert-warning]="evaluacionEnVivo().diferencia !== 0 && evaluacionEnVivo().valida"
                  [class.alert-danger]="!evaluacionEnVivo().valida"
                >
                  <div>
                    <strong>Suma calculada: {{ evaluacionEnVivo().sumaCalculada }}</strong> ·
                    {{ evaluacionEnVivo().mensaje }}
                  </div>
                </div>

                <!-- Opción de acta físicamente inconsistente (ADR-005 / ADR-009) -->
                <ion-item lines="none" class="inconsistencia-check">
                  <ion-checkbox formControlName="esInconsistente" labelPlacement="end">
                    El acta física presenta inconsistencia (registrar como OBSERVADA)
                  </ion-checkbox>
                </ion-item>

                @if (form.controls.esInconsistente.value) {
                  <div class="vote-row">
                    <ion-textarea
                      formControlName="observacion"
                      label="Observación obligatoria (mín. 10 caracteres)"
                      labelPlacement="stacked"
                      fill="outline"
                      rows="3"
                      placeholder="Describe la inconsistencia observada en el acta física..."
                    ></ion-textarea>
                    @if (form.controls.observacion.value.trim().length < 10 && enviado()) {
                      <ion-text color="danger" class="field-error">
                        Escribe al menos 10 caracteres explicando la inconsistencia.
                      </ion-text>
                    }
                  </div>
                }

                <ion-button
                  type="submit"
                  expand="block"
                  color="primary"
                  class="save-btn"
                  [disabled]="guardando()"
                >
                  @if (guardando()) {
                    <ion-spinner name="crescent" slot="start"></ion-spinner>
                    Guardando acta...
                  } @else {
                    <ion-icon slot="start" name="save-outline"></ion-icon>
                    {{ ctx.actaExistente ? 'Guardar corrección' : 'Registrar acta' }}
                  }
                </ion-button>
              </ion-card-content>
            </ion-card>
          </form>
        }
      </app-estado-vista>
    </ion-content>
  `,
  styles: `
    .meta-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: var(--ion-color-light);
      border-radius: 10px;
      margin-bottom: 0.75rem;
    }
    .photo-actions,
    .totals-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.6rem;
      margin-bottom: 0.75rem;
    }
    .foto-preview {
      width: 100%;
      max-height: 260px;
      object-fit: contain;
      border-radius: 8px;
      border: 1px solid var(--ion-color-light-shade);
      margin-top: 0.5rem;
      background: #111;
    }
    .vote-row {
      margin-bottom: 0.85rem;
    }
    .alert-box {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      padding: 0.65rem 0.75rem;
      border-radius: 8px;
      font-size: 0.85rem;
      margin-top: 0.5rem;
      margin-bottom: 0.5rem;
    }
    .alert-success {
      background: rgba(var(--ion-color-success-rgb), 0.12);
      color: var(--ion-color-success-shade);
    }
    .alert-warning {
      background: rgba(var(--ion-color-warning-rgb), 0.16);
      color: var(--ion-color-warning-shade);
    }
    .alert-danger {
      background: rgba(var(--ion-color-danger-rgb), 0.12);
      color: var(--ion-color-danger-shade);
    }
    .inconsistencia-check {
      --padding-start: 0;
      margin: 0.5rem 0;
    }
    .field-error {
      display: block;
      font-size: 0.8rem;
      margin-top: 0.25rem;
    }
    .save-btn {
      margin-top: 1rem;
    }
  `,
})
export class ActaFormPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly actaService = inject(ActaFormService);
  private readonly mesasStore = inject(VeedorMesasStore);
  private readonly toast = inject(ToastService);

  readonly jrvId = input.required<string>();
  readonly dignidad = input.required<Dignidad>();

  readonly estadoCarga = signal<Estado<ContextoActa>>({ tipo: 'cargando' });
  readonly contexto = signal<ContextoActa | null>(null);
  readonly capturandoFoto = signal(false);
  readonly capturandoGps = signal(false);
  readonly guardando = signal(false);
  readonly enviado = signal(false);

  readonly fotoPreviewUrl = signal<string | null>(null);
  readonly nuevaFotoBlob = signal<Blob | null>(null);
  readonly calidadFoto = signal<ResultadoCalidadImagen | null>(null);
  readonly errorNitidez = signal<string | null>(null);

  readonly gpsActual = signal<GpsActa>({
    lat: null,
    lng: null,
    precisionM: null,
    capturadoEn: null,
    ubicacionComprobable: false,
  });
  readonly advertenciaGps = signal<string | null>(null);
  private readonly formTick = signal(0);

  readonly form = this.fb.nonNullable.group({
    votos: this.fb.array<FormControl<number>>([]),
    nulos: [0, [Validators.required, Validators.min(0), Validators.max(999)]],
    blancos: [0, [Validators.required, Validators.min(0), Validators.max(999)]],
    totalSufragantes: [0, [Validators.required, Validators.min(0), Validators.max(5000)]],
    esInconsistente: [false],
    observacion: [''],
  });

  readonly tituloDignidad = computed(() => (this.dignidad() === 'alcalde' ? 'Alcaldía' : 'Prefectura'));
  readonly rutaRetorno = computed(() => (this.auth.rolActual() === 'recinto' ? '/recinto' : '/veedor'));

  readonly evaluacionEnVivo = computed(() => {
    this.formTick();
    const raw = this.form.getRawValue();
    return evaluarConsistenciaActa({
      votosOrganizaciones: raw.votos.map((v) => Number(v)),
      nulos: Number(raw.nulos),
      blancos: Number(raw.blancos),
      totalSufragantes: Number(raw.totalSufragantes),
      esInconsistente: raw.esInconsistente,
      observacion: raw.observacion,
      esCorreccion: this.contexto()?.actaExistente !== null,
    });
  });

  constructor() {
    addIcons({ cameraOutline, imagesOutline, locationOutline, saveOutline, checkmarkCircleOutline, warningOutline });
    this.form.valueChanges.subscribe(() => this.formTick.update((n) => n + 1));
  }

  ngOnInit(): void {
    void this.cargar();
  }

  async cargar(): Promise<void> {
    this.estadoCarga.set({ tipo: 'cargando' });
    try {
      const ctx = await this.actaService.cargarContexto(this.jrvId(), this.dignidad());
      this.contexto.set(ctx);

      const votosArr = this.form.controls.votos;
      votosArr.clear();

      for (const cand of ctx.candidaturas) {
        const previo = ctx.actaExistente?.votos.find((v) => v.candidaturaId === cand.id)?.votos ?? 0;
        votosArr.push(
          this.fb.nonNullable.control(previo, [Validators.required, Validators.min(0), Validators.max(999)]),
        );
      }

      if (ctx.actaExistente) {
        this.form.patchValue({
          nulos: ctx.actaExistente.nulos,
          blancos: ctx.actaExistente.blancos,
          totalSufragantes: ctx.actaExistente.totalSufragantes,
          esInconsistente: ctx.actaExistente.estado === 'OBSERVADA',
          observacion: ctx.actaExistente.observacion ?? '',
        });
        this.gpsActual.set(ctx.actaExistente.gps);
        this.fotoPreviewUrl.set(ctx.fotoFirmadaUrl);
      }

      this.formTick.update((n) => n + 1);
      this.estadoCarga.set({ tipo: 'exito', datos: ctx });
    } catch (error) {
      const appErr = mapSupabaseError(error);
      this.estadoCarga.set({
        tipo: 'error',
        mensaje: appErr.mensajeUsuario,
        reintentar: () => void this.cargar(),
      });
    }
  }

  async tomarFoto(origen: 'camera' | 'gallery'): Promise<void> {
    this.capturandoFoto.set(true);
    this.errorNitidez.set(null);
    try {
      const foto = await this.actaService.capturarFoto(origen);
      if (!foto) {
        return;
      }

      this.calidadFoto.set(foto.calidad);
      if (!foto.calidad.nitida) {
        this.errorNitidez.set(
          `${foto.calidad.motivo ?? 'Foto borrosa.'} (Varianza: ${foto.calidad.varianza})`,
        );
        await this.toast.error('Foto rechazada por baja nitidez o poca luz. Repítela.');
        return;
      }

      this.fotoPreviewUrl.set(foto.dataUrl);
      this.nuevaFotoBlob.set(foto.blob);
      await this.toast.exito('Fotografía aceptada.');

      if (!this.gpsActual().ubicacionComprobable) {
        await this.obtenerGps();
      }
    } catch (error) {
      const appErr = mapSupabaseError(error);
      this.errorNitidez.set(appErr.mensajeUsuario);
      await this.toast.error(appErr.mensajeUsuario);
    } finally {
      this.capturandoFoto.set(false);
    }
  }

  async obtenerGps(): Promise<void> {
    this.capturandoGps.set(true);
    try {
      const res = await this.actaService.capturarGps();
      this.gpsActual.set(res.gps);
      this.advertenciaGps.set(res.advertencia);
      if (res.gps.ubicacionComprobable) {
        await this.toast.exito('Ubicación GPS capturada.');
      } else if (res.advertencia) {
        await this.toast.advertencia(res.advertencia);
      }
    } finally {
      this.capturandoGps.set(false);
    }
  }

  async onSubmit(): Promise<void> {
    this.enviado.set(true);
    const ctx = this.contexto();
    if (!ctx) {
      return;
    }

    if (this.form.invalid || !this.evaluacionEnVivo().valida) {
      this.form.markAllAsTouched();
      await this.toast.error(this.evaluacionEnVivo().mensaje);
      return;
    }

    if (!this.nuevaFotoBlob() && !ctx.actaExistente?.fotoPath) {
      await this.toast.error('Debes capturar o subir una foto nítida del acta.');
      return;
    }

    this.guardando.set(true);
    try {
      const raw = this.form.getRawValue();
      const votos = ctx.candidaturas.map((cand, index) => ({
        candidaturaId: cand.id,
        votos: Number(raw.votos[index] ?? 0),
      }));

      const guardada = await this.actaService.guardarActa({
        jrv: ctx.jrv,
        dignidad: this.dignidad(),
        votos,
        nulos: Number(raw.nulos),
        blancos: Number(raw.blancos),
        totalSufragantes: Number(raw.totalSufragantes),
        esInconsistente: raw.esInconsistente,
        observacion: raw.observacion,
        nuevaFotoBlob: this.nuevaFotoBlob(),
        fotoPathExistente: ctx.actaExistente?.fotoPath ?? null,
        gps: this.gpsActual(),
        versionBase: ctx.actaExistente?.version ?? null,
      });

      await this.toast.exito(`Acta registrada (${guardada.estado} · v${guardada.version}).`);
      void this.mesasStore.cargarMesas();
      await this.router.navigateByUrl(this.rutaRetorno(), { replaceUrl: true });
    } catch (error) {
      const appErr = mapSupabaseError(error);
      await this.toast.error(appErr.mensajeUsuario);
    } finally {
      this.guardando.set(false);
    }
  }
}
