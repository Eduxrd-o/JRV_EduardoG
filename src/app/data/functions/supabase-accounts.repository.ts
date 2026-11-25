import { inject, Injectable } from '@angular/core';

import { AppError } from '../../core/errors/app-error.model';
import { mapSupabaseError } from '../../core/errors/supabase-error.mapper';
import { SupabaseClientService } from '../../core/supabase/supabase-client.service';
import type { Perfil, RolUsuario } from '../../domain/models';
import type { AccountsRepository, CrearCuentaInput } from '../../domain/ports';

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

interface EdgeAccountResponse {
  perfil?: PerfilRow;
  error?: string;
}

/**
 * ADR-002 / ADR-007:
 * La creación de coordinadores y veedores invoca exclusivamente Edge Functions.
 * Ninguna clave administrativa (service_role) existe en la aplicación.
 */
@Injectable({ providedIn: 'root' })
export class SupabaseAccountsRepository implements AccountsRepository {
  private readonly supabase = inject(SupabaseClientService).client;

  async listarVeedoresPorRecinto(recintoId: string): Promise<Perfil[]> {
    const { data, error } = await this.supabase
      .from('perfiles')
      .select('id, cedula, nombres, apellidos, telefono, email, rol, recinto_id, creado_por, debe_cambiar_clave')
      .eq('rol', 'veedor')
      .eq('recinto_id', recintoId)
      .order('apellidos', { ascending: true });

    if (error) {
      throw mapSupabaseError(error);
    }

    return ((data ?? []) as PerfilRow[]).map((row) => this.mapRow(row));
  }

  async listarCoordinadoresRecinto(): Promise<Perfil[]> {
    const { data, error } = await this.supabase
      .from('perfiles')
      .select('id, cedula, nombres, apellidos, telefono, email, rol, recinto_id, creado_por, debe_cambiar_clave')
      .eq('rol', 'recinto')
      .order('apellidos', { ascending: true });

    if (error) {
      throw mapSupabaseError(error);
    }

    return ((data ?? []) as PerfilRow[]).map((row) => this.mapRow(row));
  }

  async crearCoordinadorRecinto(input: CrearCuentaInput): Promise<Perfil> {
    return this.invocarCreacion('crear-coordinador-recinto', input);
  }

  async crearVeedor(input: CrearCuentaInput): Promise<Perfil> {
    return this.invocarCreacion('crear-veedor', input);
  }

  async asignarRecintoACoordinador(coordinadorId: string, recintoId: string | null): Promise<void> {
    const { error } = await this.supabase
      .from('perfiles')
      .update({ recinto_id: recintoId })
      .eq('id', coordinadorId)
      .eq('rol', 'recinto');

    if (error) {
      throw mapSupabaseError(error);
    }
  }

  private async invocarCreacion(fnName: 'crear-coordinador-recinto' | 'crear-veedor', input: CrearCuentaInput): Promise<Perfil> {
    const { data, error } = await this.supabase.functions.invoke<EdgeAccountResponse>(fnName, {
      body: input,
    });

    if (error) {
      let detalle = error.message;
      const ctx = (error as { context?: Response }).context;
      if (ctx) {
        try {
          const parsed = (await ctx.json()) as { error?: string };
          if (parsed?.error) {
            detalle = parsed.error;
          }
        } catch {
          // Mantener mensaje original
        }
      }
      throw mapSupabaseError({ message: detalle });
    }

    if (!data?.perfil) {
      throw new AppError('DESCONOCIDO', data?.error ?? 'No se recibió el perfil creado desde el servidor.');
    }

    return this.mapRow(data.perfil);
  }

  private mapRow(row: PerfilRow): Perfil {
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
