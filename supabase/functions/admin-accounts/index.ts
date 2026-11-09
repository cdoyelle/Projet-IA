import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function response(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

function generatedPassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*+-_';
  const limit = Math.floor(256 / alphabet.length) * alphabet.length;
  let password = '';
  while (password.length < 32) {
    const bytes = new Uint8Array(48);
    crypto.getRandomValues(bytes);
    for (const byte of bytes) {
      if (byte < limit) password += alphabet[byte % alphabet.length];
      if (password.length === 32) break;
    }
  }
  return password;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return response({ code: 'VALIDATION_ERROR' }, 405);

  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anonKey || !serviceKey) return response({ code: 'SERVER_ERROR' }, 500);

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return response({ code: 'AUTH_REQUIRED' }, 401);
  const token = authorization.slice('Bearer '.length).trim();
  if (!token) return response({ code: 'AUTH_REQUIRED' }, 401);

  const callerClient = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await callerClient.auth.getUser(token);
  if (authError || !authData.user) return response({ code: 'AUTH_REQUIRED' }, 401);

  // Querying public.profiles via callerClient enforces RLS, including app_private.has_active_auth_session().
  const { data: sessionProfile, error: sessionProfileError } = await callerClient
    .from('profiles')
    .select('id, role, active')
    .eq('id', authData.user.id)
    .maybeSingle();
  if (sessionProfileError) return response({ code: 'AUTH_REQUIRED' }, 500);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  if (!sessionProfile) {
    const { data: rawProfile } = await admin
      .from('profiles')
      .select('active, role')
      .eq('id', authData.user.id)
      .maybeSingle();
    if (rawProfile && (!rawProfile.active || rawProfile.role !== 'admin')) {
      return response({ code: 'FORBIDDEN' }, 403);
    }
    return response({ code: 'AUTH_REQUIRED' }, 401);
  }
  if (!sessionProfile.active || sessionProfile.role !== 'admin') {
    return response({ code: 'FORBIDDEN' }, 403);
  }

  let body: unknown;
  try { body = await request.json(); } catch { return response({ code: 'VALIDATION_ERROR' }, 400); }
  if (!body || typeof body !== 'object') return response({ code: 'VALIDATION_ERROR' }, 400);
  const input = body as Record<string, unknown>;
  const firstName = typeof input.firstName === 'string' ? input.firstName.trim() : '';
  const lastName = typeof input.lastName === 'string' ? input.lastName.trim() : '';
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  if (!firstName || !lastName || firstName.length > 100 || lastName.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return response({ code: 'VALIDATION_ERROR' }, 400);
  }

  const password = generatedPassword();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: firstName, last_name: lastName },
  });
  if (createError || !created.user) {
    const errMsg = createError?.message?.toLowerCase() ?? '';
    const errStatus = (createError as { status?: number } | null)?.status;
    if (
      createError?.code === 'email_exists' ||
      createError?.code === 'user_already_exists' ||
      errStatus === 422 ||
      errMsg.includes('already') ||
      errMsg.includes('exists') ||
      errMsg.includes('duplicate') ||
      errMsg.includes('unique')
    ) {
      return response({ code: 'CONFLICT' }, 409);
    }
    return response({ code: 'SERVER_ERROR' }, 500);
  }

  // Ensure the profile row exists with the required names and member role; roll back Auth user on failure.
  const { data: profile, error: createdProfileError } = await admin
    .from('profiles')
    .upsert(
      { id: created.user.id, first_name: firstName, last_name: lastName, role: 'member', active: true },
      { onConflict: 'id' }
    )
    .select('id')
    .maybeSingle();
  if (createdProfileError || !profile) {
    await admin.auth.admin.deleteUser(created.user.id);
    return response({ code: 'SERVER_ERROR' }, 500);
  }

  // Return the credential once after full success. It is never written to an app table or log.
  return response({ id: created.user.id, password }, 201);
});
