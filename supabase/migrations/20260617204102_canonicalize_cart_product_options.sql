-- Canonicalize option values used by cart and order flows.
-- Storage values should be stable machine values; UI renders labels.

do $$
begin
  if to_regclass('public."UserCart"') is not null then
    update public."UserCart"
    set "selectedMetal" = case
      when "selectedMetal" ilike '%loose diamond%' then 'loose_diamond'
      when "selectedMetal" ilike '%white gold%' then 'white_gold'
      when "selectedMetal" ilike '%yellow gold%' then 'yellow_gold'
      when "selectedMetal" ilike '%rose gold%' then 'rose_gold'
      when "selectedMetal" ilike '%platinum%' then 'platinum'
      else "selectedMetal"
    end
    where "selectedMetal" is not null;
  end if;

  if to_regclass('public."CartItem"') is not null then
    update public."CartItem"
    set "selectedMetal" = case
      when "selectedMetal" ilike '%loose diamond%' then 'loose_diamond'
      when "selectedMetal" ilike '%white gold%' then 'white_gold'
      when "selectedMetal" ilike '%yellow gold%' then 'yellow_gold'
      when "selectedMetal" ilike '%rose gold%' then 'rose_gold'
      when "selectedMetal" ilike '%platinum%' then 'platinum'
      else "selectedMetal"
    end
    where "selectedMetal" is not null;
  end if;

  if to_regclass('public."OrderItem"') is not null then
    update public."OrderItem"
    set "selectedMetal" = case
      when "selectedMetal" ilike '%loose diamond%' then 'loose_diamond'
      when "selectedMetal" ilike '%white gold%' then 'white_gold'
      when "selectedMetal" ilike '%yellow gold%' then 'yellow_gold'
      when "selectedMetal" ilike '%rose gold%' then 'rose_gold'
      when "selectedMetal" ilike '%platinum%' then 'platinum'
      else "selectedMetal"
    end
    where "selectedMetal" is not null;
  end if;
end $$;
