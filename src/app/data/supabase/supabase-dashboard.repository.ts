import { inject, Injectable } from '@angular/core';

import { mapSupabaseError } from '../../core/errors/supabase-error.mapper';
import { SupabaseClientService } from '../../core/supabase/supabase-client.service';
import type {
  ActaGpsItem,
  AvanceRecintoRow,
  DashboardSnapshot,
  Dignidad,
  EstadoActa,
  ResultadoBlancosNulosRow,
  ResultadoCandidatoRow,
} from '../../domain/models';
import type { DashboardRepository } from '../../domain/ports';

interface ResultadoRowSql {
  recinto_id: string;
  recinto_nombre: string;
  dignidad: Dignidad;
  candidatura_id: string;
  candidatura_nombre: string;
  organizacion_nombre: string;
  organizacion_lista: string;
  votos_totales: number;
  votos_sin_observadas: number;
  votos_observados: number;
}

interface BlancosNulosRowSql {
  recinto_id: string;
  dignidad: Dignidad;
  blancos_totales: number;
  nulos_totales: number;
  sufragantes_totales: number;
  blancos_sin_observadas: number;
  nulos_sin_observadas: number;
  sufragantes_sin_observadas: number;
  actas_observadas: number;
}

interface AvanceRowSql {
  recinto_id: string;
  canton: string;
  parroquia: string;
  recinto_nombre: string;
  total_jrv: number;
  actas_alcalde: number;
  actas_prefecto: number;
  actas_observadas: number;
}

interface ActaGpsRowSql {
  id: string;
  dignidad: Dignidad;
  estado: EstadoActa;
  lat: number | null;
  lng: number | null;
  precision_m: number | null;
  ubicacion_comprobable: boolean;
  actualizado_en: string;
  jrv:
    | {
        numero: number;
        recinto_id: string;
        recintos: { nombre: string } | { nombre: string }[] | null;
      }
    | {
        numero: number;
        recinto_id: string;
        recintos: { nombre: string } | { nombre: string }[] | null;
      }[]
    | null;
}

/**
 * ADR-009 (R4): Consume vistas SQL agregadas en servidor (security_invoker = true).
 */
@Injectable({ providedIn: 'root' })
export class SupabaseDashboardRepository implements DashboardRepository {
  private readonly supabase = inject(SupabaseClientService).client;

  async cargarSnapshot(): Promise<DashboardSnapshot> {
    const [resCand, resBn, resAvance, resGps] = await Promise.all([
      this.supabase.from('resultados_por_candidato_recinto').select('*'),
      this.supabase.from('resultados_blancos_nulos_recinto').select('*'),
      this.supabase.from('avance_actas_recinto').select('*').order('recinto_nombre', { ascending: true }),
      this.supabase
        .from('actas')
        .select('id, dignidad, estado, lat, lng, precision_m, ubicacion_comprobable, actualizado_en, jrv(numero, recinto_id, recintos(nombre))')
        .order('actualizado_en', { ascending: false }),
    ]);

    if (resCand.error) throw mapSupabaseError(resCand.error);
    if (resBn.error) throw mapSupabaseError(resBn.error);
    if (resAvance.error) throw mapSupabaseError(resAvance.error);
    if (resGps.error) throw mapSupabaseError(resGps.error);

    const resultados: ResultadoCandidatoRow[] = ((resCand.data ?? []) as ResultadoRowSql[]).map((r) => ({
      recintoId: r.recinto_id,
      recintoNombre: r.recinto_nombre,
      dignidad: r.dignidad,
      candidaturaId: r.candidatura_id,
      candidaturaNombre: r.candidatura_nombre,
      organizacionNombre: r.organizacion_nombre,
      organizacionLista: r.organizacion_lista,
      votosTotales: r.votos_totales,
      votosSinObservadas: r.votos_sin_observadas,
      votosObservados: r.votos_observados,
    }));

    const blancosNulos: ResultadoBlancosNulosRow[] = ((resBn.data ?? []) as BlancosNulosRowSql[]).map((r) => ({
      recintoId: r.recinto_id,
      dignidad: r.dignidad,
      blancosTotales: r.blancos_totales,
      nulosTotales: r.nulos_totales,
      sufragantesTotales: r.sufragantes_totales,
      blancosSinObservadas: r.blancos_sin_observadas,
      nulosSinObservadas: r.nulos_sin_observadas,
      sufragantesSinObservadas: r.sufragantes_sin_observadas,
      actasObservadas: r.actas_observadas,
    }));

    const avance: AvanceRecintoRow[] = ((resAvance.data ?? []) as AvanceRowSql[]).map((r) => ({
      recintoId: r.recinto_id,
      canton: r.canton,
      parroquia: r.parroquia,
      recintoNombre: r.recinto_nombre,
      totalJrv: r.total_jrv,
      actasAlcalde: r.actas_alcalde,
      actasPrefecto: r.actas_prefecto,
      actasObservadas: r.actas_observadas,
    }));

    const actasGps: ActaGpsItem[] = ((resGps.data ?? []) as ActaGpsRowSql[]).map((r) => {
      const jrvObj = Array.isArray(r.jrv) ? r.jrv[0] : r.jrv;
      const recObj = jrvObj ? (Array.isArray(jrvObj.recintos) ? jrvObj.recintos[0] : jrvObj.recintos) : null;
      return {
        actaId: r.id,
        recintoId: jrvObj?.recinto_id ?? '',
        recintoNombre: recObj?.nombre ?? 'Recinto',
        jrvNumero: jrvObj?.numero ?? 0,
        dignidad: r.dignidad,
        estado: r.estado,
        lat: r.lat,
        lng: r.lng,
        precisionM: r.precision_m,
        ubicacionComprobable: r.ubicacion_comprobable,
        actualizadoEn: r.actualizado_en,
      };
    });

    return {
      resultados,
      blancosNulos,
      avance,
      actasGps,
      actualizadoEn: new Date().toISOString(),
    };
  }
}
