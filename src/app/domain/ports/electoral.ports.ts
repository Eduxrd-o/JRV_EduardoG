import type {
  Acta,
  ActaVoto,
  Candidatura,
  DashboardSnapshot,
  Dignidad,
  GpsActa,
  Jrv,
  Perfil,
  Recinto,
} from '../models';

export interface GuardarActaPayload {
  jrvId: string;
  recintoId: string;
  dignidad: Dignidad;
  votos: ActaVoto[];
  nulos: number;
  blancos: number;
  totalSufragantes: number;
  fotoPath: string;
  gps: GpsActa;
  esInconsistente: boolean;
  observacion: string;
  clientUuid: string;
  versionBase: number | null;
}

export interface CrearCuentaInput {
  cedula: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  email: string;
  recintoId?: string;
}

export interface CrearRecintoInput {
  provincia: string;
  canton: string;
  parroquia: string;
  nombre: string;
  numJrv: number;
  lat: number | null;
  lng: number | null;
}

export interface JrvRepository {
  listarMisMesas(): Promise<Jrv[]>;
  listarPorRecinto(recintoId: string): Promise<Jrv[]>;
  obtenerPorId(jrvId: string): Promise<Jrv | null>;
  asignarVeedor(jrvId: string, veedorId: string | null): Promise<void>;
}

export interface ActaRepository {
  listarCandidaturas(dignidad: Dignidad): Promise<Candidatura[]>;
  obtenerActaPorJrvYDignidad(jrvId: string, dignidad: Dignidad): Promise<Acta | null>;
  listarActasPorRecinto(recintoId: string): Promise<Acta[]>;
  guardarActa(payload: GuardarActaPayload): Promise<Acta>;
}

export interface PhotoStorageRepository {
  subirFotoActa(recintoId: string, jrvId: string, dignidad: Dignidad, blob: Blob): Promise<string>;
  obtenerUrlFirmada(fotoPath: string): Promise<string>;
}

export interface AccountsRepository {
  listarVeedoresPorRecinto(recintoId: string): Promise<Perfil[]>;
  listarCoordinadoresRecinto(): Promise<Perfil[]>;
  crearCoordinadorRecinto(input: CrearCuentaInput): Promise<Perfil>;
  crearVeedor(input: CrearCuentaInput): Promise<Perfil>;
  asignarRecintoACoordinador(coordinadorId: string, recintoId: string | null): Promise<void>;
}

export interface RecintoRepository {
  listarRecintos(): Promise<Recinto[]>;
  crearRecinto(input: CrearRecintoInput): Promise<Recinto>;
}

export interface DashboardRepository {
  cargarSnapshot(): Promise<DashboardSnapshot>;
}
