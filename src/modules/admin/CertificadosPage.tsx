import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, 
  Send, 
  RefreshCw, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Search, 
  Mail, 
  User, 
  ChevronRight,
  StopCircle,
  Sparkles,
  Info,
  Check,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface PendingRecord {
  id: string;
  first_name: string;
  last_name: string;
  document_type: string;
  document_number: string;
  email: string;
  commune: string;
  neighborhood: string;
  certificate_code?: string;
  certificate_sent?: boolean;
  certificate_sent_at?: string;
  certificate_status?: string;
  created_at: string;
}

export default function CertificadosPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todaySent, setTodaySent] = useState(0);
  const [totalSent, setTotalSent] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const dailyLimit = 95; // Margen de seguridad sobre el plan gratuito de 100

  // Búsqueda puntual
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PendingRecord[]>([]);
  const [searching, setSearching] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);

  // Cola de pendientes para visualización
  const [pendingList, setPendingList] = useState<PendingRecord[]>([]);

  // Estado del despacho en lote
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchProgress, setDispatchProgress] = useState({ current: 0, total: 0, currentName: '', success: 0, failed: 0 });
  const [shouldStopDispatch, setShouldStopDispatch] = useState(false);

  // Cupos disponibles hoy
  const remainingToday = Math.max(0, dailyLimit - todaySent);
  const maxToDispatchNow = Math.min(pendingCount, remainingToday);

  // Cargar estadísticas
  const fetchStatsAndQueue = useCallback(async () => {
    try {
      // 1. Obtener conteo de hoy
      const todayIso = new Date();
      todayIso.setHours(0, 0, 0, 0);

      const { count: todayCount, error: todayErr } = await supabase
        .from('characterization_records')
        .select('*', { count: 'exact', head: true })
        .eq('certificate_sent', true)
        .gte('certificate_sent_at', todayIso.toISOString());

      if (!todayErr) setTodaySent(todayCount || 0);

      // 2. Conteo total histórico de certificados enviados
      const { count: totalCount, error: totalErr } = await supabase
        .from('characterization_records')
        .select('*', { count: 'exact', head: true })
        .eq('certificate_sent', true);

      if (!totalErr) setTotalSent(totalCount || 0);

      // 3. Conteo de registros que aún NO tienen certificado enviado
      const { count: pendCount, error: pendErr } = await supabase
        .from('characterization_records')
        .select('*', { count: 'exact', head: true })
        .or('certificate_sent.is.null,certificate_sent.eq.false');

      if (!pendErr) setPendingCount(pendCount || 0);

      // 4. Traer los primeros pendientes de la cola (ordenados por fecha más antigua)
      const { data: queueData } = await supabase
        .from('characterization_records')
        .select('id, first_name, last_name, document_type, document_number, email, commune, neighborhood, certificate_code, certificate_sent, certificate_sent_at, certificate_status, created_at')
        .or('certificate_sent.is.null,certificate_sent.eq.false')
        .order('created_at', { ascending: true })
        .limit(10);

      setPendingList(queueData || []);
    } catch (err) {
      console.error('Error al cargar datos de certificados:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStatsAndQueue();
  }, [fetchStatsAndQueue]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStatsAndQueue();
    toast.success('Datos de certificados actualizados');
  };

  // Buscar participantes puntuales
  useEffect(() => {
    const timer = setTimeout(async () => {
      const q = searchQuery.trim();
      if (!q) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      try {
        const { data, error } = await supabase
          .from('characterization_records')
          .select('id, first_name, last_name, document_type, document_number, email, commune, neighborhood, certificate_code, certificate_sent, certificate_sent_at, certificate_status, created_at')
          .or(`document_number.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`)
          .limit(8);

        if (!error && data) {
          setSearchResults(data);
        }
      } catch (err) {
        console.error('Error en búsqueda:', err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Función individual para enviar o reenviar certificado
  const sendCertificateForRecord = async (record: PendingRecord): Promise<boolean> => {
    try {
      const fullName = `${record.first_name || ''} ${record.last_name || ''}`.trim();
      const res = await fetch('/api/send-certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          documentType: record.document_type,
          documentNumber: record.document_number,
          email: record.email,
          commune: record.commune,
          neighborhood: record.neighborhood,
          code: record.certificate_code,
        }),
      });

      const resData = await res.json().catch(() => ({}));
      if (res.ok && resData.success !== false) {
        const finalCode = resData.code || record.certificate_code;
        await supabase.rpc('mark_certificate_sent', {
          doc_type: record.document_type,
          doc_number: record.document_number,
          cert_code: finalCode,
        });
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error al enviar:', e);
      return false;
    }
  };

  // Reenvío manual puntual desde la búsqueda
  const handleSingleResend = async (record: PendingRecord) => {
    // Si hoy ya no hay cupos, alertar al admin
    if (todaySent >= dailyLimit) {
      toast.warning('Atención: El cupo diario seguro de 95 correos ya fue alcanzado hoy. Se recomienda esperar a mañana.');
    }

    setResendingId(record.id);
    const toastId = toast.loading(`Enviando certificado a ${record.email}...`);
    const success = await sendCertificateForRecord(record);

    setResendingId(null);
    if (success) {
      toast.dismiss(toastId);
      toast.success(`Certificado despachado exitosamente a ${record.email}`);
      fetchStatsAndQueue();
      // Actualizar el estado visual en los resultados de búsqueda
      setSearchResults(prev => prev.map(r => r.id === record.id ? { ...r, certificate_sent: true, certificate_status: 'sent' } : r));
    } else {
      toast.dismiss(toastId);
      toast.error(`No se pudo enviar el correo a ${record.email}. Verifica tu conexión o cupo en Resend.`);
    }
  };

  // Despacho inteligente en lote (Blindado con Math.min(pendingCount, remainingToday))
  const startBatchDispatch = async () => {
    if (maxToDispatchNow <= 0) {
      if (remainingToday <= 0) {
        toast.error('Cupo diario de 95 correos agotado por hoy. Podrás despachar más mañana cuando Resend reinicie el contador.');
      } else {
        toast.info('No hay certificados pendientes en la cola.');
      }
      return;
    }

    setIsDispatching(true);
    setShouldStopDispatch(false);
    setDispatchProgress({ current: 0, total: maxToDispatchNow, currentName: '', success: 0, failed: 0 });

    try {
      // 1. Obtener exactamente los N más antiguos (donde N = maxToDispatchNow)
      const { data: recordsToDispatch, error } = await supabase
        .from('characterization_records')
        .select('id, first_name, last_name, document_type, document_number, email, commune, neighborhood, certificate_code, certificate_sent, certificate_sent_at, certificate_status, created_at')
        .or('certificate_sent.is.null,certificate_sent.eq.false')
        .order('created_at', { ascending: true })
        .limit(maxToDispatchNow);

      if (error || !recordsToDispatch || recordsToDispatch.length === 0) {
        toast.error('No se pudieron obtener los registros pendientes');
        setIsDispatching(false);
        return;
      }

      let successCount = 0;
      let failedCount = 0;

      for (let i = 0; i < recordsToDispatch.length; i++) {
        // Verificar si el usuario detuvo el proceso
        if (shouldStopDispatch) {
          toast.info('Despacho en lote detenido por el usuario.');
          break;
        }

        const rec = recordsToDispatch[i];
        const fullName = `${rec.first_name || ''} ${rec.last_name || ''}`.trim();
        
        setDispatchProgress({
          current: i + 1,
          total: recordsToDispatch.length,
          currentName: `${fullName} (${rec.email})`,
          success: successCount,
          failed: failedCount
        });

        const ok = await sendCertificateForRecord(rec);
        if (ok) {
          successCount++;
        } else {
          failedCount++;
        }

        // Pequeño retardo de 350ms para evitar rate-limit o saturar el worker
        await new Promise(res => setTimeout(res, 350));
      }

      toast.success(`Despacho finalizado: ${successCount} enviados exitosamente, ${failedCount} con error.`);
    } catch (err: any) {
      toast.error('Error durante el despacho: ' + err.message);
    } finally {
      setIsDispatching(false);
      fetchStatsAndQueue();
    }
  };

  const usagePercent = Math.min(100, Math.round((todaySent / dailyLimit) * 100));

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-foreground/10 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-2xl">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Gestión de Certificados</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Control de cupo diario, despacho inteligente en lote y reenvío selectivo.
              </p>
            </div>
          </div>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={refreshing || isDispatching}
          className="rounded-xl border-foreground/10 gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Actualizar métricas
        </Button>
      </div>

      {/* Grid de Métricas Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Cupo Seguro Hoy */}
        <div className="glass p-5 rounded-3xl border-foreground/10 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cupo Hoy (Resend)</span>
            <div className={`p-1.5 rounded-lg ${todaySent >= 90 ? 'bg-rose-500/10 text-rose-500' : todaySent >= 65 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black">{todaySent}</span>
            <span className="text-sm font-semibold text-muted-foreground">/ {dailyLimit} seguros</span>
          </div>
          <div className="w-full bg-foreground/10 h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${todaySent >= 90 ? 'bg-rose-500' : todaySent >= 65 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            {todaySent >= dailyLimit 
              ? 'Límite diario alcanzado. Pausado por seguridad.' 
              : `${dailyLimit - todaySent} envíos restantes antes del tope de seguridad.`}
          </p>
        </div>

        {/* 2. Cupos Libres Restantes */}
        <div className="glass p-5 rounded-3xl border-foreground/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cupos Libres Hoy</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
              <Mail className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-blue-500">{remainingToday}</div>
          <p className="text-[11px] text-muted-foreground">
            {remainingToday > 0 
              ? 'Disponibles para despachar en este momento sin riesgo de costo.' 
              : 'Se reactivan a medianoche automáticamente.'}
          </p>
        </div>

        {/* 3. En Cola Pendientes */}
        <div className="glass p-5 rounded-3xl border-foreground/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">En Cola Pendientes</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-500">{pendingCount}</div>
          <p className="text-[11px] text-muted-foreground">
            {pendingCount === 0 
              ? 'Todos los jóvenes activos tienen certificado emitido.' 
              : `${pendingCount} personas esperando despacho de su constancia.`}
          </p>
        </div>

        {/* 4. Total Histórico Enviados */}
        <div className="glass p-5 rounded-3xl border-foreground/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Enviados</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-500">{totalSent}</div>
          <p className="text-[11px] text-muted-foreground">
            Total histórico de certificados entregados vía correo.
          </p>
        </div>
      </div>

      {/* SECCIÓN PRINCIPAL: BOTÓN INTELIGENTE DE DESPACHO EN LOTE */}
      <div className="glass p-6 sm:p-8 rounded-3xl border-primary/20 shadow-xl space-y-6 relative overflow-hidden bg-gradient-to-br from-card/80 via-card/50 to-primary/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              Despacho Automatizado Seguro
            </div>
            <h2 className="text-xl sm:text-2xl font-black">Despachar Pendientes de la Cola</h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              El sistema analiza cuántos cupos seguros quedan hoy ({remainingToday}) y cuántos jóvenes están en espera ({pendingCount}). 
              <strong> Nunca sobrepasará los 95 envíos diarios</strong> para proteger tu plan gratuito de Resend. Si hay más pendientes que cupos, tomará únicamente los más antiguos y dejará el resto protegido para mañana.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {isDispatching ? (
              <Button 
                variant="destructive"
                onClick={() => setShouldStopDispatch(true)}
                className="rounded-2xl gap-2 font-bold px-6 py-6"
              >
                <StopCircle className="w-5 h-5" />
                Detener Despacho
              </Button>
            ) : (
              <Button
                onClick={startBatchDispatch}
                disabled={maxToDispatchNow <= 0 || isDispatching}
                className="rounded-2xl gap-3 font-black px-6 py-6 text-sm sm:text-base shadow-lg shadow-primary/25 bg-primary hover:bg-primary/90 text-white transition-all duration-300 hover:scale-[1.02]"
              >
                <Send className="w-5 h-5" />
                {remainingToday <= 0 
                  ? 'Cupo de Hoy Completado (95/95)' 
                  : pendingCount === 0 
                    ? 'Todo al Día (0 Pendientes)' 
                    : `Despachar ${maxToDispatchNow} Pendientes Hoy`}
              </Button>
            )}
          </div>
        </div>

        {/* Barra de Progreso en Vivo cuando está despachando */}
        {isDispatching && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 sm:p-5 rounded-2xl bg-primary/10 border border-primary/20 space-y-3"
          >
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                <span>Despachando {dispatchProgress.current} de {dispatchProgress.total}</span>
              </div>
              <span className="text-primary font-black">
                {Math.round((dispatchProgress.current / dispatchProgress.total) * 100)}%
              </span>
            </div>

            <div className="w-full bg-background/50 h-3 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${(dispatchProgress.current / dispatchProgress.total) * 100}%` }}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-muted-foreground gap-1">
              <span className="truncate max-w-md">Enviando a: <strong>{dispatchProgress.currentName}</strong></span>
              <span>Exitosos: <strong className="text-emerald-500">{dispatchProgress.success}</strong> | Errores: <strong className="text-rose-500">{dispatchProgress.failed}</strong></span>
            </div>
          </motion.div>
        )}

        {/* Resumen del Límite Seguro */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-foreground/5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Capacidad máxima hoy: <strong>{maxToDispatchNow} correos</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Quedarán para mañana: <strong>{Math.max(0, pendingCount - maxToDispatchNow)} correos</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <span>Tope de seguridad Resend: <strong>95/día</strong></span>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: BUSCADOR Y REENVÍO PUNTUAL */}
      <div className="glass p-6 sm:p-8 rounded-3xl border-foreground/10 space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            Búsqueda Rápida y Reenvío Puntual
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Si un participante te pide que le reenvíes su certificado o quieres verificar su estado individual, búscalo por cédula, nombre o correo.
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Escribe el número de cédula, nombre o correo del participante..."
            className="pl-11 h-12 rounded-2xl bg-card/60 border-foreground/15 text-sm"
          />
          {searching && (
            <RefreshCw className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Resultados de Búsqueda */}
        {searchResults.length > 0 ? (
          <div className="space-y-3 pt-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Resultados encontrados ({searchResults.length})
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {searchResults.map((rec) => (
                <div 
                  key={rec.id} 
                  className="p-4 rounded-2xl bg-card/40 border border-foreground/10 flex items-center justify-between gap-4 hover:border-primary/30 transition-all"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm truncate">{rec.first_name} {rec.last_name}</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${rec.certificate_sent ? 'bg-emerald-500/15 text-emerald-500' : 'bg-amber-500/15 text-amber-500'}`}>
                        {rec.certificate_sent ? 'Enviado' : 'Pendiente'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {rec.document_type} {rec.document_number} · {rec.email}
                    </p>
                    {rec.certificate_code && (
                      <p className="text-[10px] font-mono text-primary truncate">
                        Radicado: {rec.certificate_code}
                      </p>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant={rec.certificate_sent ? 'outline' : 'default'}
                    onClick={() => handleSingleResend(rec)}
                    disabled={resendingId === rec.id}
                    className="shrink-0 rounded-xl text-xs gap-1.5 font-bold"
                  >
                    {resendingId === rec.id ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Mail className="w-3.5 h-3.5" />
                        {rec.certificate_sent ? 'Reenviar' : 'Enviar Ahora'}
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : searchQuery.trim() && !searching ? (
          <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-foreground/10 rounded-2xl">
            No se encontró ningún participante con esa búsqueda.
          </div>
        ) : null}
      </div>

      {/* SECCIÓN 3: PRÓXIMOS EN LA COLA DE ESPERA (VISTA RÁPIDA) */}
      <div className="glass p-6 sm:p-8 rounded-3xl border-foreground/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Próximos en Espera ({pendingCount} en cola)
            </h2>
            <p className="text-xs text-muted-foreground">
              Jóvenes ordenados por turno de llegada que recibirán su constancia en el próximo despacho.
            </p>
          </div>
        </div>

        {pendingList.length > 0 ? (
          <div className="divide-y divide-foreground/5 rounded-2xl border border-foreground/10 overflow-hidden bg-card/30">
            {pendingList.map((rec, index) => (
              <div 
                key={rec.id} 
                className="p-3.5 sm:p-4 flex items-center justify-between gap-4 text-xs hover:bg-foreground/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-500 font-black flex items-center justify-center text-[10px] shrink-0">
                    #{index + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-foreground truncate">
                      {rec.first_name} {rec.last_name}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {rec.document_type} {rec.document_number} · {rec.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] text-muted-foreground hidden sm:inline">
                    {new Date(rec.created_at).toLocaleDateString()}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSingleResend(rec)}
                    disabled={resendingId === rec.id}
                    className="rounded-xl text-[11px] font-bold h-8 text-primary hover:bg-primary/10 gap-1.5"
                  >
                    <Send className="w-3 h-3" />
                    Enviar ya
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-foreground/10 rounded-2xl">
            ✨ No hay nadie en cola pendiente. ¡Todos los certificados están enviados y al día!
          </div>
        )}
      </div>
    </div>
  );
}
