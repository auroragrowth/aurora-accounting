-- =============================================================
-- ONE-TIME SEED — recurring business payees extracted from
-- Monzo statements (Feb 2025 – Apr 2026).
-- Owner: paul@auroraeventshire.uk (c401d386-79a6-4ed7-b30d-7778bdaede2d).
--
-- Skipped: personal items (Amazon/eBay/Spotify/EE topups), one-off
-- restaurant meals, income lines, and self-transfers.
--
-- Re-runnable via NOT EXISTS guard on (user_id, lower(name)).
-- =============================================================

do $$
declare
  v_uid uuid := 'c401d386-79a6-4ed7-b30d-7778bdaede2d';
begin

  insert into public.payees (user_id, name, category, notes)
  select v_uid, x.name, x.category::expense_category, x.notes
  from (values
    -- ========= SUPPLIERS — food / drink =========
    ('Needham Quality Butchers',        'suppliers', 'Meat supplier — Ipswich'),
    ('Booker Cash & Carry',             'suppliers', 'Wellingborough depot'),
    ('Booker Online',                   'suppliers', 'Booker ecom'),
    ('Elm Valley Foods Ltd',            'suppliers', 'Bury St Edmunds'),
    ('Kneadham Bakers Ltd',             'suppliers', null),
    ('G & G Gallo Enterprises Ltd',     'suppliers', 'Braintree'),
    ('Little Pig Bakery Ltd',           'suppliers', null),
    ('Half Moon Foods',                 'suppliers', 'Ipswich'),
    ('Wheatacre Farm Products',         'suppliers', null),
    ('Richards Fruit & Veg Ltd',        'suppliers', 'Witnesham'),
    ('Robertos Ices Ltd',               'suppliers', 'Ipswich'),
    ('Burnt House Vineyard',            'suppliers', 'Little Finborough'),
    ('Dukes Valley',                    'suppliers', 'Lancing — drinks'),
    ('Adnams Plc',                      'suppliers', 'Southwold'),
    ('Edmunds Cocktails',               'suppliers', 'Wymondham'),
    ('Morvend Ltd',                     'suppliers', null),
    ('CFW',                             'suppliers', 'Sephra House — Kirkcaldy'),
    ('Cheryl''s Ices',                  'suppliers', 'Sibton / Yoxford'),
    ('Grape Passions Ltd',              'suppliers', null),

    -- ========= SUPPLIERS — event services =========
    ('Thunder Burst Events',            'suppliers', 'Bar service / event support'),
    ('JG Events (Josh Gleed)',          'suppliers', 'Sole-trader event services'),
    ('DK Dingley',                      'suppliers', null),
    ('Lisa Goldsmith',                  'suppliers', 'Generator hire'),
    ('County Marquees',                 'suppliers', 'Marquee hire'),
    ('Hopes Balloons & Tableware Hire', 'suppliers', null),

    -- ========= PURCHASES — supermarkets =========
    ('Tesco',                           'purchases', null),
    ('Lidl',                            'purchases', null),
    ('Asda',                            'purchases', null),
    ('East of England Co-op',           'purchases', null),
    ('Aldi',                            'purchases', null),
    ('Teamix',                          'purchases', 'Ipswich — tea/specialty'),

    -- ========= EQUIPMENT =========
    ('B&M Stowmarket',                  'equipment', null),
    ('Wickes Stowmarket',               'equipment', null),
    ('Toolstation',                     'equipment', null),
    ('Screwfix',                        'equipment', null),
    ('IKEA',                            'equipment', null),
    ('Sp A1 Equipment Ltd',             'equipment', null),
    ('Messrs JJ & RJ Markwell',         'equipment', 'Wood / timber'),
    ('East Anglia Gas',                 'equipment', 'Gas cylinders'),
    ('Timber Services',                 'equipment', 'Kings Lynn'),

    -- ========= TRAVEL / FUEL =========
    ('Tesco Petrol',                    'travel',    null),
    ('Esso (MFG Stowmarket)',           'travel',    null),
    ('Asda Petrol',                     'travel',    null),
    ('EG On The Move Stowmarket',       'travel',    null),
    ('Shell',                           'travel',    null),
    ('Woolpit Service Station',         'travel',    null),
    ('Morr Ipswich',                    'travel',    null),
    ('Stratford Service Station',       'travel',    null),

    -- ========= STAFF / CONTRACTORS =========
    ('Max Basford',                     'staff',     null),
    ('Justin J Bahar',                  'staff',     'Director / Flint Hall partner'),
    ('Shelton Hew',                     'staff',     null),
    ('Gavin J Rudland',                 'staff',     null),
    ('Christopher Collins',             'staff',     null),
    ('Charlemagne Nicole Polinar David','staff',     null),
    ('T J Cooper',                      'staff',     'Coffee setup'),
    ('Debra Jarrold',                   'staff',     'Booking fees'),

    -- ========= MARKETING =========
    ('Canva',                           'marketing', 'Design subscription'),
    ('Gipping Valley Young Farmers Club','marketing','Table sponsorship'),

    -- ========= OTHER / ADMIN =========
    ('Nat Fed Of Self Employed',        'other',     'FSB membership'),
    ('MSDC Internet',                   'other',     'Mid Suffolk DC — permit / admin'),
    ('HSQE Ltd',                        'other',     'Health & safety / compliance'),
    ('Your Company Formation',          'other',     'Companies House formation agent')
  ) as x(name, category, notes)
  where not exists (
    select 1 from public.payees p
     where p.user_id = v_uid and lower(p.name) = lower(x.name)
  );

end $$;
