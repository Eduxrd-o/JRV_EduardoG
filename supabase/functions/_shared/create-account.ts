import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { validarCedulaEcuatoriana } from './cedula.ts';
import { corsHeaders, jsonResponse } from './cors.ts';

export interface CreateAccountConfig {
  requiredCallerRole: 'provincial' | 'recinto';
  targetRole: 'recinto' | 'veedor';
}

interface CreateAccountPayload {
  cedula?: string;
  nombres?: string;
  apellidos?: string;
  telefono?: string;
  email?: string;
  recintoId?: string;
}

const CONTRASENA_INICIAL = 'Ecuador2026';

export async function handleCreateAccount(req: Request, config: CreateAccountConfig): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Método no permitido' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: 'Configuración incompleta del servidor' }, 500);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return jsonResponse({ error: 'Token de autorización requerido' }, 401);
  }

  // 1. Verificar JWT del usuario que invoca la función
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user: callerUser },
    error: authError,
  } = await callerClient.auth.getUser();

  if (authError || !callerUser) {
    return jsonResponse({ error: 'Sesión inválida o expirada' }, 401);
  }

  // 2. Cliente administrativo (service_role vive SOLO en el servidor, nunca en la app)
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: callerProfile, error: profileError } = await adminClient
    .from('perfiles')
    .select('id, rol, recinto_id, debe_cambiar_clave')
    .eq('id', callerUser.id)
    .single();

  if (profileError || !callerProfile) {
    return jsonResponse({ error: 'Perfil del solicitante no encontrado' }, 403);
  }

  if (callerProfile.debe_cambiar_clave) {
    return jsonResponse({ error: 'Debe cambiar su contraseña inicial antes de crear cuentas' }, 403);
  }

  if (callerProfile.rol !== config.requiredCallerRole) {
    return jsonResponse(
      { error: `Permiso denegado: solo el rol ${config.requiredCallerRole} puede realizar esta acción` },
      403,
    );
  }

  // 3. Validar datos de entrada (R2)
  let payload: CreateAccountPayload;
  try {
    payload = (await req.json()) as CreateAccountPayload;
  } catch {
    return jsonResponse({ error: 'Cuerpo JSON inválido' }, 400);
  }

  const cedula = (payload.cedula ?? '').trim();
  const nombres = (payload.nombres ?? '').trim();
  const apellidos = (payload.apellidos ?? '').trim();
  const telefono = (payload.telefono ?? '').trim();
  const email = (payload.email ?? '').trim().toLowerCase();

  if (!validarCedulaEcuatoriana(cedula)) {
    return jsonResponse({ error: 'Cédula ecuatoriana inválida' }, 400);
  }
  if (nombres.length < 2 || apellidos.length < 2) {
    return jsonResponse({ error: 'Nombres y apellidos son obligatorios' }, 400);
  }
  if (!/^09\d{8}$/.test(telefono)) {
    return jsonResponse({ error: 'Teléfono inválido (debe iniciar con 09 y tener 10 dígitos)' }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse({ error: 'Correo electrónico inválido' }, 400);
  }

  const recintoId =
    config.targetRole === 'veedor' ? (callerProfile.recinto_id as string | null) : (payload.recintoId ?? null);

  if (!recintoId) {
    return jsonResponse({ error: 'El recinto asignado es obligatorio' }, 400);
  }

  // 4. Crear usuario en Supabase Auth con contraseña inicial Ecuador2026 (R3)
  const requireEmailConfirm = Deno.env.get('REQUIRE_EMAIL_CONFIRM') === 'true';

  const { data: createdAuth, error: createAuthError } = await adminClient.auth.admin.createUser({
    email,
    password: CONTRASENA_INICIAL,
    email_confirm: !requireEmailConfirm,
    user_metadata: {
      cedula,
      nombres,
      apellidos,
      rol: config.targetRole,
    },
  });

  if (createAuthError || !createdAuth.user) {
    return jsonResponse({ error: createAuthError?.message ?? 'No se pudo crear el usuario en Auth' }, 400);
  }

  // 5. Insertar perfil en public.perfiles con debe_cambiar_clave = true
  const { data: createdProfile, error: insertProfileError } = await adminClient
    .from('perfiles')
    .insert({
      id: createdAuth.user.id,
      cedula,
      nombres,
      apellidos,
      telefono,
      email,
      rol: config.targetRole,
      recinto_id: recintoId,
      creado_por: callerUser.id,
      debe_cambiar_clave: true,
    })
    .select()
    .single();

  if (insertProfileError) {
    // Rollback del usuario en Auth para no dejar huérfanos
    await adminClient.auth.admin.deleteUser(createdAuth.user.id);
    return jsonResponse(
      { error: `No se pudo registrar el perfil (¿cédula o correo duplicado?): ${insertProfileError.message}` },
      400,
    );
  }

  // 6. Enviar correo de confirmación si está configurado SMTP (R2)
  let confirmacionEnviada = false;
  if (requireEmailConfirm) {
    try {
      const { error: resendError } = await callerClient.auth.resend({
        type: 'signup',
        email,
      });
      confirmacionEnviada = !resendError;
    } catch {
      confirmacionEnviada = false;
    }
  }

  return jsonResponse(
    {
      perfil: createdProfile,
      confirmacionEnviada,
      mensaje: 'Cuenta creada correctamente con contraseña inicial Ecuador2026.',
    },
    201,
  );
}
