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
  Download, 
  ShieldCheck, 
  FileText, 
  Calendar, 
  User, 
  Clock, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

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

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl p-6 glass-dark border-foreground/10 text-foreground">
        <DialogHeader className="pb-3 border-b border-foreground/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black uppercase text-foreground">
                  Acta Oficial de Autorización Legal
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Documento formal para archivo físico, auditorías y protección de datos (Ley 1581 de 2012 y Ley 527 de 1999)
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

        {/* Hoja Imprimible Oficial */}
        <div 
          ref={printRef} 
          id="printable-acta" 
          className="bg-white text-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 text-xs leading-relaxed print:p-0 print:border-none print:shadow-none print:text-black"
        >
          {/* Encabezado Institucional */}
          <div className="border-b-2 border-primary/20 pb-4 mb-6 flex items-start justify-between">
            <div>
              <div className="inline-block px-2 py-0.5 rounded bg-primary/10 text-primary font-black text-[10px] uppercase tracking-wider mb-1">
                Juventudes MIRA Santiago de Cali
              </div>
              <h2 className="text-base font-black tracking-tight text-slate-900 uppercase">
                Acta de Consentimiento Informado y Autorización de Menores
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Marco Legal: Ley Estatutaria 1581 de 2012 • Decreto 1377 de 2013 • Ley 527 de 1999 (Validez de Firma Digital)
              </p>
            </div>
            <div className="text-right text-[10px] text-slate-400 font-mono">
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
              <div className="p-2.5 rounded-lg bg-blue-50/80 border border-blue-200/60 text-[10.5px] text-slate-700">
                <strong>Canal de Consultas y Reclamaciones:</strong> En cualquier momento, el padre o acudiente puede consultar, actualizar o solicitar la revocación de esta autorización escribiendo al correo:{' '}
                <a href="mailto:juventudesmiracali@gmail.com" className="font-bold text-primary underline">
                  juventudesmiracali@gmail.com
                </a>{' '}
                o a través de los canales de coordinación juvenil en Santiago de Cali.
              </div>
            </div>

            {/* Sección de Firma */}
            <div className="pt-4 mt-6 border-t border-slate-200">
              <div className="grid grid-cols-2 gap-6 items-end">
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
                    <div className="font-bold uppercase">{record.guardian_name || 'Nombre del Acudiente'}</div>
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
                    <p className="text-[10px] leading-tight text-slate-500">
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
            className="rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 flex items-center gap-2 text-xs"
          >
            <Printer className="w-4 h-4" />
            Imprimir / Guardar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
