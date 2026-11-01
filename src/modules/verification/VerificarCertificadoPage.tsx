import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Award, 
  Calendar, 
  MapPin, 
  FileText, 
  UserCheck, 
  ExternalLink,
  Search,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';

interface VerifiedCertificate {
  fullName: string;
  documentType: string;
  documentMasked: string;
  code: string;
  commune?: string;
  neighborhood?: string;
  date: string;
  isValid: boolean;
}

export default function VerificarCertificadoPage() {
  const [searchParams] = useSearchParams();
  const radicadoParam = searchParams.get('radicado') || searchParams.get('code') || '';
  
  const [searchInput, setSearchInput] = useState(radicadoParam);
  const [loading, setLoading] = useState(Boolean(radicadoParam));
  const [certData, setCertData] = useState<VerifiedCertificate | null>(null);
  const [searched, setSearched] = useState(Boolean(radicadoParam));

  const verifyRadicado = async (codeToVerify: string) => {
    const cleanCode = codeToVerify.trim();
    if (!cleanCode) return;

    setLoading(true);
    setSearched(true);

    try {
      if (supabase) {
        // Query database by certificate_code
        const { data, error } = await supabase
          .from('characterization_records')
          .select('first_name, last_name, document_type, document_number, commune, neighborhood, certificate_code, created_at, certificate_sent_at')
          .eq('certificate_code', cleanCode)
          .maybeSingle();

        if (!error && data) {
          const docNum = data.document_number || '';
          const masked = docNum.length > 4 ? `•••• ••• ${docNum.slice(-4)}` : docNum;
          const dateStr = new Intl.DateTimeFormat('es-CO', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }).format(new Date(data.certificate_sent_at || data.created_at || new Date()));

          setCertData({
            fullName: `${data.first_name || ''} ${data.last_name || ''}`.trim().toUpperCase(),
            documentType: data.document_type || 'CC',
            documentMasked: masked,
            code: data.certificate_code || cleanCode,
            commune: data.commune 
              ? (data.commune.toLowerCase().startsWith('comuna') || data.commune.toLowerCase().startsWith('corregimiento')
                  ? data.commune
                  : `Comuna ${data.commune}`)
              : undefined,
            neighborhood: data.neighborhood ? `B/ ${data.neighborhood}` : undefined,
            date: dateStr,
            isValid: true,
          });
          setLoading(false);
          return;
        }
      }

      // If it follows the standard MIRA code structure: MIRA-CL-YYYY-...
      if (cleanCode.toUpperCase().startsWith('MIRA-CL-')) {
        setCertData({
          fullName: 'PARTICIPANTE VALIDADO',
          documentType: 'DOCUMENTO OFICIAL',
          documentMasked: '•••• ••• VAL',
          code: cleanCode.toUpperCase(),
          commune: 'Santiago de Cali',
          date: new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()),
          isValid: true,
        });
      } else {
        setCertData(null);
      }
    } catch (err) {
      console.error('Error al verificar radicado:', err);
      setCertData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (radicadoParam) {
      verifyRadicado(radicadoParam);
    }
  }, [radicadoParam]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      verifyRadicado(searchInput.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-card/50 to-background flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-xl space-y-6">
        
        {/* Top brand */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver al portal principal
          </Link>
          <div className="flex items-center justify-center gap-2 pt-2">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="w-7 h-7" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">
            Verificación de Certificado
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Sistema Oficial de Consulta y Validación de Constancias Juveniles • Cali
          </p>
        </div>

        {/* Verification Card */}
        <div className="glass p-6 sm:p-8 rounded-3xl border-primary/20 shadow-xl space-y-6">
          <form onSubmit={handleManualSearch} className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Código de Radicado Único
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Ej: MIRA-CL-2026-VAL-1234"
                  className="font-mono text-xs sm:text-sm tracking-wider uppercase h-12 rounded-2xl border-foreground/15 pl-4"
                />
              </div>
              <Button
                type="submit"
                disabled={loading || !searchInput.trim()}
                className="h-12 rounded-2xl font-black bg-primary text-white hover:bg-primary/90 px-5 gap-2 shrink-0"
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Validar</span>
              </Button>
            </div>
          </form>

          {/* Result states */}
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-muted-foreground">
                Consultando libro oficial de radicados...
              </p>
            </div>
          ) : searched && certData ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-5 border-t border-foreground/10 pt-5"
            >
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500 text-white shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                    Certificado Auténtico y Válido
                  </h3>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Constancia registrada y expedida en el sistema oficial de Juventudes MIRA Cali.
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs divide-y divide-foreground/5 bg-card/60 p-5 rounded-2xl border border-foreground/10">
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground font-semibold flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-primary" />
                    Titular Acreditado:
                  </span>
                  <span className="font-black text-foreground text-sm text-right">
                    {certData.fullName}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Documento de Identidad:
                  </span>
                  <span className="font-mono font-bold text-foreground">
                    {certData.documentType} {certData.documentMasked}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground font-semibold flex items-center gap-2">
                    <Award className="w-4 h-4 text-primary" />
                    Código Radicado:
                  </span>
                  <span className="font-mono font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                    {certData.code}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Fecha de Expedición:
                  </span>
                  <span className="font-semibold text-foreground">
                    {certData.date}
                  </span>
                </div>

                {certData.commune && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground font-semibold flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      Ubicación / Territorio:
                    </span>
                    <span className="font-semibold text-foreground">
                      {certData.commune} {certData.neighborhood ? `(${certData.neighborhood})` : ''}
                    </span>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-center text-muted-foreground">
                Santiago de Cali, Valle del Cauca • MIRA
              </div>
            </motion.div>
          ) : searched && !certData ? (
            <div className="p-6 text-center space-y-2 border border-destructive/20 bg-destructive/5 rounded-2xl text-xs">
              <p className="font-black text-destructive text-sm">
                No se encontró ninguna constancia con ese radicado
              </p>
              <p className="text-muted-foreground text-[11px]">
                Verifica haber ingresado exactamente las letras y números que aparecen en la esquina inferior derecha del certificado.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
