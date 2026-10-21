import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings, Database, UserCog, Globe, Check, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getPublicBaseUrl } from '@/utils/whatsapp';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [domainUrl, setDomainUrl] = useState<string>('');

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('admin_users')
          .select('*')
          .eq('id', user.id)
          .single();
        setAdminProfile(data);
      }
      setLoading(false);
    };
    fetchProfile();
    setDomainUrl(getPublicBaseUrl());
  }, []);

  const handleSaveDomain = () => {
    if (!domainUrl.trim()) {
      toast.error('Por favor ingresa un dominio válido');
      return;
    }

    let cleaned = domainUrl.trim().replace(/\/+$/, '');
    if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
      cleaned = `https://${cleaned}`;
    }

    localStorage.setItem('public_site_url', cleaned);
    setDomainUrl(cleaned);
    toast.success('¡Dominio público guardado exitosamente!', {
      description: 'Todos los mensajes y enlaces de WhatsApp se generarán con este dominio.'
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Profile Bar */}
      <div className="glass rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 border-none shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <UserCog className="w-32 h-32" />
        </div>
        
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-primary flex items-center justify-center text-4xl font-black text-white shadow-xl rotate-3">
          {adminProfile?.email?.[0].toUpperCase() || '?'}
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-black tracking-tighter uppercase">{adminProfile?.email || 'Admin User'}</h2>
          <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
             <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
               {adminProfile?.role || 'Admin'}
             </span>
             <span className="px-3 py-1 rounded-full bg-foreground/5 text-foreground/50 text-[10px] font-black uppercase tracking-widest border border-foreground/10">
               ID: {adminProfile?.id?.split('-')[0] || '...'}
             </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Dominio Público de Enlaces de WhatsApp */}
        <Card className="glass border-none shadow-xl p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
               <Globe className="w-5 h-5 text-primary" /> DOMINIO PÚBLICO WEB
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Define la URL donde está publicado el sitio (ej. en Cloudflare Pages) para que los enlaces enviados por WhatsApp abran directo a los padres sin errores.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 space-y-4 pt-4">
             <div className="space-y-2">
               <label className="text-xs font-bold text-foreground block">
                 URL Base del Sitio Web:
               </label>
               <div className="flex flex-col sm:flex-row gap-2">
                 <Input 
                   value={domainUrl}
                   onChange={(e) => setDomainUrl(e.target.value)}
                   placeholder="https://miravejuventudescali.pages.dev"
                   className="h-11 font-mono text-xs bg-background/60"
                 />
                 <Button 
                   onClick={handleSaveDomain}
                   className="h-11 px-5 font-bold bg-primary text-white flex items-center justify-center gap-1.5 shrink-0"
                 >
                   <Check className="w-4 h-4" /> Guardar
                 </Button>
               </div>
               <p className="text-[11px] text-muted-foreground pt-1">
                 Ejemplo: <code className="bg-foreground/5 px-1.5 py-0.5 rounded font-mono text-primary font-bold">https://miravejuventudescali.pages.dev</code>
               </p>
             </div>

             <div className="p-3.5 rounded-2xl bg-foreground/5 border border-foreground/5 flex items-center justify-between">
               <div className="text-xs">
                 <span className="text-muted-foreground block text-[10px]">Ejemplo de enlace para padres:</span>
                 <span className="font-mono text-primary text-[11px] font-bold truncate block max-w-xs">
                   {domainUrl || 'https://miravejuventudescali.pages.dev'}/autorizacion/jm_demo123
                 </span>
               </div>
               <a 
                 href={domainUrl ? `${domainUrl}/autorizacion` : 'https://miravejuventudescali.pages.dev/autorizacion'}
                 target="_blank" 
                 rel="noreferrer"
                 className="p-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-all flex items-center gap-1 text-xs font-bold shrink-0 ml-2"
               >
                 <span>Probar</span>
                 <ExternalLink className="w-3.5 h-3.5" />
               </a>
             </div>
          </CardContent>
        </Card>

        {/* API & Connection */}
        <Card className="glass border-none shadow-xl p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
               <Database className="w-5 h-5 text-primary" /> INFRAESTRUCTURA
            </CardTitle>
            <CardDescription className="uppercase text-[10px] font-bold opacity-40">Estado de conexión y base de datos</CardDescription>
          </CardHeader>
          <CardContent className="px-0 space-y-4 pt-4">
             <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-foreground/5 rounded-2xl border border-foreground/5">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-sm font-bold">Supabase Cloud</span>
                   </div>
                   <span className="text-[10px] font-black uppercase opacity-40">Plan Free Conectado</span>
                </div>
                
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                   <div className="flex justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Carga de Base de Datos</span>
                      <span className="text-[10px] font-black">Mínima (Eco-mode)</span>
                   </div>
                   <div className="h-1.5 w-full bg-foreground/5 rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[5%]" />
                   </div>
                   <p className="text-[8px] mt-2 opacity-30 italic">* Registros almacenados de forma segura con cifrado SSL</p>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
