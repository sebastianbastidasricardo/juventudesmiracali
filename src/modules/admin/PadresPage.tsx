import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HeartHandshake, 
  Search, 
  Filter, 
  MessageCircle, 
  Download, 
  User, 
  MapPin, 
  Calendar, 
  Phone, 
  ShieldCheck, 
  Users, 
  Eye, 
  Copy, 
  Check, 
  RefreshCw,
  Sparkles,
  AlertCircle,
  Building,
  Heart,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  Send,
  FileText,
  ExternalLink,
  PenTool,
  FileCheck
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { calculateAge } from '@/utils/validators';
import { 
  buildGuardianWhatsAppUrl, 
  buildGuardianEmergencyWhatsAppUrl, 
  buildGuardianAuthWhatsAppUrl,
  getCleanGuardianPhone,
  generateGuardianToken,
  getPublicBaseUrl
} from '@/utils/whatsapp';
import { CALI_COMMUNES } from '@/constants/cali';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { Key } from 'lucide-react';
import ActaAutorizacionModal from './ActaAutorizacionModal';
import WhatsAppTemplateModal from './WhatsAppTemplateModal';

export default function PadresPage() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCommune, setFilterCommune] = useState('all');
  const [filterRelationship, setFilterRelationship] = useState('all');
  const [filterAge, setFilterAge] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'pending' | 'contacted' | 'authorized'
  
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedActaRecord, setSelectedActaRecord] = useState<any>(null);
  const [isActaOpen, setIsActaOpen] = useState(false);
  const [selectedTemplateRecord, setSelectedTemplateRecord] = useState<any>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchMinors();
  }, []);

  const fetchMinors = async () => {
    setLoading(true);
    try {
      if (!supabase) return;

      const { data, error } = await supabase
        .from('characterization_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // Enriquecer registros con edad calculada y filtrar menores de 18 años (14 a 17 años)
        // Auto-asignar guardian_token si no existe para garantizar que todos tengan token permanente
        const enriched = data.map(d => {
          let token = d.guardian_token;
          if (!token || token.trim().length === 0) {
            token = generateGuardianToken();
            // Guardar asíncronamente en Supabase sin bloquear
            if (supabase) {
              supabase
                .from('characterization_records')
                .update({ guardian_token: token })
                .eq('id', d.id)
                .then();
            }
          }
          return {
            ...d,
            guardian_token: token,
            age: calculateAge(d.birth_date),
            // Asegurar un estado válido por defecto
            guardian_contact_status: d.guardian_contact_status || (d.guardian_signature ? 'authorized' : 'pending')
          };
        }).filter(d => typeof d.age === 'number' && d.age < 18);

        setRecords(enriched);
      }
    } catch (err: any) {
      console.error('Error cargando menores y acudientes:', err);
      toast.error('No se pudieron cargar los datos de acudientes');
    } finally {
      setLoading(false);
    }
  };

  const handleTokenGenerated = async (recordId: string, newToken: string) => {
    setRecords(prev => prev.map(r => r.id === recordId ? { ...r, guardian_token: newToken } : r));
    if (selectedRecord && selectedRecord.id === recordId) {
      setSelectedRecord((prev: any) => ({ ...prev, guardian_token: newToken }));
    }
    if (selectedTemplateRecord && selectedTemplateRecord.id === recordId) {
      setSelectedTemplateRecord((prev: any) => ({ ...prev, guardian_token: newToken }));
    }
    try {
      if (supabase) {
        await supabase
          .from('characterization_records')
          .update({ guardian_token: newToken })
          .eq('id', recordId);
      }
    } catch (e) {
      console.warn('Error al actualizar token:', e);
    }
  };

  // Actualizar estado del semáforo en tiempo real con Supabase
  const updateGuardianStatus = async (recordId: string, newStatus: 'pending' | 'contacted' | 'authorized') => {
    // 1. Actualización optimista inmediata en memoria
    setRecords(prev => prev.map(r => {
      if (r.id === recordId) {
        return {
          ...r,
          guardian_contact_status: newStatus,
          guardian_authorized_at: newStatus === 'authorized' ? (r.guardian_authorized_at || new Date().toISOString()) : r.guardian_authorized_at
        };
      }
      return r;
    }));

    if (selectedRecord && selectedRecord.id === recordId) {
      setSelectedRecord((prev: any) => ({
        ...prev,
        guardian_contact_status: newStatus,
        guardian_authorized_at: newStatus === 'authorized' ? (prev.guardian_authorized_at || new Date().toISOString()) : prev.guardian_authorized_at
      }));
    }

    const statusLabels: Record<string, string> = {
      pending: 'Sin escribir ⏳',
      contacted: 'Ya contactado 📩',
      authorized: 'Permiso OK ✅'
    };

    toast.success(`Estado actualizado: ${statusLabels[newStatus]}`);

    // 2. Persistencia en Supabase
    try {
      if (!supabase) return;
      
      const payload: any = {
        guardian_contact_status: newStatus
      };
      if (newStatus === 'authorized') {
        payload.guardian_authorized_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('characterization_records')
        .update(payload)
        .eq('id', recordId);

      if (error) {
        console.warn('Nota de base de datos:', error.message);
      }
    } catch (err) {
      console.warn('Error al persistir en Supabase:', err);
    }
  };

  // Filtrado reactivo en memoria
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // Filtro por Estado (Semáforo)
      if (filterStatus !== 'all') {
        const curStatus = r.guardian_contact_status || 'pending';
        if (curStatus !== filterStatus) return false;
      }

      // Búsqueda por texto (nombre joven, acudiente, teléfono, doc)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const youthName = `${r.first_name || ''} ${r.last_name || ''}`.toLowerCase();
        const guardianName = (r.guardian_name || '').toLowerCase();
        const docNum = (r.document_number || '').toLowerCase();
        const gPhone = (r.guardian_phone || '').toLowerCase();
        if (!youthName.includes(q) && !guardianName.includes(q) && !docNum.includes(q) && !gPhone.includes(q)) {
          return false;
        }
      }

      // Filtro Comuna
      if (filterCommune !== 'all' && r.commune !== filterCommune) {
        return false;
      }

      // Filtro Parentesco
      if (filterRelationship !== 'all') {
        const rel = (r.guardian_relationship || '').toLowerCase();
        if (filterRelationship === 'mama' && !rel.includes('mam')) return false;
        if (filterRelationship === 'papa' && !rel.includes('pap')) return false;
        if (filterRelationship === 'tutor' && (rel.includes('mam') || rel.includes('pap'))) return false;
      }

      // Filtro Edad exacta
      if (filterAge !== 'all' && r.age !== parseInt(filterAge)) {
        return false;
      }

      return true;
    });
  }, [records, searchTerm, filterCommune, filterRelationship, filterAge, filterStatus]);

  // Métricas de semáforo
  const stats = useMemo(() => {
    const totalMinors = records.length;
    const pending = records.filter(r => (!r.guardian_contact_status || r.guardian_contact_status === 'pending')).length;
    const contacted = records.filter(r => r.guardian_contact_status === 'contacted').length;
    const authorized = records.filter(r => r.guardian_contact_status === 'authorized' || !!r.guardian_signature).length;

    return { totalMinors, pending, contacted, authorized };
  }, [records]);

  // Enviar mensaje de WhatsApp y cambiar estado a 'contactado' automáticamente
  const handleOpenWhatsApp = (record: any, type: 'auth' | 'welcome' | 'emergency' = 'auth') => {
    if (!record.guardian_phone) {
      toast.error('Este registro no tiene número de teléfono registrado.');
      return;
    }

    let url = '';
    if (type === 'auth') {
      url = buildGuardianAuthWhatsAppUrl(record);
    } else if (type === 'welcome') {
      url = buildGuardianWhatsAppUrl(record);
    } else {
      url = buildGuardianEmergencyWhatsAppUrl(record);
    }

    window.open(url, '_blank');

    // Si aún no está contactado ni autorizado, moverlo automáticamente a "contactado"
    if (!record.guardian_contact_status || record.guardian_contact_status === 'pending') {
      updateGuardianStatus(record.id, 'contacted');
    }
  };

  // Copiar enlace personalizado de autorización para el padre
  const handleCopyAuthLink = (record: any) => {
    const origin = getPublicBaseUrl();
    const token = record.guardian_token || record.id || '';
    const authLink = `${origin}/autorizacion/${token}`;

    navigator.clipboard.writeText(authLink);
    setCopiedId(record.id);
    toast.success('¡Enlace de autorización copiado!', {
      description: 'Pégalo en el chat con el padre de familia.'
    });
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCopyMessage = (record: any, type: 'auth' | 'welcome' = 'auth') => {
    const url = type === 'auth' ? buildGuardianAuthWhatsAppUrl(record) : buildGuardianWhatsAppUrl(record);
    const parsedText = decodeURIComponent(url.split('?text=')[1] || '');
    navigator.clipboard.writeText(parsedText);
    setCopiedId(record.id);
    toast.success('¡Texto del mensaje copiado al portapapeles!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Exportar Excel de Acudientes
  const exportToExcel = () => {
    if (filteredRecords.length === 0) {
      toast.info('No hay registros para exportar');
      return;
    }

    const dataToExport = filteredRecords.map(r => ({
      'Nombres Joven': r.first_name,
      'Apellidos Joven': r.last_name,
      'Edad': r.age,
      'Género': r.gender,
      'Tipo Doc': r.document_type,
      'Documento': r.document_number,
      'Celular Joven': r.phone,
      'Parentesco Acudiente': r.guardian_relationship || 'No especificado',
      'Nombre Acudiente': r.guardian_name || 'No especificado',
      'Cédula Acudiente': r.guardian_id_number || 'Sin registrar',
      'WhatsApp Acudiente': r.guardian_phone || 'Sin registrar',
      'Estado Autorización': r.guardian_contact_status === 'authorized' ? 'PERMISO OK' : r.guardian_contact_status === 'contacted' ? 'YA CONTACTADO' : 'SIN ESCRIBIR',
      'Tiene Firma Digital': r.guardian_signature ? 'SÍ' : 'NO',
      'Fecha Autorización': r.guardian_authorized_at ? new Date(r.guardian_authorized_at).toLocaleString('es-CO') : 'Pendiente',
      'Comuna': r.commune,
      'Barrio': r.neighborhood,
      'Sede/Origen': r.church_headquarters || r.registration_source || 'N/A',
      'Fecha Registro': new Date(r.created_at).toLocaleDateString('es-CO'),
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Acudientes_Juventudes_MIRA');
    XLSX.writeFile(wb, `Acudientes_Juventudes_MIRA_Cali_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('¡Reporte de acudientes exportado exitosamente!');
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase bg-primary/10 text-primary border border-primary/20">
              Menores de Edad (14 - 17 Años)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-2.5 mt-1">
            <HeartHandshake className="w-8 h-8 text-primary" />
            Módulo de Acudientes y Familias
          </h1>
          <p className="text-sm text-muted-foreground">
            Control de consentimientos legales, semáforo de contacto vía WhatsApp y actas de autorización.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={fetchMinors}
            variant="outline"
            size="sm"
            className="rounded-xl border-foreground/10 hover:bg-foreground/5 font-bold flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>

          <Button
            onClick={exportToExcel}
            size="sm"
            className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* KPI Cards: Semáforo de 3 Estados + Total */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Menores */}
        <div 
          onClick={() => setFilterStatus('all')}
          className={`glass p-5 rounded-2xl border transition-all cursor-pointer ${filterStatus === 'all' ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-foreground/5 hover:border-foreground/20'} shadow-sm space-y-1`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Menores Registrados</span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-foreground">{stats.totalMinors}</div>
          <p className="text-[11px] text-muted-foreground">Jóvenes entre 14 y 17 años</p>
        </div>

        {/* ⏳ Sin Contactar */}
        <div 
          onClick={() => setFilterStatus('pending')}
          className={`glass p-5 rounded-2xl border transition-all cursor-pointer ${filterStatus === 'pending' ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/5' : 'border-foreground/5 hover:border-amber-500/30'} shadow-sm space-y-1`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">⏳ Sin Escribir</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-500">{stats.pending}</div>
          <p className="text-[11px] text-muted-foreground">Pendientes de primer contacto</p>
        </div>

        {/* 📩 Ya Contactados */}
        <div 
          onClick={() => setFilterStatus('contacted')}
          className={`glass p-5 rounded-2xl border transition-all cursor-pointer ${filterStatus === 'contacted' ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-500/5' : 'border-foreground/5 hover:border-blue-500/30'} shadow-sm space-y-1`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-blue-500 tracking-wider">📩 Ya Contactados</span>
            <MessageCircle className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-500">{stats.contacted}</div>
          <p className="text-[11px] text-muted-foreground">Enlace enviado, esperando firma</p>
        </div>

        {/* ✅ Permiso OK */}
        <div 
          onClick={() => setFilterStatus('authorized')}
          className={`glass p-5 rounded-2xl border transition-all cursor-pointer ${filterStatus === 'authorized' ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/5' : 'border-foreground/5 hover:border-emerald-500/30'} shadow-sm space-y-1`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-emerald-500 tracking-wider">✅ Permiso OK</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-500">{stats.authorized}</div>
          <p className="text-[11px] text-muted-foreground">Firmados y autorizados legalmente</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="glass p-4 rounded-2xl border border-foreground/5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Buscador */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar joven, acudiente o celular..."
              className="pl-9 rounded-xl border-foreground/10 bg-background/50 h-10 text-xs"
            />
          </div>

          {/* Filtro Semáforo / Estado */}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="rounded-xl border-foreground/10 bg-background/50 h-10 text-xs font-bold">
              <SelectValue placeholder="Estado del Semáforo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">🚦 Todos los Estados</SelectItem>
              <SelectItem value="pending">⏳ Sin escribir</SelectItem>
              <SelectItem value="contacted">📩 Ya contactados</SelectItem>
              <SelectItem value="authorized">✅ Permiso OK (Autorizados)</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro Comuna */}
          <Select value={filterCommune} onValueChange={setFilterCommune}>
            <SelectTrigger className="rounded-xl border-foreground/10 bg-background/50 h-10 text-xs">
              <SelectValue placeholder="Comuna" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las Comunas</SelectItem>
              {CALI_COMMUNES.map(c => (
                <SelectItem key={c} value={c}>Comuna {c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro Parentesco */}
          <Select value={filterRelationship} onValueChange={setFilterRelationship}>
            <SelectTrigger className="rounded-xl border-foreground/10 bg-background/50 h-10 text-xs">
              <SelectValue placeholder="Parentesco" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Parentescos</SelectItem>
              <SelectItem value="mama">Solo Mamás</SelectItem>
              <SelectItem value="papa">Solo Papás</SelectItem>
              <SelectItem value="tutor">Solo Tutores / Otros</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro Edad */}
          <Select value={filterAge} onValueChange={setFilterAge}>
            <SelectTrigger className="rounded-xl border-foreground/10 bg-background/50 h-10 text-xs">
              <SelectValue placeholder="Edad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las Edades</SelectItem>
              <SelectItem value="14">14 Años</SelectItem>
              <SelectItem value="15">15 Años</SelectItem>
              <SelectItem value="16">16 Años</SelectItem>
              <SelectItem value="17">17 Años</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(searchTerm || filterStatus !== 'all' || filterCommune !== 'all' || filterRelationship !== 'all' || filterAge !== 'all') && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground font-bold">
              Mostrando {filteredRecords.length} de {records.length} registros
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setFilterCommune('all');
                setFilterRelationship('all');
                setFilterAge('all');
              }}
              className="text-xs text-primary font-bold hover:bg-primary/10 h-7"
            >
              Limpiar filtros
            </Button>
          </div>
        )}
      </div>

      {/* Tabla de Menores y Acudientes */}
      <div className="glass rounded-2xl border border-foreground/5 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-foreground/5 hover:bg-transparent">
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground h-12">Joven Menor</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground h-12 text-center">Edad</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground h-12">Ubicación</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground h-12">Acudiente Responsable</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground h-12">WhatsApp</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground h-12 text-center">Estado</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground h-12 text-right">Contacto & Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-foreground/5 animate-pulse">
                    <TableCell colSpan={7} className="h-16 bg-foreground/5" />
                  </TableRow>
                ))
              ) : filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Search className="w-8 h-8 opacity-40" />
                      <p className="text-sm font-bold">No se encontraron acudientes con los filtros seleccionados</p>
                      <p className="text-xs">Los registros de menores de 14 a 17 años aparecerán automáticamente aquí.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record) => {
                  const relLower = (record.guardian_relationship || '').toLowerCase();
                  const isMama = relLower.includes('mam');
                  const isPapa = relLower.includes('pap');
                  const isGirl = (record.gender || '').toLowerCase().includes('fem') || (record.gender || '').toLowerCase().includes('muj');
                  
                  const status = record.guardian_contact_status || (record.guardian_signature ? 'authorized' : 'pending');
                  const hasSignature = !!record.guardian_signature;

                  return (
                    <TableRow key={record.id} className="border-foreground/5 hover:bg-foreground/[0.02] transition-colors">
                      {/* Joven */}
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center font-black text-xs text-primary shrink-0">
                            {record.first_name?.[0]}{record.last_name?.[0]}
                          </div>
                          <div>
                            <div className="font-bold text-sm uppercase text-foreground">
                              {record.first_name} {record.last_name}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${isGirl ? 'bg-pink-500/10 text-pink-500 border border-pink-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'}`}>
                                {record.gender || 'Joven'}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {record.document_type} {record.document_number}
                              </span>
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Edad */}
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center px-2 py-1 rounded-lg bg-primary/10 text-primary font-black text-xs">
                          {record.age || '--'} años
                        </span>
                      </TableCell>

                      {/* Ubicación */}
                      <TableCell>
                        <div className="flex flex-col text-xs">
                          <span className="font-bold text-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-primary shrink-0" />
                            {record.commune ? (record.commune.toLowerCase().startsWith('comuna') ? record.commune : `Comuna ${record.commune}`) : 'Cali'}
                          </span>
                          <span className="text-[11px] text-muted-foreground truncate max-w-[140px]">
                            {record.neighborhood || 'Barrio no especificado'}
                          </span>
                        </div>
                      </TableCell>

                      {/* Acudiente */}
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              isMama 
                                ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                                : isPapa 
                                ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' 
                                : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            }`}>
                              {record.guardian_relationship || 'Acudiente'}
                            </span>
                            {record.guardian_id_number && (
                              <span className="text-[9px] font-mono text-muted-foreground">
                                C.C. {record.guardian_id_number}
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-xs text-foreground uppercase">
                            {record.guardian_name || 'Nombre no registrado'}
                          </span>
                        </div>
                      </TableCell>

                      {/* Teléfono */}
                      <TableCell>
                        {record.guardian_phone ? (
                          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-foreground">
                            <span className="text-muted-foreground text-[10px] font-sans">🇨🇴 +57</span>
                            {record.guardian_phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Sin teléfono</span>
                        )}
                      </TableCell>

                      {/* ESTADO (SEMÁFORO) */}
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="outline-none">
                            {status === 'authorized' ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all cursor-pointer shadow-sm">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Permiso OK</span>
                                {hasSignature && (
                                  <span title="Firma digital guardada" className="text-[10px] ml-0.5">✍️</span>
                                )}
                              </div>
                            ) : status === 'contacted' ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-blue-500/15 text-blue-500 border border-blue-500/30 hover:bg-blue-500/25 transition-all cursor-pointer shadow-sm">
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>Ya contactado</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-amber-500/15 text-amber-500 border border-amber-500/30 hover:bg-amber-500/25 transition-all cursor-pointer shadow-sm">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Sin escribir</span>
                              </div>
                            )}
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="center" className="glass-dark border-foreground/10 w-48 p-1.5 rounded-2xl shadow-xl">
                            <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground px-2 py-1">
                              Cambiar Semáforo
                            </DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => updateGuardianStatus(record.id, 'authorized')}
                              className="text-xs font-bold gap-2 rounded-xl py-2 cursor-pointer focus:bg-emerald-500/15 focus:text-emerald-500"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              Marcar: Permiso OK
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => updateGuardianStatus(record.id, 'contacted')}
                              className="text-xs font-bold gap-2 rounded-xl py-2 cursor-pointer focus:bg-blue-500/15 focus:text-blue-500"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-blue-500" />
                              Marcar: Ya Contactado
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => updateGuardianStatus(record.id, 'pending')}
                              className="text-xs font-bold gap-2 rounded-xl py-2 cursor-pointer focus:bg-amber-500/15 focus:text-amber-500"
                            >
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                              Marcar: Sin Escribir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>

                      {/* Acciones y WhatsApp */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botón rápido Plantilla WhatsApp lista */}
                          <Button
                            onClick={() => {
                              setSelectedTemplateRecord(record);
                              setIsTemplateModalOpen(true);
                            }}
                            size="sm"
                            className="rounded-xl font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 h-9 px-3 text-xs"
                            title="Abrir plantilla de WhatsApp lista con enlace y token"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </Button>

                          {/* Copiar enlace directo */}
                          <Button
                            onClick={() => handleCopyAuthLink(record)}
                            variant="outline"
                            size="sm"
                            className="rounded-xl font-bold border-foreground/10 hover:bg-foreground/5 h-9 px-2 text-xs text-foreground"
                            title="Copiar enlace de autorización para el padre"
                          >
                            {copiedId === record.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-blue-500" />
                            )}
                          </Button>

                          {/* Botón Acta PDF rápida */}
                          <Button
                            onClick={() => {
                              setSelectedActaRecord(record);
                              setIsActaOpen(true);
                            }}
                            variant="outline"
                            size="sm"
                            className="rounded-xl font-bold border-foreground/10 hover:bg-foreground/5 h-9 px-2.5 text-xs text-foreground flex items-center gap-1"
                            title="Descargar / Imprimir Acta Legal PDF"
                          >
                            <FileText className="w-3.5 h-3.5 text-primary" />
                            <span className="hidden sm:inline">Acta</span>
                          </Button>

                          {/* Menú Más Opciones */}
                          <DropdownMenu>
                            <DropdownMenuTrigger className="outline-none">
                              <div className="inline-flex items-center justify-center h-9 w-9 rounded-xl opacity-60 hover:opacity-100 hover:bg-foreground/5 transition-all">
                                <MoreHorizontal className="h-5 w-5" />
                              </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass-dark border-foreground/10 w-56 p-1.5 rounded-2xl shadow-xl">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedTemplateRecord(record);
                                  setIsTemplateModalOpen(true);
                                }}
                                className="text-xs font-bold gap-2 rounded-xl py-2 cursor-pointer focus:bg-emerald-500/10 focus:text-emerald-500"
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                                Ver Plantilla WhatsApp Lista
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => handleOpenWhatsApp(record, 'auth')}
                                disabled={!record.guardian_phone}
                                className="text-xs font-bold gap-2 rounded-xl py-2 cursor-pointer focus:bg-emerald-500/10 focus:text-emerald-500"
                              >
                                <Send className="w-3.5 h-3.5 text-emerald-500" />
                                Enviar Mensaje Directo
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => handleCopyAuthLink(record)}
                                className="text-xs font-bold gap-2 rounded-xl py-2 cursor-pointer focus:bg-blue-500/10 focus:text-blue-500"
                              >
                                <Copy className="w-3.5 h-3.5 text-blue-500" />
                                Copiar Enlace para el Padre
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => {
                                  const token = record.guardian_token || record.id || '';
                                  navigator.clipboard.writeText(token);
                                  toast.success(`Token copiado: ${token}`);
                                }}
                                className="text-xs font-bold gap-2 rounded-xl py-2 cursor-pointer focus:bg-amber-500/10 focus:text-amber-500"
                              >
                                <Key className="w-3.5 h-3.5 text-amber-500" />
                                Copiar Solo Token
                              </DropdownMenuItem>

                              <DropdownMenuSeparator className="bg-foreground/5" />

                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedActaRecord(record);
                                  setIsActaOpen(true);
                                }}
                                className="text-xs font-bold gap-2 rounded-xl py-2 cursor-pointer focus:bg-primary/10"
                              >
                                <FileText className="w-3.5 h-3.5 text-primary" />
                                Descargar Acta Legal PDF
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedRecord(record);
                                  setIsDetailsOpen(true);
                                }}
                                className="text-xs font-bold gap-2 rounded-xl py-2 cursor-pointer focus:bg-foreground/10"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Ver Ficha del Joven
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal de Ficha del Joven y Acudiente */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="glass-dark border-foreground/10 text-foreground max-w-lg rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase text-foreground flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Ficha del Joven y Acudiente
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Información de contacto familiar, estado de autorización legal y trazabilidad.
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-4 py-2 text-xs">
              {/* Tarjeta Acudiente */}
              <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-primary block">
                    Datos del Acudiente Responsable
                  </span>
                  {selectedRecord.guardian_contact_status === 'authorized' ? (
                    <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30 text-[10px] font-bold">
                      Permiso OK ✅
                    </Badge>
                  ) : selectedRecord.guardian_contact_status === 'contacted' ? (
                    <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30 text-[10px] font-bold">
                      Ya Contactado 📩
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 text-[10px] font-bold">
                      Sin Escribir ⏳
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Parentesco:</span>
                    <strong className="text-foreground text-sm uppercase">{selectedRecord.guardian_relationship || 'No especificado'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Nombre Completo:</span>
                    <strong className="text-foreground text-sm uppercase">{selectedRecord.guardian_name || 'No especificado'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Cédula de Ciudadanía:</span>
                    <strong className="text-foreground font-mono text-sm">{selectedRecord.guardian_id_number || 'Pendiente'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">WhatsApp:</span>
                    <strong className="text-foreground font-mono text-sm">
                      {selectedRecord.guardian_phone ? `+57 ${selectedRecord.guardian_phone}` : 'Sin registrar'}
                    </strong>
                  </div>
                </div>

                {/* Si tiene firma guardada */}
                {selectedRecord.guardian_signature && (
                  <div className="pt-2 border-t border-primary/20 mt-2">
                    <span className="text-muted-foreground block text-[10px] mb-1">Trazo de Firma Digital:</span>
                    <div className="bg-white p-2 rounded-xl flex items-center justify-center border border-slate-200">
                      <img 
                        src={selectedRecord.guardian_signature} 
                        alt="Firma Acudiente" 
                        className="max-h-16 object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Datos del Joven */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-foreground/5">
                <div>
                  <span className="text-muted-foreground block text-[10px]">Joven:</span>
                  <strong className="text-foreground text-xs uppercase">{selectedRecord.first_name} {selectedRecord.last_name}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Edad:</span>
                  <strong className="text-foreground text-xs">{selectedRecord.age} años ({selectedRecord.birth_date})</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Documento:</span>
                  <span className="font-mono text-xs">{selectedRecord.document_type} {selectedRecord.document_number}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Celular Personal:</span>
                  <span className="font-mono text-xs">{selectedRecord.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Comuna / Barrio:</span>
                  <span className="text-xs">
                    {selectedRecord.commune ? (selectedRecord.commune.toLowerCase().startsWith('comuna') ? selectedRecord.commune : `Comuna ${selectedRecord.commune}`) : 'Cali'}
                    {selectedRecord.neighborhood ? ` - ${selectedRecord.neighborhood}` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Sede de Iglesia:</span>
                  <span className="text-xs">{selectedRecord.church_headquarters || 'No registra sede'}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-row items-center justify-between sm:justify-between pt-2">
            <Button
              onClick={() => {
                setSelectedActaRecord(selectedRecord);
                setIsActaOpen(true);
              }}
              className="rounded-xl font-bold bg-primary text-primary-foreground text-xs flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              Ver Acta Legal PDF
            </Button>

            <Button
              onClick={() => setIsDetailsOpen(false)}
              variant="outline"
              className="rounded-xl font-bold border-foreground/10 text-xs"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal del Acta Legal Oficial Imprimible */}
      <ActaAutorizacionModal
        isOpen={isActaOpen}
        onClose={() => setIsActaOpen(false)}
        record={selectedActaRecord}
      />

      {/* Modal de Plantilla de WhatsApp lista con Token y Enlace */}
      <WhatsAppTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        record={selectedTemplateRecord}
        onUpdateStatus={updateGuardianStatus}
        onTokenGenerated={handleTokenGenerated}
      />
    </div>
  );
}
