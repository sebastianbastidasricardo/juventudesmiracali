import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  MessageCircle, 
  Copy, 
  Check, 
  Send, 
  ExternalLink, 
  Sparkles, 
  Key, 
  Phone, 
  User, 
  RotateCw,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Edit3,
  HelpCircle,
  Eye,
  Globe
} from 'lucide-react';
import { 
  getGuardianAuthMessageText, 
  getGuardianReminderMessageText, 
  getGuardianWelcomeMessageText, 
  getGuardianEmergencyMessageText,
  getGuardianAuthLink,
  getNormalizedColombianPhone,
  generateGuardianToken,
  getPublicBaseUrl,
  YouthGuardianData 
} from '@/utils/whatsapp';
import { toast } from 'sonner';

interface WhatsAppTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: any | null;
  onUpdateStatus?: (recordId: string, newStatus: 'pending' | 'contacted' | 'authorized') => void;
  onTokenGenerated?: (recordId: string, newToken: string) => void;
}

type TemplateType = 'auth' | 'reminder' | 'welcome' | 'emergency';

const TEMPLATES_INFO: Record<TemplateType, {
  id: TemplateType;
  title: string;
  badge: string;
  shortDesc: string;
  whenToUse: string;
  icon: string;
}> = {
  auth: {
    id: 'auth',
    title: 'Autorización (Link)',
    badge: 'Recomendada',
    shortDesc: 'Firma digital en 30s',
    whenToUse: 'Usa esta plantilla para el primer contacto. Envía el enlace para que el acudiente firme desde su celular.',
    icon: '✍️'
  },
  reminder: {
    id: 'reminder',
    title: 'Recordatorio',
    badge: 'Firma pendiente',
    shortDesc: 'Aviso cordial de firma',
    whenToUse: 'Usa esta plantilla si ya le habías escrito pero aún no ha firmado la autorización.',
    icon: '⏳'
  },
  welcome: {
    id: 'welcome',
    title: 'Bienvenida',
    badge: 'Institucional',
    shortDesc: 'Felicitación y saludo',
    whenToUse: 'Usa esta plantilla para dar la bienvenida oficial a la familia al movimiento Juventudes MIRA Cali.',
    icon: '🏛️'
  },
  emergency: {
    id: 'emergency',
    title: 'Citación / Evento',
    badge: 'Prioritario',
    shortDesc: 'Contacto para actividades',
    whenToUse: 'Usa esta plantilla para coordinar asistencia a talleres, salidas o eventos de liderazgo.',
    icon: '📞'
  }
};

export default function WhatsAppTemplateModal({
  isOpen,
  onClose,
  record,
  onUpdateStatus,
  onTokenGenerated
}: WhatsAppTemplateModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('auth');
  const [customText, setCustomText] = useState<string>('');
  const [customPhone, setCustomPhone] = useState<string>('');
  const [currentToken, setCurrentToken] = useState<string>('');
  const [copiedField, setCopiedField] = useState<'text' | 'link' | 'token' | null>(null);
  const [isEditingText, setIsEditingText] = useState<boolean>(false);
  const [currentDomain, setCurrentDomain] = useState<string>(() => getPublicBaseUrl());
  const [isEditingDomain, setIsEditingDomain] = useState<boolean>(false);
  const [domainInput, setDomainInput] = useState<string>('');

  // Sync state whenever record or modal opens
  useEffect(() => {
    if (record) {
      const activeToken = record.guardian_token || record.id || '';
      const domain = getPublicBaseUrl();
      setCurrentDomain(domain);
      setCurrentToken(activeToken);
      setCustomPhone(record.guardian_phone || '');
      loadTemplateText(selectedTemplate, activeToken, domain);
    }
  }, [record, isOpen]);

  // When template changes, regenerate the text
  const loadTemplateText = (type: TemplateType, tokenToUse?: string, domainToUse?: string) => {
    if (!record) return;
    const token = tokenToUse !== undefined ? tokenToUse : currentToken;
    const domain = domainToUse !== undefined ? domainToUse : currentDomain;
    const enrichedRecord: YouthGuardianData = {
      ...record,
      guardian_token: token,
      guardian_phone: customPhone || record.guardian_phone
    };

    let text = '';
    switch (type) {
      case 'auth':
        text = getGuardianAuthMessageText(enrichedRecord, domain);
        break;
      case 'reminder':
        text = getGuardianReminderMessageText(enrichedRecord, domain);
        break;
      case 'welcome':
        text = getGuardianWelcomeMessageText(enrichedRecord);
        break;
      case 'emergency':
        text = getGuardianEmergencyMessageText(enrichedRecord);
        break;
    }
    setCustomText(text);
  };

  const handleSelectTemplate = (type: TemplateType) => {
    setSelectedTemplate(type);
    loadTemplateText(type);
  };

  if (!record) return null;

  const authLink = getGuardianAuthLink({
    ...record,
    guardian_token: currentToken
  }, currentDomain);

  const normalizedPhone = getNormalizedColombianPhone(customPhone || record.guardian_phone);

  const handleRegenerateToken = () => {
    const newToken = generateGuardianToken();
    setCurrentToken(newToken);
    if (onTokenGenerated) {
      onTokenGenerated(record.id, newToken);
    }
    loadTemplateText(selectedTemplate, newToken);
    toast.success('¡Nuevo token seguro generado!', {
      description: `Token: ${newToken}`
    });
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(customText);
    setCopiedField('text');
    toast.success('¡Mensaje de WhatsApp copiado al portapapeles!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(authLink);
    setCopiedField('link');
    toast.success('¡Enlace del panel de padre copiado!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(currentToken);
    setCopiedField('token');
    toast.success('¡Token copiado!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSendWhatsApp = () => {
    if (!normalizedPhone) {
      toast.error('Por favor escribe un número de teléfono válido para enviar');
      return;
    }

    const whatsappUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(customText)}`;
    window.open(whatsappUrl, '_blank');

    // Automatically update to contacted if it was pending
    if (onUpdateStatus && (!record.guardian_contact_status || record.guardian_contact_status === 'pending')) {
      onUpdateStatus(record.id, 'contacted');
    }

    toast.success('¡Abriendo WhatsApp con la plantilla lista!', {
      description: `Enviando a ${record.guardian_name || 'acudiente'} (+${normalizedPhone})`
    });
  };

  const handleTestParentPortal = () => {
    window.open(authLink, '_blank');
  };

  const formatCommuneName = (communeStr?: string) => {
    if (!communeStr) return 'Cali';
    const c = communeStr.trim();
    if (c.toLowerCase().startsWith('comuna')) return c;
    return `Comuna ${c}`;
  };

  const activeTemplateInfo = TEMPLATES_INFO[selectedTemplate];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="glass-dark border-foreground/10 text-foreground w-[96vw] max-w-2xl max-h-[92vh] overflow-y-auto overflow-x-hidden rounded-3xl p-3 sm:p-6 shadow-2xl">
        
        {/* Cabecera Responsiva */}
        <DialogHeader className="pb-2.5 border-b border-foreground/10 text-left pr-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/25 shrink-0">
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base sm:text-xl font-black uppercase text-foreground truncate">
                Plantilla de WhatsApp
              </DialogTitle>
              <DialogDescription className="text-[11px] sm:text-xs text-muted-foreground truncate">
                Mensaje institucional listo para enviar con enlace tokenizado
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Ficha Rápida del Menor y Acudiente */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-foreground/[0.03] border border-foreground/10 space-y-2 text-xs">
          {/* Fila 1: Menor */}
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-black text-foreground uppercase tracking-tight text-xs sm:text-sm">
                {record.first_name} {record.last_name}
              </span>
              <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold py-0 h-5">
                {record.age} años
              </Badge>
              <span className="text-[11px] text-muted-foreground">
                • {formatCommuneName(record.commune)}
              </span>
            </div>

            {/* Token Badge */}
            <div className="inline-flex items-center gap-1 bg-background/80 px-2 py-0.5 rounded-lg border border-foreground/10 font-mono text-[10px] shrink-0">
              <Key className="w-3 h-3 text-amber-500 shrink-0" />
              <span className="text-muted-foreground font-sans hidden xs:inline">Token:</span>
              <strong className="text-foreground truncate max-w-[90px]">{currentToken || 'No asignado'}</strong>
              <button
                type="button"
                onClick={handleRegenerateToken}
                title="Generar nuevo token"
                className="p-0.5 hover:bg-foreground/10 rounded text-muted-foreground hover:text-foreground"
              >
                <RotateCw className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>

          {/* Fila 2: Acudiente y Celular */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-foreground/5 text-xs">
            <div className="flex items-center gap-1.5 truncate">
              <User className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-muted-foreground text-[11px] shrink-0">Acudiente:</span>
              <strong className="text-foreground uppercase truncate">
                {record.guardian_name || 'Sin registrar'}
              </strong>
              <span className="text-[10px] text-primary font-bold shrink-0">
                ({record.guardian_relationship || 'Mamá'})
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="text-muted-foreground text-[11px] shrink-0">Teléfono:</span>
              <div className="relative flex-1 max-w-[170px]">
                <Input
                  value={customPhone}
                  onChange={(e) => {
                    setCustomPhone(e.target.value);
                    loadTemplateText(selectedTemplate);
                  }}
                  placeholder="3001234567"
                  className="h-7 text-xs font-mono font-bold bg-background/60 border-foreground/15 rounded-lg px-2 w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dominio Web Público para Enlaces de WhatsApp */}
        <div className="p-2.5 sm:p-3 rounded-2xl bg-foreground/[0.04] border border-foreground/10 text-xs space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Dominio Web del Enlace (Público):
              </span>
            </div>

            {!isEditingDomain && (
              <button
                type="button"
                onClick={() => {
                  setDomainInput(currentDomain);
                  setIsEditingDomain(true);
                }}
                className="text-[10px] text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" /> Cambiar
              </button>
            )}
          </div>

          {isEditingDomain ? (
            <div className="flex items-center gap-1.5">
              <Input
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                placeholder="https://miravejuventudescali.pages.dev"
                className="h-8 text-xs font-mono bg-background"
              />
              <Button
                size="sm"
                onClick={() => {
                  if (!domainInput.trim()) return;
                  let cleaned = domainInput.trim().replace(/\/+$/, '');
                  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
                    cleaned = `https://${cleaned}`;
                  }
                  localStorage.setItem('public_site_url', cleaned);
                  setCurrentDomain(cleaned);
                  setIsEditingDomain(false);
                  loadTemplateText(selectedTemplate, currentToken, cleaned);
                  toast.success('¡Dominio actualizado correctamente!');
                }}
                className="h-8 px-3 text-xs font-bold bg-primary text-white shrink-0"
              >
                Guardar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditingDomain(false)}
                className="h-8 px-2 text-xs shrink-0"
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[11px] font-mono bg-background/50 px-2.5 py-1.5 rounded-xl border border-foreground/5">
              <span className="text-foreground font-bold truncate">
                {currentDomain}
              </span>
              <a
                href={authLink}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-primary hover:underline font-bold flex items-center gap-1 shrink-0 ml-2"
                title="Abrir este enlace en otra pestaña para verificar que funcione"
              >
                <span>Probar link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        {/* SELECTOR DE PLANTILLAS OPTIMIZADO PARA MÓVIL */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <span>Elige la plantilla que deseas enviar:</span>
            </label>
            <span className="text-[10px] text-primary font-bold">
              {activeTemplateInfo.icon} {activeTemplateInfo.title}
            </span>
          </div>

          {/* Grid de 2x2 en móvil / 4 columnas en desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
            {(Object.keys(TEMPLATES_INFO) as TemplateType[]).map((type) => {
              const info = TEMPLATES_INFO[type];
              const isSelected = selectedTemplate === type;

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleSelectTemplate(type)}
                  className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between min-h-[72px] sm:min-h-[82px] ${
                    isSelected
                      ? 'bg-primary text-white border-primary shadow-lg shadow-primary/25 ring-2 ring-primary/30'
                      : 'bg-foreground/[0.03] border-foreground/10 hover:border-foreground/20 text-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-base sm:text-lg shrink-0">{info.icon}</span>
                    {isSelected ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                    ) : (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                        {info.badge}
                      </span>
                    )}
                  </div>

                  <div className="mt-1">
                    <div className="font-black text-[11px] sm:text-xs leading-tight line-clamp-1">
                      {info.title}
                    </div>
                    <div className={`text-[9.5px] sm:text-[10px] leading-tight truncate mt-0.5 ${
                      isSelected ? 'text-white/80' : 'text-muted-foreground'
                    }`}>
                      {info.shortDesc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Tarjeta Explicativa de la Plantilla Activa (Para entender qué hace cada una) */}
          <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-[11px] text-foreground flex items-start gap-2">
            <HelpCircle className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
            <div className="leading-tight">
              <strong className="text-primary font-black uppercase text-[10px] mr-1">
                ¿Para qué sirve?
              </strong>
              <span className="text-muted-foreground">{activeTemplateInfo.whenToUse}</span>
            </div>
          </div>
        </div>

        {/* VISTA PREVIA BURBUJA WHATSAPP */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Vista Previa del Mensaje</span>
            </label>
            
            <button
              type="button"
              onClick={() => setIsEditingText(!isEditingText)}
              className="text-[10px] text-primary hover:underline font-bold flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" />
              {isEditingText ? 'Ver mensaje formateado' : 'Editar texto antes de enviar'}
            </button>
          </div>

          {/* Burbuja estilo WhatsApp Phone */}
          <div className="p-3 sm:p-4 rounded-3xl bg-slate-950 border border-emerald-500/25 shadow-inner space-y-2">
            {/* Header del chat simulado */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px]">
              <div className="flex items-center gap-1.5 truncate">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="font-bold text-emerald-400 truncate">
                  Para: {record.guardian_name || 'Acudiente'}
                </span>
                {normalizedPhone && (
                  <span className="text-[10px] font-mono text-slate-400 truncate">
                    (+{normalizedPhone})
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-500 shrink-0">
                {customText.length} carac.
              </span>
            </div>

            {/* Contenido editable o vista previa */}
            {isEditingText ? (
              <div className="space-y-1">
                <Textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  rows={6}
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-2.5 text-xs font-mono text-slate-100 leading-relaxed focus:border-emerald-500 resize-y"
                  placeholder="Escribe o personaliza el mensaje..."
                />
                <p className="text-[9.5px] text-slate-400 italic">
                  * Puedes añadir notas como hora del evento o lugar antes de enviar.
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 font-sans leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar select-text">
                {customText}
              </div>
            )}

            {/* Footer de la burbuja: Enlace y checkmarks */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-1.5 text-[10px]">
              <div className="flex items-center gap-1 text-slate-400 font-mono truncate max-w-[220px] sm:max-w-sm">
                <span className="text-emerald-400 font-bold">Link:</span>
                <span className="truncate">{authLink}</span>
              </div>
              <div className="flex items-center gap-1 text-slate-500 shrink-0">
                <span>Ahora</span>
                <span className="text-emerald-400 font-bold">✓✓</span>
              </div>
            </div>
          </div>
        </div>

        {/* ACCIONES DEL MODAL - 100% RESPONSIVE PARA CELULAR */}
        <DialogFooter className="flex flex-col gap-2 pt-2 border-t border-foreground/10">
          
          {/* BOTÓN PRINCIPAL GRANDE: ENVIAR POR WHATSAPP */}
          <Button
            type="button"
            onClick={handleSendWhatsApp}
            className="w-full h-12 rounded-2xl font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/25 text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
          >
            <Send className="w-4 h-4" />
            <span>Enviar por WhatsApp a Acudiente</span>
          </Button>

          {/* BOTONES SECUNDARIOS EN GRID (SIN DESBORDAMIENTO HORIZONTAL) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="rounded-xl border-foreground/10 text-[11px] font-bold h-9 px-2 flex items-center justify-center gap-1 truncate"
              title="Copiar enlace de autorización al portapapeles"
            >
              {copiedField === 'link' ? (
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-primary shrink-0" />
              )}
              <span className="truncate">Copiar Enlace</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyText}
              className="rounded-xl border-foreground/10 text-[11px] font-bold h-9 px-2 flex items-center justify-center gap-1 truncate"
              title="Copiar texto del mensaje al portapapeles"
            >
              {copiedField === 'text' ? (
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              )}
              <span className="truncate">Copiar Texto</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestParentPortal}
              className="rounded-xl border-foreground/10 text-[11px] font-bold h-9 px-2 flex items-center justify-center gap-1 text-muted-foreground hover:text-foreground truncate"
              title="Abrir el panel del padre para probar"
            >
              <Eye className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="truncate">Probar Panel</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="rounded-xl text-[11px] font-bold h-9 px-2 text-muted-foreground hover:text-foreground"
            >
              Cerrar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
