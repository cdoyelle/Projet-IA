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
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: { parts: [{ text }] } }),
    }
  );
  if (!res.ok) throw new Error('Embedding failed');
  const data = (await res.json()) as { embedding?: { values?: number[] } };
  if (!data.embedding?.values) throw new Error('Missing embedding values');
  return data.embedding.values;
}

async function generateAnswer(apiKey: string, question: string, passages: { document_title: string; content: string }[]): Promise<string> {
  const contextText = passages
    .map((p, i) => `[Passage ${i + 1} - Document: ${p.document_title}]\n${p.content}`)
    .join('\n\n');

  const prompt = `Tu es l'assistant documentaire de TaskFlow.
Règles strictes :
1. Réponds UNIQUEMENT à partir des passages fournis ci-dessous.
2. N'invente aucune information.
3. Si la réponse ne se trouve pas clairement dans les passages, réponds exactement : "Je ne sais pas répondre à cette question à partir des documents disponibles. Merci de vous rapprocher de l'administrateur."
4. Cite le nom du document utilisé dans ta réponse.

Passages :
${contextText}

Question : ${question}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1 },
      }),
    }
  );
  if (!res.ok) throw new Error('Generation failed');
  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  return (
    data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
    "Je ne sais pas répondre à cette question à partir des documents disponibles. Merci de vous rapprocher de l'administrateur."
  );
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

    const passages = splitPassages(content);
    for (let i = 0; i < passages.length; i += 1) {
      const embedding = await embedText(geminiKey, passages[i]);
      await admin.from('assistant_chunks').insert({
        document_id: doc.id,
        passage_index: i,
        content: passages[i],
        embedding,
      });
    }
    return json({ id: doc.id, passages: passages.length }, 201);
  }

  const question = typeof body.question === 'string' ? body.question.trim() : '';
  if (!question) return json({ code: 'VALIDATION_ERROR' }, 400);

  try {
    const queryEmbedding = await embedText(geminiKey, question);
    const { data: matches, error: matchError } = await callerClient.rpc('match_assistant_chunks', {
      query_embedding: queryEmbedding,
      match_count: 4,
    });
    if (matchError) return json({ code: 'AI_UNAVAILABLE' }, 500);

    const relevant = ((matches ?? []) as Array<{ document_title: string; filename: string; content: string; similarity: number }>)
      .filter((m) => m.similarity >= 0.45);

    if (relevant.length === 0) {
      return json({
        found: false,
        answer: "Je ne sais pas répondre à cette question à partir des documents disponibles. Merci de vous rapprocher de l'administrateur.",
        citations: [],
      });
    }

    const answer = await generateAnswer(geminiKey, question, relevant);
    return json({
      found: true,
      answer,
      citations: relevant.map((r) => ({
        document: r.document_title,
        passage: r.content,
      })),
    });
  } catch {
    return json({ code: 'AI_UNAVAILABLE' }, 500);
  }
});
