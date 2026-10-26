export interface CertificatePayload {
  fullName: string;
  documentType: string;
  documentNumber: string;
  email: string;
  phone?: string;
  commune?: string;
  neighborhood?: string;
  code?: string;
  certificateImageBase64?: string;
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

    const cleanName = fullName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 30);

    const verificationUrl = `https://miravejuventudescali.site/verificar?radicado=${encodeURIComponent(code)}`;

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificado Oficial - Juventudes MIRA Cali</title>
</head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0F172A;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#F8FAFC;padding:36px 12px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:580px;background-color:#FFFFFF;border-radius:24px;overflow:hidden;box-shadow:0 12px 36px rgba(0,43,121,0.07);border:1px solid #E2E8F0;">
          <!-- Banner Superior -->
          <tr>
            <td style="background:linear-gradient(135deg,#002B79 0%,#001845 100%);padding:36px 28px;text-align:center;color:#FFFFFF;">
              <span style="display:inline-block;background-color:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.25);padding:6px 16px;border-radius:9999px;font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;margin-bottom:14px;color:#6EC1E4;">
                ¡MIRA VÉ! JUVENTUDES CALI
              </span>
              <h1 style="font-size:24px;font-weight:900;margin:0;letter-spacing:0.5px;color:#FFFFFF;line-height:1.2;">
                Tu Certificado Oficial de Registro
              </h1>
              <p style="font-size:13px;opacity:0.85;margin:8px 0 0 0;letter-spacing:0.5px;color:#CBD5E1;">
                Constancia de Caracterización Juvenil Santiago de Cali
              </p>
            </td>
          </tr>

          <!-- Cuerpo Principal -->
          <tr>
            <td style="padding:32px 28px;">
              <p style="font-size:16px;line-height:1.6;color:#1E293B;margin:0 0 20px 0;">
                ¡Hola <strong>${fullName}</strong>! 🎉
              </p>
              <p style="font-size:14px;line-height:1.65;color:#475569;margin:0 0 24px 0;">
                Te damos una cordial bienvenida. Tu registro en la <strong>Caracterización Juvenil</strong> ha sido validado exitosamente. Adjunto a este mensaje encuentras tu <strong>Certificado Oficial en formato de alta resolución (PNG)</strong> listo para guardar, compartir o imprimir.
              </p>

              <!-- Tarjeta de Datos y Radicado -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#F1F5F9;border-radius:16px;padding:20px;margin-bottom:26px;border:1px solid #E2E8F0;">
                <tr>
                  <td>
                    <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#64748B;margin-bottom:4px;">Participante</div>
                    <div style="font-size:15px;font-weight:800;color:#002B79;margin-bottom:12px;">${fullName}</div>

                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="50%" style="font-size:11px;color:#64748B;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding-bottom:3px;">Documento</td>
                        <td width="50%" style="font-size:11px;color:#64748B;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding-bottom:3px;text-align:right;">Ubicación</td>
                      </tr>
                      <tr>
                        <td width="50%" style="font-size:13px;color:#0F172A;font-weight:700;padding-bottom:14px;">${docInfo}</td>
                        <td width="50%" style="font-size:13px;color:#0F172A;font-weight:700;padding-bottom:14px;text-align:right;">${locationInfo}</td>
                      </tr>
                    </table>

                    <div style="background:#FFFFFF;border-radius:10px;padding:12px 14px;border:1px solid #CBD5E1;text-align:center;">
                      <div style="font-size:10px;font-weight:800;letter-spacing:1.5px;color:#64748B;text-transform:uppercase;margin-bottom:3px;">Código Único de Radicado</div>
                      <div style="font-family:monospace;font-size:14px;font-weight:900;color:#002B79;letter-spacing:1.5px;">${code}</div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Botón de Verificación Oficial -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="${verificationUrl}" target="_blank" style="display:inline-block;background-color:#002B79;color:#FFFFFF;text-decoration:none;padding:13px 26px;border-radius:12px;font-size:13px;font-weight:800;letter-spacing:0.5px;box-shadow:0 4px 14px rgba(0,43,121,0.25);">
                      ✓ Verificar Autenticidad en Línea
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Aviso de Archivo Adjunto -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#EFF6FF;border-radius:12px;padding:12px 16px;border:1px dashed #93C5FD;">
                <tr>
                  <td width="30" valign="top" style="font-size:18px;">📎</td>
                  <td style="font-size:12px;color:#1E40AF;line-height:1.5;font-weight:600;">
                    <strong>Certificado Oficial adjunto:</strong> Descarga el archivo de imagen adjunto a este correo (<strong>Certificado-Juventudes-MIRA-${cleanName}.png</strong>) para tener tu copia oficial.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Pie de página -->
          <tr>
            <td style="background-color:#F8FAFC;border-top:1px solid #E2E8F0;padding:22px 28px;text-align:center;font-size:11px;color:#64748B;line-height:1.6;">
              <div style="font-weight:800;color:#002B79;text-transform:uppercase;letter-spacing:1px;font-size:12px;margin-bottom:4px;">
                Movimiento Político MIRA • Juventudes Cali
              </div>
              <div>Santiago de Cali, Valle del Cauca, Colombia</div>
              <div style="margin-top:8px;font-size:10px;color:#94A3B8;">
                Generado automáticamente tras completar el formulario en miravejuventudescali.site • Conforme a la Ley 1581 de Protección de Datos
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const plainText = `CERTIFICADO OFICIAL DE REGISTRO - JUVENTUDES MIRA CALI
Santiago de Cali, Valle del Cauca

¡Hola ${fullName}!
Tu registro en la Caracterización Juvenil ha sido validado exitosamente.

Tu certificado oficial de alta resolución se encuentra adjunto a este correo electrónico como imagen PNG (Certificado-Juventudes-MIRA-${cleanName}.png).

DATOS DE REGISTRO:
- Participante: ${fullName}
- Documento: ${docInfo}
- Radicado Oficial: ${code}
- Fecha de Emisión: ${emissionDate}
- Territorio: ${locationInfo}

Puedes verificar la validez de tu certificado en cualquier momento ingresando a:
${verificationUrl}

Juventudes MIRA Cali
https://miravejuventudescali.site`;

    // Preparar archivo adjunto si viene la imagen en base64
    const attachments = payload.certificateImageBase64
      ? [
          {
            filename: `Certificado-Juventudes-MIRA-${cleanName}.png`,
            content: payload.certificateImageBase64.replace(/^data:image\/[a-z]+;base64,/, ''),
          },
        ]
      : [];

    const resendRequestBody: any = {
      from: 'Juventudes MIRA Cali <certificados@miravejuventudescali.site>',
      reply_to: 'certificados@miravejuventudescali.site',
      to: [payload.email],
      subject: `🎓 Tu Certificado Oficial de Registro - ${fullName}`,
      html: html,
      text: plainText,
    };

    if (attachments.length > 0) {
      resendRequestBody.attachments = attachments;
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resendRequestBody),
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
