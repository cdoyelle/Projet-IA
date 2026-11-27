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
): Promise<{ answer: string; usedIndices: number[] }> {
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
      const data = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
      try {
        const parsed = JSON.parse(raw) as { answer?: string; used_passages?: number[] };
        const answer =
          parsed.answer?.trim() ||
          "Je ne sais pas répondre à cette question à partir des documents disponibles. Merci de vous rapprocher de l'administrateur.";
        const usedIndices = Array.isArray(parsed.used_passages)
          ? parsed.used_passages.filter((n) => typeof n === 'number' && n >= 1 && n <= passages.length)
          : [];
        return { answer, usedIndices };
      } catch {
        return {
          answer:
            raw ||
            "Je ne sais pas répondre à cette question à partir des documents disponibles. Merci de vous rapprocher de l'administrateur.",
          usedIndices: raw ? [1] : [],
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

  try {
    const queryEmbedding = await embedText(geminiKey, question);
    const { data: matches, error: matchError } = await callerClient.rpc('match_assistant_chunks', {
      query_embedding: queryEmbedding,
      match_count: 4,
    });
    if (matchError) return json({ code: 'AI_UNAVAILABLE', details: matchError.message }, 500);

    const relevant = ((matches ?? []) as Array<{ document_title: string; filename: string; content: string; similarity: number }>)
      .filter((m) => m.similarity >= 0.45);

    if (relevant.length === 0) {
      return json({
        found: false,
        answer: "Je ne sais pas répondre à cette question à partir des documents disponibles. Merci de vous rapprocher de l'administrateur.",
        citations: [],
      });
    }

    const { answer, usedIndices } = await generateAnswer(geminiKey, question, relevant);
    const citedPassages = usedIndices.map((idx) => relevant[idx - 1]).filter(Boolean);
    return json({
      found: citedPassages.length > 0,
      answer,
      citations: citedPassages.map((r) => ({
        document: r.document_title,
        passage: r.content,
      })),
    });
  } catch (err) {
    return json({ code: 'AI_UNAVAILABLE', details: err instanceof Error ? err.message : String(err) }, 500);
  }
});
