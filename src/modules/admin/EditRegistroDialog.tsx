import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { CALI_COMMUNES, NEIGHBORHOODS_BY_COMMUNE, EDUCATION_LEVELS } from '@/constants/cali';

const CHURCH_HEADQUARTERS = [
  'EL TRONCAL',
  'LOS CAMBULOS',
  'LOS LAGOS',
  'POPULAR',
  'PASOANCHO',
  'MONTEBELLO',
  'PACARA',
  'BUITRERA',
  'BELLA SUIZA',
  'TERRÓN COLORADO',
  'TERRANOVA (Jamundí)',
  'EL PILOTO (Jamundí)',
  'YUMBO',
  'OTRO'
];

export function EditRegistroDialog({ isOpen, onClose, record, onSaved }: { isOpen: boolean, onClose: () => void, record: any, onSaved: () => void }) {
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (record) {
      setFormData({
        phone: record.phone || '',
        email: record.email || '',
        commune: record.commune || '',
        neighborhood: record.neighborhood || '',
        education_level: record.education_level || '',
        is_working: record.is_working || false,
        profession: record.profession || '',
        is_entrepreneur: record.is_entrepreneur || false,
        entrepreneur_name: record.entrepreneur_name || '',
        is_in_organization: record.is_in_organization || false,
        organization_name: record.organization_name || '',
        is_internal: record.is_internal || false,
        church_headquarters: record.church_headquarters || '',
        is_infomira_subscribed: record.is_infomira_subscribed || false,
        guardian_relationship: record.guardian_relationship || '',
        guardian_name: record.guardian_name || '',
        guardian_phone: record.guardian_phone || '',
      });
    }
  }, [record]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => {
      const newData = { ...prev, [field]: value };
      if (field === 'commune') {
        newData.neighborhood = '';
      }
      return newData;
    });
  };

  const handleSave = async () => {
    if (!record || !record.id) return;
    setLoading(true);
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      
      const payload = { ...formData };
      
      // Cleanup conditionally
      if (!payload.is_entrepreneur) payload.entrepreneur_name = null;
      if (!payload.is_in_organization) payload.organization_name = null;
      if (!payload.is_internal) payload.church_headquarters = null;

      const { error } = await supabase
        .from('characterization_records')
        .update(payload)
        .eq('id', record.id);

      if (error) throw error;
      
      toast.success('Registro actualizado exitosamente');
      onSaved();
      onClose();
    } catch (error: any) {
      toast.error('Error al actualizar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!record) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] glass-dark border-foreground/10 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase text-primary">Editar Registro</DialogTitle>
          <DialogDescription>
            Modifique los datos de {record.first_name} {record.last_name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4 text-sm">
          {/* Contacto */}
          <div className="space-y-2">
            <Label className="font-bold opacity-70">Teléfono</Label>
            <Input 
              value={formData.phone} 
              onChange={e => handleChange('phone', e.target.value)} 
              className="bg-background/50 border-none"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bold opacity-70">Email</Label>
            <Input 
              value={formData.email} 
              onChange={e => handleChange('email', e.target.value)} 
              className="bg-background/50 border-none"
            />
          </div>

          {/* Ubicación */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-bold opacity-70">Comuna</Label>
              <Select value={formData.commune || ''} onValueChange={val => handleChange('commune', val)}>
                <SelectTrigger className="bg-background/50 border-none">
                  <SelectValue placeholder="Seleccione comuna" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] bg-background/95 backdrop-blur-xl border border-foreground/10 shadow-2xl z-[100]">
                  {CALI_COMMUNES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="font-bold opacity-70">Barrio</Label>
              <Select value={formData.neighborhood || ''} onValueChange={val => handleChange('neighborhood', val)} disabled={!formData.commune}>
                <SelectTrigger className="bg-background/50 border-none">
                  <SelectValue placeholder="Seleccione barrio" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] bg-background/95 backdrop-blur-xl border border-foreground/10 shadow-2xl z-[100]">
                  {formData.commune && NEIGHBORHOODS_BY_COMMUNE[formData.commune]?.map(n => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="h-px bg-border/50 my-2" />
          
          {/* Acudiente */}
          <div className="space-y-3 p-3 rounded-2xl bg-foreground/[0.03] border border-foreground/5">
            <Label className="font-black text-xs uppercase text-primary tracking-wider block">
              Datos del Acudiente (Menor de Edad)
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold opacity-70">Parentesco</Label>
                <Input 
                  value={formData.guardian_relationship || ''} 
                  placeholder="Mamá / Papá / Tutor"
                  onChange={e => handleChange('guardian_relationship', e.target.value)} 
                  className="bg-background/50 border-none text-xs h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-bold opacity-70">Nombre</Label>
                <Input 
                  value={formData.guardian_name || ''} 
                  placeholder="Nombre completo"
                  onChange={e => handleChange('guardian_name', e.target.value)} 
                  className="bg-background/50 border-none text-xs h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-bold opacity-70">WhatsApp</Label>
                <Input 
                  value={formData.guardian_phone || ''} 
                  placeholder="3001234567"
                  onChange={e => handleChange('guardian_phone', e.target.value.replace(/\D/g, ''))} 
                  className="bg-background/50 border-none text-xs h-9 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-border/50 my-2" />
          
          {/* Nivel Educativo */}
          <div className="space-y-2">
             <Label className="font-bold opacity-70">Nivel Educativo</Label>
             <Select value={formData.education_level || ''} onValueChange={val => handleChange('education_level', val)}>
               <SelectTrigger className="bg-background/50 border-none">
                 <SelectValue placeholder="Seleccione nivel" />
               </SelectTrigger>
               <SelectContent className="max-h-[200px] bg-background/95 backdrop-blur-xl border border-foreground/10 shadow-2xl z-[100]">
                 {EDUCATION_LEVELS.map(level => (
                   <SelectItem key={level} value={level}>{level}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
          </div>

          <div className="h-px bg-border/50 my-2" />

          {/* InfoMIRA */}
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox"
              id="infomira" 
              className="w-4 h-4 accent-primary cursor-pointer"
              checked={formData.is_infomira_subscribed}
              onChange={e => handleChange('is_infomira_subscribed', e.target.checked)}
            />
            <Label htmlFor="infomira" className="font-bold cursor-pointer">¿Suscrito a InfoMIRA?</Label>
          </div>

          {/* Trabajo */}
          <div className="flex items-center space-x-2 mt-2">
            <input 
              type="checkbox"
              id="working" 
              className="w-4 h-4 accent-primary cursor-pointer"
              checked={formData.is_working}
              onChange={e => handleChange('is_working', e.target.checked)}
            />
            <Label htmlFor="working" className="font-bold cursor-pointer">¿Labora actualmente?</Label>
          </div>
          {formData.is_working && (
            <div className="space-y-2 pl-6">
              <Label className="font-bold opacity-70">Profesión u Ocupación</Label>
              <Input 
                value={formData.profession} 
                onChange={e => handleChange('profession', e.target.value)} 
                className="bg-background/50 border-none"
              />
            </div>
          )}

          <div className="h-px bg-border/50 my-2" />

          {/* Emprendedor */}
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox"
              id="entrepreneur" 
              className="w-4 h-4 accent-primary cursor-pointer"
              checked={formData.is_entrepreneur}
              onChange={e => handleChange('is_entrepreneur', e.target.checked)}
            />
            <Label htmlFor="entrepreneur" className="font-bold cursor-pointer">¿Tiene Emprendimiento?</Label>
          </div>
          {formData.is_entrepreneur && (
            <div className="space-y-2 pl-6">
              <Label className="font-bold opacity-70">Nombre del Emprendimiento</Label>
              <Input 
                value={formData.entrepreneur_name} 
                onChange={e => handleChange('entrepreneur_name', e.target.value)} 
                className="bg-background/50 border-none"
              />
            </div>
          )}

          <div className="h-px bg-border/50 my-2" />

          {/* Organizacion */}
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox"
              id="organization" 
              className="w-4 h-4 accent-primary cursor-pointer"
              checked={formData.is_in_organization}
              onChange={e => handleChange('is_in_organization', e.target.checked)}
            />
            <Label htmlFor="organization" className="font-bold cursor-pointer">¿Pertenece a una Organización?</Label>
          </div>
          {formData.is_in_organization && (
            <div className="space-y-2 pl-6">
              <Label className="font-bold opacity-70">Nombre de Organización</Label>
              <Input 
                value={formData.organization_name} 
                onChange={e => handleChange('organization_name', e.target.value)} 
                className="bg-background/50 border-none"
              />
            </div>
          )}

          <div className="h-px bg-border/50 my-2" />

          {/* Origen */}
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox"
              id="internal" 
              className="w-4 h-4 accent-primary cursor-pointer"
              checked={formData.is_internal}
              onChange={e => handleChange('is_internal', e.target.checked)}
            />
            <Label htmlFor="internal" className="font-bold cursor-pointer">¿Es de la Iglesia?</Label>
          </div>
          {formData.is_internal && (
            <div className="space-y-2 pl-6">
               <Label className="font-bold opacity-70">Sede</Label>
               <Select value={formData.church_headquarters || ''} onValueChange={val => handleChange('church_headquarters', val)}>
                 <SelectTrigger className="bg-background/50 border-none">
                   <SelectValue placeholder="Seleccione sede" />
                 </SelectTrigger>
                 <SelectContent className="max-h-[200px] bg-background/95 backdrop-blur-xl border border-foreground/10 shadow-2xl z-[100]">
                   {CHURCH_HEADQUARTERS.map(hq => (
                     <SelectItem key={hq} value={hq}>{hq}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
               {formData.church_headquarters === 'OTRO' && (
                  <Input 
                    placeholder="Escriba la sede..." 
                    value={formData.church_headquarters} 
                    onChange={e => handleChange('church_headquarters', e.target.value)} 
                    className="bg-background/50 border-none mt-2"
                  />
               )}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
