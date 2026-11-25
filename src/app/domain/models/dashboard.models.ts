import type { Dignidad, EstadoActa } from './electoral.models';

export interface ResultadoCandidatoRow {
  recintoId: string;
  recintoNombre: string;
  dignidad: Dignidad;
  candidaturaId: string;
  candidaturaNombre: string;
  organizacionNombre: string;
  organizacionLista: string;
  votosTotales: number;
  votosSinObservadas: number;
  votosObservados: number;
}

export interface ResultadoBlancosNulosRow {
  recintoId: string;
  dignidad: Dignidad;
  blancosTotales: number;
  nulosTotales: number;
  sufragantesTotales: number;
  blancosSinObservadas: number;
  nulosSinObservadas: number;
  sufragantesSinObservadas: number;
  actasObservadas: number;
}

export interface AvanceRecintoRow {
  recintoId: string;
  canton: string;
  parroquia: string;
  recintoNombre: string;
  totalJrv: number;
  actasAlcalde: number;
  actasPrefecto: number;
  actasObservadas: number;
}

export interface ActaGpsItem {
  actaId: string;
  recintoId: string;
  recintoNombre: string;
  jrvNumero: number;
  dignidad: Dignidad;
  estado: EstadoActa;
  lat: number | null;
  lng: number | null;
  precisionM: number | null;
  ubicacionComprobable: boolean;
  actualizadoEn: string;
}

export interface DashboardSnapshot {
  resultados: ResultadoCandidatoRow[];
  blancosNulos: ResultadoBlancosNulosRow[];
  avance: AvanceRecintoRow[];
  actasGps: ActaGpsItem[];
  actualizadoEn: string;
}
