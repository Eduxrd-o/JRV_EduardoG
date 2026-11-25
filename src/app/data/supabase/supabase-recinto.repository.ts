import { inject, Injectable } from '@angular/core';

import { mapSupabaseError } from '../../core/errors/supabase-error.mapper';
import { SupabaseClientService } from '../../core/supabase/supabase-client.service';
import type { Recinto } from '../../domain/models';
import type { CrearRecintoInput, RecintoRepository } from '../../domain/ports';

interface RecintoRow {
  id: string;
  provincia: string;
  canton: string;
  parroquia: string;
  nombre: string;
  num_jrv: number;
  lat: number | null;
  lng: number | null;
}

@Injectable({ providedIn: 'root' })
export class SupabaseRecintoRepository implements RecintoRepository {
  private readonly supabase = inject(SupabaseClientService).client;

  async listarRecintos(): Promise<Recinto[]> {
    const { data, error } = await this.supabase
      .from('recintos')
      .select('id, provincia, canton, parroquia, nombre, num_jrv, lat, lng')
      .order('canton', { ascending: true })
      .order('parroquia', { ascending: true })
      .order('nombre', { ascending: true });

    if (error) {
      throw mapSupabaseError(error);
    }

    return ((data ?? []) as RecintoRow[]).map((r) => this.mapRow(r));
  }

  async crearRecinto(input: CrearRecintoInput): Promise<Recinto> {
    const { data, error } = await this.supabase
      .from('recintos')
      .insert({
        provincia: input.provincia.trim(),
        canton: input.canton.trim(),
        parroquia: input.parroquia.trim(),
        nombre: input.nombre.trim(),
        num_jrv: input.numJrv,
        lat: input.lat,
        lng: input.lng,
      })
      .select('id, provincia, canton, parroquia, nombre, num_jrv, lat, lng')
      .single();

    if (error) {
      throw mapSupabaseError(error);
    }

    return this.mapRow(data as RecintoRow);
  }

  private mapRow(row: RecintoRow): Recinto {
    return {
      id: row.id,
      provincia: row.provincia,
      canton: row.canton,
      parroquia: row.parroquia,
      nombre: row.nombre,
      numJrv: row.num_jrv,
      lat: row.lat,
      lng: row.lng,
    };
  }
}
