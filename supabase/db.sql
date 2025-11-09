-- Run this SQL in your Supabase SQL editor to create required tables

create table if not exists sellers (
  id uuid primary key default gen_random_uuid(),
  name text,
  paypal_payout_email text,
  created_at timestamptz default now()
);

create table if not exists purchases (
  id text primary key, -- use PayPal order id
  email text not null,
  file_path text not null,
  seller_id uuid references sellers(id),
  amount_cents integer,
  currency text default 'USD',
  payment_provider text,
  payment_provider_id text,
  status text default 'on_hold',
  purchase_at timestamptz default now(),
  refund_window_expires timestamptz not null,
  download_token text not null,
  download_token_expires timestamptz not null
);

create table if not exists refund_disputes (
  id uuid primary key default gen_random_uuid(),
  purchase_id text references purchases(id) on delete cascade,
  email text not null,
  reason text,
  evidence_url text,
  submitted_at timestamptz default now(),
  status text default 'pending'
);

create table if not exists payouts_log (
  id uuid primary key default gen_random_uuid(),
  purchase_id text references purchases(id),
  seller_id uuid,
  amount_cents integer,
  status text,
  provider_response jsonb,
  created_at timestamptz default now()
);
