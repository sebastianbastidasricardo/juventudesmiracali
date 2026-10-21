import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LabelList, Legend
} from 'recharts';
import { Users, UserPlus, MapPin, GraduationCap, TrendingUp, Activity, Sparkles, Zap, Shield, Filter, Building, Church } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { calculateAge } from '@/utils/validators';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
  const [allData, setAllData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalSedeFilter, setGlobalSedeFilter] = useState('all');
  const [globalComunaFilter, setGlobalComunaFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      if (!supabase) return;

      const { data, error } = await supabase
        .from('characterization_records')
        .select(`
          gender, 
          commune, 
          neighborhood, 
          birth_date, 
          created_at, 
          interests, 
          talents,
          education_level, 
          is_working, 
          is_entrepreneur, 
          is_in_organization, 
          is_infomira_subscribed,
          military_status,
          church_headquarters,
          study_area,
          is_internal,
          certificate_sent,
          certificate_sent_at,
          certificate_status,
          certificate_code,
          first_name,
          last_name,
          document_type,
          document_number,
          email
        `);

      if (error) {
        console.error('Supabase error fetching dashboard stats:', error);
      }

      if (data) {
        const enrichedData = data.map(d => ({
          ...d,
          age: calculateAge(d.birth_date),
          study_area: d.study_area || []
        }));
        setAllData(enrichedData);
      }
      setLoading(false);
    };

    fetchData();

    const channel = supabase
      ?.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'characterization_records' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      if (channel) supabase?.removeChannel(channel);
    };
  }, []);

  const filteredData = useMemo(() => {
    return allData.filter(d => {
       if (globalComunaFilter !== 'all' && d.commune !== globalComunaFilter) return false;
       if (globalSedeFilter !== 'all' && d.church_headquarters !== globalSedeFilter) return false;
       return true;
    });
  }, [allData, globalComunaFilter, globalSedeFilter]);

  const filterOptions = useMemo(() => {
    const sedes = new Set<string>();
    const comunas = new Set<string>();
    allData.forEach(d => {
      if (d.church_headquarters) sedes.add(d.church_headquarters);
      if (d.commune) comunas.add(d.commune);
    });
    return {
      sedes: Array.from(sedes).sort(),
      comunas: Array.from(comunas).sort((a, b) => {
         const numA = parseInt(a.replace(/\D/g, '')) || 0;
         const numB = parseInt(b.replace(/\D/g, '')) || 0;
         if (numA && numB) return numA - numB;
         return a.localeCompare(b);
      })
    };
  }, [allData]);

  // Generate Stats from currently filtered data
  const stats = useMemo(() => {
    const total = filteredData.length;
    const genres = filteredData.reduce((acc, curr) => { acc[curr.gender] = (acc[curr.gender] || 0) + 1; return acc; }, {});
    const communes = filteredData.reduce((acc, curr) => { acc[curr.commune] = (acc[curr.commune] || 0) + 1; return acc; }, {});
    const neighborhoods = filteredData.reduce((acc, curr) => { acc[curr.neighborhood] = (acc[curr.neighborhood] || 0) + 1; return acc; }, {});
    const education = filteredData.reduce((acc, curr) => { const level = curr.education_level || 'No registra'; acc[level] = (acc[level] || 0) + 1; return acc; }, {});
    const allInterests = filteredData.flatMap(d => d.interests || []);
    const interestStats = allInterests.reduce((acc: any, curr: string) => { acc[curr] = (acc[curr] || 0) + 1; return acc; }, {});
    const allStudyAreas = filteredData.flatMap(d => d.study_area || []);
    const studyAreaStats = allStudyAreas.reduce((acc: any, curr: string) => { acc[curr] = (acc[curr] || 0) + 1; return acc; }, {});
    
    // new charts points
    const military = filteredData.reduce((acc, curr) => { const s = curr.military_status || 'Sin especificar'; acc[s] = (acc[s] || 0) + 1; return acc; }, {});
    const churchHQ = filteredData.filter(d => !!d.church_headquarters).reduce((acc, curr) => { acc[curr.church_headquarters] = (acc[curr.church_headquarters] || 0) + 1; return acc; }, {});

    const talentsStats = filteredData.reduce((acc, curr) => {
      if (curr.talents) {
        const t = curr.talents.toLowerCase().trim();
        acc[t] = (acc[t] || 0) + 1;
      }
      return acc;
    }, {});

    const booleanStats = {
      working: filteredData.filter(d => d.is_working).length,
      entrepreneur: filteredData.filter(d => d.is_entrepreneur).length,
      organization: filteredData.filter(d => d.is_in_organization).length,
      subscribed: filteredData.filter(d => d.is_infomira_subscribed).length,
    };

    const avgAge = filteredData.reduce((sum, d) => sum + (d.age || 0), 0) / (total || 1);

    const toSortedChartData = (obj: any, limit = 10) => Object.entries(obj).map(([name, value]) => ({ name, value: value as number })).sort((a: any, b: any) => b.value - a.value).slice(0, limit);

    const todayStr = new Date().toDateString();
    const certsToday = allData.filter(d => d.certificate_sent && d.certificate_sent_at && new Date(d.certificate_sent_at).toDateString() === todayStr).length;
    const totalCerts = allData.filter(d => d.certificate_sent).length;
    const pendingQuotaList = allData.filter(d => d.certificate_status === 'pending_quota');

    return {
      total,
      newToday: filteredData.filter(d => new Date(d.created_at).toDateString() === new Date().toDateString()).length,
      certsToday,
      totalCerts,
      pendingQuotaList,
      byGender: Object.entries(genres).map(([name, value]) => ({ name, value: value as number })),
      byCommune: toSortedChartData(communes, 10),
      byCommuneAll: toSortedChartData(communes, 100),
      byNeighborhood: toSortedChartData(neighborhoods, 8),
      byInterest: toSortedChartData(interestStats, 10),
      byStudyArea: toSortedChartData(studyAreaStats, 10),
      byTalents: toSortedChartData(talentsStats, 8),
      byEducation: Object.entries(education).map(([name, value]) => ({ name, value: value as number })).sort((a: any, b: any) => b.value - a.value),
      byMilitary: toSortedChartData(military, 5),
      byChurchHQ: toSortedChartData(churchHQ, 10),
      byChurchHQAll: toSortedChartData(churchHQ, 100),
      boolAnalytics: booleanStats,
      ageDistribution: [
        { range: '14-17', count: filteredData.filter(d => d.age < 18).length },
        { range: '18-21', count: filteredData.filter(d => d.age >= 18 && d.age <= 21).length },
        { range: '22-25', count: filteredData.filter(d => d.age >= 22 && d.age <= 25).length },
        { range: '26-28', count: filteredData.filter(d => d.age > 25).length },
        { range: '29+', count: filteredData.filter(d => d.age > 28).length }
      ],
      avgAge: avgAge.toFixed(1)
    };
  }, [filteredData]);

  const COLORS = ['#4f46e5', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  if (loading) {
     return (
        <div className="h-[60vh] flex items-center justify-center">
           <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
              <Zap className="w-10 h-10 text-primary opacity-20" />
           </motion.div>
        </div>
     );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <h1 className="text-3xl font-black tracking-tighter flex items-center gap-2">CENTRAL DE DATOS</h1>
           <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-[0.3em]">Comando de Caracterización Juvenil • Cali</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Select value={globalSedeFilter} onValueChange={setGlobalSedeFilter}>
              <SelectTrigger className="glass border-none rounded-xl min-w-[160px]">
                 <span className="truncate">{globalSedeFilter === 'all' ? 'Sede' : globalSedeFilter}</span>
              </SelectTrigger>
              <SelectContent className="max-h-[300px] z-[100] bg-background/95 backdrop-blur-xl border border-foreground/10">
                <SelectItem value="all">Todas las Sedes</SelectItem>
                {filterOptions.sedes.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={globalComunaFilter} onValueChange={setGlobalComunaFilter}>
              <SelectTrigger className="glass border-none rounded-xl min-w-[160px]">
                 <span className="truncate">{globalComunaFilter === 'all' ? 'Comuna' : globalComunaFilter}</span>
              </SelectTrigger>
              <SelectContent className="max-h-[300px] z-[100] bg-background/95 backdrop-blur-xl border border-foreground/10">
                <SelectItem value="all">Todas las Comunas</SelectItem>
                {filterOptions.comunas.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 px-4 py-3 glass rounded-xl h-full">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Sincronización Activa</span>
            </div>
        </div>
      </div>

      {/* Main Stats Bento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <MetricCard 
          title="Total Caracterizados" 
          value={stats.total.toLocaleString()} 
          icon={<Users className="w-5 h-5" />} 
          description="Resultados del filtro"
          trend="Filtrado"
        />
        <MetricCard 
          title="Nuevos (24h)" 
          value={stats.newToday.toString()} 
          icon={<UserPlus className="w-5 h-5" />} 
          description="Últimas 24h (en filtro)"
          highlight
        />
        <MetricCard 
          title="Top Territorial" 
          value={stats.byCommune[0]?.name || '---'} 
          icon={<MapPin className="w-5 h-5" />} 
          description="Mayor participación local"
        />
        <MetricCard 
          title="Media de Edad" 
          value={stats.avgAge} 
          icon={<Activity className="w-5 h-5" />} 
          description="Promedio en filtro"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* NEW: Situacion Militar */}
        <Card className="glass border-none shadow-xl p-4 md:p-6">
           <CardHeader className="px-0 pt-0 mb-4">
              <CardTitle className="text-sm font-black uppercase flex items-center gap-2"><Shield className="w-4 h-4 text-emerald-500"/> Situación Militar</CardTitle>
           </CardHeader>
           <div className="h-32">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={stats.byMilitary} cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={2} dataKey="value">
                   {stats.byMilitary.map((_, i) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />)}
                 </Pie>
                 <ReTooltip />
               </PieChart>
             </ResponsiveContainer>
           </div>
           <div className="grid grid-cols-1 gap-2 mt-2">
              {stats.byMilitary.map((g, i) => (
                 <div key={g.name} className="flex justify-between items-center bg-foreground/5 px-3 py-1.5 rounded-lg">
                    <span className="text-[10px] font-bold opacity-70 uppercase truncate">{g.name}</span>
                    <span className="text-xs font-black">{g.value}</span>
                 </div>
              ))}
           </div>
        </Card>

        {/* NEW: Church HQ Distribution */}
        <Card className="lg:col-span-2 glass border-none shadow-2xl p-4 md:p-6">
           <CardHeader className="px-0 pt-0">
             <CardTitle className="text-lg md:text-xl font-black tracking-tight flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-500" /> DISPERSIÓN DE SEDES 
             </CardTitle>
             <CardDescription className="text-[10px] uppercase font-bold tracking-widest opacity-50">Distribución de asistencia interna</CardDescription>
           </CardHeader>
           <CardContent className="px-0 h-48 md:h-64 pt-6">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={stats.byChurchHQ} layout="vertical">
                 <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--chart-grid)" />
                 <XAxis type="number" hide />
                 <YAxis dataKey="name" type="category" width={120} fontSize={9} tick={{ fill: 'var(--chart-label)', fontWeight: 700 }} />
                 <ReTooltip contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: '12px', fontSize: '10px' }} />
                 <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20}>
                   <LabelList dataKey="value" position="right" fontSize={9} fontWeight={800} fill="#6366f1" offset={8} />
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </CardContent>
        </Card>

        {/* Geographic Analytics */}
        <Card className="lg:col-span-2 glass border-none shadow-2xl p-4 md:p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg md:text-xl font-black tracking-tight flex items-center gap-2">
               <MapPin className="w-5 h-5 text-primary" /> PARTICIPACIÓN POR ZONAS
            </CardTitle>
            <CardDescription className="text-[10px] uppercase font-bold tracking-widest opacity-50">Distribución por Comunas (Top 10)</CardDescription>
          </CardHeader>
          <CardContent className="px-0 h-64 md:h-80 pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byCommune} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--chart-grid)" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} fontSize={10} tick={{ fill: 'var(--chart-label)', fontWeight: 700 }} />
                <ReTooltip 
                  cursor={{ fill: 'var(--chart-grid)' }}
                  contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: '12px', fontSize: '10px' }} 
                />
                <Bar dataKey="value" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={20}>
                  <LabelList dataKey="value" position="right" fontSize={9} fontWeight={800} fill="var(--primary)" offset={8} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Binary Stats (Cards) */}
        <div className="space-y-4">
           <Card className="glass border-none shadow-xl p-6">
              <div className="flex justify-between items-center mb-4">
                 <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40">Perfil Social</h4>
                 <Activity className="w-4 h-4 text-primary" />
              </div>
              <div className="space-y-4">
                 <StatLine label="Trabajan" value={stats.boolAnalytics.working} total={stats.total} color="bg-blue-500" />
                 <StatLine label="Emprendores" value={stats.boolAnalytics.entrepreneur} total={stats.total} color="bg-emerald-500" />
                 <StatLine label="En Organizaciones" value={stats.boolAnalytics.organization} total={stats.total} color="bg-amber-500" />
                 <StatLine label="InfoMIRA" value={stats.boolAnalytics.subscribed} total={stats.total} color="bg-rose-500" />
              </div>
           </Card>

           <Card className="glass border-none shadow-xl p-6">
              <CardHeader className="px-0 pt-0 mb-4">
                 <CardTitle className="text-sm font-black uppercase">Género</CardTitle>
              </CardHeader>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.byGender} cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={5} dataKey="value">
                      {stats.byGender.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <ReTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                 {stats.byGender.map((g, i) => (
                    <div key={g.name} className="flex flex-col">
                       <span className="text-[8px] font-bold opacity-40 uppercase truncate">{g.name}</span>
                       <span className="text-xs font-black">{g.value}</span>
                    </div>
                 ))}
              </div>
           </Card>
        </div>

        {/* NEW: Area de Estudio/Exp */}
        <Card className="lg:col-span-3 glass border-none shadow-2xl p-4 md:p-6">
           <CardHeader className="px-0 pt-0">
             <CardTitle className="text-lg md:text-xl font-black tracking-tight flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-amber-500" /> ÁREAS DE ESTUDIO / EXPERIENCIA
             </CardTitle>
             <CardDescription className="text-[10px] uppercase font-bold tracking-widest opacity-50">Sectores de capacitación predominantes</CardDescription>
           </CardHeader>
           <CardContent className="px-0 h-64 md:h-80 pt-6">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={stats.byStudyArea}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                 <XAxis dataKey="name" fontSize={9} interval={0} tick={{ fill: 'var(--chart-label)', fontWeight: 700 }} />
                 <YAxis hide />
                 <ReTooltip contentStyle={{ borderRadius: '12px', fontSize: '10px' }} />
                 <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="value" position="top" fontSize={9} fontWeight={800} fill="#f59e0b" offset={6} />
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </CardContent>
        </Card>

        {/* Interests Analysis */}
        <Card className="lg:col-span-2 glass border-none shadow-2xl p-4 md:p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg md:text-xl font-black tracking-tight flex items-center gap-2">
               <Sparkles className="w-5 h-5 text-secondary" /> TEMAS DE INTERÉS
            </CardTitle>
            <CardDescription className="text-[10px] uppercase font-bold tracking-widest opacity-50">Lo que más apasiona a los jóvenes</CardDescription>
          </CardHeader>
          <CardContent className="px-0 h-64 md:h-80 pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byInterest}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                <XAxis dataKey="name" fontSize={8} interval={0} tick={{ fill: 'var(--chart-label)', fontWeight: 700 }} />
                <YAxis hide />
                <ReTooltip contentStyle={{ borderRadius: '12px', fontSize: '10px' }} />
                <Bar dataKey="value" fill="var(--secondary)" radius={[4, 4, 0, 0]}>
                   <LabelList dataKey="value" position="top" fontSize={8} fontWeight={800} fill="var(--secondary)" offset={6} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Education & Talents */}
        <div className="grid grid-cols-1 gap-6 md:gap-8">
           <Card className="glass border-none shadow-2xl p-4 md:p-6">
             <CardHeader className="px-0 pt-0">
               <CardTitle className="text-lg md:text-xl font-black tracking-tight">FORMACIÓN</CardTitle>
               <CardDescription className="text-[10px] uppercase font-bold tracking-widest opacity-50">Niveles educativos</CardDescription>
             </CardHeader>
             <CardContent className="px-0 pt-6 space-y-4">
                {stats.byEducation.slice(0, 6).map((e, i) => (
                   <div key={e.name} className="space-y-1">
                      <div className="flex justify-between text-[10px] font-black uppercase">
                         <span className="truncate max-w-[150px]">{e.name}</span>
                         <span>{Math.round((e.value / stats.total) * 100)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-foreground/5 rounded-full overflow-hidden">
                         <div className="h-full bg-primary/40" style={{ width: `${(e.value / stats.total) * 100}%` }} />
                      </div>
                   </div>
                ))}
             </CardContent>
           </Card>
        </div>

        {/* Top Neighborhoods Table-like view */}
        <Card className="glass border-none shadow-2xl p-4 md:p-6 lg:col-span-1">
           <CardHeader className="px-0 pt-0 mb-4">
              <CardTitle className="text-lg font-black tracking-tight">TOP BARRIOS</CardTitle>
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest opacity-50">Zonas específicas</CardDescription>
           </CardHeader>
           <div className="space-y-3">
              {stats.byNeighborhood.map((n: any, i: number) => (
                 <div key={n.name} className="flex items-center justify-between p-3 bg-foreground/5 rounded-xl border border-foreground/5 hover:bg-foreground/10 transition-all">
                    <div className="flex items-center gap-3">
                       <span className="text-[10px] font-black opacity-20">#0{i+1}</span>
                       <span className="text-[11px] font-bold uppercase truncate max-w-[140px]">{n.name}</span>
                    </div>
                    <span className="text-[10px] font-black bg-primary/20 text-primary px-2 py-0.5 rounded-lg">{n.value}</span>
                 </div>
              ))}
           </div>
        </Card>

        {/* Age Distribution */}
        <Card className="lg:col-span-2 glass border-none shadow-2xl p-4 md:p-6">
           <CardHeader className="px-0 pt-0 mb-4">
              <CardTitle className="text-lg font-black tracking-tight">RANGOS ETARIOS</CardTitle>
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest opacity-50">Distribución por edad</CardDescription>
           </CardHeader>
           <div className="h-48 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={stats.ageDistribution}>
                    <defs>
                      <linearGradient id="ageColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                    <XAxis dataKey="range" fontSize={10} fontStyle="italic" />
                    <YAxis hide />
                    <ReTooltip />
                    <Area type="monotone" dataKey="count" stroke="var(--primary)" fillOpacity={1} fill="url(#ageColor)" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </Card>
      </div>
    </div>
  );
}

function StatLine({ label, value, total, color }: any) {
   const percentage = Math.round((value / (total || 1)) * 100);
   return (
      <div className="space-y-1.5">
         <div className="flex justify-between items-end">
            <span className="text-[10px] font-bold uppercase opacity-60 tracking-tight">{label}</span>
            <span className="text-[10px] font-black">{value} ({percentage}%)</span>
         </div>
         <div className="h-1.5 w-full bg-foreground/5 rounded-full overflow-hidden">
            <div className={`h-full ${color}`} style={{ width: `${percentage}%` }} />
         </div>
      </div>
   );
}

function MetricCard({ title, value, icon, description, highlight, trend }: any) {
  return (
    <Card className={`glass border-none shadow-xl group transition-all hover:scale-[1.02] relative overflow-hidden ${highlight ? 'mira-blue-glow' : ''}`}>
      <CardContent className="p-6 relative z-10">
        <div className="flex justify-between items-start mb-4">
           <div className={`p-2.5 rounded-xl ${highlight ? 'bg-primary text-white shadow-lg' : 'bg-foreground/5 border border-foreground/10 text-primary'}`}>
              {icon}
           </div>
           {trend && (
              <div className="flex items-center gap-1 text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                 <TrendingUp className="w-3 h-3" /> {trend}
              </div>
           )}
        </div>
        <div className="space-y-1">
           <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">{title}</h3>
           <div className="text-3xl font-black tracking-tighter transition-all group-hover:text-primary">{value}</div>
           <p className="text-[10px] font-medium opacity-30 mt-2">{description}</p>
        </div>
      </CardContent>
      {highlight && (
         <div className="absolute top-0 right-0 p-4">
            <Sparkles className="w-5 h-5 text-primary/30" />
         </div>
      )}
    </Card>
  );
}

