-- ==============================================================================
-- ACTIVACIÓN INMEDIATA DEL MÓDULO DE PADRES Y AUTORIZACIONES (JUVENTUDES MIRA CALI)
-- ==============================================================================
-- Instrucciones:
-- 1. Ve a tu Dashboard de Supabase (https://supabase.com/dashboard)
-- 2. Entra a tu proyecto -> "SQL Editor" en el menú lateral izquierdo
-- 3. Pega este código completo y presiona "RUN" (ejecutar).
-- ==============================================================================

-- 1. Crear las columnas necesarias para acudientes si no existen
ALTER TABLE characterization_records 
ADD COLUMN IF NOT EXISTS guardian_token TEXT,
ADD COLUMN IF NOT EXISTS guardian_relationship TEXT,
ADD COLUMN IF NOT EXISTS guardian_name TEXT,
ADD COLUMN IF NOT EXISTS guardian_phone TEXT,
ADD COLUMN IF NOT EXISTS guardian_id_number TEXT,
ADD COLUMN IF NOT EXISTS guardian_contact_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS guardian_signature TEXT,
ADD COLUMN IF NOT EXISTS guardian_authorized_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS guardian_notes TEXT;

-- 2. Índices de búsqueda rápida por token y teléfono
CREATE INDEX IF NOT EXISTS idx_records_guardian_token ON characterization_records(guardian_token);
CREATE INDEX IF NOT EXISTS idx_records_guardian_phone ON characterization_records(guardian_phone);
CREATE INDEX IF NOT EXISTS idx_records_guardian_status ON characterization_records(guardian_contact_status);

-- 3. Políticas RLS para permitir que los padres vean su ficha y firmen sin requerir login de admin
DROP POLICY IF EXISTS "Public can view authorization record" ON characterization_records;
CREATE POLICY "Public can view authorization record" ON characterization_records 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can update authorization" ON characterization_records;
CREATE POLICY "Public can update authorization" ON characterization_records 
FOR UPDATE USING (true) WITH CHECK (true);

-- 4. Función segura (SECURITY DEFINER) para consultar la ficha de autorización por Token o Documento
CREATE OR REPLACE FUNCTION get_parent_authorization_record(lookup_query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  clean_input TEXT;
  clean_doc TEXT;
  found_record RECORD;
BEGIN
  clean_input := TRIM(lookup_query);
  clean_doc := REGEXP_REPLACE(clean_input, '\D', '', 'g');

  -- 1. Buscar por guardian_token
  SELECT * INTO found_record
  FROM characterization_records
  WHERE guardian_token = clean_input
  LIMIT 1;

  -- 2. Buscar por ID (UUID)
  IF found_record.id IS NULL AND clean_input ~ '^[0-9a-fA-F-]{36}$' THEN
    SELECT * INTO found_record
    FROM characterization_records
    WHERE id = clean_input::UUID
    LIMIT 1;
  END IF;

  -- 3. Buscar por Documento del menor (Tarjeta de Identidad)
  IF found_record.id IS NULL AND LENGTH(clean_doc) >= 6 THEN
    SELECT * INTO found_record
    FROM characterization_records
    WHERE document_number = clean_doc
    LIMIT 1;
  END IF;

  IF found_record.id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Retornar solo los datos relevantes para la autorización
  RETURN jsonb_build_object(
    'id', found_record.id,
    'first_name', found_record.first_name,
    'last_name', found_record.last_name,
    'document_type', found_record.document_type,
    'document_number', found_record.document_number,
    'birth_date', found_record.birth_date,
    'gender', found_record.gender,
    'commune', found_record.commune,
    'neighborhood', found_record.neighborhood,
    'church_headquarters', found_record.church_headquarters,
    'guardian_relationship', found_record.guardian_relationship,
    'guardian_name', found_record.guardian_name,
    'guardian_phone', found_record.guardian_phone,
    'guardian_id_number', found_record.guardian_id_number,
    'guardian_contact_status', found_record.guardian_contact_status,
    'guardian_signature', found_record.guardian_signature,
    'guardian_authorized_at', found_record.guardian_authorized_at,
    'guardian_token', found_record.guardian_token
  );
END;
$$;

-- 5. Función segura (SECURITY DEFINER) para guardar la firma y autorización del padre
CREATE OR REPLACE FUNCTION save_parent_authorization(
  record_id UUID,
  g_name TEXT,
  g_relationship TEXT,
  g_id_number TEXT,
  g_phone TEXT,
  g_signature TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_row characterization_records;
BEGIN
  UPDATE characterization_records
  SET
    guardian_name = TRIM(g_name),
    guardian_relationship = TRIM(g_relationship),
    guardian_id_number = REGEXP_REPLACE(g_id_number, '\D', '', 'g'),
    guardian_phone = REGEXP_REPLACE(g_phone, '\D', '', 'g'),
    guardian_signature = g_signature,
    guardian_contact_status = 'authorized',
    guardian_authorized_at = NOW()
  WHERE id = record_id
  RETURNING * INTO updated_row;

  IF updated_row.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Registro no encontrado');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'id', updated_row.id,
    'guardian_authorized_at', updated_row.guardian_authorized_at
  );
END;
$$;

-- 6. Otorgar permisos de ejecución pública a las funciones
GRANT EXECUTE ON FUNCTION get_parent_authorization_record(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION save_parent_authorization(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

-- 7. Generar tokens automáticamente para todos los jóvenes menores que ya se habían registrado antes
UPDATE characterization_records
SET 
  guardian_token = 'jm_' || SUBSTRING(MD5(RANDOM()::TEXT || id::TEXT) FROM 1 FOR 6) || RIGHT(EXTRACT(EPOCH FROM NOW())::TEXT, 4),
  guardian_contact_status = COALESCE(guardian_contact_status, 'pending')
WHERE guardian_token IS NULL
  AND birth_date > (CURRENT_DATE - INTERVAL '18 years');

