/**
 * Generador inteligente de mensajes de WhatsApp y Tokens para Acudientes / Padres
 * Juventudes MIRA Cali
 */

export interface YouthGuardianData {
  id?: string;
  first_name?: string;
  last_name?: string;
  gender?: string;
  age?: number;
  commune?: string;
  neighborhood?: string;
  church_headquarters?: string;
  guardian_relationship?: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_token?: string;
}

/**
 * Genera un token seguro y corto para enlaces de autorización parental
 */
export function generateGuardianToken(): string {
  const rand = Math.random().toString(36).substring(2, 8);
  const time = Date.now().toString(36).slice(-4);
  return `jm_${rand}${time}`;
}

/**
 * Limpia y normaliza el número de teléfono para Colombia (+57)
 * Evita duplicar el prefijo 57 si ya viene incluido.
 */
export function getCleanGuardianPhone(phone?: string): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

export function getNormalizedColombianPhone(phone?: string): string {
  if (!phone) return '';
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 0) return '';
  
  // Si ya tiene el 57 y al menos 12 dígitos (57 + 10 dígitos)
  if (clean.startsWith('57') && clean.length >= 12) {
    return clean;
  }
  // Si tiene 10 dígitos colombianos (Ej: 3001234567)
  if (clean.length === 10) {
    return `57${clean}`;
  }
  // Si tiene 11 dígitos y empieza con 57 (raro pero posible)
  if (clean.startsWith('57')) {
    return clean;
  }
  return `57${clean}`;
}

export function detectSonOrDaughter(gender?: string): string {
  const rawGender = (gender || '').toLowerCase().trim();
  if (rawGender.includes('fem') || rawGender.includes('muj') || rawGender === 'f') {
    return 'hija';
  }
  if (rawGender.includes('masc') || rawGender.includes('hom') || rawGender === 'm') {
    return 'hijo';
  }
  return 'hijo(a)';
}

/**
 * Obtiene la URL pública del sitio web para generar enlaces accesibles desde WhatsApp.
 * Si se detecta el entorno de desarrollo privado de AI Studio (ais-dev-...),
 * se utiliza el dominio público configurado o por defecto el dominio de producción en Cloudflare Pages.
 */
export function getPublicBaseUrl(origin?: string): string {
  if (origin && origin.trim()) {
    return origin.trim().replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined') {
    // 1. Revisar si el usuario o admin configuró un dominio personalizado en LocalStorage
    const saved = localStorage.getItem('public_site_url');
    if (saved && saved.trim()) {
      return saved.trim().replace(/\/+$/, '');
    }

    const currentOrigin = window.location.origin;

    // 2. Si ya está corriendo en un dominio público real (ej: Cloudflare Pages *.pages.dev o dominio propio)
    if (
      !currentOrigin.includes('run.app') &&
      !currentOrigin.includes('localhost') &&
      !currentOrigin.includes('127.0.0.1') &&
      !currentOrigin.includes('google.com')
    ) {
      localStorage.setItem('public_site_url', currentOrigin);
      return currentOrigin;
    }

    // 3. Si está en el entorno de desarrollo privado de Google AI Studio (ais-dev-...)
    // El enlace en WhatsApp no debe llevar a ais-dev porque Google da "Page Not Found".
    // Por defecto usamos el dominio oficial en Cloudflare Pages
    return 'https://miravecaliesdetodos.pages.dev';
  }

  return 'https://miravecaliesdetodos.pages.dev';
}

/**
 * Construye el enlace de autorización web para el padre
 */
export function getGuardianAuthLink(record: YouthGuardianData, origin?: string): string {
  const baseUrl = getPublicBaseUrl(origin);
  const token = record.guardian_token || record.id || '';
  return `${baseUrl}/autorizacion/${token}`;
}

/**
 * TEMPLATE 1: Solicitud Oficial de Autorización y Firma Digital
 */
export function getGuardianAuthMessageText(record: YouthGuardianData, origin?: string): string {
  const guardianName = (record.guardian_name || 'Padre de Familia / Acudiente').trim();
  const youthName = `${record.first_name || ''} ${record.last_name || ''}`.trim() || 'Joven Participante';
  const youthAge = record.age ? `${record.age} años` : 'menor de edad';
  const sonOrDaughter = detectSonOrDaughter(record.gender);
  const relationship = (record.guardian_relationship || 'acudiente').toLowerCase();
  const authLink = getGuardianAuthLink(record, origin);

  return `¡Hola, *${guardianName}*! 👋💙

Le saludamos con mucho aprecio y respeto de parte del equipo de *Juventudes MIRA Santiago de Cali* 🏛️✨.

Nos comunicamos con usted como ${relationship} para informarle que su ${sonOrDaughter}, *${youthName}* (${youthAge}), se ha vinculado a nuestras actividades gratuitas de formación en valores, liderazgo, cultura y deporte juvenil en Santiago de Cali 🌟.

Para garantizar la protección legal de sus datos y contar con su visto bueno como acudiente responsable (Ley 1581 de 2012 y Ley 527 de 1999), le agradecemos ingresar al siguiente enlace seguro para firmar la autorización digital en solo 30 segundos desde su celular 📲✍️:

👉 *Autorizar aquí:* ${authLink}

Al abrir el enlace encontrará los datos de su ${sonOrDaughter} y un recuadro sencillo para firmar con su dedo.

¡Muchas gracias por su apoyo y confianza en el desarrollo de la juventud caleña! 🙏💙

*Equipo Juventudes MIRA Cali*`;
}

export function buildGuardianAuthWhatsAppUrl(record: YouthGuardianData, origin?: string): string {
  const phone = getNormalizedColombianPhone(record.guardian_phone);
  if (!phone) return '';
  const text = getGuardianAuthMessageText(record, origin);
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

/**
 * TEMPLATE 2: Recordatorio Amable de Firma Pendiente
 */
export function getGuardianReminderMessageText(record: YouthGuardianData, origin?: string): string {
  const guardianName = (record.guardian_name || 'Padre de Familia / Acudiente').trim();
  const youthName = `${record.first_name || ''} ${record.last_name || ''}`.trim() || 'Joven Participante';
  const sonOrDaughter = detectSonOrDaughter(record.gender);
  const authLink = getGuardianAuthLink(record, origin);

  return `¡Hola de nuevo, *${guardianName}*! 👋💙

Esperamos que tenga un excelente día. Le escribimos cordialmente de *Juventudes MIRA Cali* con relación a su ${sonOrDaughter}, *${youthName}*.

Notamos que aún está pendiente la firma de la autorización parental requerida para participar formalmente en nuestros talleres y encuentros juveniles 🌟.

Es muy fácil y rápido, solo toma 30 segundos en el celular:

👉 *Firmar autorización aquí:* ${authLink}

Agradecemos mucho su valiosa colaboración para que su ${sonOrDaughter} cuente con todo en regla. Si tiene alguna inquietud, con gusto estamos atentos a este chat. ¡Muchas bendiciones! 🙏💙

*Equipo Juventudes MIRA Cali*`;
}

export function buildGuardianReminderWhatsAppUrl(record: YouthGuardianData, origin?: string): string {
  const phone = getNormalizedColombianPhone(record.guardian_phone);
  if (!phone) return '';
  const text = getGuardianReminderMessageText(record, origin);
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

/**
 * TEMPLATE 3: Mensaje oficial de bienvenida institucional
 */
export function getGuardianWelcomeMessageText(record: YouthGuardianData): string {
  const guardianName = (record.guardian_name || 'Padre de Familia / Acudiente').trim();
  const youthName = `${record.first_name || ''} ${record.last_name || ''}`.trim() || 'Joven Participante';
  const youthAge = record.age ? `${record.age} años` : 'menor de edad';
  const sonOrDaughter = detectSonOrDaughter(record.gender);
  const relationship = (record.guardian_relationship || 'acudiente').toLowerCase();

  const zoneInfo = record.commune 
    ? `en la *Comuna ${record.commune}*${record.neighborhood ? ` (Barrio ${record.neighborhood})` : ''}` 
    : 'en el Distrito de Santiago de Cali';

  return `¡Hola, *${guardianName}*! 👋💙

Le saludamos con mucho aprecio y respeto de parte del equipo de *Juventudes MIRA Santiago de Cali* 🏛️✨.

Nos comunicamos cordialmente con usted como ${relationship} para informarle que su ${sonOrDaughter}, *${youthName}* (${youthAge}), completó con éxito su registro oficial en nuestra *Caracterización Juvenil* ${zoneInfo} 📍.

Queremos felicitarle y reiterarle que en Juventudes MIRA trabajamos con dedicación para promover espacios seguros de formación en liderazgo, cultura, deporte, educación y oportunidades reales para los jóvenes de nuestra ciudad 🌟.

Quedamos a su entera disposición ante cualquier duda o para mantenerle informado(a) sobre nuestras próximas actividades y encuentros juveniles.

¡Le deseamos un excelente día y muchas bendiciones para su hogar! 🙏💙

*Equipo Juventudes MIRA Cali*`;
}

export function buildGuardianWhatsAppUrl(record: YouthGuardianData): string {
  const phone = getNormalizedColombianPhone(record.guardian_phone);
  if (!phone) return '';
  const text = getGuardianWelcomeMessageText(record);
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

/**
 * TEMPLATE 4: Mensaje prioritario / contacto de coordinación
 */
export function getGuardianEmergencyMessageText(record: YouthGuardianData): string {
  const guardianName = (record.guardian_name || 'Acudiente').trim();
  const youthName = `${record.first_name || ''} ${record.last_name || ''}`.trim() || 'Joven Participante';
  const sonOrDaughter = detectSonOrDaughter(record.gender);

  return `¡Hola, *${guardianName}*! 👋💙

Le escribimos con atención desde la coordinación de *Juventudes MIRA Cali* respecto a su ${sonOrDaughter}, *${youthName}*.

Por favor confírmenos si se encuentra disponible para comunicarnos brevemente con usted en este momento con relación a una actividad juvenil en Santiago de Cali. ¡Muchas gracias por su atención! 🙏`;
}

export function buildGuardianEmergencyWhatsAppUrl(record: YouthGuardianData): string {
  const phone = getNormalizedColombianPhone(record.guardian_phone);
  if (!phone) return '';
  const text = getGuardianEmergencyMessageText(record);
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

/**
 * TEMPLATE 5: Confirmación de Acudiente a Coordinación tras firmar
 */
export function buildParentConfirmationWhatsAppUrl(record: YouthGuardianData, coordPhone = '3001234567'): string {
  const guardianName = (record.guardian_name || 'Acudiente').trim();
  const youthName = `${record.first_name || ''} ${record.last_name || ''}`.trim() || 'mi hijo(a)';
  const phone = getNormalizedColombianPhone(coordPhone);

  const message = `¡Hola, equipo de Juventudes MIRA Cali! 👋💙

Les confirmo que soy *${guardianName}*, acudiente de *${youthName}*, y acabo de firmar exitosamente la autorización digital en la plataforma web ✅✍️.

¡Muchas gracias!`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * TEMPLATE 6: Contacto directo por WhatsApp al Joven participante
 */
export function buildYouthWhatsAppUrl(record: { first_name?: string; last_name?: string; phone?: string; commune?: string; neighborhood?: string }): string {
  const phone = getNormalizedColombianPhone(record.phone);
  if (!phone) return '';
  const firstName = (record.first_name || '').trim();
  const zone = record.commune ? ` de la Comuna ${record.commune}` : '';
  const message = `¡Hola, *${firstName}*! 👋💙

Te saludamos cordialmente del equipo de *Juventudes MIRA Cali* 🏛️✨.

Esperamos que estés muy bien. Te contactamos con relación a tu registro en nuestra Caracterización Juvenil${zone}. ¡Nos alegra mucho saludarte! 🌟`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

