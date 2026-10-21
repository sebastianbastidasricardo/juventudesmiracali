-- ==============================================================================
-- MIRA VÉ JUVENTUDES CALI - GESTIÓN Y PROTECCIÓN DE CUPOS DE CERTIFICADOS RESEND
-- ==============================================================================
-- Copia y pega este script en el "SQL Editor" de tu proyecto de Supabase y dale RUN.

-- 1. Añadir columnas de control a la tabla characterization_records si no existen
ALTER TABLE characterization_records 
ADD COLUMN IF NOT EXISTS certificate_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS certificate_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS certificate_code TEXT,
ADD COLUMN IF NOT EXISTS certificate_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS guardian_relationship TEXT,
ADD COLUMN IF NOT EXISTS guardian_name TEXT,
ADD COLUMN IF NOT EXISTS guardian_phone TEXT;

-- 2. Índices para acelerar el cálculo del cupo diario y búsquedas
CREATE INDEX IF NOT EXISTS idx_records_cert_sent_at ON characterization_records(certificate_sent, certificate_sent_at);
CREATE INDEX IF NOT EXISTS idx_records_cert_status ON characterization_records(certificate_status);

-- 3. Eliminar la versión anterior para permitir cambio de retorno (de VOID a JSONB)
DROP FUNCTION IF EXISTS upsert_record_safely(JSONB);

-- 4. Crear la función inteligente que controla duplicados por número de documento y cupo diario
CREATE OR REPLACE FUNCTION upsert_record_safely(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_record characterization_records;
  new_record characterization_records;
  daily_sent_count INT;
  is_already_sent BOOLEAN := false;
  code_to_use TEXT;
  doc_clean TEXT;
  year_str TEXT;
  rand_str TEXT;
  dispatch_status TEXT;
BEGIN
  -- Convertimos el payload JSON a una estructura de la tabla
  new_record := jsonb_populate_record(null::characterization_records, payload);

  -- Buscamos ÚNICAMENTE por número de documento (en Colombia el número es único y el joven pasa de TI a CC con el mismo número)
  SELECT * INTO existing_record
  FROM characterization_records
  WHERE document_number = new_record.document_number
  LIMIT 1;

  -- Contar cuántos correos se han enviado HOY (en fecha actual UTC/Colombia)
  SELECT COUNT(*) INTO daily_sent_count
  FROM characterization_records
  WHERE certificate_sent = true
    AND certificate_sent_at >= CURRENT_DATE;

  IF existing_record.id IS NOT NULL THEN
    -- El usuario ya existía previamente (mismo número de documento)
    is_already_sent := COALESCE(existing_record.certificate_sent, false);
    code_to_use := COALESCE(existing_record.certificate_code, '');

    -- Si no tenía código asignado, se le genera uno
    IF code_to_use = '' OR code_to_use IS NULL THEN
      doc_clean := RIGHT(REGEXP_REPLACE(new_record.document_number, '\D', '', 'g'), 4);
      IF doc_clean = '' THEN doc_clean := '0000'; END IF;
      year_str := TO_CHAR(CURRENT_DATE, 'YYYY');
      rand_str := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));
      code_to_use := 'MIRA-CL-' || year_str || '-' || doc_clean || '-' || rand_str;
    END IF;

    -- Determinar estado del despacho
    IF is_already_sent THEN
      dispatch_status := 'already_sent'; -- No gastar cupo
    ELSIF daily_sent_count >= 95 THEN
      dispatch_status := 'quota_exceeded'; -- Cupo diario protegido
    ELSE
      dispatch_status := 'can_send'; -- Proceder con el envío
    END IF;

    -- Actualizamos los datos del registro (incluyendo si actualizó de TI a CC)
    UPDATE characterization_records
    SET 
        document_type = new_record.document_type,
        first_name = new_record.first_name,
        last_name = new_record.last_name,
        birth_date = new_record.birth_date,
        gender = new_record.gender,
        military_status = new_record.military_status,
        phone = new_record.phone,
        email = new_record.email,
        neighborhood = new_record.neighborhood,
        commune = new_record.commune,
        education_level = new_record.education_level,
        study_area = new_record.study_area,
        is_working = new_record.is_working,
        profession = new_record.profession,
        is_internal = new_record.is_internal,
        registration_source = new_record.registration_source,
        church_headquarters = new_record.church_headquarters,
        is_infomira_subscribed = new_record.is_infomira_subscribed,
        is_entrepreneur = new_record.is_entrepreneur,
        entrepreneur_name = new_record.entrepreneur_name,
        is_in_organization = new_record.is_in_organization,
        organization_name = new_record.organization_name,
        interests = new_record.interests,
        talents = new_record.talents,
        open_comments = new_record.open_comments,
        guardian_relationship = new_record.guardian_relationship,
        guardian_name = new_record.guardian_name,
        guardian_phone = new_record.guardian_phone,
        certificate_code = code_to_use,
        certificate_status = CASE 
          WHEN is_already_sent THEN 'sent' 
          WHEN daily_sent_count >= 95 THEN 'pending_quota' 
          ELSE 'pending' 
        END
    WHERE id = existing_record.id;

  ELSE
    -- Nuevo registro
    doc_clean := RIGHT(REGEXP_REPLACE(new_record.document_number, '\D', '', 'g'), 4);
    IF doc_clean = '' THEN doc_clean := '0000'; END IF;
    year_str := TO_CHAR(CURRENT_DATE, 'YYYY');
    rand_str := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));
    code_to_use := 'MIRA-CL-' || year_str || '-' || doc_clean || '-' || rand_str;

    IF daily_sent_count >= 95 THEN
      dispatch_status := 'quota_exceeded';
    ELSE
      dispatch_status := 'can_send';
    END IF;

    INSERT INTO characterization_records (
        first_name, last_name, document_type, document_number, birth_date, gender,
        military_status, phone, email, neighborhood, commune, education_level,
        study_area, is_working, profession, is_internal, registration_source,
        church_headquarters, is_infomira_subscribed, is_entrepreneur,
        entrepreneur_name, is_in_organization, organization_name, interests,
        talents, open_comments, guardian_relationship, guardian_name, guardian_phone,
        certificate_sent, certificate_code, certificate_status
    ) VALUES (
        new_record.first_name, new_record.last_name, new_record.document_type, new_record.document_number, new_record.birth_date, new_record.gender,
        new_record.military_status, new_record.phone, new_record.email, new_record.neighborhood, new_record.commune, new_record.education_level,
        new_record.study_area, new_record.is_working, new_record.profession, new_record.is_internal, new_record.registration_source,
        new_record.church_headquarters, new_record.is_infomira_subscribed, new_record.is_entrepreneur,
        new_record.entrepreneur_name, new_record.is_in_organization, new_record.organization_name, new_record.interests,
        new_record.talents, new_record.open_comments, new_record.guardian_relationship, new_record.guardian_name, new_record.guardian_phone,
        false, code_to_use,
        CASE WHEN daily_sent_count >= 95 THEN 'pending_quota' ELSE 'pending' END
    );
  END IF;

  RETURN jsonb_build_object(
    'dispatch_status', dispatch_status,
    'certificate_code', code_to_use,
    'already_sent', is_already_sent,
    'daily_sent_count', daily_sent_count,
    'is_new', (existing_record.id IS NULL)
  );
END;
$$;

-- 5. Función segura para confirmar que el correo fue enviado efectivamente
DROP FUNCTION IF EXISTS mark_certificate_sent(TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION mark_certificate_sent(
  doc_type TEXT,
  doc_number TEXT,
  cert_code TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE characterization_records
  SET certificate_sent = true,
      certificate_sent_at = NOW(),
      certificate_status = 'sent',
      certificate_code = COALESCE(cert_code, certificate_code)
  WHERE document_number = doc_number;
END;
$$;

-- 6. Función para obtener métricas del cupo diario en el panel /admin
DROP FUNCTION IF EXISTS get_certificate_stats();
CREATE OR REPLACE FUNCTION get_certificate_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  today_count INT;
  total_sent INT;
  pending_count INT;
BEGIN
  SELECT COUNT(*) INTO today_count
  FROM characterization_records
  WHERE certificate_sent = true AND certificate_sent_at >= CURRENT_DATE;

  SELECT COUNT(*) INTO total_sent
  FROM characterization_records
  WHERE certificate_sent = true;

  SELECT COUNT(*) INTO pending_count
  FROM characterization_records
  WHERE certificate_status = 'pending_quota';

  RETURN jsonb_build_object(
    'today_sent', today_count,
    'today_limit', 95,
    'total_sent', total_sent,
    'pending_quota', pending_count
  );
END;
$$;
