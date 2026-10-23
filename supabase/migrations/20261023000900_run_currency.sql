-- =============================================================================
-- Rutine · 0900 · Moneda RUN para los precios
-- =============================================================================
-- Los precios de los planes se publican en RUN, la moneda de Rutine.
-- Por ahora RUN es solo la unidad en la que se expresan los precios: la
-- equivalencia, la compra de RUN y los cobros se definirán más adelante
-- (ver docs; no se custodia dinero hasta validar la parte legal y de pagos).
-- =============================================================================
alter table public.membership_plans drop constraint membership_plans_currency_check;
alter table public.membership_plans
  add constraint membership_plans_currency_check check (currency in ('RUN', 'USD', 'VES'));
alter table public.membership_plans alter column currency set default 'RUN';
