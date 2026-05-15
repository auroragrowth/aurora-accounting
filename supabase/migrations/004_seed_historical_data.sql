-- =============================================================
-- ONE-TIME SEED — historical customers + line-item catalogue
-- extracted from sole-trader invoices/quotes in /old-inv.
-- Owner: paul@auroraeventshire.uk (auth user c401d386-79a6-4ed7-b30d-7778bdaede2d).
--
-- Re-runnable: uses NOT EXISTS guards keyed on (user_id, name)
-- for customers and (user_id, description) for presets.
-- =============================================================

do $$
declare
  v_uid uuid := 'c401d386-79a6-4ed7-b30d-7778bdaede2d';
begin

  -- ============ CUSTOMERS ============
  insert into public.customers (user_id, name, email, notes)
  select v_uid, x.name, x.email, x.notes
  from (values
    ('Flint Hall Glamping and Events Ltd', 'jussybahar@gmail.com', 'Contact: Justin Bahar'),
    ('Alex Matter',                         'alexander.matter@gmail.com', null),
    ('Amy & Sam',                           null, 'Chair / table / glassware hire'),
    ('Mendlesham Medical Group',            'cassie.jarvis@nhs.net', 'Contact: Cassody Jarvis'),
    ('Stowmarket Community Sports and Social Club CIC', 'chairman@stowmarkettownfc.co.uk', 'Contact: Kevin Blundell'),
    ('Herrco Cosmetics Limited',            null, null),
    ('Christies Care',                      'matt.gunns@christiescare.com', 'Contact: Matt Gunns'),
    ('Mykaela McCarthy',                    'Mykaela.McCarthy@hotmail.com', '18th birthday — bar hire'),
    ('Stowmarket Beekeepers',               null, 'Contact: Andy Smith'),
    ('The Wellness One Collective',         'thewellnessonecollective@gmail.com', 'Contact: Georgina Hubbard'),
    ('Thunder Burst Events',                null, 'Contact: Gareth Mutimer')
  ) as x(name, email, notes)
  where not exists (
    select 1 from public.customers c
     where c.user_id = v_uid and lower(c.name) = lower(x.name)
  );

  -- ============ LINE ITEM PRESETS ============
  insert into public.line_item_presets (user_id, description, default_qty, default_price, sort_order)
  select v_uid, x.description, x.qty, x.price, x.sort_order
  from (values
    -- Furniture & hire
    ('Chair Hire',                                         1,    3.00,  10),
    ('Folding Beechwood Chair',                            1,    3.00,  11),
    ('Folding Beechwood Chair — Replacement',              1,   45.54,  12),
    ('6ft Round Table Hire',                               1,   12.00,  20),
    ('Table Hire',                                         1,   12.00,  21),
    ('Hi-Ball Glass (incl. wash-up)',                      1,    0.30,  30),
    ('PA Hire',                                            1,  100.00,  40),
    ('Double Fridge Hire',                                 1,    0.00,  50),
    ('6-Ring Oven Hire',                                   1,    0.00,  51),
    ('King Edward Oven Hire',                              1,    0.00,  52),
    -- Bar
    ('Bar Setup',                                          1,  100.00, 100),
    ('Bar Hire Booking Fee (Licensing, Staffing, Setup)',  1,  150.00, 101),
    ('Minimum Spend Deposit (Fully Refundable)',           1,  300.00, 102),
    ('Madri Keg',                                          1,  156.99, 110),
    ('Aspalls Keg',                                        1,  154.98, 111),
    ('Can of Drink',                                       1,    1.50, 120),
    -- Catering
    ('Event Catering',                                     1,    0.00, 200),
    ('Filled Jacket Potatoes — Catering Service',          1,    0.00, 201),
    ('Hog Roast',                                          1,   13.50, 202),
    ('Healthy Meals (Summer Social)',                      1,    8.00, 203),
    -- Sweet / treats
    ('Doughnuts (5 per serving)',                          1,    4.00, 300),
    ('Candy Floss',                                        1,    2.46, 301),
    ('Popcorn',                                            1,    2.62, 302),
    ('Slushy',                                             1,    2.98, 303),
    ('Waffles',                                            1,    3.50, 304),
    ('Ice Cream',                                          1,    3.00, 305),
    ('Ice Cream Cones & Pots (Mixed)',                     1,    3.00, 306),
    ('Pic ''N'' Mix (per 100g)',                           1,    1.20, 307),
    -- Pizza
    ('Pizza — Classic (Pepperoni / Margarita)',            1,    9.50, 400),
    ('Pizza — Gourmet (BBQ Chicken / Vegetarian)',         1,   13.00, 401),
    ('Pizza Sides (per person)',                           1,    3.00, 402)
  ) as x(description, qty, price, sort_order)
  where not exists (
    select 1 from public.line_item_presets p
     where p.user_id = v_uid and lower(p.description) = lower(x.description)
  );

end $$;
