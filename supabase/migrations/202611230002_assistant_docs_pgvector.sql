create extension if not exists vector;

create table if not exists public.assistant_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  filename text not null unique,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.assistant_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.assistant_documents(id) on delete cascade,
  passage_index integer not null,
  content text not null,
  embedding vector(768) not null
);

alter table public.assistant_documents enable row level security;
alter table public.assistant_chunks enable row level security;

revoke all on public.assistant_documents from anon, authenticated;
revoke all on public.assistant_chunks from anon, authenticated;
grant select on public.assistant_documents to authenticated;
grant select on public.assistant_chunks to authenticated;

drop policy if exists "assistant_documents_read_active" on public.assistant_documents;
create policy "assistant_documents_read_active" on public.assistant_documents
  for select to authenticated
  using (app_private.has_active_auth_session());

drop policy if exists "assistant_chunks_read_active" on public.assistant_chunks;
create policy "assistant_chunks_read_active" on public.assistant_chunks
  for select to authenticated
  using (app_private.has_active_auth_session());

create or replace function public.match_assistant_chunks(
  query_embedding vector(768),
  match_count integer default 5
)
returns table (
  id uuid,
  document_title text,
  filename text,
  content text,
  similarity double precision
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    d.title as document_title,
    d.filename,
    c.content,
    1 - (c.embedding <=> query_embedding) as similarity
  from public.assistant_chunks c
  join public.assistant_documents d on d.id = c.document_id
  where app_private.has_active_auth_session()
  order by c.embedding <=> query_embedding
  limit greatest(1, least(match_count, 10));
$$;
revoke all on function public.match_assistant_chunks(vector, integer) from public, anon;
grant execute on function public.match_assistant_chunks(vector, integer) to authenticated;
