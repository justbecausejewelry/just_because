-- Scope custom 4-digit OTP rows by purpose so signup verification and
-- password reset codes can share public.email_otps without colliding.

alter table public.email_otps
  add column if not exists purpose text not null default 'email_verification';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'email_otps_purpose_check'
      and conrelid = 'public.email_otps'::regclass
  ) then
    alter table public.email_otps
      add constraint email_otps_purpose_check
      check (purpose in ('email_verification', 'password_reset'));
  end if;
end $$;

create index if not exists email_otps_purpose_email_created_at_idx
  on public.email_otps (purpose, lower(email), created_at desc);

create index if not exists email_otps_purpose_active_lookup_idx
  on public.email_otps (purpose, lower(email), otp_code, expires_at desc)
  where used = false;
