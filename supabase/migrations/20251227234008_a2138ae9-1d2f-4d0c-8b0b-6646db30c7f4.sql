-- Add marches permissions to roles that should have access

-- Get permission IDs for marches module
-- marches read: 2d36d577-9d39-465a-bb59-51ae7c61f131
-- marches create: 64457020-0fda-4309-95cc-6390b97fce36
-- marches update: bddae858-078a-4e26-9007-ba5f7a44d5d2
-- marches delete: ef986c1a-8abd-4c69-b211-d73e63ef63e8
-- marches validate: 0c02a570-62df-44aa-89fc-595cc8db4032
-- marches export: 95323a1b-9a3b-4a4b-bc56-e038f1b6287d

-- RF (Responsable Financier) - read, create, update, export
INSERT INTO role_permissions (role_id, permission_id) VALUES
  ('808bd53b-a1ff-4944-b8f8-71cbec53fdb7', '2d36d577-9d39-465a-bb59-51ae7c61f131'), -- read
  ('808bd53b-a1ff-4944-b8f8-71cbec53fdb7', '64457020-0fda-4309-95cc-6390b97fce36'), -- create
  ('808bd53b-a1ff-4944-b8f8-71cbec53fdb7', 'bddae858-078a-4e26-9007-ba5f7a44d5d2'), -- update
  ('808bd53b-a1ff-4944-b8f8-71cbec53fdb7', '95323a1b-9a3b-4a4b-bc56-e038f1b6287d')  -- export
ON CONFLICT DO NOTHING;

-- CDS (Chef de Service) - read, validate, export
INSERT INTO role_permissions (role_id, permission_id) VALUES
  ('d1254c91-f390-4bee-8311-15407919ff7c', '2d36d577-9d39-465a-bb59-51ae7c61f131'), -- read
  ('d1254c91-f390-4bee-8311-15407919ff7c', '0c02a570-62df-44aa-89fc-595cc8db4032'), -- validate
  ('d1254c91-f390-4bee-8311-15407919ff7c', '95323a1b-9a3b-4a4b-bc56-e038f1b6287d')  -- export
ON CONFLICT DO NOTHING;

-- Comptable - read, create, update, export
INSERT INTO role_permissions (role_id, permission_id) VALUES
  ('c738ccc7-2ecf-4395-b4a8-5bd4deb32c94', '2d36d577-9d39-465a-bb59-51ae7c61f131'), -- read
  ('c738ccc7-2ecf-4395-b4a8-5bd4deb32c94', '64457020-0fda-4309-95cc-6390b97fce36'), -- create
  ('c738ccc7-2ecf-4395-b4a8-5bd4deb32c94', 'bddae858-078a-4e26-9007-ba5f7a44d5d2'), -- update
  ('c738ccc7-2ecf-4395-b4a8-5bd4deb32c94', '95323a1b-9a3b-4a4b-bc56-e038f1b6287d')  -- export
ON CONFLICT DO NOTHING;

-- Demandeur - read only
INSERT INTO role_permissions (role_id, permission_id) VALUES
  ('86ec6ce4-6f29-4415-aba8-4fd011525885', '2d36d577-9d39-465a-bb59-51ae7c61f131')  -- read
ON CONFLICT DO NOTHING;

-- Admin Sys - read, export
INSERT INTO role_permissions (role_id, permission_id) VALUES
  ('9e4aa543-596a-4ed3-8c74-e752995ed34a', '2d36d577-9d39-465a-bb59-51ae7c61f131'), -- read
  ('9e4aa543-596a-4ed3-8c74-e752995ed34a', '95323a1b-9a3b-4a4b-bc56-e038f1b6287d')  -- export
ON CONFLICT DO NOTHING;