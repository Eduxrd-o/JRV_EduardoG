import { inject, Injectable } from '@angular/core';

import { mapSupabaseError } from '../../core/errors/supabase-error.mapper';
import { SupabaseClientService } from '../../core/supabase/supabase-client.service';
import type { Dignidad } from '../../domain/models';
import type { PhotoStorageRepository } from '../../domain/ports';

/**
 * ADR-008: Almacenamiento privado en bucket 'actas' con ruta {recinto_id}/{jrv_id}/{dignidad}.jpg
 * y acceso mediante URLs firmadas de corta duración.
 */
@Injectable({ providedIn: 'root' })
export class SupabasePhotoStorageRepository implements PhotoStorageRepository {
  private readonly supabase = inject(SupabaseClientService).client;

  async subirFotoActa(recintoId: string, jrvId: string, dignidad: Dignidad, blob: Blob): Promise<string> {
    const path = `${recintoId}/${jrvId}/${dignidad}.jpg`;
    const { error } = await this.supabase.storage.from('actas').upload(path, blob, {
      contentType: 'image/jpeg',
      upsert: true,
    });

    if (error) {
      throw mapSupabaseError(error);
    }

    return path;
  }

  async obtenerUrlFirmada(fotoPath: string): Promise<string> {
    const { data, error } = await this.supabase.storage.from('actas').createSignedUrl(fotoPath, 300);
    if (error || !data?.signedUrl) {
      throw mapSupabaseError(error ?? new Error('No se pudo generar la URL firmada de la foto.'));
    }
    return data.signedUrl;
  }
}
