-- ===========================================
-- InvoicePro Supabase Schema
-- Run this in your Supabase SQL Editor
-- ===========================================

-- 1) Enable UUID support
create extension if not exists "uuid-ossp";

-- ===========================================
-- 2) BUSINESS PROFILES
-- ===========================================
create table if not exists public.business_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  address text,
  city text,
  state text,
  zip_code text,
  country text,
  website text,
  logo_url text,
  tax_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_business_profiles_user_id on public.business_profiles (user_id);

-- ===========================================
-- 3) INVOICES
-- ===========================================
do $$ begin
  create type public.invoice_status as enum ('draft', 'sent', 'paid', 'overdue');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.invoice_template as enum (
    'modern', 'classic', 'minimal', 'professional', 'corporate', 'elegant', 'creative'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.invoices (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  business_profile_id uuid not null references public.business_profiles (id) on delete cascade,

  invoice_number text not null,
  client_name text not null,
  client_email text not null,
  client_phone text,
  client_address text,
  client_city text,
  client_state text,
  client_zip_code text,
  client_country text,

  subtotal numeric(12,2) not null default 0,
  tax_rate numeric(5,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  discount_rate numeric(5,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,

  notes text,
  terms text,
  due_date date not null,
  issue_date date not null,
  status public.invoice_status not null default 'draft',
  template public.invoice_template not null default 'modern',
  currency text not null default 'USD',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_invoices_user_id on public.invoices (user_id);
create index if not exists idx_invoices_business_profile_id on public.invoices (business_profile_id);
create index if not exists idx_invoices_status on public.invoices (status);

-- ===========================================
-- 4) INVOICE ITEMS
-- ===========================================
create table if not exists public.invoice_items (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  description text not null,
  quantity numeric(12,2) not null default 1,
  rate numeric(12,2) not null default 0,
  amount numeric(12,2) not null default 0
);

create index if not exists idx_invoice_items_invoice_id on public.invoice_items (invoice_id);

-- ===========================================
-- 5) USER SETTINGS
-- ===========================================
create table if not exists public.user_settings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  currency text not null default 'USD',
  tax_rate numeric(5,2) not null default 0,
  language text not null default 'en',
  date_format text not null default 'MM/dd/yyyy',
  default_template public.invoice_template not null default 'modern',
  default_notes text,
  default_terms text,
  default_due_days integer not null default 30,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_settings_user_id on public.user_settings (user_id);

-- ===========================================
-- 6) MEDIA ASSETS (Cloudinary metadata)
-- ===========================================
create table if not exists public.media_assets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  business_profile_id uuid references public.business_profiles (id) on delete set null,
  invoice_id uuid references public.invoices (id) on delete set null,

  -- Cloudinary fields
  public_id text not null,
  url text not null,
  format text,
  resource_type text,
  bytes integer,
  width integer,
  height integer,

  created_at timestamptz not null default now()
);

create index if not exists idx_media_assets_user_id on public.media_assets (user_id);
create index if not exists idx_media_assets_business_profile_id on public.media_assets (business_profile_id);
create index if not exists idx_media_assets_invoice_id on public.media_assets (invoice_id);

-- ===========================================
-- 7) SUBSCRIPTION PLANS
-- ===========================================
create table if not exists public.plans (
  id text primary key,
  name text not null,
  description text,
  price_cents integer not null,
  currency text not null default 'kes',
  interval text not null check (interval in ('month', 'year')),
  features jsonb,
  created_at timestamptz not null default now()
);

-- Insert default plans
insert into public.plans (id, name, description, price_cents, currency, interval, features)
values 
  ('free', 'Free', 'Basic features for getting started', 0, 'kes', 'month', '{"maxInvoices": 10, "maxProfiles": 1}'),
  ('basic', 'Basic', 'For freelancers and small businesses', 50000, 'kes', 'month', '{"maxInvoices": 100, "maxProfiles": 3, "emailSupport": true}'),
  ('pro', 'Professional', 'For growing businesses', 150000, 'kes', 'month', '{"maxInvoices": -1, "maxProfiles": -1, "emailSupport": true, "prioritySupport": true}'),
  ('enterprise', 'Enterprise', 'For large organizations', 500000, 'kes', 'month', '{"maxInvoices": -1, "maxProfiles": -1, "emailSupport": true, "prioritySupport": true, "customBranding": true}')
on conflict (id) do nothing;

-- ===========================================
-- 8) SUBSCRIPTIONS (M-Pesa based)
-- ===========================================
do $$ begin
  create type public.subscription_status as enum (
    'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_id text not null references public.plans (id),
  
  -- M-Pesa specific fields
  mpesa_receipt_number text,
  mpesa_phone_number text,
  
  status public.subscription_status not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at timestamptz,
  canceled_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_subscriptions_user_id on public.subscriptions (user_id);
create index if not exists idx_subscriptions_mpesa_receipt on public.subscriptions (mpesa_receipt_number);

-- ===========================================
-- 9) PAYMENT EVENTS (M-Pesa webhook log)
-- ===========================================
create table if not exists public.payment_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users (id) on delete set null,
  mpesa_event_id text not null,
  type text not null,
  payload jsonb not null,
  received_at timestamptz not null default now()
);

create unique index if not exists idx_payment_events_mpesa_event_id on public.payment_events (mpesa_event_id);
create index if not exists idx_payment_events_user_id on public.payment_events (user_id);
create index if not exists idx_payment_events_type on public.payment_events (type);

-- ===========================================
-- 10) ROW LEVEL SECURITY (RLS)
-- ===========================================

-- Enable RLS on all tables
alter table public.business_profiles enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.user_settings enable row level security;
alter table public.media_assets enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payment_events enable row level security;
alter table public.plans enable row level security;

-- Plans are public (read-only)
create policy "Plans are viewable by everyone"
on public.plans for select
using (true);

-- Business Profiles: users can only access their own
create policy "Users can view their own business profiles"
on public.business_profiles for select
using (auth.uid() = user_id);

create policy "Users can insert their own business profiles"
on public.business_profiles for insert
with check (auth.uid() = user_id);

create policy "Users can update their own business profiles"
on public.business_profiles for update
using (auth.uid() = user_id);

create policy "Users can delete their own business profiles"
on public.business_profiles for delete
using (auth.uid() = user_id);

-- Invoices: users can only access their own
create policy "Users can view their own invoices"
on public.invoices for select
using (auth.uid() = user_id);

create policy "Users can insert their own invoices"
on public.invoices for insert
with check (auth.uid() = user_id);

create policy "Users can update their own invoices"
on public.invoices for update
using (auth.uid() = user_id);

create policy "Users can delete their own invoices"
on public.invoices for delete
using (auth.uid() = user_id);

-- Invoice Items: access through invoice ownership
create policy "Users can view invoice items for their invoices"
on public.invoice_items for select
using (
  exists (
    select 1 from public.invoices
    where invoices.id = invoice_items.invoice_id
    and invoices.user_id = auth.uid()
  )
);

create policy "Users can insert invoice items for their invoices"
on public.invoice_items for insert
with check (
  exists (
    select 1 from public.invoices
    where invoices.id = invoice_items.invoice_id
    and invoices.user_id = auth.uid()
  )
);

create policy "Users can update invoice items for their invoices"
on public.invoice_items for update
using (
  exists (
    select 1 from public.invoices
    where invoices.id = invoice_items.invoice_id
    and invoices.user_id = auth.uid()
  )
);

create policy "Users can delete invoice items for their invoices"
on public.invoice_items for delete
using (
  exists (
    select 1 from public.invoices
    where invoices.id = invoice_items.invoice_id
    and invoices.user_id = auth.uid()
  )
);

-- User Settings: users can only access their own
create policy "Users can view their own settings"
on public.user_settings for select
using (auth.uid() = user_id);

create policy "Users can insert their own settings"
on public.user_settings for insert
with check (auth.uid() = user_id);

create policy "Users can update their own settings"
on public.user_settings for update
using (auth.uid() = user_id);

-- Media Assets: users can only access their own
create policy "Users can view their own media"
on public.media_assets for select
using (auth.uid() = user_id);

create policy "Users can insert their own media"
on public.media_assets for insert
with check (auth.uid() = user_id);

create policy "Users can delete their own media"
on public.media_assets for delete
using (auth.uid() = user_id);

-- Subscriptions: users can only view their own
create policy "Users can view their own subscription"
on public.subscriptions for select
using (auth.uid() = user_id);

-- Payment Events: users can view their own (insert handled by service role)
create policy "Users can view their own payment events"
on public.payment_events for select
using (auth.uid() = user_id);

-- ===========================================
-- 11) FUNCTIONS & TRIGGERS
-- ===========================================

-- Auto-update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply to tables with updated_at
drop trigger if exists set_updated_at on public.business_profiles;
create trigger set_updated_at
  before update on public.business_profiles
  for each row execute function public.handle_updated_at();

drop trigger if exists set_updated_at on public.invoices;
create trigger set_updated_at
  before update on public.invoices
  for each row execute function public.handle_updated_at();

drop trigger if exists set_updated_at on public.user_settings;
create trigger set_updated_at
  before update on public.user_settings
  for each row execute function public.handle_updated_at();

drop trigger if exists set_updated_at on public.subscriptions;
create trigger set_updated_at
  before update on public.subscriptions
  for each row execute function public.handle_updated_at();
