import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Printer, 
  Award, 
  Download, 
  FileText, 
  Share2, 
  Check, 
  ExternalLink,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { getPublicBaseUrl } from '@/utils/whatsapp';

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
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Fallbacks and formatting
  const fullName = (data.fullName || 'Participante Oficial').trim().toUpperCase();
  const docInfo = `${data.documentType || 'CC'} ${data.documentNumber || 'N/A'}`.trim().toUpperCase();
  const radicado = (data.code || 'MIRA-CL-2026-VAL').trim().toUpperCase();
  
  const emissionDate = data.date || new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const locationInfo = data.commune
    ? `Comuna ${data.commune}${data.neighborhood ? ` - B/ ${data.neighborhood}` : ''}`
    : 'Santiago de Cali, Valle del Cauca';

  // Build verification link
  const baseUrl = getPublicBaseUrl();
  const verificationUrl = `${baseUrl}/verificar?radicado=${encodeURIComponent(radicado)}`;

  // Generate QR code
  useEffect(() => {
    if (!isOpen) return;
    
    QRCode.toDataURL(verificationUrl, {
      width: 300,
      margin: 1,
      color: {
        dark: '#002B79',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Error generando QR:', err));
  }, [isOpen, verificationUrl]);

  if (!isOpen) return null;

  // Render high-res 1536x1024 canvas
  const renderFullCanvas = async (): Promise<HTMLCanvasElement> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1536;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo inicializar contexto 2D'));
        return;
      }

      const baseImg = new Image();
      baseImg.crossOrigin = 'anonymous';
      baseImg.src = '/assets/certificado-plantilla.png';

      baseImg.onload = () => {
        // 1. Draw base template image
        ctx.drawImage(baseImg, 0, 0, 1536, 1024);

        // 2. Draw QR code over designated placeholder
        if (qrDataUrl) {
          const qrImg = new Image();
          qrImg.onload = () => {
            // QR Container inside coordinates: x=159, y=658, width=124, height=124
            const qrX = 159;
            const qrY = 658;
            const qrSize = 124;

            // Clean white rounded background behind QR
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.roundRect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8, 8);
            ctx.fill();

            ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

            // 3. Draw text fields
            drawTexts(ctx);
            resolve(canvas);
          };
          qrImg.onerror = () => {
            drawTexts(ctx);
            resolve(canvas);
          };
          qrImg.src = qrDataUrl;
        } else {
          drawTexts(ctx);
          resolve(canvas);
        }
      };

      baseImg.onerror = (e) => {
        reject(new Error('No se pudo cargar la plantilla del certificado: ' + e));
      };
    });
  };

  const drawTexts = (ctx: CanvasRenderingContext2D) => {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#002B79';

    // 1. Full Name Box: Center X = 768, Center Y = 562, Max Width = 950
    let fontSize = 34;
    ctx.font = `900 ${fontSize}px 'Geist', 'Segoe UI', Arial, sans-serif`;
    let measuredWidth = ctx.measureText(fullName).width;
    while (measuredWidth > 940 && fontSize > 18) {
      fontSize -= 2;
      ctx.font = `900 ${fontSize}px 'Geist', 'Segoe UI', Arial, sans-serif`;
      measuredWidth = ctx.measureText(fullName).width;
    }
    ctx.fillText(fullName, 768, 562);

    // 2. Document Box: Center X = 769, Center Y = 670, Max Width = 420
    ctx.font = `bold 22px 'Geist', 'Segoe UI', Arial, sans-serif`;
    ctx.fillText(docInfo, 769, 670);

    // 3. Radicado Code Box: Center X = 1277, Center Y = 782, Max Width = 380
    ctx.font = `900 21px monospace`;
    ctx.letterSpacing = '1.5px';
    ctx.fillText(radicado, 1277, 782);
    ctx.letterSpacing = '0px';
  };

  // Download high-resolution PNG
  const handleDownloadPNG = async () => {
    setIsGenerating(true);
    const toastId = toast.loading('Generando certificado en alta resolución...');
    try {
      const canvas = await renderFullCanvas();
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.dismiss(toastId);
          toast.error('No se pudo generar la imagen');
          return;
        }
        const cleanName = fullName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Certificado-Juventudes-MIRA-${cleanName}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.dismiss(toastId);
        toast.success('¡Certificado descargado con éxito!');
      }, 'image/png');
    } catch (err) {
      console.error(err);
      toast.dismiss(toastId);
      toast.error('Ocurrió un error al generar la imagen');
    } finally {
      setIsGenerating(false);
    }
  };

  // Download PDF
  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    const toastId = toast.loading('Preparando PDF oficial para descarga...');
    try {
      const canvas = await renderFullCanvas();
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      // Landscape letter ratio (1536 x 1024 px)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1536, 1024],
        compress: true,
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, 1536, 1024);
      const cleanName = fullName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
      pdf.save(`Certificado-Juventudes-MIRA-${cleanName}.pdf`);

      toast.dismiss(toastId);
      toast.success('¡PDF generado y descargado exitosamente!');
    } catch (err) {
      console.error(err);
      toast.dismiss(toastId);
      toast.error('Ocurrió un error al compilar el PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  // Print
  const handlePrint = () => {
    window.print();
  };

  // Copy verification link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopiedLink(true);
    toast.success('Enlace de verificación copiado al portapapeles');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
        
        {/* Printable Area Specific for Print Media */}
        <div id="printable-certificate" className="hidden print:block w-full h-full">
          <div className="relative w-full aspect-[3/2] overflow-hidden bg-white">
            <img 
              src="/assets/certificado-plantilla.png" 
              alt="Certificado Oficial" 
              className="w-full h-full object-cover"
            />
            {/* Name */}
            <div 
              style={{
                position: 'absolute',
                top: '51.56%',
                left: '17.06%',
                width: '65.82%',
                height: '6.64%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                color: '#002B79',
                fontWeight: 900,
                fontSize: '22pt',
                textTransform: 'uppercase',
                fontFamily: 'Arial, sans-serif'
              }}
            >
              {fullName}
            </div>
            {/* Document */}
            <div 
              style={{
                position: 'absolute',
                top: '62.89%',
                left: '35.22%',
                width: '29.69%',
                height: '4.98%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                color: '#002B79',
                fontWeight: 700,
                fontSize: '14pt',
                fontFamily: 'Arial, sans-serif'
              }}
            >
              {docInfo}
            </div>
            {/* Radicado */}
            <div 
              style={{
                position: 'absolute',
                top: '72.95%',
                left: '69.4%',
                width: '27.47%',
                height: '6.93%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                color: '#002B79',
                fontWeight: 900,
                fontSize: '13pt',
                fontFamily: 'monospace',
                letterSpacing: '1px'
              }}
            >
              {radicado}
            </div>
            {/* QR */}
            {qrDataUrl && (
              <div 
                style={{
                  position: 'absolute',
                  top: '64.26%',
                  left: '10.35%',
                  width: '8.07%',
                  height: '12.11%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#FFFFFF',
                  padding: '2px',
                  borderRadius: '4px'
                }}
              >
                <img src={qrDataUrl} alt="QR de Verificación" className="w-full h-full object-contain" />
              </div>
            )}
          </div>
        </div>

        {/* Interactive Modal Frame (Screen Only) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          className="bg-card text-foreground rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-foreground/15 my-4 sm:my-8 print:hidden flex flex-col max-h-[92vh]"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-foreground/10 bg-card/90">
            <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-wider">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Award className="w-4 h-4" />
              </div>
              <span>Certificado Digital Oficial • Juventudes Cali</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-foreground/10 transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Certificate Viewport */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 bg-muted/20 flex-1">
            
            {/* Main Certificate with Exact Overlay Positioning */}
            <div className="relative w-full aspect-[3/2] rounded-2xl overflow-hidden shadow-xl border border-foreground/15 select-none bg-white">
              {/* Official Template Image */}
              <img
                src="/assets/certificado-plantilla.png"
                alt="Plantilla de Certificado"
                className="w-full h-full object-contain pointer-events-none"
              />

              {/* OVERLAY 1: Nombre Completo (Pill Box 1) */}
              <div 
                className="absolute flex items-center justify-center text-center px-3"
                style={{
                  top: '51.56%',
                  left: '17.06%',
                  width: '65.82%',
                  height: '6.64%',
                }}
              >
                <span 
                  className="font-black uppercase tracking-tight text-[#002B79] leading-none truncate max-w-full drop-shadow-xs"
                  style={{
                    fontSize: 'clamp(10px, 2.2vw, 24px)',
                  }}
                  title={fullName}
                >
                  {fullName}
                </span>
              </div>

              {/* OVERLAY 2: Documento de Identidad (Pill Box 2) */}
              <div 
                className="absolute flex items-center justify-center text-center px-2"
                style={{
                  top: '62.89%',
                  left: '35.22%',
                  width: '29.69%',
                  height: '4.98%',
                }}
              >
                <span 
                  className="font-bold uppercase tracking-wider text-[#002B79] leading-none truncate max-w-full"
                  style={{
                    fontSize: 'clamp(8px, 1.35vw, 16px)',
                  }}
                >
                  {docInfo}
                </span>
              </div>

              {/* OVERLAY 3: Código de Radicado Único (Pill Box 3) */}
              <div 
                className="absolute flex items-center justify-center text-center px-2"
                style={{
                  top: '72.95%',
                  left: '69.4%',
                  width: '27.47%',
                  height: '6.93%',
                }}
              >
                <span 
                  className="font-mono font-black uppercase text-[#002B79] leading-none truncate max-w-full tracking-wider"
                  style={{
                    fontSize: 'clamp(7px, 1.25vw, 15px)',
                  }}
                >
                  {radicado}
                </span>
              </div>

              {/* OVERLAY 4: Código QR de Verificación (QR Box) */}
              <div 
                className="absolute flex items-center justify-center"
                style={{
                  top: '64.26%',
                  left: '10.35%',
                  width: '8.07%',
                  height: '12.11%',
                }}
              >
                {qrDataUrl ? (
                  <div className="w-full h-full p-0.5 bg-white rounded shadow-sm flex items-center justify-center">
                    <img
                      src={qrDataUrl}
                      alt="Código QR de Verificación"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full bg-slate-100 animate-pulse rounded" />
                )}
              </div>
            </div>

            {/* Validation Info Badge */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-card border border-foreground/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-bold text-foreground">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Constancia Oficial Verificada</span>
                  <span className="text-[10px] font-mono text-muted-foreground ml-1">({radicado})</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Expedido en {locationInfo} • Fecha: {emissionDate}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="rounded-xl text-[11px] h-8 font-bold border-foreground/15 gap-1.5"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
                  {copiedLink ? 'Copiado' : 'Compartir / Link'}
                </Button>
                <a
                  href={verificationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline px-2"
                >
                  Probar QR
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

          </div>

          {/* Action Buttons Bar */}
          <div className="p-4 sm:p-6 bg-card border-t border-foreground/10 flex flex-wrap sm:flex-nowrap gap-2.5 sm:gap-3">
            <Button
              onClick={handleDownloadPNG}
              disabled={isGenerating}
              className="flex-1 rounded-2xl h-12 font-black bg-primary text-white hover:bg-primary/90 shadow-md gap-2 min-w-[140px]"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Imagen (PNG)</span>
            </Button>

            <Button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              variant="outline"
              className="flex-1 rounded-2xl h-12 font-bold border-foreground/15 hover:bg-foreground/5 gap-2 min-w-[130px]"
            >
              <FileText className="w-4 h-4 text-primary" />
              <span>Descargar PDF</span>
            </Button>

            <Button
              onClick={handlePrint}
              variant="outline"
              className="rounded-2xl h-12 font-bold border-foreground/15 hover:bg-foreground/5 gap-2 px-4 shrink-0"
              title="Imprimir constancia"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir</span>
            </Button>

            <Button
              onClick={onClose}
              variant="ghost"
              className="rounded-2xl h-12 font-bold px-5 text-muted-foreground hover:text-foreground shrink-0"
            >
              Cerrar
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
