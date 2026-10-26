import QRCode from 'qrcode';

export interface GenerateCertificateParams {
  fullName: string;
  documentType: string;
  documentNumber: string;
  code?: string;
  commune?: string;
  neighborhood?: string;
}

/**
 * Genera el certificado en alta resolución (1536x1024) utilizando la plantilla
 * oficial /assets/certificado-plantilla.png y estampando el nombre, documento,
 * código de radicado único y código QR dinámico de verificación.
 * 
 * Retorna la imagen en base64 (data:image/png;base64,...).
 */
export async function generateCertificateBase64(params: GenerateCertificateParams): Promise<string> {
  const fullName = (params.fullName || 'Participante Oficial').trim().toUpperCase();
  const docInfo = `${params.documentType || 'CC'} ${params.documentNumber || 'N/A'}`.trim().toUpperCase();
  const radicado = (params.code || 'MIRA-CL-2026-VAL').trim().toUpperCase();

  const verificationUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/verificar?radicado=${encodeURIComponent(radicado)}`
    : `https://miravejuventudescali.site/verificar?radicado=${encodeURIComponent(radicado)}`;

  // 1. Generar código QR dinámico
  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 300,
      margin: 1,
      color: {
        dark: '#002B79',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });
  } catch (err) {
    console.warn('Error generando QR para el certificado:', err);
  }

  // 2. Renderizar sobre Canvas
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      return reject(new Error('Canvas solo puede generarse en entorno de navegador'));
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1536;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return reject(new Error('No se pudo inicializar contexto Canvas 2D'));
    }

    const baseImg = new Image();
    baseImg.crossOrigin = 'anonymous';
    baseImg.src = '/assets/certificado-plantilla.png';

    const finalizeAndResolve = () => {
      // 3. Estampar textos
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#002B79';

      // Nombre completo centrado (x=768, y=562) con auto-escalado
      let fontSize = 34;
      ctx.font = `900 ${fontSize}px 'Geist', 'Segoe UI', Arial, sans-serif`;
      let measuredWidth = ctx.measureText(fullName).width;
      while (measuredWidth > 940 && fontSize > 18) {
        fontSize -= 2;
        ctx.font = `900 ${fontSize}px 'Geist', 'Segoe UI', Arial, sans-serif`;
        measuredWidth = ctx.measureText(fullName).width;
      }
      ctx.fillText(fullName, 768, 562);

      // Documento de identidad (x=769, y=670)
      ctx.font = `bold 22px 'Geist', 'Segoe UI', Arial, sans-serif`;
      ctx.fillText(docInfo, 769, 670);

      // Radicado único (x=1277, y=782)
      ctx.font = `900 21px monospace`;
      ctx.letterSpacing = '1.5px';
      ctx.fillText(radicado, 1277, 782);
      ctx.letterSpacing = '0px';

      // Convertir a base64
      try {
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      } catch (toDataErr) {
        reject(toDataErr);
      }
    };

    baseImg.onload = () => {
      // Dibujar plantilla base
      ctx.drawImage(baseImg, 0, 0, 1536, 1024);

      // Dibujar QR si existe
      if (qrDataUrl) {
        const qrImg = new Image();
        qrImg.onload = () => {
          const qrX = 159;
          const qrY = 658;
          const qrSize = 124;

          // Fondo blanco redondeado para contraste óptimo
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8, 8);
          } else {
            ctx.rect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8);
          }
          ctx.fill();

          ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
          finalizeAndResolve();
        };
        qrImg.onerror = () => {
          finalizeAndResolve();
        };
        qrImg.src = qrDataUrl;
      } else {
        finalizeAndResolve();
      }
    };

    baseImg.onerror = (e) => {
      reject(new Error('No se pudo cargar la imagen plantilla /assets/certificado-plantilla.png: ' + e));
    };
  });
}
