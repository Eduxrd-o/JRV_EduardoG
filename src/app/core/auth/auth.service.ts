import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

import type { Perfil, RolUsuario } from '../../domain/models';
import { AppError } from '../errors/app-error.model';
import { LoggerService } from '../errors/logger.service';
import { mapSupabaseError } from '../errors/supabase-error.mapper';
import { SupabaseClientService } from '../supabase/supabase-client.service';

interface PerfilRow {
  id: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  email: string;
  rol: RolUsuario;
  recinto_id: string | null;
  creado_por: string | null;
  debe_cambiar_clave: boolean;
}

/**
 * ADR-002 / ADR-005 (R2, R3):
 * Gestiona la sesión autenticada y el perfil mediante Signals.
 * El inicio de sesión usa cédula -> RPC email_por_cedula -> signInWithPassword.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseClientService).client;
  private readonly router = inject(Router);
  private readonly logger = inject(LoggerService);

  private readonly _perfil = signal<Perfil | null>(null);
  private readonly _inicializado = signal<boolean>(false);

  readonly perfil = this._perfil.asReadonly();
  readonly inicializado = this._inicializado.asReadonly();
  readonly estaAutenticado = computed(() => this._perfil() !== null);
  readonly debeCambiarClave = computed(() => this._perfil()?.debeCambiarClave ?? false);
  readonly rolActual = computed(() => this._perfil()?.rol ?? null);

  private initPromise: Promise<void> | null = null;

  async asegurarInicializado(): Promise<void> {
    if (this._inicializado()) {
      return;
    }
    if (!this.initPromise) {
      this.initPromise = this.cargarSesionActual()
        .then(() => undefined)
        .finally(() => {
          this._inicializado.set(true);
        });
    }
    await this.initPromise;
  }

  async cargarSesionActual(): Promise<Perfil | null> {
    try {
      const {
        data: { session },
      } = await this.supabase.auth.getSession();

      if (!session?.user) {
        this._perfil.set(null);
        return null;
      }

      const perfil = await this.obtenerPerfilPorId(session.user.id);
      this._perfil.set(perfil);
      return perfil;
    } catch {
      this.logger.warn('AuthService', 'No se pudo restaurar la sesión inicial');
      this._perfil.set(null);
      return null;
    }
  }

  async iniciarSesionConCedula(cedula: string, password: string): Promise<Perfil> {
    const cedulaLimpia = cedula.trim();

    const { data: emailData, error: rpcError } = await this.supabase.rpc('email_por_cedula', {
      p_cedula: cedulaLimpia,
    });

    if (rpcError) {
      throw mapSupabaseError(rpcError);
    }

    const email = typeof emailData === 'string' ? emailData : null;
    if (!email) {
      throw new AppError('CREDENCIALES_INVALIDAS', 'Cédula o contraseña incorrecta.');
    }

    const { data: authData, error: signInError } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !authData.user) {
      throw mapSupabaseError(signInError);
    }

    const perfil = await this.obtenerPerfilPorId(authData.user.id);
    if (!perfil) {
      await this.supabase.auth.signOut();
      throw new AppError('PERMISO_DENEGADO', 'No se encontró un perfil electoral asociado a esta cuenta.');
    }

    this._perfil.set(perfil);
    this._inicializado.set(true);
    return perfil;
  }

  async cambiarClaveObligatoria(nuevaClave: string): Promise<void> {
    const { error: updateError } = await this.supabase.auth.updateUser({ password: nuevaClave });
    if (updateError) {
      throw mapSupabaseError(updateError);
    }

    const { error: rpcError } = await this.supabase.rpc('marcar_clave_cambiada');
    if (rpcError) {
      throw mapSupabaseError(rpcError);
    }

    const actual = this._perfil();
    if (actual) {
      this._perfil.set({ ...actual, debeCambiarClave: false });
    }
  }

  async recuperarClavePorCorreo(correo: string): Promise<void> {
    const { error } = await this.supabase.auth.resetPasswordForEmail(correo.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/auth/cambiar-clave`,
    });
    if (error) {
      throw mapSupabaseError(error);
    }
  }

  async cerrarSesion(): Promise<void> {
    await this.supabase.auth.signOut();
    this._perfil.set(null);
    await this.router.navigateByUrl('/auth/login', { replaceUrl: true });
  }

  rutaInicialPorRol(rol: RolUsuario | null = this.rolActual()): string {
    switch (rol) {
      case 'provincial':
        return '/provincial';
      case 'recinto':
        return '/recinto';
      case 'veedor':
        return '/veedor';
      default:
        return '/auth/login';
    }
  }

  private async obtenerPerfilPorId(userId: string): Promise<Perfil | null> {
    const { data, error } = await this.supabase
      .from('perfiles')
      .select('id, cedula, nombres, apellidos, telefono, email, rol, recinto_id, creado_por, debe_cambiar_clave')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw mapSupabaseError(error);
    }
    if (!data) {
      return null;
    }

    const row = data as PerfilRow;
    return {
      id: row.id,
      cedula: row.cedula,
      nombres: row.nombres,
      apellidos: row.apellidos,
      telefono: row.telefono,
      email: row.email,
      rol: row.rol,
      recintoId: row.recinto_id,
      creadoPor: row.creado_por,
      debeCambiarClave: row.debe_cambiar_clave,
    };
  }
}
