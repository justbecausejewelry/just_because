-- Just Because security hardening RLS review script.
-- Additive only: enables RLS and creates missing policies when target tables exist.
-- Review in Supabase SQL editor before applying to project xayiwdexbykvbvcgudne.

create extension if not exists pgcrypto;

do $$
begin
  if to_regclass('public."UserProfile"') is not null then
    alter table public."UserProfile" enable row level security;

    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'UserProfile' and policyname = 'Users can read own profile') then
      create policy "Users can read own profile"
        on public."UserProfile" for select to authenticated
        using ("userId" = auth.uid()::text);
    end if;

    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'UserProfile' and policyname = 'Users can update own safe profile fields') then
      create policy "Users can update own safe profile fields"
        on public."UserProfile" for update to authenticated
        using ("userId" = auth.uid()::text)
        with check ("userId" = auth.uid()::text);
    end if;
  end if;
end $$;

do $$
begin
  if to_regclass('public."Order"') is not null then
    alter table public."Order" enable row level security;

    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'Order' and policyname = 'Users can read own orders') then
      create policy "Users can read own orders"
        on public."Order" for select to authenticated
        using ("userId" = auth.uid()::text);
    end if;
  end if;

  if to_regclass('public."OrderItem"') is not null then
    alter table public."OrderItem" enable row level security;

    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'OrderItem' and policyname = 'Users can read items for own orders') then
      create policy "Users can read items for own orders"
        on public."OrderItem" for select to authenticated
        using (
          exists (
            select 1 from public."Order"
            where public."Order".id = public."OrderItem"."orderId"
              and public."Order"."userId" = auth.uid()::text
          )
        );
    end if;
  end if;

  if to_regclass('public.order_events') is not null then
    alter table public.order_events enable row level security;

    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'order_events' and policyname = 'Users can read events for own orders') then
      create policy "Users can read events for own orders"
        on public.order_events for select to authenticated
        using (
          exists (
            select 1 from public."Order"
            where public."Order".id = public.order_events.order_id
              and public."Order"."userId" = auth.uid()::text
          )
        );
    end if;
  end if;
end $$;

do $$
begin
  if to_regclass('public.return_requests') is not null then
    alter table public.return_requests enable row level security;

    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'return_requests' and policyname = 'Users can read own return requests') then
      create policy "Users can read own return requests"
        on public.return_requests for select to authenticated
        using (user_id = auth.uid()::text);
    end if;

    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'return_requests' and policyname = 'Users can create own return requests') then
      create policy "Users can create own return requests"
        on public.return_requests for insert to authenticated
        with check (user_id = auth.uid()::text);
    end if;
  end if;
end $$;

do $$
begin
  if to_regclass('public."Conversation"') is not null then
    alter table public."Conversation" enable row level security;

    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'Conversation' and policyname = 'Users can read own conversations') then
      create policy "Users can read own conversations"
        on public."Conversation" for select to authenticated
        using ("customerId" = auth.uid()::text);
    end if;

    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'Conversation' and policyname = 'Users can create own conversations') then
      create policy "Users can create own conversations"
        on public."Conversation" for insert to authenticated
        with check ("customerId" = auth.uid()::text);
    end if;
  end if;

  if to_regclass('public."ConversationMessage"') is not null then
    alter table public."ConversationMessage" enable row level security;

    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ConversationMessage' and policyname = 'Users can read messages for own conversations') then
      create policy "Users can read messages for own conversations"
        on public."ConversationMessage" for select to authenticated
        using (
          exists (
            select 1 from public."Conversation"
            where public."Conversation".id = public."ConversationMessage"."conversationId"
              and public."Conversation"."customerId" = auth.uid()::text
          )
        );
    end if;
  end if;
end $$;

do $$
begin
  if to_regclass('public.email_otps') is not null then
    alter table public.email_otps enable row level security;
    -- No authenticated user policies by design. OTP rows are service-role only.
  end if;

  if to_regclass('public."SavedAddress"') is not null then
    alter table public."SavedAddress" enable row level security;

    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'SavedAddress' and policyname = 'Users can manage own saved addresses') then
      create policy "Users can manage own saved addresses"
        on public."SavedAddress" for all to authenticated
        using ("userId" = auth.uid()::text)
        with check ("userId" = auth.uid()::text);
    end if;
  end if;

  if to_regclass('public."UserCart"') is not null then
    alter table public."UserCart" enable row level security;

    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'UserCart' and policyname = 'Users can manage own cart') then
      create policy "Users can manage own cart"
        on public."UserCart" for all to authenticated
        using ("userId" = auth.uid()::text)
        with check ("userId" = auth.uid()::text);
    end if;
  end if;
end $$;

do $$
begin
  if to_regclass('public."Product"') is not null then
    alter table public."Product" enable row level security;

    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'Product' and policyname = 'Public can read active products') then
      create policy "Public can read active products"
        on public."Product" for select to anon, authenticated
        using ("isActive" = true);
    end if;
  end if;

  if to_regclass('public."Diamond"') is not null then
    alter table public."Diamond" enable row level security;

    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'Diamond' and policyname = 'Public can read available diamonds') then
      create policy "Public can read available diamonds"
        on public."Diamond" for select to anon, authenticated
        using ("isAvailable" = true);
    end if;
  end if;
end $$;

do $$
begin
  if to_regclass('public."DiscountCode"') is not null then
    alter table public."DiscountCode" enable row level security;
    -- Discount validation and admin management are service-role API only.
  end if;
end $$;
