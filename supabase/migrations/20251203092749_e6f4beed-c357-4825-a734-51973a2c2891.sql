-- Add 'validate' and 'export' permission types to the enum
ALTER TYPE permission_type ADD VALUE IF NOT EXISTS 'validate';
ALTER TYPE permission_type ADD VALUE IF NOT EXISTS 'export';