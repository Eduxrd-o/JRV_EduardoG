import { inject, Injectable } from '@angular/core';

import { mapSupabaseError } from '../../core/errors/supabase-error.mapper';
import { SupabaseClientService } from '../../core/supabase/supabase-client.service';
import type { EstadoJrv, Jrv } from '../../domain/models';
import type { JrvRepository } from '../../domain/ports';

interface JrvRow {
  id: string;
  recinto_id: string;
  numero: number;
  veedor_id: string | null;
  estado: EstadoJrv;
}

@Injectable({ providedIn: 'root' })
export class SupabaseJrvRepository implements JrvRepository {
  private readonly supabase = inject(SupabaseClientService).client;

  async listarMisMesas(): Promise<Jrv[]> {
    const { data, error } = await this.supabase
      .from('jrv')
      .select('id, recinto_id, numero, veedor_id, estado')
      .order('numero', { ascending: true });

    if (error) {
      throw mapSupabaseError(error);
    }

    return ((data ?? []) as JrvRow[]).map((row) => this.mapRow(row));
  }

  async listarPorRecinto(recintoId: string): Promise<Jrv[]> {
    const { data, error } = await this.supabase
      .from('jrv')
      .select('id, recinto_id, numero, veedor_id, estado')
      .eq('recinto_id', recintoId)
      .order('numero', { ascending: true });

    if (error) {
      throw mapSupabaseError(error);
    }

    return ((data ?? []) as JrvRow[]).map((row) => this.mapRow(row));
  }

  async obtenerPorId(jrvId: string): Promise<Jrv | null> {
    const { data, error } = await this.supabase
      .from('jrv')
      .select('id, recinto_id, numero, veedor_id, estado')
      .eq('id', jrvId)
      .maybeSingle();

    if (error) {
      throw mapSupabaseError(error);
    }

    return data ? this.mapRow(data as JrvRow) : null;
  }

  async asignarVeedor(jrvId: string, veedorId: string | null): Promise<void> {
    const { error } = await this.supabase.from('jrv').update({ veedor_id: veedorId }).eq('id', jrvId);
    if (error) {
      throw mapSupabaseError(error);
    }
  }

  private mapRow(row: JrvRow): Jrv {
    return {
      id: row.id,
      recintoId: row.recinto_id,
      numero: row.numero,
      veedorId: row.veedor_id,
      estado: row.estado,
    };
  }
}
