export type CodigoErrorApp =
  | 'CREDENCIALES_INVALIDAS'
  | 'SESION_EXPIRADA'
  | 'DEBE_CAMBIAR_CLAVE'
  | 'PERMISO_DENEGADO'
  | 'DATO_DUPLICADO'
  | 'TOTALES_INCONSISTENTES'
  | 'CONFLICTO_VERSION'
  | 'SIN_CONEXION'
  | 'VALIDACION'
  | 'DESCONOCIDO';

export class AppError extends Error {
  constructor(
    public readonly codigo: CodigoErrorApp,
    public readonly mensajeUsuario: string,
    public readonly causa?: unknown,
  ) {
    super(mensajeUsuario);
    this.name = 'AppError';
  }
}
