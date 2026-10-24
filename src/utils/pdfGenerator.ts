import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ActaRecordData {
  id?: string;
  first_name?: string;
  last_name?: string;
  document_type?: string;
  document_number?: string;
  age?: number | string;
  birth_date?: string;
  commune?: string | number;
  neighborhood?: string;
  guardian_name?: string;
  guardian_relationship?: string;
  guardian_id_number?: string;
  guardian_phone?: string;
  guardian_signature?: string | null;
  guardian_authorized_at?: string;
  guardian_token?: string;
  guardian_contact_status?: string;
  created_at?: string;
}

/**
 * Genera el HTML exacto de alta fidelidad para el Acta Legal con estilos inline estándar,
 * garantizando compatibilidad 100% con html2canvas y jsPDF sin depender de variables CSS modernas.
 */
function buildActaHtmlString(record: ActaRecordData): string {
  const isAuthorized = record.guardian_contact_status === 'authorized' || !!record.guardian_signature;
  const authDate = record.guardian_authorized_at 
    ? new Date(record.guardian_authorized_at).toLocaleString('es-CO', {
        dateStyle: 'long',
        timeStyle: 'short'
      })
    : record.created_at 
    ? new Date(record.created_at).toLocaleDateString('es-CO', { dateStyle: 'long' })
    : 'Pendiente de formalización';

  const radicadoId = record.guardian_token 
    ? record.guardian_token.toUpperCase() 
    : record.id 
    ? `#${record.id.slice(0, 8).toUpperCase()}` 
    : '#ADC3C380';

  const minorFullName = `${record.first_name || ''} ${record.last_name || ''}`.trim().toUpperCase() || 'NOMBRE DEL MENOR';
  const guardianFullName = (record.guardian_name || 'EL ACUDIENTE').trim().toUpperCase();
  const guardianDoc = record.guardian_id_number || '____________________';
  const guardianRel = (record.guardian_relationship || 'PADRE / MADRE / TUTOR LEGAL').trim().toUpperCase();
  const minorDoc = `${record.document_type || 'TI'} No. ${record.document_number || '________________'}`;
  const minorAge = record.age ? `${record.age} años` : '--';
  const minorBirth = record.birth_date ? ` (${record.birth_date})` : '';
  const location = `Comuna ${record.commune || 'Cali'} - ${record.neighborhood || 'Barrio no especificado'}`;
  const tokenHash = record.guardian_token || record.id || 'N/A';
  const guardianPhone = record.guardian_phone || 'Sin número';

  const signatureContent = record.guardian_signature
    ? `<img src="${record.guardian_signature}" alt="Firma Digital" style="max-height: 58px; max-width: 180px; object-fit: contain; display: block; margin: 0 auto;" />`
    : `<div style="border-bottom: 1px dashed #94a3b8; width: 100%; padding-top: 35px; text-align: center; font-size: 10px; color: #94a3b8; font-style: italic;">(Firma física o pendiente de firma digital)</div>`;

  return `
    <div style="width: 780px; background-color: #ffffff; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 28px 32px; box-sizing: border-box; line-height: 1.42; font-size: 11.5px;">
      
      <!-- ENCABEZADO INSTITUCIONAL -->
      <div style="border-bottom: 2px solid #002B79; padding-bottom: 12px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-start;">
        <div style="flex: 1;">
          <div style="display: inline-block; padding: 2px 8px; border-radius: 4px; background-color: rgba(0, 43, 121, 0.08); color: #002B79; font-weight: 800; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
            JUVENTUDES MIRA SANTIAGO DE CALI
          </div>
          <h2 style="margin: 0; font-size: 15px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: -0.3px; line-height: 1.25;">
            ACTA DE CONSENTIMIENTO INFORMADO Y AUTORIZACIÓN DE MENORES
          </h2>
          <p style="margin: 3px 0 0 0; font-size: 9.5px; color: #64748b; font-weight: 500;">
            Marco Legal: Ley Estatutaria 1581 de 2012 • Decreto 1377 de 2013 • Ley 527 de 1999 (Validez de Firma Digital)
          </p>
        </div>
        <div style="text-align: right; font-size: 9.5px; color: #64748b; font-family: monospace; white-space: nowrap; margin-left: 16px;">
          <div style="font-weight: 700; color: #334155;">Radicado ID: ${radicadoId}</div>
          <div style="margin-top: 2px;">Fecha: ${authDate}</div>
        </div>
      </div>

      <!-- DECLARACIÓN LEGAL INICIAL -->
      <div style="margin-bottom: 12px; text-align: justify; font-size: 11.5px; color: #1e293b; line-height: 1.45;">
        Yo, <strong style="color: #0f172a;">${guardianFullName}</strong>, identificado(a) con Cédula de Ciudadanía No. <strong style="text-decoration: underline; color: #0f172a;">${guardianDoc}</strong>, en calidad de <strong style="color: #0f172a;">${guardianRel}</strong> y representante legal del(la) menor de edad:
      </div>

      <!-- FICHA DEL MENOR -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; padding: 10px 14px; border-radius: 8px; background-color: #f8fafc; border: 1px solid #cbd5e1; margin-bottom: 14px; font-size: 11px;">
        <div>
          <span style="font-size: 8.5px; text-transform: uppercase; font-weight: 700; color: #64748b; display: block; letter-spacing: 0.3px;">Nombres y Apellidos del Menor:</span>
          <span style="font-weight: 800; color: #0f172a; font-size: 11.5px; text-transform: uppercase;">${minorFullName}</span>
        </div>
        <div>
          <span style="font-size: 8.5px; text-transform: uppercase; font-weight: 700; color: #64748b; display: block; letter-spacing: 0.3px;">Documento de Identidad:</span>
          <span style="font-weight: 800; font-family: monospace; color: #0f172a; font-size: 11.5px;">${minorDoc}</span>
        </div>
        <div>
          <span style="font-size: 8.5px; text-transform: uppercase; font-weight: 700; color: #64748b; display: block; letter-spacing: 0.3px;">Edad y Fecha de Nacimiento:</span>
          <span style="font-weight: 600; color: #1e293b;">${minorAge}${minorBirth}</span>
        </div>
        <div>
          <span style="font-size: 8.5px; text-transform: uppercase; font-weight: 700; color: #64748b; display: block; letter-spacing: 0.3px;">Ubicación Territorial:</span>
          <span style="font-weight: 600; color: #1e293b;">${location}</span>
        </div>
      </div>

      <!-- CLÁUSULAS LEGALES -->
      <div style="margin-bottom: 12px;">
        <div style="font-weight: 800; color: #002B79; font-size: 11px; text-transform: uppercase; display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
          <svg style="width: 14px; height: 14px; fill: none; stroke: #002B79; stroke-width: 2; vertical-align: middle; display: inline-block;" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          AUTORIZACIÓN DE PARTICIPACIÓN Y PROTECCIÓN DE DATOS
        </div>

        <div style="font-size: 10.5px; color: #334155; line-height: 1.4; text-align: justify; margin-bottom: 6px;">
          <strong style="color: #0f172a;">1. PARTICIPACIÓN Y TALLERES:</strong> Autorizo voluntariamente la vinculación y participación de mi representado(a) en las actividades gratuitas de formación en liderazgo, arte, deporte, cultura y desarrollo comunitario organizadas por <em>Juventudes MIRA Santiago de Cali</em>.
        </div>

        <div style="font-size: 10.5px; color: #334155; line-height: 1.4; text-align: justify; margin-bottom: 6px;">
          <strong style="color: #0f172a;">2. TRATAMIENTO DE DATOS PERSONALES:</strong> Autorizo de manera previa, voluntaria e informada el registro de datos básicos de contacto con fines exclusivos de comunicación institucional, avisos de actividades y seguimiento pedagógico (Ley 1581 de 2012). Estos datos no se venden ni se comparten con fines comerciales.
        </div>

        <div style="font-size: 10.5px; color: #334155; line-height: 1.4; text-align: justify; margin-bottom: 8px;">
          <strong style="color: #0f172a;">3. MEMORIA FOTOGRÁFICA INSTITUCIONAL:</strong> Autorizo la toma de fotografías o grabaciones grupales de las actividades desarrolladas para la difusión institucional de los programas juveniles sin fines de lucro.
        </div>

        <!-- RECUADRO CANAL DE CONSULTAS -->
        <div style="padding: 8px 12px; border-radius: 6px; background-color: #eff6ff; border: 1px solid #bfdbfe; font-size: 10px; color: #1e3a8a; line-height: 1.35;">
          <strong>Canal de Consultas y Reclamaciones:</strong> En cualquier momento, el padre o acudiente puede consultar, actualizar o solicitar la revocación de esta autorización escribiendo al correo: <a href="mailto:juventudesmiracali@gmail.com" style="color: #002B79; font-weight: bold; text-decoration: underline;">juventudesmiracali@gmail.com</a> o a través de los canales de coordinación juvenil en Santiago de Cali.
        </div>
      </div>

      <!-- SECCIÓN DE FIRMAS Y CERTIFICACIÓN ELECTRÓNICA -->
      <div style="border-top: 1px solid #cbd5e1; padding-top: 10px; margin-top: 10px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
          
          <!-- CUADRO DE FIRMA DEL ACUDIENTE -->
          <div style="padding: 10px 12px; border-radius: 8px; border: 1px solid #cbd5e1; background-color: #fafafa; display: flex; flex-direction: column; justify-content: space-between; min-height: 135px; box-sizing: border-box;">
            <div>
              <div style="font-size: 8.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; color: #64748b; margin-bottom: 4px;">
                FIRMA DEL ACUDIENTE RESPONSABLE:
              </div>
            </div>

            <div style="display: flex; align-items: center; justify-content: center; min-height: 60px; padding: 2px 0;">
              ${signatureContent}
            </div>

            <div style="border-top: 1px solid #e2e8f0; padding-top: 6px; font-size: 9.5px; color: #334155;">
              <div style="font-weight: 800; text-transform: uppercase; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${guardianFullName}</div>
              <div style="font-family: monospace; color: #64748b;">C.C. ${guardianDoc}</div>
              <div style="font-size: 8.5px; color: #64748b;">Tel: +57 ${guardianPhone}</div>
            </div>
          </div>

          <!-- SELLO DE CERTIFICACIÓN ELECTRÓNICA -->
          <div style="padding: 10px 12px; border-radius: 8px; border: 1px solid #cbd5e1; background-color: #f8fafc; display: flex; flex-direction: column; justify-content: space-between; min-height: 135px; font-size: 9.5px; color: #475569; box-sizing: border-box;">
            <div>
              <div style="font-size: 8.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; color: #002B79; margin-bottom: 3px;">
                CERTIFICACIÓN ELECTRÓNICA INSTITUCIONAL
              </div>
              <p style="margin: 0; font-size: 9px; line-height: 1.3; color: #64748b;">
                Conforme a la Ley 527 de 1999 de Colombia, este registro digital cuenta con valor probatorio pleno y trazabilidad electrónica.
              </p>
            </div>

            <div style="margin-top: 6px; font-family: monospace; font-size: 8.5px; background-color: #ffffff; padding: 6px 8px; border-radius: 6px; border: 1px solid #e2e8f0; line-height: 1.45; color: #1e293b;">
              <div><strong>Estado:</strong> ${isAuthorized ? 'AUTORIZADO Y VALIDADO' : 'PENDIENTE DE AUTORIZACIÓN'}</div>
              <div><strong>Fecha:</strong> ${authDate}</div>
              <div><strong>Hash Token:</strong> ${tokenHash}</div>
            </div>
          </div>

        </div>
      </div>

    </div>
  `;
}

/**
 * Descarga directamente el Acta de Autorización en formato PDF de alta fidelidad,
 * sin necesidad de abrir el diálogo de impresión del navegador y compatible con todos los navegadores y sandboxes.
 */
export async function downloadActaPdf(record: ActaRecordData): Promise<boolean> {
  // Crear contenedor temporal fuera de pantalla
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'fixed';
  tempContainer.style.top = '-9999px';
  tempContainer.style.left = '-9999px';
  tempContainer.style.width = '780px';
  tempContainer.style.zIndex = '-1000';
  tempContainer.style.backgroundColor = '#ffffff';
  tempContainer.innerHTML = buildActaHtmlString(record);

  document.body.appendChild(tempContainer);

  try {
    // Esperar a que se carguen las imágenes de firma si existen
    const imgElements = tempContainer.querySelectorAll('img');
    if (imgElements.length > 0) {
      await Promise.all(
        Array.from(imgElements).map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          });
        })
      );
    }

    // Renderizar a Canvas con alta resolución (scale 2)
    const canvas = await html2canvas(tempContainer.firstElementChild as HTMLElement || tempContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png', 1.0);

    // Crear PDF en tamaño carta portrait (215.9 x 279.4 mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Margen de 10mm a cada lado
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2);
    const contentHeight = (canvas.height * contentWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, Math.min(contentHeight, pageHeight - (margin * 2)));

    // Nombre de archivo limpio
    const cleanDoc = (record.document_number || 'Menor').toString().replace(/\D/g, '') || 'Menor';
    const filename = `Acta_Autorizacion_${cleanDoc}.pdf`;

    pdf.save(filename);
    return true;
  } catch (err) {
    console.error('Error al generar PDF del acta:', err);
    throw err;
  } finally {
    if (document.body.contains(tempContainer)) {
      document.body.removeChild(tempContainer);
    }
  }
}
