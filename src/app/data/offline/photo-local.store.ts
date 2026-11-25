import { Injectable } from '@angular/core';
import { Directory, Filesystem } from '@capacitor/filesystem';

/**
 * ADR-006 (R10): Persistencia local de fotografías de actas pendientes usando @capacitor/filesystem.
 */
@Injectable({ providedIn: 'root' })
export class PhotoLocalStore {
  async guardarFotoLocal(clientUuid: string, blob: Blob): Promise<string> {
    const base64 = await this.blobABase64(blob);
    const path = `offline-actas/${clientUuid}.jpg`;

    await Filesystem.writeFile({
      path,
      data: base64,
      directory: Directory.Data,
      recursive: true,
    });

    return path;
  }

  async leerFotoLocal(path: string): Promise<Blob> {
    const res = await Filesystem.readFile({
      path,
      directory: Directory.Data,
    });

    if (typeof res.data !== 'string') {
      return res.data;
    }

    const bin = atob(res.data);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }
    return new Blob([bytes], { type: 'image/jpeg' });
  }

  async eliminarFotoLocal(path: string | null): Promise<void> {
    if (!path) {
      return;
    }
    try {
      await Filesystem.deleteFile({
        path,
        directory: Directory.Data,
      });
    } catch {
      // Si el archivo ya no existe, continuar sin error
    }
  }

  private blobABase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = String(reader.result ?? '');
        const commaIndex = result.indexOf(',');
        resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
      };
      reader.onerror = () => reject(new Error('No se pudo convertir la foto local a base64.'));
      reader.readAsDataURL(blob);
    });
  }
}
