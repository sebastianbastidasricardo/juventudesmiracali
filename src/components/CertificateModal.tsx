import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, Award, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    fullName: string;
    documentType: string;
    documentNumber: string;
    commune?: string;
    neighborhood?: string;
    code?: string;
    date?: string;
  };
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const emissionDate = data.date || new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const locationInfo = data.commune
    ? `Comuna ${data.commune}${data.neighborhood ? ` - B/ ${data.neighborhood}` : ''}`
    : 'Santiago de Cali, Valle';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          className="bg-white text-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 my-8 print:m-0 print:max-w-none print:shadow-none print:rounded-none"
        >
          {/* Top action bar (hidden in print) */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 print:hidden">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
              <Award className="w-4 h-4 text-primary" />
              Certificado Digital Oficial
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-200 transition-colors text-slate-500 hover:text-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Certificate Body */}
          <div className="p-6 sm:p-8 space-y-6 text-center">
            {/* Header branding */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 bg-[#002B79]/10 text-[#002B79] px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                <ShieldCheck className="w-3.5 h-3.5" />
                ¡MIRA VÉ! JUVENTUDES CALI
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#002B79] uppercase">
                Certificado de Registro
              </h2>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                Constancia de Caracterización Juvenil
              </p>
            </div>

            {/* Certificate content border card */}
            <div className="relative border-2 border-[#002B79] rounded-2xl p-6 bg-[#FAFCFF] space-y-4 shadow-sm">
              <div className="inline-flex items-center gap-1 bg-[#002B79] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                <CheckCircle2 className="w-3 h-3" />
                Validación Oficial
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  Se certifica que:
                </p>
                <h3 className="text-xl sm:text-2xl font-black text-[#002B79] uppercase leading-tight">
                  {data.fullName}
                </h3>
                <p className="text-xs font-semibold text-slate-600">
                  {data.documentType} {data.documentNumber}
                </p>
              </div>

              <p className="text-xs leading-relaxed text-slate-600 px-2 text-justify sm:text-center">
                Ha completado satisfactoriamente su registro y caracterización en el movimiento <strong>Juventudes MIRA Cali</strong>, formalizando su vinculación ciudadana a las iniciativas de formación, talento y liderazgo social juvenil.
              </p>

              <div className="grid grid-cols-2 gap-4 border-t border-dashed border-slate-300 pt-4 text-left">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Ubicación
                  </span>
                  <span className="text-xs font-extrabold text-slate-800">
                    {locationInfo}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Fecha de Emisión
                  </span>
                  <span className="text-xs font-extrabold text-slate-800">
                    {emissionDate}
                  </span>
                </div>
              </div>

              <div className="bg-[#EEF4FF] rounded-xl py-2 px-3 text-center border border-[#002B79]/20">
                <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500 block">
                  Código de Radicado Oficial
                </span>
                <span className="font-mono text-xs font-black text-[#002B79] tracking-wider">
                  {data.code || 'MIRA-CL-2026-VAL'}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 leading-snug">
              Expedido por el Movimiento Político MIRA • Santiago de Cali, Valle del Cauca.<br />
              Válido para constancia de participación y registro juvenil.
            </div>
          </div>

          {/* Bottom Actions (hidden in print) */}
          <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3 print:hidden">
            <Button
              onClick={handlePrint}
              variant="outline"
              className="flex-1 rounded-xl h-12 font-bold text-slate-700 border-slate-300 hover:bg-slate-100"
            >
              <Printer className="w-4 h-4 mr-2" />
              Descargar / Imprimir
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 rounded-xl h-12 font-black bg-[#002B79] text-white hover:bg-[#002B79]/90"
            >
              Aceptar
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
