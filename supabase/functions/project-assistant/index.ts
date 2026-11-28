import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function embedText(apiKey: string, text: string): Promise<number[]> {
  const models = [
    { name: 'text-embedding-004', extra: {} },
    { name: 'gemini-embedding-001', extra: { outputDimensionality: 768 } },
  ];
  let lastError = 'Embedding failed';
  for (const m of models) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${m.name}:embedContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: { parts: [{ text }] }, ...m.extra }),
      }
    );
    if (res.ok) {
      const data = (await res.json()) as { embedding?: { values?: number[] } };
      if (data.embedding?.values) return data.embedding.values;
    } else {
      lastError = `${m.name}: ${res.status} ${await res.text()}`;
    }
  }
  throw new Error(lastError);
}

async function generateAnswer(
  apiKey: string,
  question: string,
  passages: { document_title: string; content: string }[]
): Promise<{
  answer: string;
  usedIndices: number[];
  modelUsed: string;
  inputTokens: number;
  outputTokens: number;
  ttftMs: number;
}> {
  const contextText = passages
    .map((p, i) => `[Passage ${i + 1} - Document: ${p.document_title}]\n${p.content}`)
    .join('\n\n');

  const prompt = `Tu es l'assistant documentaire de TaskFlow.
Règles strictes :
1. Réponds UNIQUEMENT à partir des passages fournis ci-dessous.
2. N'invente aucune information.
3. Si la réponse ne se trouve pas clairement dans les passages, réponds exactement : "Je ne sais pas répondre à cette question à partir des documents disponibles. Merci de vous rapprocher de l'administrateur." et mets used_passages à [].
4. Cite le nom du document utilisé dans ta réponse.
5. Réponds STRICTEMENT au format JSON valide : {"answer": "...", "used_passages": [1]} où used_passages contient uniquement les numéros (1, 2, ...) des passages qui ont réellement servi à répondre.

Passages :
${contextText}

Question : ${question}`;

  const models = ['gemini-3.5-flash-lite', 'gemini-2.5-flash'];

  let lastError = 'Generation failed';
  for (const model of models) {
    const genStart = performance.now();
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
        }),
      }
    );
    if (res.ok) {
      const ttftMs = Math.round(performance.now() - genStart);
      const data = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
      };
      const inputTokens = Number(data.usageMetadata?.promptTokenCount ?? 0);
      const outputTokens = Number(data.usageMetadata?.candidatesTokenCount ?? 0);
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
      try {
        const parsed = JSON.parse(raw) as { answer?: string; used_passages?: number[] };
        const answer =
          parsed.answer?.trim() ||
          "Je ne sais pas répondre à cette question à partir des documents disponibles. Merci de vous rapprocher de l'administrateur.";
        const usedIndices = Array.isArray(parsed.used_passages)
          ? parsed.used_passages.filter((n) => typeof n === 'number' && n >= 1 && n <= passages.length)
          : [];
        return { answer, usedIndices, modelUsed: model, inputTokens, outputTokens, ttftMs };
      } catch {
        return {
          answer:
            raw ||
            "Je ne sais pas répondre à cette question à partir des documents disponibles. Merci de vous rapprocher de l'administrateur.",
          usedIndices: raw ? [1] : [],
          modelUsed: model,
          inputTokens,
          outputTokens,
          ttftMs,
        };
      }
    }
    lastError = `${model}: ${res.status} ${await res.text()}`;
  }
  throw new Error(lastError);
}

function splitPassages(content: string, maxLen = 800): string[] {
  const paragraphs = content.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = '';
  for (const para of paragraphs) {
    if (current && current.length + para.length + 2 > maxLen) {
      chunks.push(current);
      current = para;
    } else {
      current = current ? `${current}\n\n${para}` : para;
    }
  }
  if (current) chunks.push(current);
  return chunks.length > 0 ? chunks : [content.trim()];
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ code: 'VALIDATION_ERROR' }, 405);

  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const geminiKey = Deno.env.get('GEMINI_API_KEY');
  if (!url || !anonKey || !serviceKey || !geminiKey) return json({ code: 'AI_UNAVAILABLE' }, 500);

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return json({ code: 'AUTH_REQUIRED' }, 401);
  const token = authHeader.slice('Bearer '.length).trim();

  const callerClient = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await callerClient.auth.getUser(token);
  if (authError || !authData.user) return json({ code: 'AUTH_REQUIRED' }, 401);

  const { data: profile } = await callerClient
    .from('profiles')
    .select('role, active')
    .eq('id', authData.user.id)
    .maybeSingle();
  if (!profile?.active) return json({ code: 'FORBIDDEN' }, 403);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ code: 'VALIDATION_ERROR' }, 400);
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  if (body.action === 'ingest') {
    if (profile.role !== 'admin') return json({ code: 'FORBIDDEN' }, 403);
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const filename = typeof body.filename === 'string' ? body.filename.trim() : '';
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    if (!title || !filename || !content) return json({ code: 'VALIDATION_ERROR' }, 400);

    await admin.from('assistant_documents').delete().eq('filename', filename);
    const { data: doc, error: docError } = await admin
      .from('assistant_documents')
      .insert({ title, filename, content })
      .select('id')
      .single();
    if (docError || !doc) return json({ code: 'SERVER_ERROR' }, 500);

    try {
      const passages = splitPassages(content);
      for (let i = 0; i < passages.length; i += 1) {
        const embedding = await embedText(geminiKey, passages[i]);
        const { error: chunkErr } = await admin.from('assistant_chunks').insert({
          document_id: doc.id,
          passage_index: i,
          content: passages[i],
          embedding,
        });
        if (chunkErr) return json({ code: 'SERVER_ERROR', details: chunkErr.message }, 500);
      }
      return json({ id: doc.id, passages: passages.length }, 201);
    } catch (err) {
      return json({ code: 'AI_UNAVAILABLE', details: err instanceof Error ? err.message : String(err) }, 500);
    }
  }

  const question = typeof body.question === 'string' ? body.question.trim() : '';
  if (!question) return json({ code: 'VALIDATION_ERROR' }, 400);

  const { data: settingsRow } = await admin
    .from('assistant_settings')
    .select('enabled, daily_limit_per_user, monthly_budget_eur, alert_threshold_pct, estimated_cost_per_question_eur')
    .eq('id', 1)
    .maybeSingle();

  const settings = settingsRow ?? {
    enabled: true,
    daily_limit_per_user: 20,
    monthly_budget_eur: 5,
    alert_threshold_pct: 80,
    estimated_cost_per_question_eur: 0.0003,
  };

  if (!settings.enabled) {
    await admin.from('assistant_logs').insert({ question, found: false, status: 'disabled', estimated_cost_eur: 0 });
    return json({
      found: false,
      answer: "L’assistant est actuellement désactivé par l’administrateur.",
      citations: [],
    });
  }

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const { data: monthLogs } = await admin
    .from('assistant_logs')
    .select('estimated_cost_eur')
    .gte('created_at', monthStart.toISOString());
  const monthlySpend = (monthLogs ?? []).reduce((acc, r) => acc + Number(r.estimated_cost_eur ?? 0), 0);

  if (monthlySpend >= Number(settings.monthly_budget_eur)) {
    await admin.from('assistant_logs').insert({ question, found: false, status: 'blocked_budget', estimated_cost_eur: 0 });
    return json({
      found: false,
      answer: "Le plafond mensuel de l’assistant est atteint. Merci de contacter l’administrateur.",
      citations: [],
    });
  }
  if (monthlySpend >= Number(settings.monthly_budget_eur) * (Number(settings.alert_threshold_pct) / 100)) {
    console.warn(`[ALERT] Budget mensuel assistant >= ${settings.alert_threshold_pct}% (${monthlySpend.toFixed(4)} EUR)`);
  }

  const todayDate = new Date().toISOString().slice(0, 10);
  const { data: usageRow } = await admin
    .from('assistant_daily_usage')
    .select('question_count')
    .eq('user_id', authData.user.id)
    .eq('usage_date', todayDate)
    .maybeSingle();
  const currentCount = Number(usageRow?.question_count ?? 0);

  if (currentCount >= Number(settings.daily_limit_per_user)) {
    await admin.from('assistant_logs').insert({ question, found: false, status: 'blocked_quota', estimated_cost_eur: 0 });
    return json({
      found: false,
      answer: "Vous avez atteint votre limite quotidienne de questions. Réessayez demain.",
      citations: [],
    });
  }

  const reqStart = performance.now();
  try {
    const queryEmbedding = await embedText(geminiKey, question);
    const { data: matches, error: matchError } = await callerClient.rpc('match_assistant_chunks', {
      query_embedding: queryEmbedding,
      match_count: 4,
    });
    if (matchError) {
      await admin.from('assistant_logs').insert({ question, found: false, status: 'fallback', estimated_cost_eur: 0 });
      return json({
        found: false,
        answer: "L’assistant est temporairement indisponible. Merci de réessayer plus tard ou de contacter l’administrateur.",
        citations: [],
      });
    }

    const relevant = ((matches ?? []) as Array<{ document_title: string; filename: string; content: string; similarity: number }>)
      .filter((m) => m.similarity >= 0.45);

    const cost = Number(settings.estimated_cost_per_question_eur ?? 0.0003);
    await admin.from('assistant_daily_usage').upsert(
      { user_id: authData.user.id, usage_date: todayDate, question_count: currentCount + 1 },
      { onConflict: 'user_id,usage_date' }
    );

    if (relevant.length === 0) {
      await admin.from('assistant_logs').insert({ question, found: false, status: 'ok', estimated_cost_eur: cost });
      const { data: metricRow } = await admin
        .from('assistant_metrics')
        .insert({
          user_role: profile.role,
          model_used: 'embedding-only',
          ttft_ms: Math.round(performance.now() - reqStart),
          total_ms: Math.round(performance.now() - reqStart),
          input_tokens: 0,
          output_tokens: 0,
          estimated_cost_eur: cost,
          passages_count: 0,
          is_unknown: true,
        })
        .select('id')
        .single();
      return json({
        found: false,
        metricId: metricRow?.id ?? null,
        answer: "Je ne sais pas répondre à cette question à partir des documents disponibles. Merci de vous rapprocher de l'administrateur.",
        citations: [],
      });
    }

    const { answer, usedIndices, modelUsed, inputTokens, outputTokens, ttftMs } = await generateAnswer(
      geminiKey,
      question,
      relevant
    );
    const citedPassages = usedIndices.map((idx) => relevant[idx - 1]).filter(Boolean);
    const isUnknown = citedPassages.length === 0 || answer.toLowerCase().includes('je ne sais pas');
    await admin.from('assistant_logs').insert({
      question,
      found: citedPassages.length > 0,
      status: 'ok',
      estimated_cost_eur: cost,
    });
    const { data: metricRow } = await admin
      .from('assistant_metrics')
      .insert({
        user_role: profile.role,
        model_used: modelUsed,
        ttft_ms: ttftMs,
        total_ms: Math.round(performance.now() - reqStart),
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        estimated_cost_eur: cost,
        passages_count: citedPassages.length,
        is_unknown: isUnknown,
      })
      .select('id')
      .single();
    return json({
      found: citedPassages.length > 0,
      metricId: metricRow?.id ?? null,
      answer,
      citations: citedPassages.map((r) => ({
        document: r.document_title,
        passage: r.content,
      })),
    });
  } catch {
    await admin.from('assistant_logs').insert({ question, found: false, status: 'fallback', estimated_cost_eur: 0 });
    return json({
      found: false,
      answer: "L’assistant est temporairement indisponible. Merci de réessayer plus tard ou de contacter l’administrateur.",
      citations: [],
    });
  }
});
