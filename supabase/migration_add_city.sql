-- ==============================================================================
-- MIRA VÉ JUVENTUDES - MIGRACIÓN PARA SOPORTE DE CIUDAD (CALI, JAMUNDÍ, YUMBO)
-- ==============================================================================
-- Copia y pega este script en el "SQL Editor" de tu proyecto de Supabase y presiona RUN.

-- 1. Añadir columna 'city' a la tabla characterization_records (por defecto 'Cali')
ALTER TABLE characterization_records 
ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Cali';

-- Asegurar que los registros existentes tengan 'Cali' asignado
UPDATE characterization_records 
SET city = 'Cali' 
WHERE city IS NULL;

-- 2. Actualizar la función upsert_record_safely para registrar y actualizar la ciudad
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

  -- Buscamos ÚNICAMENTE por número de documento
  SELECT * INTO existing_record
  FROM characterization_records
  WHERE document_number = new_record.document_number
  LIMIT 1;

  -- Contar cuántos correos se han enviado HOY
  SELECT COUNT(*) INTO daily_sent_count
  FROM characterization_records
  WHERE certificate_sent = true
    AND certificate_sent_at >= CURRENT_DATE;

  IF existing_record.id IS NOT NULL THEN
    -- El usuario ya existía previamente
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
      dispatch_status := 'already_sent';
    ELSIF daily_sent_count >= 95 THEN
      dispatch_status := 'quota_exceeded';
    ELSE
      dispatch_status := 'can_send';
    END IF;

    -- Actualizamos los datos del registro incluyendo la ciudad
    UPDATE characterization_records
    SET 
        city = COALESCE(new_record.city, existing_record.city, 'Cali'),
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
        guardian_relationship = COALESCE(new_record.guardian_relationship, existing_record.guardian_relationship),
        guardian_name = COALESCE(new_record.guardian_name, existing_record.guardian_name),
        guardian_phone = COALESCE(new_record.guardian_phone, existing_record.guardian_phone),
        guardian_token = COALESCE(new_record.guardian_token, existing_record.guardian_token),
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
        city, first_name, last_name, document_type, document_number, birth_date, gender,
        military_status, phone, email, neighborhood, commune, education_level,
        study_area, is_working, profession, is_internal, registration_source,
        church_headquarters, is_infomira_subscribed, is_entrepreneur,
        entrepreneur_name, is_in_organization, organization_name, interests,
        talents, open_comments, guardian_relationship, guardian_name, guardian_phone,
        guardian_token, guardian_contact_status,
        certificate_sent, certificate_code, certificate_status
    ) VALUES (
        COALESCE(new_record.city, 'Cali'),
        new_record.first_name, new_record.last_name, new_record.document_type, new_record.document_number, new_record.birth_date, new_record.gender,
        new_record.military_status, new_record.phone, new_record.email, new_record.neighborhood, new_record.commune, new_record.education_level,
        new_record.study_area, new_record.is_working, new_record.profession, new_record.is_internal, new_record.registration_source,
        new_record.church_headquarters, new_record.is_infomira_subscribed, new_record.is_entrepreneur,
        new_record.entrepreneur_name, new_record.is_in_organization, new_record.organization_name, new_record.interests,
        new_record.talents, new_record.open_comments, new_record.guardian_relationship, new_record.guardian_name, new_record.guardian_phone,
        new_record.guardian_token, CASE WHEN new_record.guardian_token IS NOT NULL THEN 'pending' ELSE NULL END,
        false, code_to_use, CASE WHEN daily_sent_count >= 95 THEN 'pending_quota' ELSE 'pending' END
    );
  END IF;

  RETURN jsonb_build_object(
    'status', 'success',
    'certificate_code', code_to_use,
    'dispatch_status', dispatch_status
  );
END;
$$;
