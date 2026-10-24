import React, { useEffect, useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  MoreHorizontal,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  UserCheck,
  MapPin,
  Calendar,
  Eye,
  Trash2,
  Info,
  Sparkles,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Send,
  MessageCircle,
  HeartHandshake
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { buildGuardianWhatsAppUrl, buildYouthWhatsAppUrl } from '@/utils/whatsapp';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EditRegistroDialog } from './EditRegistroDialog';
import { CALI_COMMUNES, NEIGHBORHOODS_BY_COMMUNE, TALENTS_CATEGORIES, EDUCATION_LEVELS, INTERESTS } from '@/constants/cali';
import { calculateAge } from '@/utils/validators';

export default function RegistrosPage() {
  const [registros, setRegistros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCommune, setFilterCommune] = useState('all');
  const [filterGender, setFilterGender] = useState('all');
  const [filterEducation, setFilterEducation] = useState('all');
  const [boolFilters, setBoolFilters] = useState({
    working: 'all',
    entrepreneur: 'all',
    organization: 'all',
    subscribed: 'all'
  });
  const [filterAge, setFilterAge] = useState({ operator: 'all', value: 18, value2: 25 });
  const [filterInternal, setFilterInternal] = useState('all');
  const [filterMilitary, setFilterMilitary] = useState('all');
  const [filterHQ, setFilterHQ] = useState('all');
  const [filterStudyArea, setFilterStudyArea] = useState('all');
  const [filterTalent, setFilterTalent] = useState('all');
  const [filterInterest, setFilterInterest] = useState('all');

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const pageSize = 25;

  useEffect(() => {
    fetchRegistros();
  }, [currentPage, searchTerm, filterCommune, filterGender, filterEducation, boolFilters, filterAge, filterInternal, filterMilitary, filterHQ, filterStudyArea, filterTalent, filterInterest]);

  const fetchRegistros = async () => {
    setLoading(true);
    if (!supabase) {
      console.error('Supabase client not initialized');
      setLoading(false);
      return;
    }
    
    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('characterization_records')
      .select('*', { count: 'exact' });

    if (searchTerm) {
      query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,document_number.ilike.%${searchTerm}%`);
    }

    if (filterCommune !== 'all') query = query.eq('commune', filterCommune);
    if (filterGender !== 'all') query = query.eq('gender', filterGender);
    if (filterEducation !== 'all') query = query.eq('education_level', filterEducation);
    
    if (boolFilters.working !== 'all') query = query.eq('is_working', boolFilters.working === 'yes');
    if (boolFilters.entrepreneur !== 'all') query = query.eq('is_entrepreneur', boolFilters.entrepreneur === 'yes');
    if (boolFilters.organization !== 'all') query = query.eq('is_in_organization', boolFilters.organization === 'yes');
    if (boolFilters.subscribed !== 'all') query = query.eq('is_infomira_subscribed', boolFilters.subscribed === 'yes');

    // Postgres array search for interests if we wanted to be strict, 
    // but a simple text search on the interests column works too if it's stored as jsonb or string.
    // Assuming it's an array, we use 'cs' (contains) or just filter client side for better UX if needed.
    // Let's do client side for interests/talents to keep it flexible.

    const { data, count, error } = await query
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching records:', error);
      toast.error('Error al cargar datos: ' + error.message);
    } else {
      let filtered = data || [];
      
      // Calculate age for all fetched records
      filtered = filtered.map(r => ({ ...r, age: calculateAge(r.birth_date) }));
      
      if (filterAge.operator !== 'all') {
        const val = filterAge.value;
        const val2 = filterAge.value2;
        if (filterAge.operator === 'greater') filtered = filtered.filter(d => d.age > val);
        if (filterAge.operator === 'greater_equal') filtered = filtered.filter(d => d.age >= val);
        if (filterAge.operator === 'less') filtered = filtered.filter(d => d.age < val);
        if (filterAge.operator === 'less_equal') filtered = filtered.filter(d => d.age <= val);
        if (filterAge.operator === 'between') filtered = filtered.filter(d => d.age >= val && d.age <= val2);
        if (filterAge.operator === 'equal') filtered = filtered.filter(d => d.age === val);
      }

      if (filterInternal !== 'all') {
         const checkInternal = filterInternal === 'true';
         filtered = filtered.filter(d => d.is_internal === checkInternal);
      }

      if (filterMilitary !== 'all') filtered = filtered.filter(d => d.military_status === filterMilitary);
      if (filterHQ !== 'all') filtered = filtered.filter(d => d.church_headquarters === filterHQ);
      if (filterStudyArea !== 'all') filtered = filtered.filter(d => d.study_area && d.study_area.some((a: string) => filterStudyArea === 'Otra' ? a.startsWith('Otra') : a === filterStudyArea));
      if (filterTalent !== 'all') filtered = filtered.filter(d => d.talents && d.talents.includes(filterTalent));
      if (filterInterest !== 'all') filtered = filtered.filter(d => d.interests && d.interests.includes(filterInterest));

      setTotalCount(count || 0);
      const paginated = filtered.slice(from, to + 1);
      setRegistros(paginated);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!selectedRecord) return;
    
    const { error } = await supabase
      .from('characterization_records')
      .delete()
      .eq('id', selectedRecord.id);

    if (error) {
      toast.error('Error al eliminar: ' + error.message);
    } else {
      toast.success('Registro eliminado correctamente');
      fetchRegistros();
      setIsDeleteConfirmOpen(false);
    }
  };

  const handleResendCertificate = async (registro: any) => {
    if (!registro.email) {
      toast.error('Este registro no tiene un correo electrónico configurado.');
      return;
    }

    const toastId = toast.loading(`Enviando certificado a ${registro.email}...`);
    try {
      const fullName = `${registro.first_name || ''} ${registro.last_name || ''}`.trim();
      const res = await fetch('/api/send-certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          documentType: registro.document_type,
          documentNumber: registro.document_number,
          email: registro.email,
          commune: registro.commune,
          neighborhood: registro.neighborhood,
          code: registro.certificate_code,
        }),
      });

      const resData = await res.json().catch(() => ({}));
      if (res.ok && resData.success !== false) {
        const finalCode = resData.code || registro.certificate_code;
        await supabase?.rpc('mark_certificate_sent', {
          doc_type: registro.document_type,
          doc_number: registro.document_number,
          cert_code: finalCode,
        });
        toast.dismiss(toastId);
        toast.success(`Certificado enviado exitosamente a ${registro.email}`);
        fetchRegistros();
      } else {
        toast.dismiss(toastId);
        toast.error(resData.error || 'Error al enviar certificado por correo.');
      }
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error('Error de conexión al enviar: ' + err.message);
    }
  };

  const exportData = async (type: 'excel' | 'csv', onlyFiltered: boolean) => {
    setLoading(true);
    try {
      let query = supabase
        .from('characterization_records')
        .select('*');

      if (onlyFiltered) {
        if (searchTerm) {
          query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,document_number.ilike.%${searchTerm}%`);
        }
        if (filterCommune !== 'all') query = query.eq('commune', filterCommune);
        if (filterGender !== 'all') query = query.eq('gender', filterGender);
        if (filterEducation !== 'all') query = query.eq('education_level', filterEducation);
        
        if (boolFilters.working !== 'all') query = query.eq('is_working', boolFilters.working === 'yes');
        if (boolFilters.entrepreneur !== 'all') query = query.eq('is_entrepreneur', boolFilters.entrepreneur === 'yes');
        if (boolFilters.organization !== 'all') query = query.eq('is_in_organization', boolFilters.organization === 'yes');
        if (boolFilters.subscribed !== 'all') query = query.eq('is_infomira_subscribed', boolFilters.subscribed === 'yes');
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(onlyFiltered ? 1000 : 5000);

      if (error) throw error;
      
      let finalData = data || [];
      
      finalData = finalData.map(r => ({ ...r, age: calculateAge(r.birth_date) }));

      if (onlyFiltered) {
        if (filterAge.operator !== 'all') {
          const val = filterAge.value;
          const val2 = filterAge.value2;
          if (filterAge.operator === 'greater') finalData = finalData.filter(d => d.age > val);
          if (filterAge.operator === 'greater_equal') finalData = finalData.filter(d => d.age >= val);
          if (filterAge.operator === 'less') finalData = finalData.filter(d => d.age < val);
          if (filterAge.operator === 'less_equal') finalData = finalData.filter(d => d.age <= val);
          if (filterAge.operator === 'between') finalData = finalData.filter(d => d.age >= val && d.age <= val2);
          if (filterAge.operator === 'equal') finalData = finalData.filter(d => d.age === val);
        }
        if (filterInternal !== 'all') {
           const checkInternal = filterInternal === 'true';
           finalData = finalData.filter(d => d.is_internal === checkInternal);
        }
        if (filterMilitary !== 'all') finalData = finalData.filter(d => d.military_status === filterMilitary);
        if (filterHQ !== 'all') finalData = finalData.filter(d => d.church_headquarters === filterHQ);
        if (filterStudyArea !== 'all') finalData = finalData.filter(d => d.study_area && d.study_area.some((a: string) => filterStudyArea === 'Otra' ? a.startsWith('Otra') : a === filterStudyArea));
        if (filterTalent !== 'all') finalData = finalData.filter(d => d.talents && d.talents.includes(filterTalent));
        if (filterInterest !== 'all') finalData = finalData.filter(d => d.interests && d.interests.includes(filterInterest));
      }

      if (finalData.length === 0) {
        toast.error('No se encontraron datos para exportar');
        return;
      }

      const flatData = finalData.map(d => ({
        'Nombres': d.first_name,
        'Apellidos': d.last_name,
        'Tipo Doc.': d.document_type,
        'No. Documento': d.document_number,
        'Fecha Nac.': d.birth_date,
        'Edad': d.age,
        'Género': d.gender,
        'Sit. Militar': d.military_status || 'N/A',
        'Teléfono': d.phone,
        'Email': d.email,
        'Comuna': d.commune,
        'Barrio': d.neighborhood,
        'Educación': d.education_level,
        'Área Estudio': Array.isArray(d.study_area) ? d.study_area.join(', ') : (d.study_area || 'N/A'),
        'Trabaja': d.is_working ? 'Sí' : 'No',
        'Profesión': d.profession || 'N/A',
        'Emprendedor': d.is_entrepreneur ? 'Sí' : 'No',
        'Cual Emprendimiento': d.entrepreneur_name || 'N/A',
        'Pertenece Org.': d.is_in_organization ? 'Sí' : 'No',
        'Cual Organización': d.organization_name || 'N/A',
        'Intereses': Array.isArray(d.interests) ? d.interests.join(', ') : (d.interests || 'N/A'),
        'Talentos': Array.isArray(d.talents) ? d.talents.join(', ') : (d.talents || 'N/A'),
        'Origen (Iglesia)': d.is_internal ? 'Interno' : `Externo ${!['Evento o Actividad', 'Colegio / Universidad', 'Amigo o familiar'].includes(d.registration_source) ? `(${d.registration_source})` : ''}`,
        'Sede Iglesia': d.church_headquarters || 'N/A',
        'Subscrito InfoMIRA': d.is_infomira_subscribed ? 'Sí' : 'No',
        'Observaciones': d.open_comments || 'N/A',
        'Fecha Registro': new Date(d.created_at).toLocaleString()
      }));

      const ws = XLSX.utils.json_to_sheet(flatData);
      
      if (type === 'csv') {
         const csvOutput = XLSX.utils.sheet_to_csv(ws);
         const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
         const link = document.createElement("a");
         const url = URL.createObjectURL(blob);
         link.setAttribute("href", url);
         link.setAttribute("download", `Juventudes_MIRA_Cali_${onlyFiltered ? 'Filtrados' : 'Completo'}_${new Date().toISOString().split('T')[0]}.csv`);
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);
         toast.success(`CSV (${finalData.length} registros) generado correctamente`);
      } else {
         const wb = XLSX.utils.book_new();
         XLSX.utils.book_append_sheet(wb, ws, "Registros");
         XLSX.writeFile(wb, `Juventudes_MIRA_Cali_${onlyFiltered ? 'Filtrados' : 'Completo'}_${new Date().toISOString().split('T')[0]}.xlsx`);
         toast.success(`Excel (${finalData.length} registros) generado correctamente`);
      }
    } catch (err: any) {
      console.error('Export error:', err);
      toast.error('Error al exportar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h2 className="text-2xl font-black tracking-tighter flex items-center gap-2">
             <UserCheck className="w-6 h-6 text-primary" /> BASE DE DATOS MAESTRA
           </h2>
           <p className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-40">Gestión de registros y exportación de datos</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger className="outline-none">
              <div className="h-12 px-6 rounded-xl font-bold bg-primary text-white hover:opacity-90 shadow-lg mira-blue-glow transition-all flex items-center justify-center cursor-pointer">
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Exportar Datos
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="glass-dark border-foreground/10 w-48 p-2 rounded-2xl">
              <DropdownMenuItem 
                onClick={() => exportData('excel', false)}
                className="py-3 px-4 font-bold text-xs rounded-xl cursor-pointer"
              >
                Exportar Todo a Excel
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => exportData('excel', true)}
                className="py-3 px-4 font-bold text-xs rounded-xl cursor-pointer"
              >
                Exportar Filtrados (Excel)
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => exportData('csv', false)}
                className="py-3 px-4 font-bold text-xs rounded-xl cursor-pointer"
              >
                Exportar Todo a CSV
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => exportData('csv', true)}
                className="py-3 px-4 font-bold text-xs rounded-xl cursor-pointer"
              >
                Exportar Filtrados (CSV)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" className="glass h-12 px-6 rounded-xl border-foreground/5 font-bold" onClick={fetchRegistros}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refrescar
          </Button>
        </div>
      </div>

      {/* Main Container */}
      <div className="glass rounded-[1.5rem] md:rounded-[2rem] border-none shadow-2xl p-4 md:p-6 relative overflow-hidden">
        {/* Search & Stats Bar */}
        <div className="flex flex-col gap-4 mb-6 md:mb-8">
           <div className="flex flex-col lg:flex-row gap-4 w-full justify-between items-start lg:items-center">
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <Input 
                    placeholder="Nombre o CC..." 
                    className="h-12 pl-12 bg-foreground/5 border-foreground/10 rounded-xl focus:bg-foreground/10 focus:ring-1 focus:ring-primary/50 transition-all" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="w-full sm:w-48">
                   <Select value={filterCommune} onValueChange={(val) => { setFilterCommune(val); setCurrentPage(1); }}>
                      <SelectTrigger className="h-12 bg-foreground/5 border-foreground/10 rounded-xl font-bold shadow-sm">
                         <span className="truncate">{filterCommune === 'all' ? 'Comuna' : filterCommune}</span>
                      </SelectTrigger>
                      <SelectContent className="glass-dark border-foreground/10 max-h-[400px] w-[calc(100vw-2rem)] md:w-[300px]">
                         <SelectItem value="all" className="font-black">Todas las Comunas</SelectItem>
                         {CALI_COMMUNES.map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                         ))}
                      </SelectContent>
                   </Select>
                </div>

                <Button 
                  variant="outline"
                  className={`h-12 rounded-xl font-bold transition-all border-foreground/10 ${showAdvancedFilters ? 'bg-primary/10 text-primary border-primary/20' : 'glass opacity-70'}`}
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                >
                   <Filter className="mr-2 h-4 w-4" /> 
                   {showAdvancedFilters ? 'Cerrar Filtros' : 'Filtros Pro'}
                </Button>
              </div>

              <div className="flex items-center gap-4 bg-foreground/5 px-4 py-2 rounded-xl self-end lg:self-auto border border-foreground/5">
                <div className="flex flex-col items-end">
                   <span className="text-[9px] font-black uppercase opacity-30 tracking-widest leading-none">Resultados</span>
                   <span className="text-xl font-black tracking-tighter text-primary">{totalCount}</span>
                </div>
              </div>
           </div>

           {/* Advanced Filters Panel */}
           <AnimatePresence>
             {showAdvancedFilters && (
               <motion.div 
                 initial={{ height: 0, opacity: 0 }}
                 animate={{ height: 'auto', opacity: 1 }}
                 exit={{ height: 0, opacity: 0 }}
                 className="overflow-hidden"
               >
                 <div className="p-4 md:p-6 bg-foreground/5 rounded-[1.5rem] mt-2 border border-foreground/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase opacity-40 ml-1">Género</label>
                       <Select value={filterGender} onValueChange={setFilterGender}>
                          <SelectTrigger className="glass-dark border-none rounded-xl h-10">
                             <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="glass-dark border-foreground/10">
                             <SelectItem value="all">Género (Todos)</SelectItem>
                             <SelectItem value="Masculino">Masculino</SelectItem>
                             <SelectItem value="Femenino">Femenino</SelectItem>
                          </SelectContent>
                       </Select>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase opacity-40 ml-1">Educación</label>
                       <Select value={filterEducation} onValueChange={setFilterEducation}>
                          <SelectTrigger className="glass-dark border-none rounded-xl h-10">
                             <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="glass-dark border-foreground/10">
                             <SelectItem value="all">Educación (Todos)</SelectItem>
                             <SelectItem value="Primaria">Primaria</SelectItem>
                             <SelectItem value="Bachillerato">Bachillerato</SelectItem>
                             <SelectItem value="Técnico">Técnico</SelectItem>
                             <SelectItem value="Tecnólogo">Tecnólogo</SelectItem>
                             <SelectItem value="Profesional">Profesional</SelectItem>
                             <SelectItem value="Maestría">Maestría</SelectItem>
                          </SelectContent>
                       </Select>
                    </div>

                    {/* Age Filter */}
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase opacity-40 ml-1">Edad</label>
                       <div className="flex gap-2">
                          <select 
                             className="flex-[2] bg-background/50 border-none rounded-xl text-[11px] px-2 focus:outline-none focus:ring-1 focus:ring-primary/20 h-10 overflow-hidden text-ellipsis"
                             value={filterAge.operator}
                             onChange={e => setFilterAge({...filterAge, operator: e.target.value})}
                          >
                             <option value="all">Todas</option>
                             <option value="greater">Mayor que</option>
                             <option value="greater_equal">Mayor o igual que</option>
                             <option value="less">Menor que</option>
                             <option value="less_equal">Menor o igual que</option>
                             <option value="between">Entre dos edades</option>
                             <option value="equal">Exactamente</option>
                          </select>
                          {filterAge.operator !== 'all' && (
                             <input 
                               type="number" 
                               className="w-14 bg-background/50 border-none rounded-xl text-xs px-1 text-center h-10 focus:outline-none"
                               value={filterAge.value}
                               onChange={e => setFilterAge({...filterAge, value: parseInt(e.target.value) || 0})}
                             />
                          )}
                          {filterAge.operator === 'between' && (
                             <>
                               <span className="flex items-center text-xs opacity-50">-</span>
                               <input 
                                 type="number" 
                                 className="w-14 bg-background/50 border-none rounded-xl text-xs px-1 text-center h-10 focus:outline-none"
                                 value={filterAge.value2}
                                 onChange={e => setFilterAge({...filterAge, value2: parseInt(e.target.value) || 0})}
                               />
                             </>
                          )}
                       </div>
                    </div>

                    {/* Internals Filter */}
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase opacity-40 ml-1">Origen (MIRA)</label>
                       <select 
                          className="w-full bg-background/50 border-none rounded-xl text-xs px-3 focus:outline-none focus:ring-1 focus:ring-primary/20 h-10"
                          value={filterInternal}
                          onChange={e => setFilterInternal(e.target.value)}
                       >
                          <option value="all">Todos (Int/Ext)</option>
                          <option value="true">Solo Internos</option>
                          <option value="false">Solo Externos</option>
                       </select>
                    </div>

                    <div className="space-y-2 lg:col-span-4">
                       <label className="text-[10px] font-black uppercase opacity-40 ml-1">Atributos Rápidos</label>
                       <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <Select value={boolFilters.working} onValueChange={val => setBoolFilters(prev => ({...prev, working: val}))}>
                             <SelectTrigger className="glass-dark border-none rounded-xl h-10">
                                <span className="truncate">{boolFilters.working === 'all' ? 'Trabaja? (Todos)' : boolFilters.working === 'yes' ? 'Sí Trabaja' : 'No Trabaja'}</span>
                             </SelectTrigger>
                             <SelectContent>
                                <SelectItem value="all">Trabaja? (Todos)</SelectItem>
                                <SelectItem value="yes">Sí Trabaja</SelectItem>
                                <SelectItem value="no">No Trabaja</SelectItem>
                             </SelectContent>
                          </Select>

                          <Select value={boolFilters.entrepreneur} onValueChange={val => setBoolFilters(prev => ({...prev, entrepreneur: val}))}>
                             <SelectTrigger className="glass-dark border-none rounded-xl h-10">
                                <span className="truncate">{boolFilters.entrepreneur === 'all' ? 'Emprendedor? (Todos)' : boolFilters.entrepreneur === 'yes' ? 'Sí Emprendedor' : 'No Emprendedor'}</span>
                             </SelectTrigger>
                             <SelectContent>
                                <SelectItem value="all">Emprendedor? (Todos)</SelectItem>
                                <SelectItem value="yes">Sí Emprendedor</SelectItem>
                                <SelectItem value="no">No Emprendedor</SelectItem>
                             </SelectContent>
                          </Select>

                          <Select value={boolFilters.subscribed} onValueChange={val => setBoolFilters(prev => ({...prev, subscribed: val}))}>
                             <SelectTrigger className="glass-dark border-none rounded-xl h-10">
                                <span className="truncate">{boolFilters.subscribed === 'all' ? 'Suscrito a InfoMIRA? (Todos)' : boolFilters.subscribed === 'yes' ? 'Sí Suscrito' : 'No Suscrito'}</span>
                             </SelectTrigger>
                             <SelectContent>
                                <SelectItem value="all">Suscrito a InfoMIRA? (Todos)</SelectItem>
                                <SelectItem value="yes">Sí Suscrito</SelectItem>
                                <SelectItem value="no">No Suscrito</SelectItem>
                             </SelectContent>
                          </Select>
                       </div>
                       <div className="flex justify-end pt-2">
                          <Button 
                             size="sm" 
                             variant="ghost" 
                             onClick={() => {
                               setSearchTerm(''); setFilterCommune('all'); setFilterGender('all'); 
                               setFilterEducation('all');
                               setBoolFilters({working:'all', entrepreneur:'all', organization:'all', subscribed:'all'});
                               setFilterAge({operator:'all', value:18, value2:25});
                               setFilterInternal('all'); setFilterMilitary('all'); setFilterHQ('all'); setFilterStudyArea('all');
                               setFilterTalent('all');
                             }}
                             className="h-8 rounded-lg text-[10px] font-black uppercase tracking-tight px-3 text-rose-500 hover:bg-rose-500/10"
                          >
                             Limpiar Filtros
                          </Button>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase opacity-40 ml-1">Sit. Militar</label>
                       <Select value={filterMilitary} onValueChange={setFilterMilitary}>
                          <SelectTrigger className="glass-dark border-none rounded-xl h-10">
                             <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="glass-dark border-foreground/10">
                             <SelectItem value="all">Todos</SelectItem>
                             <SelectItem value="Tiene libreta militar">Tiene libreta militar</SelectItem>
                             <SelectItem value="No la tiene">No la tiene</SelectItem>
                             <SelectItem value="Está en trámite">Está en trámite</SelectItem>
                          </SelectContent>
                       </Select>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase opacity-40 ml-1">Sede (Iglesia)</label>
                        <Select value={filterHQ} onValueChange={setFilterHQ} disabled={filterInternal === 'false'}>
                           <SelectTrigger className="glass-dark border-none rounded-xl h-10">
                              <span className="truncate">{filterHQ === 'all' ? 'Sede' : filterHQ}</span>
                           </SelectTrigger>
                           <SelectContent className="glass-dark border-foreground/10 max-h-[300px]">
                              <SelectItem value="all">Todas las Sedes</SelectItem>
                              {[
                                'EL TRONCAL', 'LOS CAMBULOS', 'LOS LAGOS', 'POPULAR',
                                'PASOANCHO', 'MONTEBELLO', 'PACARA', 'BUITRERA',
                                'BELLA SUIZA', 'TERRÓN COLORADO', 'TERRANOVA (Jamundí)',
                                'EL PILOTO (Jamundí)', 'YUMBO', 'OTRO'
                              ].map(hq => (
                                 <SelectItem key={hq} value={hq}>{hq}</SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase opacity-40 ml-1">Área de Estudio</label>
                       <Select value={filterStudyArea} onValueChange={setFilterStudyArea}>
                          <SelectTrigger className="glass-dark border-none rounded-xl h-10">
                             <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="glass-dark border-foreground/10 max-h-[300px]">
                             <SelectItem value="all">Todas</SelectItem>
                             {[
                                'Tecnología / TI', 'Derecho y Ciencias Políticas', 'Salud / Medicina',
                                'Ingeniería', 'Arte / Diseño', 'Administración y Negocios',
                                'Servicio al Cliente y Ventas', 'Educación', 'Comunicación / Marketing',
                                'Logística y Operación', 'Otra'
                             ].map(area => (
                                <SelectItem key={area} value={area}>{area}</SelectItem>
                             ))}
                          </SelectContent>
                       </Select>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase opacity-40 ml-1">Talento / Habilidad</label>
                       <Select value={filterTalent} onValueChange={setFilterTalent}>
                          <SelectTrigger className="glass-dark border-none rounded-xl h-10">
                             <span className="truncate">{filterTalent === 'all' ? 'Todos los Talentos' : filterTalent}</span>
                          </SelectTrigger>
                          <SelectContent className="glass-dark border-foreground/10 max-h-[300px]">
                             <SelectItem value="all">Todos los Talentos</SelectItem>
                             {TALENTS_CATEGORIES.map(category => (
                               <div key={category.category}>
                                 <div className="px-2 py-1 text-[10px] uppercase font-black opacity-50 bg-foreground/5">{category.category}</div>
                                 {category.options.map(opt => (
                                   <SelectItem key={opt} value={opt} className="pl-4">{opt}</SelectItem>
                                 ))}
                               </div>
                             ))}
                          </SelectContent>
                       </Select>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase opacity-40 ml-1">Temas de Interés</label>
                       <Select value={filterInterest} onValueChange={setFilterInterest}>
                          <SelectTrigger className="glass-dark border-none rounded-xl h-10">
                             <span className="truncate">{filterInterest === 'all' ? 'Todos' : filterInterest}</span>
                          </SelectTrigger>
                          <SelectContent className="glass-dark border-foreground/10 max-h-[300px]">
                             <SelectItem value="all">Todos</SelectItem>
                             {INTERESTS.map(i => (
                               <SelectItem key={i} value={i}>{i}</SelectItem>
                             ))}
                          </SelectContent>
                       </Select>
                    </div>
                 </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        {/* Table Wrapper with Scroll hint */}
        <div className="relative group">
          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-4">
            <Table>
              <TableHeader>
                <TableRow className="border-foreground/5 hover:bg-transparent">
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest opacity-40 h-14">Participante</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest opacity-40 h-14 text-center">Edad</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest opacity-40 h-14">Zona</TableHead>
                  <TableHead className="hidden md:table-cell font-bold text-[10px] uppercase tracking-widest opacity-40 h-14">Documento</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest opacity-40 h-14 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-white/5 animate-pulse">
                      <TableCell colSpan={5} className="h-20 bg-white/5 rounded-xl border-y-4 border-transparent" />
                    </TableRow>
                  ))
                ) : registros.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-64 text-center">
                      <div className="flex flex-col items-center gap-3 opacity-20 transform -translate-y-4">
                         <Search className="w-16 h-16" />
                         <p className="font-black uppercase tracking-[0.3em] text-[10px] italic">Sin resultados para estos filtros</p>
                         <Button variant="link" size="sm" onClick={() => {
                            setSearchTerm(''); setFilterCommune('all'); setFilterGender('all'); 
                            setFilterEducation('all');
                            setBoolFilters({working:'all', entrepreneur:'all', organization:'all', subscribed:'all'});
                            setFilterAge({operator:'all', value:18, value2:25});
                            setFilterInternal('all'); setFilterMilitary('all'); setFilterHQ('all'); setFilterStudyArea('all');
                            setFilterTalent('all');
                         }}>Limpiar filtros</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  registros.map((registro, idx) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: idx * 0.03 }}
                      key={registro.id} 
                      className="group border-foreground/5 hover:bg-foreground/[0.03] transition-all cursor-default"
                    >
                      <TableCell className="h-20 min-w-[200px]">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-xs text-primary shadow-sm border border-primary/5 group-hover:rotate-3 transition-transform">
                              {registro.first_name[0]}{registro.last_name[0]}
                           </div>
                           <div className="flex flex-col min-w-0">
                              <span className="font-black tracking-tight text-sm uppercase group-hover:text-primary transition-colors truncate">
                                 {registro.first_name} {registro.last_name}
                              </span>
                              <span className="text-[10px] opacity-40 font-mono italic truncate">{registro.email}</span>
                              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                {registro.certificate_sent ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                    <CheckCircle2 className="w-2.5 h-2.5" /> Certificado Enviado
                                  </span>
                                ) : registro.certificate_status === 'pending_quota' ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                    <AlertTriangle className="w-2.5 h-2.5" /> En espera (Cupo)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-foreground/5 text-muted-foreground border border-foreground/10">
                                    <Mail className="w-2.5 h-2.5" /> Sin enviar
                                  </span>
                                )}

                                {((typeof registro.age === 'number' && registro.age < 18) || registro.guardian_phone) && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                    <HeartHandshake className="w-2.5 h-2.5" /> Menor ({registro.guardian_relationship || 'Acudiente'})
                                  </span>
                                )}
                              </div>
                           </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center h-20 w-16">
                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-foreground/5 font-black text-xs">
                          {registro.age}
                        </div>
                      </TableCell>
                      <TableCell className="h-20 min-w-[140px]">
                         <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 opacity-70">
                               <MapPin className="w-3.5 h-3.5 text-primary" />
                               <span className="text-[11px] font-black uppercase tracking-tight">{registro.commune}</span>
                            </div>
                            <span className="text-[9px] font-bold opacity-30 truncate uppercase pl-5">{registro.neighborhood}</span>
                         </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell h-20 min-w-[150px]">
                         <div className="flex flex-col">
                            <span className="text-[9px] font-bold uppercase opacity-30 leading-none mb-1">{registro.document_type}</span>
                            <span className="font-mono text-[10px] opacity-70 tracking-widest">{registro.document_number}</span>
                         </div>
                      </TableCell>
                      <TableCell className="text-right h-20 w-24">
                        <div className="flex items-center justify-end gap-1">
                          {/* Botón rápido directo: WhatsApp al Joven */}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl"
                            title={`WhatsApp Joven (${registro.first_name || 'Participante'})`}
                            onClick={() => {
                              if (!registro.phone) {
                                toast.error('Sin número de teléfono registrado');
                                return;
                              }
                              const url = buildYouthWhatsAppUrl(registro);
                              if (url) {
                                window.open(url, '_blank');
                              } else {
                                toast.error('Número de WhatsApp inválido');
                              }
                            }}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>

                          <DropdownMenu>
                           <DropdownMenuTrigger className="outline-none">
                             <div className="inline-flex items-center justify-center h-9 w-9 rounded-xl opacity-40 hover:opacity-100 hover:bg-foreground/5 transition-all">
                               <MoreHorizontal className="h-5 w-5" />
                             </div>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="end" className="glass-dark border-foreground/10 text-foreground w-52 p-2 rounded-2xl shadow-2xl">
                             <DropdownMenuItem 
                               onClick={() => {
                                 setSelectedRecord(registro);
                                 setIsDetailsOpen(true);
                               }}
                               className="gap-3 cursor-pointer focus:bg-primary/20 focus:text-primary rounded-xl py-3 font-bold text-xs"
                             >
                               <div className="p-1.5 bg-primary/10 rounded-lg"><Eye className="h-3.5 w-3.5" /></div> Ver Detalles
                             </DropdownMenuItem>

                             {/* WhatsApp Joven en menú de acciones */}
                             <DropdownMenuItem 
                               onClick={() => {
                                 if (!registro.phone) {
                                   toast.error('Sin número de teléfono registrado');
                                   return;
                                 }
                                 const url = buildYouthWhatsAppUrl(registro);
                                 if (url) window.open(url, '_blank');
                               }}
                               className="gap-3 cursor-pointer text-emerald-500 focus:bg-emerald-500/20 focus:text-emerald-500 rounded-xl py-3 font-bold text-xs"
                             >
                               <div className="p-1.5 bg-emerald-500/10 rounded-lg"><MessageCircle className="h-3.5 w-3.5 text-emerald-500" /></div> WhatsApp Joven
                             </DropdownMenuItem>

                             {/* WhatsApp Acudiente en menú de acciones (si es menor o tiene teléfono de acudiente) */}
                             {((typeof registro.age === 'number' && registro.age < 18) || registro.guardian_phone) && (
                               <DropdownMenuItem 
                                 onClick={() => {
                                   if (!registro.guardian_phone) {
                                     toast.error('Sin número de WhatsApp de acudiente');
                                     return;
                                   }
                                   window.open(buildGuardianWhatsAppUrl(registro), '_blank');
                                 }}
                                 className="gap-3 cursor-pointer text-amber-500 focus:bg-amber-500/20 focus:text-amber-500 rounded-xl py-3 font-bold text-xs"
                               >
                                 <div className="p-1.5 bg-amber-500/10 rounded-lg"><HeartHandshake className="h-3.5 w-3.5 text-amber-500" /></div> WhatsApp Acudiente
                               </DropdownMenuItem>
                             )}

                             <DropdownMenuItem 
                               onClick={() => {
                                 setSelectedRecord(registro);
                                 setIsEditOpen(true);
                               }}
                               className="gap-3 cursor-pointer focus:bg-blue-500/20 focus:text-blue-500 rounded-xl py-3 font-bold text-xs"
                             >
                               <div className="p-1.5 bg-blue-500/10 rounded-lg"><Info className="h-3.5 w-3.5" /></div> Editar Ficha
                             </DropdownMenuItem>
                             <DropdownMenuItem 
                               onClick={() => handleResendCertificate(registro)}
                               className="gap-3 cursor-pointer focus:bg-emerald-500/20 focus:text-emerald-500 rounded-xl py-3 font-bold text-xs"
                             >
                               <div className="p-1.5 bg-emerald-500/10 rounded-lg"><Mail className="h-3.5 w-3.5 text-emerald-500" /></div> Reenviar Certificado
                             </DropdownMenuItem>
                             <DropdownMenuItem 
                               onClick={() => {
                                 setSelectedRecord(registro);
                                 setIsDeleteConfirmOpen(true);
                               }}
                               className="gap-3 cursor-pointer text-rose-500 focus:bg-rose-500/10 focus:text-rose-500 rounded-xl py-3 font-bold text-xs"
                             >
                               <div className="p-1.5 bg-rose-500/10 rounded-lg"><Trash2 className="h-3.5 w-3.5" /></div> Eliminar
                             </DropdownMenuItem>
                           </DropdownMenuContent>
                         </DropdownMenu>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background/10 to-transparent pointer-events-none md:hidden" />
        </div>
      </div>

      {/* Pagination Container */}
      <div className="flex items-center justify-between px-6 md:px-8 py-4 md:py-6 glass rounded-2xl border-none shadow-xl">
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 md:gap-2">
               {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  const p = i + 1;
                  return (
                    <Button 
                      key={p} 
                      variant={currentPage === p ? 'default' : 'ghost'} 
                      size="sm" 
                      className={`w-8 h-8 rounded-lg font-bold ${currentPage === p ? 'shadow-lg mira-blue-glow' : 'opacity-40'}`}
                      onClick={() => setCurrentPage(p)}
                    >
                       {p}
                    </Button>
                  );
               })}
            </div>
            <span className="hidden sm:inline-block text-[10px] font-bold uppercase opacity-30 tracking-widest">
              Página {currentPage} de {totalPages || 1}
            </span>
         </div>
         
         <div className="flex items-center gap-2 md:gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-8 h-8 opacity-40 hover:opacity-100 disabled:opacity-10"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-8 h-8 opacity-40 hover:opacity-100 disabled:opacity-10"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
         </div>
      </div>

      {/* Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl glass-dark border-foreground/10 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black italic tracking-tighter flex items-center gap-2">
              <Info className="w-6 h-6 text-primary" /> DETALLES DEL REGISTRO
            </DialogTitle>
            <DialogDescription className="text-[10px] uppercase font-bold tracking-widest opacity-40">
              Información completa del participante
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <div className="space-y-4">
                <DetailSection title="Información Básica">
                  <DetailItem label="Nombre" value={`${selectedRecord.first_name} ${selectedRecord.last_name}`} />
                  <DetailItem label="Documento" value={`${selectedRecord.document_type} ${selectedRecord.document_number}`} />
                  <DetailItem label="Edad" value={selectedRecord.age === 'N/A' ? 'N/A' : `${selectedRecord.age} años (${new Date(selectedRecord.birth_date).toLocaleDateString()})`} />
                  <DetailItem label="Género" value={selectedRecord.gender} />
                </DetailSection>

                <DetailSection title="Contacto">
                  <DetailItem label="Celular" value={selectedRecord.phone} />
                  <DetailItem label="Correo" value={selectedRecord.email} />
                </DetailSection>

                <DetailSection title="Ubicación">
                  <DetailItem label="Comuna" value={selectedRecord.commune} />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[9px] uppercase font-bold opacity-30 flex items-center gap-1">
                      Barrio 
                      {selectedRecord.commune && NEIGHBORHOODS_BY_COMMUNE[selectedRecord.commune] && !NEIGHBORHOODS_BY_COMMUNE[selectedRecord.commune].includes(selectedRecord.neighborhood) && (
                         <Badge className="h-3 text-[7px] bg-amber-500/20 text-amber-500 border-none px-1">OTRO / MANUAL</Badge>
                      )}
                    </span>
                    <span className="text-sm font-bold text-foreground/80 break-all leading-snug">{selectedRecord.neighborhood || 'N/A'}</span>
                  </div>
                </DetailSection>

                {(selectedRecord.guardian_phone || selectedRecord.guardian_name || selectedRecord.guardian_id_number || (typeof selectedRecord.age === 'number' && selectedRecord.age < 18)) && (
                  <DetailSection title="Acudiente y Contacto Familiar">
                    <DetailItem label="Parentesco" value={selectedRecord.guardian_relationship || 'No especificado'} />
                    <DetailItem label="Nombre Acudiente" value={selectedRecord.guardian_name || 'No especificado'} />
                    {selectedRecord.guardian_id_number && (
                      <DetailItem label="Cédula Acudiente" value={selectedRecord.guardian_id_number} />
                    )}
                    {selectedRecord.guardian_contact_status && (
                      <DetailItem 
                        label="Estado de Consentimiento" 
                        value={
                          selectedRecord.guardian_contact_status === 'authorized' 
                            ? '✅ Permiso OK (Autorizado)' 
                            : selectedRecord.guardian_contact_status === 'contacted' 
                            ? '📩 Ya contactado' 
                            : '⏳ Sin escribir'
                        } 
                      />
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <DetailItem label="WhatsApp Acudiente" value={selectedRecord.guardian_phone ? `+57 ${selectedRecord.guardian_phone}` : 'Sin registrar'} />
                      {selectedRecord.guardian_phone && (
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs h-7 gap-1 font-bold"
                          onClick={() => window.open(buildGuardianWhatsAppUrl(selectedRecord), '_blank')}
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> Chatear
                        </Button>
                      )}
                    </div>
                  </DetailSection>
                )}
              </div>

              <div className="space-y-4">
                <DetailSection title="Perfil Socioeconómico">
                  <DetailItem label="Educación" value={selectedRecord.education_level} />
                  <DetailItem label="Área de Estudio" value={Array.isArray(selectedRecord.study_area) ? selectedRecord.study_area.join(', ') : selectedRecord.study_area || 'No especificada'} />
                  <DetailItem label="Trabaja" value={selectedRecord.is_working ? 'Sí' : 'No'} />
                  <DetailItem label="Profesión" value={selectedRecord.profession} />
                  <DetailItem label="Emprendedor" value={selectedRecord.is_entrepreneur ? `Sí (${selectedRecord.entrepreneur_name || 'N/A'})` : 'No'} />
                </DetailSection>

                <DetailSection title="Participación">
                  <DetailItem label="Tipo" value={selectedRecord.is_internal ? 'Interno' : `Externo ${!['Evento o Actividad', 'Colegio / Universidad', 'Amigo o familiar'].includes(selectedRecord.registration_source) ? `(${selectedRecord.registration_source})` : ''}`} />
                  <DetailItem label="Origen" value={selectedRecord.registration_source} />
                  {selectedRecord.church_headquarters && (
                    <DetailItem label="Sede" value={selectedRecord.church_headquarters} />
                  )}
                  <DetailItem label="Situación Militar" value={selectedRecord.military_status || 'N/A'} />
                  <DetailItem label="InfoMIRA" value={selectedRecord.is_infomira_subscribed ? 'Suscrito' : 'No suscrito'} />
                  <DetailItem label="Organización" value={selectedRecord.is_in_organization ? selectedRecord.organization_name : 'Ninguna'} />
                </DetailSection>

                <DetailSection title="Intereses y Talentos">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold opacity-30">Intereses</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedRecord.interests?.map((i: string) => (
                        <Badge key={i} variant="secondary" className="text-[8px] bg-primary/10 text-primary border-none">{i}</Badge>
                      ))}
                    </div>
                  </div>
                  <DetailItem label="Talentos" value={selectedRecord.talents} />
                </DetailSection>
              </div>

              {selectedRecord.open_comments && (
                <div className="col-span-full">
                  <DetailSection title="Comentarios Adicionales">
                    <p className="text-sm p-4 bg-foreground/5 rounded-xl border border-foreground/5 italic">"{selectedRecord.open_comments}"</p>
                  </DetailSection>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="glass-dark border-rose-500/20">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-rose-500">¿CONFIRMAR ELIMINACIÓN?</DialogTitle>
            <DialogDescription>
              Esta acción es irreversible y eliminará todos los datos de {selectedRecord?.first_name} de la base de datos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsDeleteConfirmOpen(false)}>Cancelar</Button>
            <Button variant="destructive" className="font-bold" onClick={handleDelete}>Eliminar Definitivamente</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditRegistroDialog 
        isOpen={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
        record={selectedRecord} 
        onSaved={fetchRegistros} 
      />
    </div>
  );
}

function FilterBadge({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon?: React.ReactNode }) {
  return (
    <Button 
      size="sm" 
      variant={active ? "default" : "ghost"}
      onClick={onClick}
      className={`h-8 rounded-lg text-[10px] font-black uppercase tracking-tight px-3 transition-all ${active ? 'bg-primary text-white shadow-md' : 'bg-foreground/5 opacity-50 hover:opacity-100'}`}
    >
      {icon && <span className="mr-1.5">{icon}</span>}
      {label}
    </Button>
  );
}

function DetailSection({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h4 className="text-[10px] font-black uppercase tracking-widest text-primary border-b border-primary/20 pb-1">{title}</h4>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string, value: any }) {
  return (
    <div className="flex flex-col min-w-0">
      <span className="text-[9px] uppercase font-bold opacity-30">{label}</span>
      <span className="text-sm font-bold text-foreground/80 break-all leading-snug">{value || 'N/A'}</span>
    </div>
  );
}
