-- Custom 4-digit email OTP verification for Just Because.
-- Run this in Supabase SQL Editor before enabling the custom app flow.

create table if not exists public.email_otps (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  otp_code text not null check (otp_code ~ '^[0-9]{4}$'),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  used boolean not null default false
);

create index if not exists email_otps_email_created_at_idx
  on public.email_otps (lower(email), created_at desc);

create index if not exists email_otps_active_lookup_idx
  on public.email_otps (lower(email), otp_code, expires_at desc)
  where used = false;

alter table public.email_otps enable row level security;

alter table public."UserProfile"
  add column if not exists email_verified boolean not null default false;

update public."UserProfile"
set email_verified = true
where email_verified is false
  and "userId" in (
    select id::text
    from auth.users
    where email_confirmed_at is not null
  );
