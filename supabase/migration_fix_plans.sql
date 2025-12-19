-- ===========================================
-- Migration: Fix plans table for M-Pesa (remove Stripe columns)
-- Run this if you have an existing plans table with stripe_price_id
-- ===========================================

-- Step 1: Drop the existing plans table and recreate without Stripe fields
-- WARNING: This will delete existing plan data

-- First, drop foreign key constraints from subscriptions if they exist
alter table if exists public.subscriptions 
  drop constraint if exists subscriptions_plan_id_fkey;

-- Drop the old plans table
drop table if exists public.plans cascade;

-- Recreate plans table for M-Pesa (no Stripe fields)
create table public.plans (
  id text primary key,
  name text not null,
  description text,
  price_cents integer not null,        -- Price in cents (e.g., 50000 = 500 KES)
  currency text not null default 'kes',
  interval text not null check (interval in ('month', 'year')),
  features jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Insert default plans (prices in KES cents)
-- Free: 0 KES
-- Basic: 500 KES/month
-- Pro: 1,500 KES/month  
-- Enterprise: 5,000 KES/month
insert into public.plans (id, name, description, price_cents, currency, interval, features, is_active)
values 
  ('free', 'Free', 'Basic features for getting started', 0, 'kes', 'month', 
   '{"maxInvoices": 10, "maxProfiles": 1}', true),
  ('basic', 'Basic', 'For freelancers and small businesses', 50000, 'kes', 'month', 
   '{"maxInvoices": 100, "maxProfiles": 3, "emailSupport": true}', true),
  ('pro', 'Professional', 'For growing businesses', 150000, 'kes', 'month', 
   '{"maxInvoices": -1, "maxProfiles": -1, "emailSupport": true, "prioritySupport": true}', true),
  ('enterprise', 'Enterprise', 'For large organizations', 500000, 'kes', 'month', 
   '{"maxInvoices": -1, "maxProfiles": -1, "emailSupport": true, "prioritySupport": true, "customBranding": true}', true);

-- Recreate foreign key on subscriptions
alter table public.subscriptions
  add constraint subscriptions_plan_id_fkey 
  foreign key (plan_id) references public.plans(id);

-- Enable RLS
alter table public.plans enable row level security;

-- Plans are public (read-only for everyone)
drop policy if exists "Plans are viewable by everyone" on public.plans;
create policy "Plans are viewable by everyone"
on public.plans for select
using (true);

-- ===========================================
-- Also fix subscriptions table if it has Stripe columns
-- ===========================================

-- Remove Stripe-specific columns if they exist
alter table public.subscriptions 
  drop column if exists stripe_customer_id,
  drop column if exists stripe_subscription_id;

-- Add M-Pesa columns if they don't exist
do $$ 
begin
  if not exists (select 1 from information_schema.columns 
                 where table_name = 'subscriptions' and column_name = 'mpesa_receipt_number') then
    alter table public.subscriptions add column mpesa_receipt_number text;
  end if;
  
  if not exists (select 1 from information_schema.columns 
                 where table_name = 'subscriptions' and column_name = 'mpesa_phone_number') then
    alter table public.subscriptions add column mpesa_phone_number text;
  end if;
end $$;

-- Create index on M-Pesa receipt for lookups
create index if not exists idx_subscriptions_mpesa_receipt 
  on public.subscriptions (mpesa_receipt_number);
