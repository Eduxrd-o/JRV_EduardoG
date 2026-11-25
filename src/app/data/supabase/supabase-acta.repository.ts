import { inject, Injectable } from '@angular/core';

import { mapSupabaseError } from '../../core/errors/supabase-error.mapper';
import { SupabaseClientService } from '../../core/supabase/supabase-client.service';
import type { Acta, Candidatura, Dignidad, EstadoActa } from '../../domain/models';
import type { ActaRepository, GuardarActaPayload } from '../../domain/ports';

interface CandidaturaRow {
  id: string;
  organizacion_id: string;
  dignidad: Dignidad;
  nombre: string;
  organizaciones: { nombre: string; lista: string } | { nombre: string; lista: string }[] | null;
}

interface ActaVotoRow {
  candidatura_id: string;
  votos: number;
}

interface ActaRow {
  id: string;
  jrv_id: string;
  dignidad: Dignidad;
  nulos: number;
  blancos: number;
  total_sufragantes: number;
  foto_path: string;
  lat: number | null;
  lng: number | null;
  precision_m: number | null;
  capturado_en: string | null;
  ubicacion_comprobable: boolean;
  estado: EstadoActa;
  observacion: string | null;
  version: number;
  client_uuid: string;
  actualizado_por: string;
  actualizado_en: string;
  acta_votos?: ActaVotoRow[];
}

@Injectable({ providedIn: 'root' })
export class SupabaseActaRepository implements ActaRepository {
  private readonly supabase = inject(SupabaseClientService).client;

  async listarCandidaturas(dignidad: Dignidad): Promise<Candidatura[]> {
    const { data, error } = await this.supabase
      .from('candidaturas')
      .select('id, organizacion_id, dignidad, nombre, organizaciones(nombre, lista)')
      .eq('dignidad', dignidad)
      .order('nombre', { ascending: true });

    if (error) {
      throw mapSupabaseError(error);
    }

    return ((data ?? []) as CandidaturaRow[]).map((row) => {
      const org = Array.isArray(row.organizaciones) ? row.organizaciones[0] : row.organizaciones;
      return {
        id: row.id,
        organizacionId: row.organizacion_id,
        organizacionNombre: org ? `${org.lista} · ${org.nombre}` : 'Organización',
        dignidad: row.dignidad,
        nombre: row.nombre,
      };
    });
  }

  async obtenerActaPorJrvYDignidad(jrvId: string, dignidad: Dignidad): Promise<Acta | null> {
    const { data, error } = await this.supabase
      .from('actas')
      .select('*, acta_votos(candidatura_id, votos)')
      .eq('jrv_id', jrvId)
      .eq('dignidad', dignidad)
      .maybeSingle();

    if (error) {
      throw mapSupabaseError(error);
    }

    return data ? this.mapActaRow(data as ActaRow) : null;
  }

  async listarActasPorRecinto(recintoId: string): Promise<Acta[]> {
    const { data, error } = await this.supabase
      .from('actas')
      .select('*, acta_votos(candidatura_id, votos), jrv!inner(recinto_id)')
      .eq('jrv.recinto_id', recintoId)
      .order('actualizado_en', { ascending: false });

    if (error) {
      throw mapSupabaseError(error);
    }

    return ((data ?? []) as ActaRow[]).map((row) => this.mapActaRow(row));
  }

  async guardarActa(payload: GuardarActaPayload): Promise<Acta> {
    const { data, error } = await this.supabase.rpc('guardar_acta', {
      p_jrv_id: payload.jrvId,
      p_dignidad: payload.dignidad,
      p_votos: payload.votos.map((v) => ({
        candidatura_id: v.candidaturaId,
        votos: v.votos,
      })),
      p_nulos: payload.nulos,
      p_blancos: payload.blancos,
      p_total_sufragantes: payload.totalSufragantes,
      p_foto_path: payload.fotoPath,
      p_lat: payload.gps.lat,
      p_lng: payload.gps.lng,
      p_precision_m: payload.gps.precisionM,
      p_capturado_en: payload.gps.capturadoEn,
      p_ubicacion_comprobable: payload.gps.ubicacionComprobable,
      p_es_inconsistente: payload.esInconsistente,
      p_observacion: payload.observacion,
      p_client_uuid: payload.clientUuid,
      p_version_base: payload.versionBase,
    });

    if (error) {
      throw mapSupabaseError(error);
    }

    return this.mapActaRow({ ...(data as ActaRow), acta_votos: payload.votos.map((v) => ({ candidatura_id: v.candidaturaId, votos: v.votos })) });
  }

  private mapActaRow(row: ActaRow): Acta {
    return {
      id: row.id,
      jrvId: row.jrv_id,
      dignidad: row.dignidad,
      votos: (row.acta_votos ?? []).map((v) => ({
        candidaturaId: v.candidatura_id,
        votos: v.votos,
      })),
      nulos: row.nulos,
      blancos: row.blancos,
      totalSufragantes: row.total_sufragantes,
      fotoPath: row.foto_path,
      gps: {
        lat: row.lat,
        lng: row.lng,
        precisionM: row.precision_m,
        capturadoEn: row.capturado_en,
        ubicacionComprobable: row.ubicacion_comprobable,
      },
      estado: row.estado,
      observacion: row.observacion,
      version: row.version,
      clientUuid: row.client_uuid,
      actualizadoPor: row.actualizado_por,
      actualizadoEn: row.actualizado_en,
    };
  }
}
