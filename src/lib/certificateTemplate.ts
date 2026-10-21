export interface CertificateData {
  fullName: string;
  documentType: string;
  documentNumber: string;
  email: string;
  phone?: string;
  commune?: string;
  neighborhood?: string;
  registrationDate?: string;
  code?: string;
}

export function generateCertificateCode(documentNumber: string): string {
  const cleanDoc = (documentNumber || '').replace(/\D/g, '').slice(-4) || '0000';
  const year = new Date().getFullYear();
  const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `MIRA-CL-${year}-${cleanDoc}-${randomChars}`;
}

export function formatEmissionDate(date = new Date()): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function generateCertificateHtml(data: CertificateData): string {
  const code = data.code || generateCertificateCode(data.documentNumber);
  const emissionDate = data.registrationDate || formatEmissionDate();
  const fullName = (data.fullName || 'Joven Participante').toUpperCase();
  const docInfo = `${data.documentType || 'CC'} ${data.documentNumber || 'N/A'}`;
  const locationInfo = data.commune ? `Comuna ${data.commune}${data.neighborhood ? ` - B/ ${data.neighborhood}` : ''}` : 'Santiago de Cali';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificado Oficial de Caracterización Juvenil</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #F1F5F9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1E293B;
    }
    .wrapper {
      width: 100%;
      background-color: #F1F5F9;
      padding: 30px 10px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 43, 121, 0.08);
      border: 1px solid #E2E8F0;
    }
    .header-bar {
      background: linear-gradient(135deg, #002B79 0%, #001A4E 100%);
      padding: 35px 25px;
      text-align: center;
      color: #FFFFFF;
    }
    .header-tag {
      display: inline-block;
      background-color: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 5px 14px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 12px;
      color: #6EC1E4;
    }
    .header-title {
      font-size: 26px;
      font-weight: 900;
      margin: 0;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .header-subtitle {
      font-size: 13px;
      opacity: 0.85;
      margin: 6px 0 0 0;
      letter-spacing: 1px;
    }
    .content {
      padding: 32px 28px;
    }
    .greeting {
      font-size: 16px;
      line-height: 1.6;
      color: #334155;
      margin-bottom: 24px;
    }
    .certificate-card {
      background: #FAFCFF;
      border: 2px solid #002B79;
      border-radius: 16px;
      padding: 28px 22px;
      text-align: center;
      margin: 25px 0;
      position: relative;
    }
    .cert-seal {
      display: inline-block;
      background: #002B79;
      color: #FFFFFF;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-bottom: 15px;
    }
    .cert-heading {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #64748B;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .cert-name {
      font-size: 22px;
      font-weight: 900;
      color: #002B79;
      text-transform: uppercase;
      margin: 10px 0;
      letter-spacing: 0.5px;
      line-height: 1.3;
    }
    .cert-doc {
      font-size: 14px;
      font-weight: 600;
      color: #475569;
      margin-bottom: 15px;
    }
    .cert-body {
      font-size: 13px;
      color: #334155;
      line-height: 1.6;
      margin: 15px 0 20px 0;
      padding: 0 10px;
    }
    .cert-grid {
      display: table;
      width: 100%;
      border-top: 1px dashed #CBD5E1;
      padding-top: 16px;
      margin-top: 16px;
    }
    .cert-col {
      display: table-cell;
      width: 50%;
      text-align: left;
      vertical-align: top;
      font-size: 11px;
    }
    .cert-col-right {
      display: table-cell;
      width: 50%;
      text-align: right;
      vertical-align: top;
      font-size: 11px;
    }
    .cert-label {
      color: #64748B;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      display: block;
      margin-bottom: 2px;
    }
    .cert-val {
      color: #0F172A;
      font-weight: 800;
      font-size: 12px;
    }
    .code-box {
      margin-top: 18px;
      padding: 10px;
      background: #EEF4FF;
      border-radius: 8px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      font-weight: 800;
      color: #002B79;
      letter-spacing: 1.5px;
    }
    .footer {
      background-color: #F8FAFC;
      border-top: 1px solid #E2E8F0;
      padding: 24px 20px;
      text-align: center;
      font-size: 12px;
      color: #64748B;
      line-height: 1.6;
    }
    .footer-brand {
      font-weight: 800;
      color: #002B79;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-size: 13px;
      margin-bottom: 6px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <!-- Header -->
      <div class="header-bar">
        <div class="header-tag">¡MIRA VÉ! JUVENTUDES CALI</div>
        <h1 class="header-title">Certificado de Registro</h1>
        <p class="header-subtitle">Constancia Oficial de Caracterización Juvenil</p>
      </div>

      <!-- Main Content -->
      <div class="content">
        <p class="greeting">
          ¡Hola <strong>${fullName}</strong>! 🎉<br>
          Queremos darte la más cálida bienvenida. Tu registro ha sido procesado y validado satisfactoriamente en la base de datos de <strong>Juventudes MIRA Cali</strong>.
        </p>

        <!-- Certificate Box -->
        <div class="certificate-card">
          <span class="cert-seal">✓ Validación Oficial</span>
          <div class="cert-heading">Constancia expedida a favor de:</div>
          <div class="cert-name">${fullName}</div>
          <div class="cert-doc">Documento: <strong>${docInfo}</strong></div>

          <p class="cert-body">
            Certifica que el/la joven ha participado formalmente en el censo y caracterización del movimiento <strong>Juventudes MIRA en Santiago de Cali</strong>, quedando vinculado/a para las iniciativas de liderazgo, formación, vocación social y talento juvenil.
          </p>

          <div class="cert-grid">
            <div class="cert-col">
              <span class="cert-label">Ubicación</span>
              <span class="cert-val">${locationInfo}</span>
            </div>
            <div class="cert-col-right">
              <span class="cert-label">Fecha de Expedición</span>
              <span class="cert-val">${emissionDate}</span>
            </div>
          </div>

          <div class="code-box">
            RADICADO: ${code}
          </div>
        </div>

        <p style="font-size: 13px; color: #475569; text-align: center; line-height: 1.6; margin-top: 24px;">
          Guarda este correo como comprobante digital de tu participación.<br>
          ¡Gracias por ser parte activa de la transformación de nuestra ciudad!
        </p>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div class="footer-brand">Movimiento Político MIRA • Juventudes Cali</div>
        <div>Santiago de Cali, Valle del Cauca, Colombia</div>
        <div style="margin-top: 10px; font-size: 11px; color: #94A3B8;">
          Este es un correo automático generado tras completar el formulario en miravejuventudescali.site • Ley 1581 de Protección de Datos Personales
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}
