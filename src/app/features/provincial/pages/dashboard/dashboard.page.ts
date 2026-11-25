import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, type OnInit, signal } from '@angular/core';
import {
  IonBadge,
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
  IonItem,
  IonLabel,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToggle,
  IonToolbar,
  type RefresherCustomEvent,
  type SegmentCustomEvent,
  type SelectCustomEvent,
  type ToggleCustomEvent,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { logOutOutline, refreshOutline } from 'ionicons/icons';

import { AuthService } from '../../../../core/auth/auth.service';
import type { AvanceRecintoRow, Dignidad } from '../../../../domain/models';
import { EstadoVistaComponent } from '../../../../shared/components/estado-vista/estado-vista.component';
import { ProvincialStore } from '../../services/provincial.store';

interface FilaCandidatoConsolidada {
  candidaturaId: string;
  candidaturaNombre: string;
  organizacionLista: string;
  organizacionNombre: string;
  votos: number;
  votosObservados: number;
  porcentaje: number;
  anchoBarra: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [
    DatePipe,
    DecimalPipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonItem,
    IonToggle,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonBadge,
    EstadoVistaComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Dashboard Provincial</ion-title>
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

      <div class="filters-box">
        <ion-segment [value]="dignidad()" (ionChange)="onDignidad($event)">
          <ion-segment-button value="alcalde">
            <ion-label>Alcaldía</ion-label>
          </ion-segment-button>
          <ion-segment-button value="prefecto">
            <ion-label>Prefectura</ion-label>
          </ion-segment-button>
        </ion-segment>

        <ion-select
          label="Alcance"
          labelPlacement="stacked"
          fill="outline"
          [value]="recintoFiltro()"
          (ionChange)="onRecinto($event)"
        >
          <ion-select-option value="CONSOLIDADO">Consolidado Provincial</ion-select-option>
          @for (r of avanceRecintos(); track r.recintoId) {
            <ion-select-option [value]="r.recintoId">
              {{ r.recintoNombre }} ({{ r.parroquia }})
            </ion-select-option>
          }
        </ion-select>

        <ion-item lines="none" class="toggle-item">
          <ion-toggle [checked]="excluirObservadas()" (ionChange)="onExcluirObservadas($event)">
            Excluir actas observadas del conteo
          </ion-toggle>
        </ion-item>
      </div>

      <app-estado-vista
        [estado]="store.dashboard()"
        mensajeCargando="Consultando vistas agregadas en servidor..."
        mensajeVacio="No hay datos de escrutinio disponibles."
      >
        @if (ultimaActualizacion(); as fecha) {
          <p class="update-note">Última actualización: {{ fecha | date: 'short' }}</p>
        }

        <!-- KPIs de avance -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <span class="kpi-val">{{ resumenAvance().totalJrv }}</span>
            <span class="kpi-lbl">Total JRV</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-val">{{ resumenAvance().actasAlcalde }}</span>
            <span class="kpi-lbl">Actas Alcalde</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-val">{{ resumenAvance().actasPrefecto }}</span>
            <span class="kpi-lbl">Actas Prefecto</span>
          </div>
          <div class="kpi-card kpi-warn">
            <span class="kpi-val">{{ resumenAvance().actasObservadas }}</span>
            <span class="kpi-lbl">Observadas</span>
          </div>
        </div>

        <!-- Gráfico de barras HTML/CSS sin librería externa (ADR-009) -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>
              Votos por candidatura · {{ dignidad() === 'alcalde' ? 'Alcaldía' : 'Prefectura' }}
            </ion-card-title>
            <ion-card-subtitle>
              {{ excluirObservadas() ? 'Solo actas validadas/corregidas' : 'Incluye actas observadas (marcadas)' }}
            </ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            @if (filasCandidatos().length === 0) {
              <p class="empty-inline">Aún no existen actas registradas para este filtro.</p>
            } @else {
              @for (item of filasCandidatos(); track item.candidaturaId) {
                <div class="bar-item">
                  <div class="bar-label">
                    <span>
                      <strong>{{ item.organizacionLista }}</strong> · {{ item.candidaturaNombre }}
                      @if (!excluirObservadas() && item.votosObservados > 0) {
                        <ion-badge color="warning" class="obs-badge">
                          +{{ item.votosObservados }} obs.
                        </ion-badge>
                      }
                    </span>
                    <span class="bar-num">
                      {{ item.votos }} ({{ item.porcentaje | number: '1.1-1' }}%)
                    </span>
                  </div>
                  <div class="bar-track">
                    <div class="bar-fill" [style.width.%]="item.anchoBarra"></div>
                  </div>
                </div>
              }

              <div class="bn-summary">
                <div><strong>Blancos:</strong> {{ resumenBlancosNulos().blancos }}</div>
                <div><strong>Nulos:</strong> {{ resumenBlancosNulos().nulos }}</div>
                <div><strong>Sufragantes:</strong> {{ resumenBlancosNulos().sufragantes }}</div>
              </div>
            }
          </ion-card-content>
        </ion-card>

        <!-- Avance por recinto -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Avance por recinto</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            @for (r of avanceRecintos(); track r.recintoId) {
              <div class="avance-row">
                <div>
                  <strong>{{ r.recintoNombre }}</strong>
                  <div class="avance-sub">{{ r.canton }} · {{ r.parroquia }}</div>
                </div>
                <div class="avance-badges">
                  <ion-badge color="primary">Alc {{ r.actasAlcalde }}/{{ r.totalJrv }}</ion-badge>
                  <ion-badge color="secondary">Pref {{ r.actasPrefecto }}/{{ r.totalJrv }}</ion-badge>
                  @if (r.actasObservadas > 0) {
                    <ion-badge color="warning">Obs {{ r.actasObservadas }}</ion-badge>
                  }
                </div>
              </div>
            }
          </ion-card-content>
        </ion-card>
      </app-estado-vista>
    </ion-content>
  `,
  styles: `
    .filters-box {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }
    .toggle-item {
      --padding-start: 0;
      --inner-padding-end: 0;
    }
    .update-note {
      font-size: 0.78rem;
      color: var(--ion-color-medium);
      margin: 0 0 0.75rem;
      text-align: right;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }
    .kpi-card {
      background: var(--ion-color-light);
      border-radius: 10px;
      padding: 0.6rem 0.4rem;
      text-align: center;
      display: flex;
      flex-direction: column;
    }
    .kpi-warn {
      background: rgba(var(--ion-color-warning-rgb), 0.16);
    }
    .kpi-val {
      font-size: 1.2rem;
      font-weight: 700;
    }
    .kpi-lbl {
      font-size: 0.72rem;
      color: var(--ion-color-medium-shade);
    }
    .bar-item {
      margin-bottom: 0.85rem;
    }
    .bar-label {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.85rem;
      margin-bottom: 0.25rem;
      gap: 0.5rem;
    }
    .bar-num {
      white-space: nowrap;
      font-weight: 600;
    }
    .bar-track {
      height: 12px;
      background: var(--ion-color-light-shade);
      border-radius: 6px;
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      background: var(--ion-color-primary);
      border-radius: 6px;
      transition: width 0.25s ease;
    }
    .obs-badge {
      font-size: 0.68rem;
      margin-left: 0.3rem;
      vertical-align: middle;
    }
    .bn-summary {
      display: flex;
      justify-content: space-between;
      margin-top: 1rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--ion-color-light-shade);
      font-size: 0.88rem;
    }
    .empty-inline {
      color: var(--ion-color-medium);
      text-align: center;
      margin: 1rem 0;
    }
    .avance-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.55rem 0;
      border-bottom: 1px solid var(--ion-color-light);
      gap: 0.5rem;
    }
    .avance-sub {
      font-size: 0.78rem;
      color: var(--ion-color-medium);
    }
    .avance-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 0.3rem;
      justify-content: flex-end;
    }
  `,
})
export class DashboardPage implements OnInit {
  private readonly auth = inject(AuthService);
  readonly store = inject(ProvincialStore);

  readonly dignidad = signal<Dignidad>('alcalde');
  readonly recintoFiltro = signal<string>('CONSOLIDADO');
  readonly excluirObservadas = signal<boolean>(false);

  readonly ultimaActualizacion = computed(() => {
    const est = this.store.dashboard();
    return est.tipo === 'exito' ? est.datos.actualizadoEn : null;
  });

  readonly avanceRecintos = computed<AvanceRecintoRow[]>(() => {
    const est = this.store.dashboard();
    return est.tipo === 'exito' ? est.datos.avance : [];
  });

  readonly resumenAvance = computed(() => {
    const filtro = this.recintoFiltro();
    const lista =
      filtro === 'CONSOLIDADO'
        ? this.avanceRecintos()
        : this.avanceRecintos().filter((r) => r.recintoId === filtro);

    return lista.reduce(
      (acc, r) => ({
        totalJrv: acc.totalJrv + r.totalJrv,
        actasAlcalde: acc.actasAlcalde + r.actasAlcalde,
        actasPrefecto: acc.actasPrefecto + r.actasPrefecto,
        actasObservadas: acc.actasObservadas + r.actasObservadas,
      }),
      { totalJrv: 0, actasAlcalde: 0, actasPrefecto: 0, actasObservadas: 0 },
    );
  });

  readonly filasCandidatos = computed<FilaCandidatoConsolidada[]>(() => {
    const est = this.store.dashboard();
    if (est.tipo !== 'exito') {
      return [];
    }

    const dig = this.dignidad();
    const rec = this.recintoFiltro();
    const excluir = this.excluirObservadas();

    const filtradas = est.datos.resultados.filter(
      (r) => r.dignidad === dig && (rec === 'CONSOLIDADO' || r.recintoId === rec),
    );

    const mapa = new Map<string, Omit<FilaCandidatoConsolidada, 'porcentaje' | 'anchoBarra'>>();
    for (const r of filtradas) {
      const votos = excluir ? r.votosSinObservadas : r.votosTotales;
      const existente = mapa.get(r.candidaturaId);
      if (existente) {
        existente.votos += votos;
        existente.votosObservados += r.votosObservados;
      } else {
        mapa.set(r.candidaturaId, {
          candidaturaId: r.candidaturaId,
          candidaturaNombre: r.candidaturaNombre,
          organizacionLista: r.organizacionLista,
          organizacionNombre: r.organizacionNombre,
          votos,
          votosObservados: r.votosObservados,
        });
      }
    }

    const lista = Array.from(mapa.values()).sort((a, b) => b.votos - a.votos);
    const totalValidos = lista.reduce((acc, item) => acc + item.votos, 0);
    const maxVotos = lista.reduce((max, item) => Math.max(max, item.votos), 0);

    return lista.map((item) => ({
      ...item,
      porcentaje: totalValidos > 0 ? (item.votos / totalValidos) * 100 : 0,
      anchoBarra: maxVotos > 0 ? (item.votos / maxVotos) * 100 : 0,
    }));
  });

  readonly resumenBlancosNulos = computed(() => {
    const est = this.store.dashboard();
    if (est.tipo !== 'exito') {
      return { blancos: 0, nulos: 0, sufragantes: 0 };
    }

    const dig = this.dignidad();
    const rec = this.recintoFiltro();
    const excluir = this.excluirObservadas();

    return est.datos.blancosNulos
      .filter((r) => r.dignidad === dig && (rec === 'CONSOLIDADO' || r.recintoId === rec))
      .reduce(
        (acc, r) => ({
          blancos: acc.blancos + (excluir ? r.blancosSinObservadas : r.blancosTotales),
          nulos: acc.nulos + (excluir ? r.nulosSinObservadas : r.nulosTotales),
          sufragantes: acc.sufragantes + (excluir ? r.sufragantesSinObservadas : r.sufragantesTotales),
        }),
        { blancos: 0, nulos: 0, sufragantes: 0 },
      );
  });

  constructor() {
    addIcons({ refreshOutline, logOutOutline });
  }

  ngOnInit(): void {
    void this.store.cargarTodo();
  }

  recargar(): void {
    void this.store.cargarTodo();
  }

  async onRefresh(event: RefresherCustomEvent): Promise<void> {
    await this.store.cargarTodo();
    await event.target.complete();
  }

  onDignidad(event: SegmentCustomEvent): void {
    this.dignidad.set((event.detail.value as Dignidad) ?? 'alcalde');
  }

  onRecinto(event: SelectCustomEvent): void {
    this.recintoFiltro.set(String(event.detail.value ?? 'CONSOLIDADO'));
  }

  onExcluirObservadas(event: ToggleCustomEvent): void {
    this.excluirObservadas.set(Boolean(event.detail.checked));
  }

  async salir(): Promise<void> {
    await this.auth.cerrarSesion();
  }
}
