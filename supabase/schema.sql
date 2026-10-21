-- Rafi Book starter database schema.
-- Run in Supabase Dashboard > SQL Editor.
-- Review these policies before launching publicly; extend them for moderation and privacy.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'Rafi Book member',
  username text unique,
  bio text not null default '',
  avatar_url text,
  cover_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null default '',
  image_url text,
  created_at timestamptz not null default now(),
  constraint post_has_content_or_image check (length(trim(content)) > 0 or image_url is not null)
);

create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (length(trim(content)) > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined','blocked')),
  created_at timestamptz not null default now(),
  unique (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (length(trim(name)) between 2 and 80),
  description text not null default '',
  privacy text not null default 'public' check (privacy in ('public','private')),
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('member','moderator','admin')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (length(trim(name)) between 2 and 100),
  description text not null default '',
  category text not null default 'Community',
  created_at timestamptz not null default now()
);

create table if not exists public.page_followers (
  page_id uuid not null references public.pages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (page_id, user_id)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  is_group boolean not null default false,
  title text,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (length(trim(content)) > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  kind text not null,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists posts_created_at_idx on public.posts(created_at desc);
create index if not exists posts_user_id_idx on public.posts(user_id);
create index if not exists comments_post_id_idx on public.comments(post_id);
create index if not exists messages_conversation_created_idx on public.messages(conversation_id, created_at);

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.comments enable row level security;
alter table public.friendships enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.pages enable row level security;
alter table public.page_followers enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;

-- Profiles: visible to signed-in users; users can edit only their own.
create policy "profiles select for authenticated" on public.profiles
  for select to authenticated using (true);
create policy "profiles insert own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);
create policy "profiles update own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Create a profile automatically after sign-up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', 'Rafi Book member'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Public posts are readable by signed-in users; only authors can create/edit/delete.
create policy "posts select authenticated" on public.posts
  for select to authenticated using (true);
create policy "posts insert own" on public.posts
  for insert to authenticated with check (auth.uid() = user_id);
create policy "posts update own" on public.posts
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "posts delete own" on public.posts
  for delete to authenticated using (auth.uid() = user_id);

create policy "likes read authenticated" on public.post_likes
  for select to authenticated using (true);
create policy "likes insert own" on public.post_likes
  for insert to authenticated with check (auth.uid() = user_id);
create policy "likes delete own" on public.post_likes
  for delete to authenticated using (auth.uid() = user_id);

create policy "comments read authenticated" on public.comments
  for select to authenticated using (true);
create policy "comments insert own" on public.comments
  for insert to authenticated with check (auth.uid() = user_id);
create policy "comments update own" on public.comments
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "comments delete own" on public.comments
  for delete to authenticated using (auth.uid() = user_id);

create policy "friendships read participants" on public.friendships
  for select to authenticated using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy "friendships create requester" on public.friendships
  for insert to authenticated with check (auth.uid() = requester_id);
create policy "friendships update participants" on public.friendships
  for update to authenticated using (auth.uid() = requester_id or auth.uid() = addressee_id)
  with check (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy "friendships delete participants" on public.friendships
  for delete to authenticated using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "groups read authenticated" on public.groups
  for select to authenticated using (privacy = 'public' or owner_id = auth.uid());
create policy "groups create own" on public.groups
  for insert to authenticated with check (auth.uid() = owner_id);
create policy "groups update owner" on public.groups
  for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "groups delete owner" on public.groups
  for delete to authenticated using (auth.uid() = owner_id);
create policy "group members read authenticated" on public.group_members
  for select to authenticated using (true);
create policy "group members join self" on public.group_members
  for insert to authenticated with check (auth.uid() = user_id);
create policy "group members leave self" on public.group_members
  for delete to authenticated using (auth.uid() = user_id);

create policy "pages read authenticated" on public.pages
  for select to authenticated using (true);
create policy "pages create own" on public.pages
  for insert to authenticated with check (auth.uid() = owner_id);
create policy "pages update owner" on public.pages
  for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "pages delete owner" on public.pages
  for delete to authenticated using (auth.uid() = owner_id);
create policy "page followers read authenticated" on public.page_followers
  for select to authenticated using (true);
create policy "page follow self" on public.page_followers
  for insert to authenticated with check (auth.uid() = user_id);
create policy "page unfollow self" on public.page_followers
  for delete to authenticated using (auth.uid() = user_id);

-- Messaging: members can see conversations they belong to and send messages only as themselves.
create policy "conversations member read" on public.conversations
  for select to authenticated using (
    exists (select 1 from public.conversation_members cm where cm.conversation_id = id and cm.user_id = auth.uid())
  );
create policy "conversations create own" on public.conversations
  for insert to authenticated with check (auth.uid() = created_by);
create policy "conversation members read self" on public.conversation_members
  for select to authenticated using (auth.uid() = user_id or exists (
    select 1 from public.conversation_members cm where cm.conversation_id = conversation_id and cm.user_id = auth.uid()
  ));
create policy "conversation members add self" on public.conversation_members
  for insert to authenticated with check (auth.uid() = user_id);
create policy "messages member read" on public.messages
  for select to authenticated using (
    exists (select 1 from public.conversation_members cm where cm.conversation_id = conversation_id and cm.user_id = auth.uid())
  );
create policy "messages member send" on public.messages
  for insert to authenticated with check (
    auth.uid() = sender_id and exists (
      select 1 from public.conversation_members cm where cm.conversation_id = conversation_id and cm.user_id = auth.uid()
    )
  );

create policy "notifications read own" on public.notifications
  for select to authenticated using (auth.uid() = user_id);
create policy "notifications update own" on public.notifications
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notifications insert actor" on public.notifications
  for insert to authenticated with check (auth.uid() = actor_id);
