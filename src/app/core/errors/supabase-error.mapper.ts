import { AppError } from './app-error.model';

interface RawErrorShape {
  code?: string;
  message?: string;
  status?: number;
  error_description?: string;
}

/**
 * ADR-005 / ADR-010:
 * Traduce errores técnicos de Supabase, PostgREST, Auth y red a mensajes comprensibles en español.
 */
export function mapSupabaseError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  const raw = (typeof error === 'object' && error !== null ? error : {}) as RawErrorShape;
  const message =
    typeof error === 'string'
      ? error
      : (raw.message ?? raw.error_description ?? (error instanceof Error ? error.message : ''));
  const code = raw.code ?? '';
  const lower = message.toLowerCase();

  if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('network request failed')) {
    return new AppError('SIN_CONEXION', 'Sin conexión a internet. Verifica tu red e intenta nuevamente.', error);
  }

  if (lower.includes('invalid login credentials') || lower.includes('invalid_credentials')) {
    return new AppError('CREDENCIALES_INVALIDAS', 'Cédula o contraseña incorrecta.', error);
  }

  if (lower.includes('email not confirmed')) {
    return new AppError(
      'CREDENCIALES_INVALIDAS',
      'Tu cuenta aún no está confirmada. Revisa tu correo electrónico.',
      error,
    );
  }

  if (message.includes('DEBE_CAMBIAR_CLAVE')) {
    return new AppError(
      'DEBE_CAMBIAR_CLAVE',
      'Debes cambiar tu contraseña inicial antes de acceder al sistema.',
      error,
    );
  }

  if (message.includes('CONFLICTO_VERSION')) {
    return new AppError(
      'CONFLICTO_VERSION',
      'El acta fue modificada por otro usuario mientras estabas sin conexión. Revisa las versiones.',
      error,
    );
  }

  if (message.includes('TOTALES_INCONSISTENTES')) {
    return new AppError(
      'TOTALES_INCONSISTENTES',
      'La suma de votos, nulos y blancos no coincide con el total de sufragantes.',
      error,
    );
  }

  if (
    code === '42501' ||
    raw.status === 403 ||
    lower.includes('row-level security') ||
    lower.includes('permission denied')
  ) {
    return new AppError('PERMISO_DENEGADO', 'No tienes permiso para realizar esta acción o ver este registro.', error);
  }

  if (code === '23505' || lower.includes('duplicate key') || lower.includes('already registered')) {
    return new AppError('DATO_DUPLICADO', 'Ya existe un registro con los mismos datos (cédula, correo o acta).', error);
  }

  if (raw.status === 401 || lower.includes('jwt expired') || lower.includes('not authenticated')) {
    return new AppError('SESION_EXPIRADA', 'Tu sesión expiró. Inicia sesión nuevamente.', error);
  }

  return new AppError(
    'DESCONOCIDO',
    message ? `Ocurrió un problema: ${message}` : 'Ocurrió un error inesperado. Intenta nuevamente.',
    error,
  );
}
