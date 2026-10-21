-- ==============================================================================
-- MIRA VÉ JUVENTUDES CALI - MIGRACIÓN MÓDULO DE PADRES Y ACUDIENTES (14 - 17 AÑOS)
-- ==============================================================================
-- Copia y pega este script en el "SQL Editor" de tu proyecto de Supabase y dale RUN.

-- 1. Agregar columnas para la información del acudiente/padre y el flujo de autorización digital
ALTER TABLE characterization_records 
ADD COLUMN IF NOT EXISTS guardian_relationship TEXT,
ADD COLUMN IF NOT EXISTS guardian_name TEXT,
ADD COLUMN IF NOT EXISTS guardian_phone TEXT,
ADD COLUMN IF NOT EXISTS guardian_id_number TEXT,
ADD COLUMN IF NOT EXISTS guardian_contact_status TEXT DEFAULT 'pending', -- 'pending' | 'contacted' | 'authorized'
ADD COLUMN IF NOT EXISTS guardian_signature TEXT,
ADD COLUMN IF NOT EXISTS guardian_authorized_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS guardian_token TEXT;

-- 2. Índices para consultas rápidas por acudiente, menores de edad y token de autorización
CREATE INDEX IF NOT EXISTS idx_records_guardian_phone ON characterization_records(guardian_phone);
CREATE INDEX IF NOT EXISTS idx_records_guardian_status ON characterization_records(guardian_contact_status);
CREATE INDEX IF NOT EXISTS idx_records_guardian_token ON characterization_records(guardian_token);
