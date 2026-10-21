import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'api-dev-resend',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url === '/api/send-certificate' && req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', async () => {
                res.setHeader('Content-Type', 'application/json');
                try {
                  const payload = JSON.parse(body || '{}');
                  const apiKey = env.RESEND_API_KEY || process.env.RESEND_API_KEY;

                  if (!apiKey) {
                    res.statusCode = 200;
                    return res.end(JSON.stringify({
                      success: true,
                      simulated: true,
                      message: 'Simulación local: RESEND_API_KEY no detectada en local. En Cloudflare Pages se enviará automáticamente con la clave configurada.',
                      code: `MIRA-CL-${new Date().getFullYear()}-DEMO`
                    }));
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

                  const fullName = (payload.fullName || 'Joven MIRA').toUpperCase();
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
                      text: `Certificado Oficial de Caracterización Juvenil - Juventudes MIRA Cali\n\nEstimado(a) ${fullName},\nTu registro ha sido completado y validado satisfactoriamente.\nCódigo de Radicado: ${code}\nSantiago de Cali, Valle del Cauca.`,
                    }),
                  });

                  const resendData = await resendResponse.json();
                  res.statusCode = resendResponse.status;
                  return res.end(JSON.stringify(resendData));
                } catch (err: any) {
                  res.statusCode = 500;
                  return res.end(JSON.stringify({ error: err.message || 'Error en servidor local' }));
                }
              });
              return;
            }
            next();
          });
        }
      }
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
