-- ════════════════════════════════════════════════════════════════
-- Seed data for SM Sales Analytics (optional — for testing).
-- Run AFTER schema.sql. Inserts salespersons, reference rows, targets
-- and a small set of sample sales lines.
-- ════════════════════════════════════════════════════════════════

insert into public.salespersons (name, region) values
  ('Somchai P.', 'Central'),
  ('Wanida K.', 'North'),
  ('Anan T.', 'South'),
  ('Ploy S.', 'East'),
  ('Krit M.', 'Northeast'),
  ('Nicha R.', 'Central')
on conflict (name) do nothing;

insert into public.companies (name, province) values
  ('Siam Group', 'Bangkok'),
  ('Bangkok Holdings', 'Bangkok'),
  ('Chao Phraya Corp', 'Nonthaburi'),
  ('Andaman Industries', 'Phuket'),
  ('Mekong Partners', 'Khon Kaen'),
  ('Lanna Enterprises', 'Chiang Mai')
on conflict (name) do nothing;

insert into public.products (product_code, product_name, category, unit_price) values
  ('P-1001', 'Premium Coffee Beans 1kg', 'Beverages', 850),
  ('P-3001', 'Wireless Earbuds Pro', 'Electronics', 2490),
  ('P-2002', 'Ceramic Dinner Set', 'Homeware', 1290),
  ('P-5001', 'Vitamin C Serum', 'Beauty', 690),
  ('P-4002', 'Denim Jacket', 'Apparel', 1490)
on conflict (product_code) do nothing;

-- Monthly targets for the current year.
insert into public.targets (salesperson_id, year, month, target_amount)
select sp.id, extract(year from now())::int, m, 500000
from public.salespersons sp
cross join generate_series(1, 12) as m
on conflict (salesperson_id, year, month) do nothing;

-- A handful of sample sales lines.
insert into public.sales
  (date, invoice_no, customer_name, company_name, salesperson, product_code, product_name, category, quantity, unit_price, sales_amount, province)
values
  (current_date - 2, 'INV-9001', 'Apex Retail', 'Siam Group', 'Somchai P.', 'P-1001', 'Premium Coffee Beans 1kg', 'Beverages', 10, 850, 8500, 'Bangkok'),
  (current_date - 2, 'INV-9001', 'Apex Retail', 'Siam Group', 'Somchai P.', 'P-3001', 'Wireless Earbuds Pro', 'Electronics', 3, 2490, 7470, 'Bangkok'),
  (current_date - 1, 'INV-9002', 'Bright Living', 'Bangkok Holdings', 'Wanida K.', 'P-2002', 'Ceramic Dinner Set', 'Homeware', 5, 1290, 6450, 'Chiang Mai'),
  (current_date,     'INV-9003', 'Crystal Mart', 'Andaman Industries', 'Anan T.', 'P-5001', 'Vitamin C Serum', 'Beauty', 12, 690, 8280, 'Phuket'),
  (current_date,     'INV-9004', 'Delta Foods', 'Mekong Partners', 'Ploy S.', 'P-4002', 'Denim Jacket', 'Apparel', 4, 1490, 5960, 'Khon Kaen');
