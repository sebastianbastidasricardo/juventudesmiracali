-- Ejecuta ESTE script en el SQL Editor de tu Dashboard de Supabase
-- Esto crea una función segura (bypameando los bloqueos por políticas que estaban duplicando los datos)

CREATE OR REPLACE FUNCTION upsert_record_safely(payload JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_id UUID;
  new_record characterization_records;
BEGIN
  -- Convertimos el payload JSON a una estructura de la tabla (dejamos el ID como nulo)
  new_record := jsonb_populate_record(null::characterization_records, payload);

  -- Buscamos ÚNICAMENTE por número de documento (el número en Colombia es único e invariable de TI a CC)
  SELECT id INTO existing_id
  FROM characterization_records
  WHERE document_number = new_record.document_number;

  IF existing_id IS NOT NULL THEN
     -- SI YA EXISTE: Actualizamos todos los datos (incluyendo el tipo de documento si cambió de TI a CC).
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
        open_comments = new_record.open_comments
     WHERE id = existing_id;
  ELSE
     -- SI NO EXISTE: Insertamos un registro completamente nuevo
     INSERT INTO characterization_records (
        first_name, last_name, document_type, document_number, birth_date, gender,
        military_status, phone, email, neighborhood, commune, education_level,
        study_area, is_working, profession, is_internal, registration_source,
        church_headquarters, is_infomira_subscribed, is_entrepreneur,
        entrepreneur_name, is_in_organization, organization_name, interests,
        talents, open_comments
     ) VALUES (
        new_record.first_name, new_record.last_name, new_record.document_type, new_record.document_number, new_record.birth_date, new_record.gender,
        new_record.military_status, new_record.phone, new_record.email, new_record.neighborhood, new_record.commune, new_record.education_level,
        new_record.study_area, new_record.is_working, new_record.profession, new_record.is_internal, new_record.registration_source,
        new_record.church_headquarters, new_record.is_infomira_subscribed, new_record.is_entrepreneur,
        new_record.entrepreneur_name, new_record.is_in_organization, new_record.organization_name, new_record.interests,
        new_record.talents, new_record.open_comments
     );
  END IF;
END;
$$;
