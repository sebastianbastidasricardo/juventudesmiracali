export interface CertificatePayload {
  fullName: string;
  documentType: string;
  documentNumber: string;
  email: string;
  phone?: string;
  commune?: string;
  neighborhood?: string;
  code?: string;
}

export const onRequestPost = async (context: { request: Request; env: Record<string, string | undefined> }) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  try {
    const { request, env } = context;

    const apiKey = env.RESEND_API_KEY || (typeof process !== 'undefined' && process.env ? process.env.RESEND_API_KEY : undefined);

    if (!apiKey) {
      console.warn('RESEND_API_KEY no encontrada en las variables de entorno.');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'RESEND_API_KEY no configurada en Cloudflare Pages.',
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    const payload: CertificatePayload = await request.json();

    if (!payload.email || !payload.fullName) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'El nombre completo y correo electrónico son requeridos.',
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    const cleanDoc = (payload.documentNumber || '').replace(/\D/g, '').slice(-4) || '0000';
    const year = new Date().getFullYear();
    const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = payload.code || `MIRA-CL-${year}-${cleanDoc}-${randomChars}`;

    const emissionDate = new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());

    const fullName = payload.fullName.toUpperCase();
    const docInfo = `${payload.documentType || 'CC'} ${payload.documentNumber || 'N/A'}`;
    const locationInfo = payload.commune
      ? `Comuna ${payload.commune}${payload.neighborhood ? ` - B/ ${payload.neighborhood}` : ''}`
      : 'Santiago de Cali';

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificado Oficial de Caracterización Juvenil</title>
</head>
<body style="margin:0;padding:0;background-color:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1E293B;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#F1F5F9;padding:30px 10px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#FFFFFF;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(0,43,121,0.08);border:1px solid #E2E8F0;">
          <tr>
            <td style="background:linear-gradient(135deg,#002B79 0%,#001A4E 100%);padding:35px 25px;text-align:center;color:#FFFFFF;">
              <span style="display:inline-block;background-color:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);padding:5px 14px;border-radius:9999px;font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;color:#6EC1E4;">¡MIRA VÉ! JUVENTUDES CALI</span>
              <h1 style="font-size:26px;font-weight:900;margin:0;letter-spacing:1px;text-transform:uppercase;color:#FFFFFF;">Certificado de Registro</h1>
              <p style="font-size:13px;opacity:0.85;margin:6px 0 0 0;letter-spacing:1px;color:#E2E8F0;">Constancia Oficial de Caracterización Juvenil</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px;">
              <p style="font-size:16px;line-height:1.6;color:#334155;margin-bottom:24px;">
                ¡Hola <strong>${fullName}</strong>! 🎉<br>
                Queremos darte la más cálida bienvenida. Tu registro ha sido procesado y validado satisfactoriamente en la base de datos de <strong>Juventudes MIRA Cali</strong>.
              </p>
              
              <div style="background:#FAFCFF;border:2px solid #002B79;border-radius:16px;padding:26px 20px;text-align:center;margin:25px 0;">
                <span style="display:inline-block;background:#002B79;color:#FFFFFF;padding:4px 14px;border-radius:20px;font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:15px;">✓ Validación Oficial</span>
                <div style="font-size:12px;text-transform:uppercase;letter-spacing:2px;color:#64748B;font-weight:700;">Constancia expedida a favor de:</div>
                <div style="font-size:22px;font-weight:900;color:#002B79;text-transform:uppercase;margin:10px 0;line-height:1.3;">${fullName}</div>
                <div style="font-size:14px;font-weight:600;color:#475569;margin-bottom:15px;">Documento: <strong>${docInfo}</strong></div>
                <p style="font-size:13px;color:#334155;line-height:1.6;margin:15px 0 20px 0;padding:0 10px;">
                  Certifica que el/la joven ha participado formalmente en el censo y caracterización del movimiento <strong>Juventudes MIRA en Santiago de Cali</strong>, quedando formalmente vinculado/a para las iniciativas de liderazgo, formación, vocación social y talento juvenil.
                </p>
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-top:1px dashed #CBD5E1;padding-top:16px;margin-top:16px;">
                  <tr>
                    <td align="left" style="font-size:11px;">
                      <span style="color:#64748B;font-weight:700;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:2px;">Ubicación</span>
                      <span style="color:#0F172A;font-weight:800;font-size:12px;">${locationInfo}</span>
                    </td>
                    <td align="right" style="font-size:11px;">
                      <span style="color:#64748B;font-weight:700;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:2px;">Fecha de Expedición</span>
                      <span style="color:#0F172A;font-weight:800;font-size:12px;">${emissionDate}</span>
                    </td>
                  </tr>
                </table>
                <div style="margin-top:18px;padding:10px;background:#EEF4FF;border-radius:8px;font-family:monospace;font-size:12px;font-weight:800;color:#002B79;letter-spacing:1.5px;">
                  RADICADO: ${code}
                </div>
              </div>

              <p style="font-size:13px;color:#475569;text-align:center;line-height:1.6;margin-top:24px;">
                Guarda este correo como comprobante digital de tu participación.<br>
                ¡Gracias por ser parte activa de la transformación de nuestra ciudad!
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#F8FAFC;border-top:1px solid #E2E8F0;padding:24px 20px;text-align:center;font-size:12px;color:#64748B;line-height:1.6;">
              <div style="font-weight:800;color:#002B79;text-transform:uppercase;letter-spacing:1px;font-size:13px;margin-bottom:6px;">Movimiento Político MIRA • Juventudes Cali</div>
              <div>Santiago de Cali, Valle del Cauca, Colombia</div>
              <div style="margin-top:10px;font-size:11px;color:#94A3B8;">
                Este es un correo automático generado tras completar el formulario en miravejuventudescali.site • Ley 1581 de Protección de Datos Personales
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const plainText = `CERTIFICADO OFICIAL DE CARACTERIZACIÓN JUVENIL
Juventudes MIRA Cali

Estimado(a) ${fullName},

Te confirmamos que tu registro en la Caracterización Juvenil de Santiago de Cali ha sido completado y validado con éxito.

DATOS DE VALIDACIÓN OFICIAL:
- Participante: ${fullName}
- Documento de Identidad: ${docInfo}
- Ubicación / Territorio: ${locationInfo}
- Código Oficial de Radicado: ${code}
- Fecha de Emisión: ${emissionDate}

Este certificado acredita tu vinculación activa al proceso de caracterización comunitaria y desarrollo juvenil en el Distrito de Santiago de Cali.

Juventudes MIRA Cali
Santiago de Cali, Valle del Cauca, Colombia
https://miravejuventudescali.site`;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Juventudes MIRA Cali <certificados@miravejuventudescali.site>',
        reply_to: 'certificados@miravejuventudescali.site',
        to: [payload.email],
        subject: `Certificado Oficial de Caracterización Juvenil - ${fullName}`,
        html: html,
        text: plainText,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Error de Resend:', resendData);
      return new Response(
        JSON.stringify({
          success: false,
          error: (resendData && resendData.message) || 'Error al enviar correo con Resend',
          details: resendData,
        }),
        { status: resendResponse.status, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: resendData.id,
        code: code,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Error en /api/send-certificate:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Error interno del servidor',
      }),
      { status: 500, headers: corsHeaders }
    );
  }
};

export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
