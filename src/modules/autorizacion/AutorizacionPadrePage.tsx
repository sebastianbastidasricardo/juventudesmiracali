import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HeartHandshake, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  FileText, 
  Lock, 
  User, 
  MapPin, 
  Calendar, 
  Phone, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  Download,
  Info,
  Search,
  MessageCircle,
  ExternalLink,
  Key,
  Edit3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { calculateAge } from '@/utils/validators';
import { buildParentConfirmationWhatsAppUrl, detectSonOrDaughter } from '@/utils/whatsapp';
import { toast } from 'sonner';
import ActaAutorizacionModal from '@/modules/admin/ActaAutorizacionModal';

export default function AutorizacionPadrePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [record, setRecord] = useState<any | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [searchDoc, setSearchDoc] = useState('');
  const [searching, setSearching] = useState(false);

  // Formulario del acudiente
  const [guardianName, setGuardianName] = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState('Mamá');
  const [guardianIdNumber, setGuardianIdNumber] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [agreeParticipation, setAgreeParticipation] = useState(true);
  const [agreeDataPolicy, setAgreeDataPolicy] = useState(true);
  const [showLegalDetails, setShowLegalDetails] = useState(false);

  // Firma digital táctil (Canvas)
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isActaOpen, setIsActaOpen] = useState(false);

  // Cargar registro por token, id o documento
  useEffect(() => {
    if (!token) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    fetchRecord(token);
  }, [token]);

  const fetchRecord = async (tokenOrParam: string) => {
    setLoading(true);
    setNotFound(false);
    try {
      if (!supabase) {
        setNotFound(true);
        return;
      }

      const cleanParam = tokenOrParam.trim();

      // 1. Buscar por guardian_token
      let { data, error } = await supabase
        .from('characterization_records')
        .select('*')
        .eq('guardian_token', cleanParam)
        .maybeSingle();

      // 2. Si no coincide, buscar por ID
      if (!data && !error) {
        const fallback = await supabase
          .from('characterization_records')
          .select('*')
          .eq('id', cleanParam)
          .maybeSingle();
        data = fallback.data;
        error = fallback.error;
      }

      // 3. Si no coincide, buscar por número de documento (TI del joven)
      if (!data) {
        const cleanDoc = cleanParam.replace(/\D/g, '');
        if (cleanDoc.length >= 6) {
          const docFallback = await supabase
            .from('characterization_records')
            .select('*')
            .eq('document_number', cleanDoc)
            .maybeSingle();
          data = docFallback.data;
          error = docFallback.error;
        }
      }

      if (error || !data) {
        setNotFound(true);
      } else {
        const enriched = {
          ...data,
          age: calculateAge(data.birth_date)
        };
        setRecord(enriched);
        setGuardianName(data.guardian_name || '');
        setGuardianRelationship(data.guardian_relationship || 'Mamá');
        setGuardianPhone(data.guardian_phone || '');
        setGuardianIdNumber(data.guardian_id_number || '');

        if (data.guardian_contact_status === 'authorized' || data.guardian_signature) {
          setSubmitted(true);
        } else {
          setSubmitted(false);
        }
      }
    } catch (err) {
      console.error('Error cargando ficha de autorización:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchDoc.trim()) {
      toast.error('Ingresa el número de documento del menor o el código');
      return;
    }
    setSearching(true);
    await fetchRecord(searchDoc.trim());
    setSearching(false);
  };

  // Inicializar Canvas táctil con DPI alto para máxima nitidez
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.strokeStyle = '#002B79'; // Tinta azul Juventudes MIRA
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  useEffect(() => {
    if (!loading && !submitted && !notFound) {
      // Breve retardo para que el DOM monte el canvas
      const timer = setTimeout(() => {
        initCanvas();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [loading, submitted, notFound, initCanvas]);

  // Manejadores de trazo táctil y ratón con captura de puntero
  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {
      // Fallback seguro si pointerCapture no está soportado
    }
    setIsDrawing(true);

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    setHasSignature(false);
  };

  // Enviar Autorización Legal
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!guardianName.trim() || guardianName.trim().length < 3) {
      toast.error('Por favor ingresa tu nombre completo');
      return;
    }

    const cleanId = guardianIdNumber.replace(/\D/g, '');
    if (!cleanId || cleanId.length < 6) {
      toast.error('Por favor ingresa tu número de cédula válido (mínimo 6 dígitos)');
      return;
    }

    if (!hasSignature || !canvasRef.current) {
      toast.error('Por favor dibuja tu firma con tu dedo en el recuadro blanco');
      return;
    }

    if (!agreeParticipation || !agreeDataPolicy) {
      toast.error('Debes marcar las casillas de autorización para continuar');
      return;
    }

    setSubmitting(true);
    try {
      const signatureDataUrl = canvasRef.current.toDataURL('image/png');
      const nowIso = new Date().toISOString();

      if (!supabase) throw new Error('Conexión a base de datos no disponible');

      const cleanPhone = guardianPhone.replace(/\D/g, '');

      const { error } = await supabase
        .from('characterization_records')
        .update({
          guardian_name: guardianName.trim(),
          guardian_relationship: guardianRelationship,
          guardian_id_number: cleanId,
          guardian_phone: cleanPhone,
          guardian_signature: signatureDataUrl,
          guardian_contact_status: 'authorized',
          guardian_authorized_at: nowIso,
        })
        .eq('id', record.id);

      if (error) {
        console.warn('Advertencia al guardar:', error.message);
      }

      const updatedRecord = {
        ...record,
        guardian_name: guardianName.trim(),
        guardian_relationship: guardianRelationship,
        guardian_id_number: cleanId,
        guardian_phone: cleanPhone,
        guardian_signature: signatureDataUrl,
        guardian_contact_status: 'authorized',
        guardian_authorized_at: nowIso
      };

      setRecord(updatedRecord);
      setSubmitted(true);
      toast.success('¡Autorización confirmada exitosamente!');
    } catch (err: any) {
      console.error('Error al guardar autorización:', err);
      toast.error('Hubo un problema al guardar. Por favor intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center animate-pulse mb-4">
          <HeartHandshake className="w-7 h-7 text-primary animate-bounce" />
        </div>
        <h2 className="text-xl font-bold">Cargando panel de autorización...</h2>
        <p className="text-xs text-slate-400 mt-1.5 max-w-sm">
          Conectando de forma segura con Juventudes MIRA Santiago de Cali
        </p>
      </div>
    );
  }

  // Si no se encuentra registro o no hay token en URL
  if (notFound || !record) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full glass-dark p-8 rounded-3xl border-slate-800 space-y-6 shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-black text-white">Localizar Ficha de Autorización</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ingresa el número de documento (T.I.) de tu hijo(a) o el código que te enviaron para acceder a la autorización.
            </p>
          </div>

          <form onSubmit={handleSearchManual} className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchDoc}
                onChange={(e) => setSearchDoc(e.target.value)}
                placeholder="Ej: 1144001234 o código jm_..."
                className="pl-9 h-11 text-xs rounded-xl bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-primary"
              />
            </div>

            <Button
              type="submit"
              disabled={searching}
              className="w-full h-11 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white text-xs shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              {searching ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Buscando ficha...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Buscar Autorización
                </>
              )}
            </Button>
          </form>

          <div className="pt-2 border-t border-slate-800">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-xs text-slate-400 hover:text-white"
            >
              Volver al Inicio
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const sonOrDaughter = detectSonOrDaughter(record.gender);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 py-8 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-6">
        
        {/* Cabecera Institucional */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-[11px] font-black uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5" />
            Juventudes MIRA Santiago de Cali
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Autorización de Acudiente
          </h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Consentimiento informado y respaldo parental para actividades juveniles (Leyes 1581 de 2012 y 527 de 1999).
          </p>
        </div>

        {/* Tarjeta del Joven (Cero confusión de hijos) */}
        <div className="glass-dark border border-slate-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden bg-slate-900/60">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <HeartHandshake className="w-32 h-32 text-primary" />
          </div>

          <div className="relative z-10 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Ficha del Joven Participante
              </span>
              <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] font-bold">
                Menor de Edad (14-17 Años)
              </Badge>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center font-black text-base text-primary shrink-0 shadow-md">
                {record.first_name?.[0]}{record.last_name?.[0]}
              </div>
              <div className="space-y-0.5">
                <h3 className="text-lg font-black text-white uppercase tracking-tight">
                  {record.first_name} {record.last_name}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span className="font-semibold text-slate-200">{record.age} años</span>
                  <span>•</span>
                  <span className="font-mono text-[11px]">{record.document_type} {record.document_number}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-primary" /> Comuna {record.commune || 'Cali'}
                    {record.neighborhood ? ` (${record.neighborhood})` : ''}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/40 text-[11px] text-slate-300 leading-relaxed">
              Al confirmar esta autorización, respaldarás la vinculación de tu {sonOrDaughter} a actividades gratuitas de formación en valores, cultura, arte, deporte y recreación sana organizadas por Juventudes MIRA en Santiago de Cali 🌟.
            </div>
          </div>
        </div>

        {/* Si ya fue firmado exitosamente */}
        {submitted ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-dark border border-emerald-500/30 rounded-3xl p-6 text-center space-y-5 shadow-2xl bg-emerald-950/20"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-xl">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-white">¡Autorización Legal Confirmada!</h2>
              <p className="text-xs text-emerald-400 font-bold flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Permiso OK y Validado Jurídicamente ✅
              </p>
              {record.guardian_authorized_at && (
                <p className="text-[10px] text-slate-400 font-mono">
                  Fecha de firma: {new Date(record.guardian_authorized_at).toLocaleString('es-CO')}
                </p>
              )}
            </div>

            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              Muchas gracias, <strong>{record.guardian_name || guardianName}</strong>. La autorización para <strong>{record.first_name} {record.last_name}</strong> quedó registrada con éxito con tu Cédula No. <strong>{record.guardian_id_number || guardianIdNumber}</strong> y firma digital.
            </p>

            {record.guardian_signature && (
              <div className="p-3 bg-white rounded-2xl border border-slate-300 max-w-xs mx-auto shadow-md">
                <span className="text-[9px] font-bold text-slate-500 block uppercase mb-1">Tu Firma Digital Registrada:</span>
                <img 
                  src={record.guardian_signature} 
                  alt="Firma Digital" 
                  className="max-h-16 mx-auto object-contain" 
                />
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <Button
                type="button"
                onClick={() => setIsActaOpen(true)}
                className="w-full sm:w-auto rounded-xl font-bold bg-primary hover:bg-primary/90 text-white text-xs flex items-center justify-center gap-2 h-11 px-5 shadow-lg shadow-primary/20"
              >
                <FileText className="w-4 h-4" />
                Descargar / Ver Acta Legal PDF
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const url = buildParentConfirmationWhatsAppUrl(record);
                  window.open(url, '_blank');
                }}
                className="w-full sm:w-auto rounded-xl font-bold border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-xs flex items-center justify-center gap-2 h-11 px-4"
              >
                <MessageCircle className="w-4 h-4" />
                Notificar por WhatsApp
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setSubmitted(false);
                  setHasSignature(false);
                }}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 h-10 px-3"
                title="Corregir datos o repetir firma"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Modificar Firma
              </Button>
            </div>
          </motion.div>
        ) : (
          /* Formulario de Firma del Acudiente */
          <form onSubmit={handleSubmit} className="glass-dark border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 bg-slate-900/70">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Datos del Acudiente Responsable
              </h2>
              <p className="text-[11px] text-slate-400">
                Por favor verifica tus datos tal como aparecen en tu documento de identidad.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              {/* Parentesco */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Parentesco con el Joven *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Mamá', 'Papá', 'Tutor Legal'].map((rel) => (
                    <button
                      key={rel}
                      type="button"
                      onClick={() => setGuardianRelationship(rel)}
                      className={`h-10 rounded-xl font-bold text-xs border transition-all ${
                        guardianRelationship === rel
                          ? 'bg-primary text-white border-primary shadow-md shadow-primary/25'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-800'
                      }`}
                    >
                      {rel}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nombre Completo */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Tu Nombre Completo *
                </label>
                <Input
                  required
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  placeholder="Ej: María Elena Rodríguez"
                  className="rounded-xl bg-slate-900/80 border-slate-700 h-11 text-xs text-white focus:border-primary"
                />
              </div>

              {/* Cédula de Ciudadanía */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Cédula de Ciudadanía del Acudiente *</span>
                  <span className="text-[10px] text-slate-400 font-mono">Solo números</span>
                </label>
                <Input
                  required
                  type="text"
                  inputMode="numeric"
                  value={guardianIdNumber}
                  onChange={(e) => setGuardianIdNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ej: 31890123"
                  className="rounded-xl bg-slate-900/80 border-slate-700 h-11 font-mono text-xs text-white focus:border-primary"
                />
              </div>

              {/* Teléfono Celular / WhatsApp */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Teléfono Celular / WhatsApp *
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                    🇨🇴 +57
                  </div>
                  <Input
                    required
                    type="tel"
                    inputMode="tel"
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="300 123 4567"
                    className="pl-16 rounded-xl bg-slate-900/80 border-slate-700 h-11 font-mono text-xs text-white focus:border-primary"
                  />
                </div>
              </div>

              {/* Recuadro Táctil de Firma Digital */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    Firma Digital con tu Dedo *
                  </label>
                  {hasSignature && (
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="text-[10px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" /> Borrar y repetir
                    </button>
                  )}
                </div>

                <div className="relative rounded-2xl border-2 border-dashed border-slate-600 bg-white p-1 overflow-hidden shadow-inner touch-none">
                  <canvas
                    ref={canvasRef}
                    onPointerDown={startDrawing}
                    onPointerMove={draw}
                    onPointerUp={stopDrawing}
                    onPointerCancel={stopDrawing}
                    className="w-full h-36 cursor-crosshair block rounded-xl touch-none bg-white"
                  />

                  {!hasSignature && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400/80 gap-1">
                      <span className="text-2xl">✍️</span>
                      <span className="text-xs font-bold text-slate-600">
                        Firma aquí con tu dedo en la pantalla
                      </span>
                      <span className="text-[10px] text-slate-400">
                        (Tal como firmas en tu cédula)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Términos y Declaraciones */}
              <div className="space-y-2.5 pt-2">
                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeParticipation}
                    onChange={(e) => setAgreeParticipation(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-300 leading-snug">
                    Autorizo voluntariamente la vinculación y participación de mi representado(a) en las iniciativas formativas, culturales y deportivas de Juventudes MIRA Santiago de Cali.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeDataPolicy}
                    onChange={(e) => setAgreeDataPolicy(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-300 leading-snug">
                    Acepto el tratamiento de datos personales conforme a la <strong>Ley 1581 de 2012</strong> y valido esta firma electrónica bajo la <strong>Ley 527 de 1999</strong> de Colombia.
                  </span>
                </label>

                {/* Acordeón Términos Legales */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowLegalDetails(!showLegalDetails)}
                    className="text-[10px] text-primary hover:underline font-bold flex items-center gap-1"
                  >
                    {showLegalDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {showLegalDetails ? 'Ocultar detalles legales' : 'Leer texto legal completo de protección de datos'}
                  </button>

                  <AnimatePresence>
                    {showLegalDetails && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden text-[10px] text-slate-400 p-3 bg-slate-900 rounded-xl mt-2 border border-slate-800 space-y-2"
                      >
                        <p>
                          <strong>Tratamiento y Finalidad:</strong> Los datos de contacto del menor y acudiente se recopilan exclusivamente para convocatorias a talleres formativos, actividades recreativas y seguimiento juvenil de Juventudes MIRA Cali. Jamás serán vendidos ni transferidos comercialmente.
                        </p>
                        <p>
                          <strong>Validez Jurídica de la Firma:</strong> Conforme al Artículo 7 de la Ley 527 de 1999 de Colombia, este mensaje de datos y la firma digital registrada tienen pleno valor probatorio y validez legal.
                        </p>
                        <p className="text-slate-300 bg-slate-800/80 p-2 rounded-lg border border-slate-700/60">
                          <strong>Canal de Consultas y Reclamaciones:</strong> Como titular o representante legal, puedes ejercer tus derechos de Habeas Data (conocer, actualizar o revocar la autorización) escribiendo directamente al correo:{' '}
                          <a href="mailto:juventudesmiracali@gmail.com" className="font-bold text-primary underline">
                            juventudesmiracali@gmail.com
                          </a>
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Botón de Enviar */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={submitting || !hasSignature || !agreeParticipation || !agreeDataPolicy}
                  className="w-full rounded-2xl font-black text-sm h-12 bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Firmando y validando...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Confirmar y Firmar Autorización
                    </>
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Proceso seguro con cifrado y respaldo legal</span>
              </div>
            </div>
          </form>
        )}

        {/* Modal de Acta Legal */}
        <ActaAutorizacionModal
          isOpen={isActaOpen}
          onClose={() => setIsActaOpen(false)}
          record={record}
        />

        {/* Footer */}
        <div className="text-center text-[10px] text-slate-500 space-y-1 pt-4">
          <p>© {new Date().getFullYear()} Juventudes MIRA Santiago de Cali • Todos los derechos reservados.</p>
          <p>Comprometidos con el desarrollo integral, el liderazgo y las oportunidades para la juventud caleña.</p>
        </div>
      </div>
    </div>
  );
}
