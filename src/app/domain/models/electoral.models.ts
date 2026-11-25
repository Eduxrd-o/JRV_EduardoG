/**
 * ADR-004 / ADR-008: Modelos puros del dominio electoral (sin dependencias de Angular ni Supabase).
 */
export type RolUsuario = 'provincial' | 'recinto' | 'veedor';

export type Dignidad = 'alcalde' | 'prefecto';

export type EstadoActa = 'VALIDADA' | 'OBSERVADA' | 'CORREGIDA';

export type EstadoJrv = 'PENDIENTE' | 'PARCIAL' | 'COMPLETA' | 'OBSERVADA';

export type EstadoSyncLocal = 'pendiente' | 'sincronizando' | 'sincronizada' | 'conflicto' | 'error';

export interface Perfil {
  id: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  email: string;
  rol: RolUsuario;
  recintoId: string | null;
  creadoPor: string | null;
  debeCambiarClave: boolean;
}

export interface Recinto {
  id: string;
  provincia: string;
  canton: string;
  parroquia: string;
  nombre: string;
  numJrv: number;
  lat: number | null;
  lng: number | null;
  coordinadorId?: string | null;
}

export interface Jrv {
  id: string;
  recintoId: string;
  numero: number;
  veedorId: string | null;
  veedorNombre?: string | null;
  estado: EstadoJrv;
}

export interface Organizacion {
  id: string;
  nombre: string;
  lista: string;
}

export interface Candidatura {
  id: string;
  organizacionId: string;
  organizacionNombre?: string;
  dignidad: Dignidad;
  nombre: string;
}

export interface GpsActa {
  lat: number | null;
  lng: number | null;
  precisionM: number | null;
  capturadoEn: string | null;
  ubicacionComprobable: boolean;
}

export interface ActaVoto {
  candidaturaId: string;
  votos: number;
}

export interface Acta {
  id: string;
  jrvId: string;
  dignidad: Dignidad;
  votos: ActaVoto[];
  nulos: number;
  blancos: number;
  totalSufragantes: number;
  fotoPath: string;
  gps: GpsActa;
  estado: EstadoActa;
  observacion: string | null;
  version: number;
  clientUuid: string;
  actualizadoPor: string;
  actualizadoEn: string;
}
