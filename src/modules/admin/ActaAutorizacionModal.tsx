import React, { useRef } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Printer, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  Download
} from 'lucide-react';
import { toast } from 'sonner';

interface ActaAutorizacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: any | null;
}

export default function ActaAutorizacionModal({ isOpen, onClose, record }: ActaAutorizacionModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!record) return null;

  const isAuthorized = record.guardian_contact_status === 'authorized' || !!record.guardian_signature;
  const authDate = record.guardian_authorized_at 
    ? new Date(record.guardian_authorized_at).toLocaleString('es-CO', {
        dateStyle: 'long',
        timeStyle: 'short'
      })
    : record.created_at 
    ? new Date(record.created_at).toLocaleDateString('es-CO', { dateStyle: 'long' })
    : 'Pendiente';

  // Función de impresión aislada: Genera el documento completo sin recortes de scroll ni espacios en blanco
  const handlePrint = () => {
    try {
      const printElement = document.getElementById('printable-acta');
      if (!printElement) {
        window.print();
        return;
      }

      // 1. Crear un iframe oculto dedicado a la impresión para evitar recortes por el scroll del modal
      let printFrame = document.getElementById('acta-print-iframe') as HTMLIFrameElement | null;
      if (!printFrame) {
        printFrame = document.createElement('iframe');
        printFrame.id = 'acta-print-iframe';
        printFrame.style.position = 'fixed';
        printFrame.style.right = '0';
        printFrame.style.bottom = '0';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = '0';
        printFrame.style.visibility = 'hidden';
        document.body.appendChild(printFrame);
      }

      const frameDoc = printFrame.contentWindow?.document;
      if (!frameDoc) {
        window.print();
        return;
      }

      const htmlContent = printElement.innerHTML;

      frameDoc.open();
      frameDoc.write(`
        <!DOCTYPE html>
        <html lang="es">
          <head>
            <meta charset="utf-8" />
            <title>Acta_Autorizacion_${record.document_number || 'Menor'}</title>
            <style>
              @page {
                size: letter portrait;
                margin: 12mm 15mm;
              }
              * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              }
              body {
                background: #ffffff;
                color: #0f172a;
                font-size: 11.5px;
                line-height: 1.45;
                padding: 0;
              }
              .border-b-2 { border-bottom: 2px solid #002B79; }
              .pb-4 { padding-bottom: 12px; }
              .mb-6 { margin-bottom: 14px; }
              .flex { display: flex; }
              .items-start { align-items: flex-start; }
              .items-end { align-items: flex-end; }
              .justify-between { justify-content: space-between; }
              .text-right { text-align: right; }
              .text-justify { text-align: justify; }
              .font-bold { font-weight: 700; }
              .font-black { font-weight: 900; }
              .uppercase { text-transform: uppercase; }
              .grid { display: grid; }
              .grid-cols-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
              .bg-slate-50 { background-color: #f8fafc; }
              .bg-blue-50 { background-color: #eff6ff; }
              .border { border: 1px solid #cbd5e1; }
              .border-t { border-top: 1px solid #cbd5e1; }
              .rounded-xl { border-radius: 8px; }
              .p-3 { padding: 10px; }
              .p-3\\.5 { padding: 12px; }
              .pt-4 { padding-top: 12px; }
              .mt-6 { margin-top: 14px; }
              .space-y-4 > * + * { margin-top: 10px; }
              .space-y-2 > * + * { margin-top: 6px; }
              .text-primary { color: #002B79; }
              .bg-primary\\/10 { background-color: rgba(0, 43, 121, 0.08); }
              img { max-height: 65px; max-width: 190px; object-fit: contain; display: block; margin: 0 auto; }
              @media print {
                body { padding: 0; margin: 0; }
              }
            </style>
          </head>
          <body>
            <div>${htmlContent}</div>
          </body>
        </html>
      `);
      frameDoc.close();

      toast.info('Preparando documento completo para imprimir o guardar PDF...', { duration: 2000 });

      // Dar tiempo a cargar imágenes antes de abrir el diálogo de impresión
      setTimeout(() => {
        try {
          printFrame?.contentWindow?.focus();
          printFrame?.contentWindow?.print();
        } catch (e) {
          window.print();
        }
      }, 350);
    } catch (err) {
      console.error('Error al imprimir:', err);
      window.print();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl p-4 sm:p-6 glass-dark border-foreground/10 text-foreground">
        <DialogHeader className="pb-3 border-b border-foreground/10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-black uppercase text-foreground">
                  Acta Oficial de Autorización Legal
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Documento formal para archivo físico, auditorías y protección de datos (Leyes 1581 de 2012 y 527 de 1999)
                </DialogDescription>
              </div>
            </div>
            {isAuthorized ? (
              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 font-bold text-xs gap-1.5 py-1 px-3">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Legalmente Firmada
              </Badge>
            ) : (
              <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30 font-bold text-xs gap-1.5 py-1 px-3">
                <AlertCircle className="w-3.5 h-3.5" />
                Pendiente de Firma
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Hoja Imprimible Oficial (Contenedor que se imprime completo) */}
        <div 
          ref={printRef} 
          id="printable-acta" 
          className="bg-white text-slate-900 p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 text-xs leading-relaxed"
        >
          {/* Encabezado Institucional */}
          <div className="border-b-2 border-primary/20 pb-4 mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="inline-block px-2.5 py-0.5 rounded bg-primary/10 text-primary font-black text-[10px] uppercase tracking-wider mb-1">
                Juventudes MIRA Santiago de Cali
              </div>
              <h2 className="text-sm sm:text-base font-black tracking-tight text-slate-900 uppercase">
                Acta de Consentimiento Informado y Autorización de Menores
              </h2>
              <p className="text-[10.5px] text-slate-500 font-medium">
                Marco Legal: Ley Estatutaria 1581 de 2012 • Decreto 1377 de 2013 • Ley 527 de 1999 (Validez de Firma Digital)
              </p>
            </div>
            <div className="text-right text-[10px] text-slate-400 font-mono shrink-0">
              <div>Radicado ID: #{record.id?.slice(0, 8)?.toUpperCase()}</div>
              <div>Fecha: {authDate}</div>
            </div>
          </div>

          {/* Cuerpo Legal */}
          <div className="space-y-4">
            <p className="text-justify text-slate-700">
              Yo, <strong>{(record.guardian_name || 'EL ACUDIENTE').toUpperCase()}</strong>, identificado(a) con Cédula de Ciudadanía No.{' '}
              <strong className="underline underline-offset-2">
                {record.guardian_id_number || '____________________'}
              </strong>, en calidad de <strong>{(record.guardian_relationship || 'PADRE / MADRE / TUTOR LEGAL').toUpperCase()}</strong> y representante legal del(la) menor de edad:
            </p>

            {/* Ficha del Menor */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px]">
              <div>
                <span className="text-slate-500 block text-[9px] uppercase font-bold">Nombres y Apellidos del Menor:</span>
                <span className="font-bold text-slate-800 text-xs uppercase">{record.first_name} {record.last_name}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase font-bold">Documento de Identidad:</span>
                <span className="font-bold font-mono text-slate-800 text-xs">{record.document_type} No. {record.document_number}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase font-bold">Edad y Fecha de Nacimiento:</span>
                <span className="font-semibold text-slate-800">{record.age || '--'} años ({record.birth_date || 'N/A'})</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase font-bold">Ubicación Territorial:</span>
                <span className="font-semibold text-slate-800">Comuna {record.commune || 'Cali'} - {record.neighborhood || 'Barrio no especificado'}</span>
              </div>
            </div>

            {/* Declaración Clara y Sencilla */}
            <div className="space-y-2 text-[11px] text-slate-700 text-justify">
              <h4 className="font-bold text-slate-900 text-xs uppercase flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                Autorización de Participación y Protección de Datos
              </h4>
              <p>
                <strong>1. PARTICIPACIÓN Y TALLERES:</strong> Autorizo voluntariamente la vinculación y participación de mi representado(a) en las actividades gratuitas de formación en liderazgo, arte, deporte, cultura y desarrollo comunitario organizadas por <em>Juventudes MIRA Santiago de Cali</em>.
              </p>
              <p>
                <strong>2. TRATAMIENTO DE DATOS PERSONALES:</strong> Autorizo de manera previa, voluntaria e informada el registro de datos básicos de contacto con fines exclusivos de comunicación institucional, avisos de actividades y seguimiento pedagógico (Ley 1581 de 2012). Estos datos no se venden ni se comparten con fines comerciales.
              </p>
              <p>
                <strong>3. MEMORIA FOTOGRÁFICA INSTITUCIONAL:</strong> Autorizo la toma de fotografías o grabaciones grupales de las actividades desarrolladas para la difusión institucional de los programas juveniles sin fines de lucro.
              </p>
              <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-[10.5px] text-slate-700">
                <strong>Canal de Consultas y Reclamaciones:</strong> En cualquier momento, el padre o acudiente puede consultar, actualizar o solicitar la revocación de esta autorización escribiendo al correo:{' '}
                <a href="mailto:juventudesmiracali@gmail.com" className="font-bold text-primary underline">
                  juventudesmiracali@gmail.com
                </a>{' '}
                o a través de los canales de coordinación juvenil en Santiago de Cali.
              </div>
            </div>

            {/* Sección de Firma */}
            <div className="pt-4 mt-6 border-t border-slate-200">
              <div className="grid grid-cols-2 gap-4 sm:gap-6 items-end">
                {/* Cuadro de Firma del Acudiente */}
                <div className="p-3 rounded-xl border border-slate-300 bg-slate-50/50 flex flex-col justify-between min-h-[140px]">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">
                    Firma del Padre de Familia / Acudiente Responsable:
                  </span>
                  
                  <div className="my-2 flex items-center justify-center min-h-[60px]">
                    {record.guardian_signature ? (
                      <img 
                        src={record.guardian_signature} 
                        alt="Firma Digital Acudiente" 
                        className="max-h-16 max-w-[200px] object-contain"
                      />
                    ) : (
                      <div className="border-b border-dashed border-slate-400 w-full pt-10 text-center text-[10px] text-slate-400 italic">
                        (Firma física o pendiente de firma digital)
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-200 pt-1 text-[10px] text-slate-700">
                    <div className="font-bold uppercase truncate">{record.guardian_name || 'Nombre del Acudiente'}</div>
                    <div className="font-mono text-slate-500">C.C. {record.guardian_id_number || '__________________'}</div>
                    <div className="text-[9px] text-slate-400">Tel: +57 {record.guardian_phone || 'Sin número'}</div>
                  </div>
                </div>

                {/* Sello de Validez Digital / Institucional */}
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between min-h-[140px] text-[10px] text-slate-600">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-primary block mb-1">
                      Certificación Electrónica Institucional
                    </span>
                    <p className="text-[9.5px] leading-tight text-slate-500">
                      Conforme a la Ley 527 de 1999 de Colombia, este registro digital cuenta con valor probatorio pleno y trazabilidad electrónica.
                    </p>
                  </div>

                  <div className="space-y-1 font-mono text-[9px] bg-white p-2 rounded border border-slate-200">
                    <div><strong>Estado:</strong> {isAuthorized ? 'AUTORIZADO Y VALIDADO' : 'PENDIENTE DE AUTORIZACIÓN'}</div>
                    <div><strong>Fecha:</strong> {authDate}</div>
                    <div><strong>Hash Token:</strong> {record.guardian_token || record.id || 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4 flex flex-row items-center justify-between sm:justify-between border-t border-foreground/10 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl border-foreground/10 text-xs font-bold"
          >
            Cerrar
          </Button>

          <Button
            type="button"
            onClick={handlePrint}
            className="rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 flex items-center gap-2 text-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Imprimir / Guardar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
