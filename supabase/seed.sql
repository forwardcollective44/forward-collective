-- Forward Collective — sample seed data for products and drops.
-- Run after schema.sql. Swap image_url for real product photography.

insert into products (name, category, price, image_url, tag, active) values
  ('Forward Hoodie',   'Outerwear',   145, null, 'staple', true),
  ('Collective Tee',   'Tops',         65, null, 'staple', true),
  ('Motion Cargo',     'Bottoms',     180, null, 'staple', true),
  ('Signal Crewneck',  'Tops',        120, null, 'staple', true),
  ('Vector Jacket',    'Outerwear',   320, null, 'staple', true),
  ('Baseline Cap',     'Accessories',  45, null, 'staple', true);

insert into drops (name, season, status, image_url) values
  ('Origin',     'FW24', 'archived', null),
  ('Nightshift', 'SS25', 'archived', null),
  ('Static',     'FW25', 'archived', null),
  ('Threshold',  'SS26', 'archived', null);
