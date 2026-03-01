-- ============================================================
-- Gotomami Restaurant – Sample Seed Data
-- ============================================================
--
-- BEFORE YOU RUN THIS:
--   1. Run `npm run dev` at least once so Payload CMS creates
--      all tables in your Neon database automatically.
--   2. In Neon Console → Tables, confirm the exact table and
--      column names match what's used below. Payload may differ
--      slightly between versions.
--   3. The dietary flags junction table name and column names
--      (_order, _parent_id) are Payload v3 conventions — verify
--      the actual table name in your Neon schema before running.
--
-- The script runs inside a transaction so you can safely
-- ROLLBACK if anything looks wrong before committing.
-- ============================================================

BEGIN;

-- ── 1. Menu Categories ──────────────────────────────────────

INSERT INTO menu_categories (name, slug, description, "order", updated_at, created_at)
VALUES
  ('Starters',       'starters',      'Light bites to begin your journey',                  1, NOW(), NOW()),
  ('Sushi & Rolls',  'sushi-rolls',   'Fresh nigiri, sashimi, and signature maki rolls',   2, NOW(), NOW()),
  ('Main Dishes',    'main-dishes',   'Hearty plates crafted with seasonal ingredients',   3, NOW(), NOW()),
  ('Noodles & Rice', 'noodles-rice',  'Comforting bowls made to order',                    4, NOW(), NOW()),
  ('Desserts',       'desserts',      'Sweet endings to complete the experience',           5, NOW(), NOW()),
  ('Drinks',         'drinks',        'House cocktails, sake, and non-alcoholic options',   6, NOW(), NOW());


-- ── 2. Menu Items ───────────────────────────────────────────
--
-- The `description` column stores Lexical rich-text as JSONB.
-- Each value below is the minimal valid Lexical document for a
-- single paragraph of plain text.

INSERT INTO menu_items
  (name, slug, category_id, description, price, featured, available, "order", updated_at, created_at)
VALUES

  -- Starters -----------------------------------------------

  ('Edamame',
   'edamame',
   (SELECT id FROM menu_categories WHERE slug = 'starters'),
   '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Steamed salted soybeans with a sprinkle of sea salt.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
   6.00, false, true, 1, NOW(), NOW()),

  ('Gyoza (5 pcs)',
   'gyoza-5-pcs',
   (SELECT id FROM menu_categories WHERE slug = 'starters'),
   '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Pan-fried pork and cabbage dumplings served with ponzu dipping sauce.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
   10.00, false, true, 2, NOW(), NOW()),

  ('Agedashi Tofu',
   'agedashi-tofu',
   (SELECT id FROM menu_categories WHERE slug = 'starters'),
   '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Lightly battered tofu in a warm dashi broth with grated daikon.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
   9.00, false, true, 3, NOW(), NOW()),

  ('Takoyaki (6 pcs)',
   'takoyaki-6-pcs',
   (SELECT id FROM menu_categories WHERE slug = 'starters'),
   '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Osaka-style octopus balls topped with bonito flakes and Japanese mayo.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
   11.00, true, true, 4, NOW(), NOW()),

  ('Miso Soup',
   'miso-soup',
   (SELECT id FROM menu_categories WHERE slug = 'starters'),
   '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Traditional white miso with tofu, wakame seaweed, and green onion.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
   4.00, false, true, 5, NOW(), NOW()),

  -- Sushi & Rolls ------------------------------------------

  ('Salmon Nigiri (2 pcs)',
   'salmon-nigiri-2-pcs',
   (SELECT id FROM menu_categories WHERE slug = 'sushi-rolls'),
   '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Premium Atlantic salmon over seasoned sushi rice.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
   8.00, false, true, 1, NOW(), NOW()),

  ('Dragon Roll',
   'dragon-roll',
   (SELECT id FROM menu_categories WHERE slug = 'sushi-rolls'),
   '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Shrimp tempura and cucumber topped with avocado and eel sauce.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
   16.00, true, true, 2, NOW(), NOW()),

  ('Spicy Tuna Roll',
   'spicy-tuna-roll',
   (SELECT id FROM menu_categories WHERE slug = 'sushi-rolls'),
   '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Fresh tuna with sriracha aioli and cucumber, finished with sesame seeds.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
   14.00, false, true, 3, NOW(), NOW()),

  ('Rainbow Roll',
   'rainbow-roll',
   (SELECT id FROM menu_categories WHERE slug = 'sushi-rolls'),
   '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"California roll base topped with assorted sashimi.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
   18.00, true, true, 4, NOW(), NOW()),

  ('Vegetable Roll',
   'vegetable-roll',
   (SELECT id FROM menu_categories WHERE slug = 'sushi-rolls'),
   '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Avocado, cucumber, pickled daikon, and carrot.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
   10.00, false, true, 5, NOW(), NOW()),

  ('Sashimi Platter (9 pcs)',
   'sashimi-platter-9-pcs',
   (SELECT id FROM menu_categories WHERE slug = 'sushi-rolls'),
   '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Chef''s daily selection of premium sashimi.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
   24.00, true, true, 6, NOW(), NOW()),

  -- Main Dishes --------------------------------------------

  ('Chicken Teriyaki',
   'chicken-teriyaki',
   (SELECT id FROM menu_categories WHERE slug = 'main-dishes'),
   '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Grilled free-range chicken glazed with house teriyaki, served with steamed rice and seasonal vegetables.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
   19.00, true, true, 1, NOW(), NOW()),

  ('Black Cod Miso',
   'black-cod-miso',
   (SELECT id FROM menu_categories WHERE slug = 'main-dishes'),
   '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Nobu-inspired miso-marinated sablefish, broiled and served with pickled cucumber.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
   32.00, true, true, 2, NOW(), NOW()),

  ('Wagyu Beef Steak',
   'wagyu-beef-steak',
   (SELECT id FROM menu_categories WHERE slug = 'main-dishes'),
   '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"200g A5 wagyu striploin with yuzu butter and daikon oroshi.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
   48.00, false, true, 3, NOW(), NOW()),

  ('Tofu Katsu Curry',
   'tofu-katsu-curry',
   (SELECT id FROM menu_categories WHERE slug = 'main-dishes'),
   '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Panko-crusted tofu over Japanese curry sauce with steamed rice.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
   18.00, false, true, 4, NOW(), NOW()),

  ('Duck Breast Teriyaki',
   'duck-breast-teriyaki',
   (SELECT id FROM menu_categories WHERE slug = 'main-dishes'),
   '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Slow-cooked duck breast with teriyaki reduction and sesame bok choy.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
   29.00, false, true, 5, NOW(), NOW()),

  -- Noodles & Rice -----------------------------------------

  ('Tonkotsu Ramen',
   'tonkotsu-ramen',
   (SELECT id FROM menu_categories WHERE slug = 'noodles-rice'),
   '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Rich pork bone broth, chashu pork, soft egg, nori, and bamboo shoots.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
   17.00, true, true, 1, NOW(), NOW()),

  ('Vegetable Udon',
   'vegetable-udon',
   (SELECT id FROM menu_categories WHERE slug = 'noodles-rice'),
   '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Thick udon noodles in a clear kombu broth with seasonal vegetables.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
   15.00, false, true, 2, NOW(), NOW()),

  ('Spicy Miso Ramen',
   'spicy-miso-ramen',
   (SELECT id FROM menu_categories WHERE slug = 'noodles-rice'),
   '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Miso-based broth with togarashi oil, mushrooms, corn, and green onion.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
   17.00, false, true, 3, NOW(), NOW()),

  ('Chicken Yakimeshi',
   'chicken-yakimeshi',
   (SELECT id FROM menu_categories WHERE slug = 'noodles-rice'),
   '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Wok-fried rice with chicken, egg, vegetables, and soy.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
   14.00, false, true, 4, NOW(), NOW()),

  ('Ebi Tempura Udon',
   'ebi-tempura-udon',
   (SELECT id FROM menu_categories WHERE slug = 'noodles-rice'),
   '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Golden prawn tempura over hot udon noodles in a delicate dashi broth.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
   19.00, false, true, 5, NOW(), NOW()),

  -- Desserts -----------------------------------------------

  ('Matcha Cheesecake',
   'matcha-cheesecake',
   (SELECT id FROM menu_categories WHERE slug = 'desserts'),
   '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Creamy ceremonial-grade matcha cheesecake with white chocolate drizzle.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
   9.00, true, true, 1, NOW(), NOW()),

  ('Mochi Ice Cream (3 pcs)',
   'mochi-ice-cream-3-pcs',
   (SELECT id FROM menu_categories WHERE slug = 'desserts'),
   '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Choose from mango, strawberry, or black sesame.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
   8.00, false, true, 2, NOW(), NOW()),

  ('Dorayaki',
   'dorayaki',
   (SELECT id FROM menu_categories WHERE slug = 'desserts'),
   '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Fluffy Japanese pancakes filled with sweet red bean paste.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
   7.00, false, true, 3, NOW(), NOW()),

  ('Yuzu Panna Cotta',
   'yuzu-panna-cotta',
   (SELECT id FROM menu_categories WHERE slug = 'desserts'),
   '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Silky cream dessert with a yuzu citrus jelly topping.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
   9.00, false, true, 4, NOW(), NOW()),

  -- Drinks -------------------------------------------------

  ('Sake (house, 180ml)',
   'sake-house-180ml',
   (SELECT id FROM menu_categories WHERE slug = 'drinks'),
   '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"House junmai sake served warm or cold.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
   9.00, false, true, 1, NOW(), NOW()),

  ('Yuzu Lemonade',
   'yuzu-lemonade',
   (SELECT id FROM menu_categories WHERE slug = 'drinks'),
   '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Freshly squeezed lemonade with yuzu citrus syrup and mint.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
   6.00, false, true, 2, NOW(), NOW()),

  ('Matcha Latte',
   'matcha-latte',
   (SELECT id FROM menu_categories WHERE slug = 'drinks'),
   '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Ceremonial-grade matcha whisked with steamed oat milk.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
   7.00, false, true, 3, NOW(), NOW()),

  ('Japanese Whisky Highball',
   'japanese-whisky-highball',
   (SELECT id FROM menu_categories WHERE slug = 'drinks'),
   '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Suntory Toki over ice with sparkling water and a lemon twist.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
   13.00, true, true, 4, NOW(), NOW()),

  ('Ramune Soda',
   'ramune-soda',
   (SELECT id FROM menu_categories WHERE slug = 'drinks'),
   '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Classic Japanese marble-sealed soda in original or lychee flavour.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
   4.00, false, true, 5, NOW(), NOW());


-- ── 3. Dietary Flags (junction table) ───────────────────────
--
-- Payload v3 stores `hasMany` select fields in a separate table.
-- Expected table name: menu_items_dietary_flags
-- Expected columns:    _order, _parent_id, value
--
-- If this table doesn't exist with that name, check your Neon
-- Tables view and adjust the name/columns accordingly.

INSERT INTO menu_items_dietary_flags ("order", parent_id, value)
VALUES
  -- Edamame: vegan, gluten-free
  (1, (SELECT id FROM menu_items WHERE slug = 'edamame'), 'vegan'),
  (2, (SELECT id FROM menu_items WHERE slug = 'edamame'), 'gluten-free'),

  -- Gyoza: contains-nuts
  (1, (SELECT id FROM menu_items WHERE slug = 'gyoza-5-pcs'), 'contains-nuts'),

  -- Agedashi Tofu: vegetarian, vegan
  (1, (SELECT id FROM menu_items WHERE slug = 'agedashi-tofu'), 'vegetarian'),
  (2, (SELECT id FROM menu_items WHERE slug = 'agedashi-tofu'), 'vegan'),

  -- Takoyaki: chefs-special
  (1, (SELECT id FROM menu_items WHERE slug = 'takoyaki-6-pcs'), 'chefs-special'),

  -- Miso Soup: vegan, gluten-free
  (1, (SELECT id FROM menu_items WHERE slug = 'miso-soup'), 'vegan'),
  (2, (SELECT id FROM menu_items WHERE slug = 'miso-soup'), 'gluten-free'),

  -- Salmon Nigiri: gluten-free
  (1, (SELECT id FROM menu_items WHERE slug = 'salmon-nigiri-2-pcs'), 'gluten-free'),

  -- Dragon Roll: chefs-special
  (1, (SELECT id FROM menu_items WHERE slug = 'dragon-roll'), 'chefs-special'),

  -- Spicy Tuna Roll: spicy, gluten-free
  (1, (SELECT id FROM menu_items WHERE slug = 'spicy-tuna-roll'), 'spicy'),
  (2, (SELECT id FROM menu_items WHERE slug = 'spicy-tuna-roll'), 'gluten-free'),

  -- Rainbow Roll: gluten-free
  (1, (SELECT id FROM menu_items WHERE slug = 'rainbow-roll'), 'gluten-free'),

  -- Vegetable Roll: vegan, gluten-free
  (1, (SELECT id FROM menu_items WHERE slug = 'vegetable-roll'), 'vegan'),
  (2, (SELECT id FROM menu_items WHERE slug = 'vegetable-roll'), 'gluten-free'),

  -- Sashimi Platter: gluten-free, chefs-special
  (1, (SELECT id FROM menu_items WHERE slug = 'sashimi-platter-9-pcs'), 'gluten-free'),
  (2, (SELECT id FROM menu_items WHERE slug = 'sashimi-platter-9-pcs'), 'chefs-special'),

  -- Chicken Teriyaki: gluten-free
  (1, (SELECT id FROM menu_items WHERE slug = 'chicken-teriyaki'), 'gluten-free'),

  -- Black Cod Miso: gluten-free, chefs-special
  (1, (SELECT id FROM menu_items WHERE slug = 'black-cod-miso'), 'gluten-free'),
  (2, (SELECT id FROM menu_items WHERE slug = 'black-cod-miso'), 'chefs-special'),

  -- Wagyu Beef Steak: gluten-free
  (1, (SELECT id FROM menu_items WHERE slug = 'wagyu-beef-steak'), 'gluten-free'),

  -- Tofu Katsu Curry: vegan, dairy-free
  (1, (SELECT id FROM menu_items WHERE slug = 'tofu-katsu-curry'), 'vegan'),
  (2, (SELECT id FROM menu_items WHERE slug = 'tofu-katsu-curry'), 'dairy-free'),

  -- Duck Breast Teriyaki: chefs-special
  (1, (SELECT id FROM menu_items WHERE slug = 'duck-breast-teriyaki'), 'chefs-special'),

  -- Tonkotsu Ramen: contains-nuts
  (1, (SELECT id FROM menu_items WHERE slug = 'tonkotsu-ramen'), 'contains-nuts'),

  -- Vegetable Udon: vegan
  (1, (SELECT id FROM menu_items WHERE slug = 'vegetable-udon'), 'vegan'),

  -- Spicy Miso Ramen: spicy, vegan
  (1, (SELECT id FROM menu_items WHERE slug = 'spicy-miso-ramen'), 'spicy'),
  (2, (SELECT id FROM menu_items WHERE slug = 'spicy-miso-ramen'), 'vegan'),

  -- Chicken Yakimeshi: gluten-free
  (1, (SELECT id FROM menu_items WHERE slug = 'chicken-yakimeshi'), 'gluten-free'),

  -- Ebi Tempura Udon: chefs-special
  (1, (SELECT id FROM menu_items WHERE slug = 'ebi-tempura-udon'), 'chefs-special'),

  -- Matcha Cheesecake: vegetarian
  (1, (SELECT id FROM menu_items WHERE slug = 'matcha-cheesecake'), 'vegetarian'),

  -- Mochi Ice Cream: gluten-free
  (1, (SELECT id FROM menu_items WHERE slug = 'mochi-ice-cream-3-pcs'), 'gluten-free'),

  -- Dorayaki: vegetarian, contains-nuts
  (1, (SELECT id FROM menu_items WHERE slug = 'dorayaki'), 'vegetarian'),
  (2, (SELECT id FROM menu_items WHERE slug = 'dorayaki'), 'contains-nuts'),

  -- Yuzu Panna Cotta: gluten-free
  (1, (SELECT id FROM menu_items WHERE slug = 'yuzu-panna-cotta'), 'gluten-free'),

  -- Sake: gluten-free
  (1, (SELECT id FROM menu_items WHERE slug = 'sake-house-180ml'), 'gluten-free'),

  -- Yuzu Lemonade: vegan, gluten-free
  (1, (SELECT id FROM menu_items WHERE slug = 'yuzu-lemonade'), 'vegan'),
  (2, (SELECT id FROM menu_items WHERE slug = 'yuzu-lemonade'), 'gluten-free'),

  -- Matcha Latte: vegetarian
  (1, (SELECT id FROM menu_items WHERE slug = 'matcha-latte'), 'vegetarian'),

  -- Japanese Whisky Highball: gluten-free
  (1, (SELECT id FROM menu_items WHERE slug = 'japanese-whisky-highball'), 'gluten-free'),

  -- Ramune Soda: vegan, gluten-free
  (1, (SELECT id FROM menu_items WHERE slug = 'ramune-soda'), 'vegan'),
  (2, (SELECT id FROM menu_items WHERE slug = 'ramune-soda'), 'gluten-free');


-- ── 4. Events ────────────────────────────────────────────────

INSERT INTO events
  (title, slug, description, date, end_date, featured, status, updated_at, created_at)
VALUES

  ('Sake Tasting Evening',
   'sake-tasting-evening',
   '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Join our sake sommelier for a guided tasting of six premium Japanese sakes paired with small bites. Tickets $55 per person.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
   '2026-03-14 19:00:00', '2026-03-14 21:30:00', true, 'published', NOW(), NOW()),

  ('Cherry Blossom Dinner',
   'cherry-blossom-dinner',
   '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"A special 5-course omakase menu celebrating the arrival of spring. Limited to 30 guests. $120 per person.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
   '2026-04-05 18:00:00', '2026-04-05 22:00:00', true, 'published', NOW(), NOW()),

  ('Sushi Rolling Masterclass',
   'sushi-rolling-masterclass',
   '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Learn to roll maki and inside-out rolls with our head sushi chef. Includes ingredients and a light lunch. $75 per person.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
   '2026-03-22 11:00:00', '2026-03-22 13:00:00', false, 'published', NOW(), NOW()),

  ('Mother''s Day Brunch',
   'mothers-day-brunch',
   '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"A special a la carte brunch menu with complimentary sparkling sake for all mothers. Reservations required.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
   '2026-05-10 11:00:00', '2026-05-10 15:00:00', true, 'published', NOW(), NOW()),

  ('Ramen Night Pop-Up',
   'ramen-night-pop-up',
   '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"A one-night ramen special featuring four exclusive broth styles not on the regular menu. Walk-ins welcome.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
   '2026-04-18 17:00:00', '2026-04-18 21:00:00', false, 'published', NOW(), NOW()),

  ('Japanese Whisky Dinner',
   'japanese-whisky-dinner',
   '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Four-course dinner paired with Suntory and Nikka expressions by a brand ambassador. $95 per person.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
   '2026-05-02 19:00:00', NULL, false, 'draft', NOW(), NOW());


-- ── 5. Page Content (About page) ─────────────────────────────
--
-- Global slug: page-content → table: page_content
-- Nested group fields are flattened with underscores:
--   about.eyebrow                      → about_eyebrow
--   about.headerTitle                  → about_header_title
--   about.tagline                      → about_tagline
--   about.valuesHeading                → about_values_heading
--   about.storyFormatting.background   → about_story_formatting_background
--   about.storyFormatting.textAlign    → about_story_formatting_text_align
--   about.storyFormatting.containerWidth → about_story_formatting_container_width
-- Rich text is stored as JSONB (same Lexical format as elsewhere).
-- The values array lives in a separate table: page_content_about_values
--
-- Run this AFTER `npm run dev` has created the tables via Payload migrations.

INSERT INTO page_content (
  about_eyebrow,
  about_header_title,
  about_tagline,
  about_story,
  about_story_formatting_background,
  about_story_formatting_text_align,
  about_story_formatting_container_width,
  about_values_heading,
  about_cta_heading,
  about_cta_subtext,
  about_cta_primary_text,
  about_cta_secondary_text,
  updated_at,
  created_at
)
VALUES (
  'Who We Are',
  'About Us',
  'Where every meal tells a story.',

  -- Story: two plain paragraphs of introduction text
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Welcome to Gotomami. We believe in crafting every dish with care, using the finest seasonal ingredients to create an experience you''ll want to return to. Our passion for food is matched only by our commitment to making every guest feel at home.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Whether you''re joining us for a quiet dinner, a family celebration, or a special occasion, our team is dedicated to making it unforgettable.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',

  'white',
  'center',
  'narrow',
  'Our Values',
  'Come Visit Us',
  'We''d love to welcome you. View our menu or get in touch to plan your visit.',
  'View Our Menu',
  'Contact Us',
  NOW(),
  NOW()
);

INSERT INTO page_content_about_values ("order", parent_id, icon, title, description)
VALUES
  (1, (SELECT id FROM page_content LIMIT 1), '🌿',  'Fresh & Seasonal',  'We source the finest local and seasonal ingredients to keep every dish vibrant and full of flavour.'),
  (2, (SELECT id FROM page_content LIMIT 1), '👨‍🍳', 'Crafted with Care', 'Every plate is prepared by our dedicated kitchen team with time-honoured techniques and modern creativity.'),
  (3, (SELECT id FROM page_content LIMIT 1), '🤝',  'Warm Hospitality',  'From the moment you walk in, we treat every guest like family. Your experience is our priority.');


COMMIT;
