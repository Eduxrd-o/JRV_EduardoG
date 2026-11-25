import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';

import type { RolUsuario } from '../../domain/models';

import { AuthService } from './auth.service';

/**
 * ADR-005: Bloquea rutas privadas si no existe sesión autenticada.
 */
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.asegurarInicializado();

  if (!auth.estaAutenticado()) {
    return router.createUrlTree(['/auth/login']);
  }
  return true;
};

/**
 * ADR-005 (R3): Si el usuario aún tiene debe_cambiar_clave = true,
 * lo redirige obligatoriamente a /auth/cambiar-clave.
 */
export const cambioClaveGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.asegurarInicializado();

  if (!auth.estaAutenticado()) {
    return router.createUrlTree(['/auth/login']);
  }

  if (auth.debeCambiarClave()) {
    return router.createUrlTree(['/auth/cambiar-clave']);
  }

  return true;
};

/**
 * ADR-005 (R4–R6, R8): Restringe la ruta a los roles indicados (complemento UX de RLS).
 */
export function rolGuard(rolesPermitidos: readonly RolUsuario[]): CanActivateFn {
  return async () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    await auth.asegurarInicializado();

    const perfil = auth.perfil();
    if (!perfil) {
      return router.createUrlTree(['/auth/login']);
    }

    if (perfil.debeCambiarClave) {
      return router.createUrlTree(['/auth/cambiar-clave']);
    }

    if (!rolesPermitidos.includes(perfil.rol)) {
      return router.createUrlTree([auth.rutaInicialPorRol(perfil.rol)]);
    }

    return true;
  };
}

/**
 * Evita volver al login si ya hay una sesión activa.
 */
export const noAuthGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.asegurarInicializado();

  if (auth.estaAutenticado()) {
    if (auth.debeCambiarClave()) {
      return router.createUrlTree(['/auth/cambiar-clave']);
    }
    return router.createUrlTree([auth.rutaInicialPorRol()]);
  }

  return true;
};
