import { Injectable } from '@angular/core';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { environment } from '../../../environments/environment';

/**
 * ADR-002 / ADR-004:
 * Único punto de instanciación del cliente de Supabase.
 * Solo utiliza la anon key pública; nunca expone claves administrativas (service_role).
 */
@Injectable({ providedIn: 'root' })
export class SupabaseClientService {
  readonly client: SupabaseClient;

  constructor() {
    this.client = createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }
}
