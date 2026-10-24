import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Sparkles, 
  ChevronRight, 
  User, 
  Phone, 
  MapPin, 
  GraduationCap, 
  Briefcase, 
  Heart,
  MessageSquare,
  Megaphone,
  Info,
  X,
  Search,
  CreditCard,
  Star,
  Shield,
  Calendar,
  ChevronsDown,
  Mic, Music, Smile, Volume2, Video, MonitorPlay, Presentation, Package, Trophy, HeartPulse, ShieldCheck, Users, Palette,
  Mail,
  Award,
  FileText,
  Loader2,
  HeartHandshake
} from 'lucide-react';
import { calculateAge } from '@/utils/validators';
import { generateGuardianToken, buildGuardianAuthWhatsAppUrl } from '@/utils/whatsapp';
import { CALI_COMMUNES, NEIGHBORHOODS_BY_COMMUNE, EDUCATION_LEVELS, GENDERS, INTERESTS, STUDY_AREAS, TALENTS_CATEGORIES } from '@/constants/cali';
import { supabase } from '@/lib/supabase';
import { CertificateModal } from '@/components/CertificateModal';

/**
 * Validador oficial de documentos de identidad de Colombia:
 * - Cédula de Ciudadanía (C.C.): 6 a 10 dígitos numéricos
 * - Tarjeta de Identidad (T.I.): 8 a 11 dígitos numéricos (estándar habitual 10 dígitos)
 * - Cédula de Extranjería / PPT: 6 a 15 caracteres alfanuméricos
 */
export function validateDocumentNumber(type: string, value: string): { isValid: boolean; message: string } {
  const clean = (value || '').trim().replace(/\s/g, '');
  if (!clean) {
    return { isValid: false, message: 'Ingresa tu número de documento' };
  }

  if (type === 'CC') {
    if (!/^\d+$/.test(clean)) {
      return { isValid: false, message: 'La Cédula solo debe tener números' };
    }
    if (clean.length < 6) {
      return { isValid: false, message: `La Cédula debe tener mínimo 6 dígitos (llevas ${clean.length})` };
    }
    if (clean.length > 10) {
      return { isValid: false, message: 'La Cédula no puede tener más de 10 dígitos' };
    }
    return { isValid: true, message: `Cédula Válida (${clean.length} dígitos)` };
  }

  if (type === 'TI') {
    if (!/^\d+$/.test(clean)) {
      return { isValid: false, message: 'La Tarjeta de Identidad solo debe tener números' };
    }
    if (clean.length < 8) {
      return { isValid: false, message: `La T.I. debe tener mínimo 8 dígitos (llevas ${clean.length}, habitual 10)` };
    }
    if (clean.length > 11) {
      return { isValid: false, message: 'La T.I. no puede tener más de 11 dígitos' };
    }
    return { isValid: true, message: `Tarjeta de Identidad Válida (${clean.length} dígitos)` };
  }

  if (type === 'CE' || type === 'PPT') {
    if (!/^[a-zA-Z0-9]+$/.test(clean)) {
      return { isValid: false, message: 'Solo letras y números sin espacios ni símbolos' };
    }
    if (clean.length < 6) {
      return { isValid: false, message: `${type} debe tener mínimo 6 caracteres` };
    }
    if (clean.length > 15) {
      return { isValid: false, message: `${type} no puede superar 15 caracteres` };
    }
    return { isValid: true, message: `${type} Válido (${clean.length} caracteres)` };
  }

  return { isValid: clean.length >= 6, message: 'Identificación válida' };
}

// High-fidelity schema
const formSchema = z.object({
  first_name: z.string().min(2, 'Ingresa tus nombres'),
  last_name: z.string().min(2, 'Ingresa tus apellidos'),
  document_type: z.enum(['CC', 'TI', 'CE', 'PPT']),
  document_number: z.string().min(1, 'El documento es obligatorio'),
  birth_date: z.string().min(1, 'Fecha requerida'),
  guardian_relationship: z.string().optional(),
  guardian_name: z.string().optional(),
  guardian_phone: z.string().optional(),
  gender: z.string().min(1, 'Selecciona género'),
  military_status: z.string().optional(),
  phone: z.string().regex(/^3\d{9}$/, 'Debe tener 10 números, sin puntos ni espacios (Ej: 3001234567)'),
  email: z.string().email('Email inválido'),
  is_infomira_subscribed: z.boolean(),
  registration_source: z.string().min(1, 'Selecciona cómo te enteraste'),
  other_registration_source: z.string().optional(),
  church_headquarters: z.string().optional(),
  other_church_headquarters: z.string().optional(),
  neighborhood: z.string().min(2, 'Barrio requerido'),
  commune: z.string().min(1, 'Comuna requerida'),
  education_level: z.string().min(1, 'Nivel requerido'),
  study_area: z.array(z.string()).min(1, 'Selecciona al menos un área'),
  other_study_area: z.string().optional(),
  is_working: z.boolean(),
  profession: z.string().min(2, 'Ingresa tu profesión u ocupación'),
  is_internal: z.boolean().optional(),
  is_entrepreneur: z.boolean(),
  entrepreneur_name: z.string().optional(),
  is_in_organization: z.boolean(),
  organization_name: z.string().optional(),
  interests: z.array(z.string()).min(1, 'Elige al menos uno'),
  talents: z.array(z.string()).optional(),
  other_talent: z.string().optional(),
  open_comments: z.string().optional(),
  data_authorization: z.boolean().refine(val => val === true, 'Debes autorizar el tratamiento de datos'),
}).superRefine((data, ctx) => {
  if (data.is_entrepreneur && (!data.entrepreneur_name || data.entrepreneur_name.length < 2)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Indica el nombre de tu emprendimiento',
      path: ['entrepreneur_name']
    });
  }
  if (data.is_in_organization && (!data.organization_name || data.organization_name.length < 2)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Indica el nombre de la organización',
      path: ['organization_name']
    });
  }
  if (data.registration_source === 'Iglesia' && (!data.church_headquarters || data.church_headquarters.length < 2)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Selecciona una sede',
      path: ['church_headquarters']
    });
  }
  if (data.church_headquarters === 'OTRO' && (!data.other_church_headquarters || data.other_church_headquarters.length < 2)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Indica el nombre de la sede',
      path: ['other_church_headquarters']
    });
  }
  if (data.gender === 'Masculino' && (!data.military_status || data.military_status.trim().length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Selecciona una opción',
      path: ['military_status']
    });
  }
  const youthAge = calculateAge(data.birth_date);
  if (typeof youthAge === 'number' && youthAge < 18) {
    if (!data.guardian_relationship || data.guardian_relationship.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecciona el parentesco (Mamá, Papá o Acudiente)',
        path: ['guardian_relationship']
      });
    }
    if (!data.guardian_name || data.guardian_name.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Ingresa el nombre de tu acudiente',
        path: ['guardian_name']
      });
    }
    const cleanGPhone = (data.guardian_phone || '').replace(/\D/g, '');
    if (!cleanGPhone || cleanGPhone.length !== 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'WhatsApp del acudiente debe tener 10 dígitos (Ej: 3001234567)',
        path: ['guardian_phone']
      });
    }
  }
  const docValidation = validateDocumentNumber(data.document_type, data.document_number);
  if (!docValidation.isValid) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: docValidation.message,
      path: ['document_number']
    });
  }
});

type FormValues = z.infer<typeof formSchema>;

const SOURCES = [
  'Evento o Actividad',
  'Iglesia',
  'Colegio / Universidad',
  'Amigo o familiar',
  'OTRO'
];

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


const getTalentIcon = (talent: string) => {
  switch (talent) {
    case 'Canto': return <Mic className="w-6 h-6" />;
    case 'Danza': return <Music className="w-6 h-6" />;
    case 'Recreación juvenil': return <Smile className="w-6 h-6" />;
    case 'Manejo de Sonido': return <Volume2 className="w-6 h-6" />;
    case 'Video y camarografía': return <Video className="w-6 h-6" />;
    case 'Edición audiovisual': return <MonitorPlay className="w-6 h-6" />;
    case 'Charlas y capacitaciones': return <Presentation className="w-6 h-6" />;
    case 'Apoyo logístico y eventos': return <Package className="w-6 h-6" />;
    case 'Recreación deportiva': return <Trophy className="w-6 h-6" />;
    case 'Primeros auxilios': return <HeartPulse className="w-6 h-6" />;
    case 'Seguridad en eventos': return <ShieldCheck className="w-6 h-6" />;
    case 'Trabajo comunitario': return <Users className="w-6 h-6" />;
    default: return <Star className="w-6 h-6" />;
  }
};

const QUESTION_STEPS = [
  { id: 'welcome', title: '🚀 Oportunidades para ti' },
  { id: 'source', title: '¿Cómo te enteraste de este espacio?', fields: ['registration_source', 'other_registration_source'], icon: Megaphone },
  { id: 'church', title: '¿A qué sede asistes normalmente?', fields: ['church_headquarters', 'other_church_headquarters'], icon: Megaphone },
  { id: 'name', title: '¿Cómo te llamas?', fields: ['first_name', 'last_name'], icon: User },
  { id: 'id', title: 'Identificación oficial', fields: ['document_type', 'document_number'], icon: CreditCard },
  { id: 'birth', title: '¿Cuándo naciste?', fields: ['birth_date'], icon: Calendar },
  { id: 'gender', title: 'Género', fields: ['gender'], icon: User },
  { id: 'military', title: '¿Cuál es tu situación militar?', fields: ['military_status'], icon: Shield },
  { id: 'guardian', title: 'Contacto de tu acudiente', fields: ['guardian_relationship', 'guardian_name', 'guardian_phone'], icon: HeartHandshake },
  { id: 'contact', title: '¿Cómo nos comunicamos contigo?', fields: ['phone', 'email'], icon: Phone },
  { id: 'location', title: '¿Dónde vives?', fields: ['commune', 'neighborhood'], icon: MapPin },
  { id: 'education', title: 'Tu formación actual', fields: ['education_level'], icon: GraduationCap },
  { id: 'study_area', title: 'Área de estudio', fields: ['study_area'], icon: GraduationCap },
  { id: 'is_working', title: '¿Estás laborando actualmente?', fields: ['is_working'], icon: Briefcase },
  { id: 'profession', title: 'Profesión u ocupación', fields: ['profession'], icon: Briefcase },
  { id: 'is_entrepreneur', title: 'Micronegocio o emprendimiento', fields: ['is_entrepreneur', 'entrepreneur_name'], icon: Sparkles },
  { id: 'is_in_organization', title: '¿Haces parte de alguna organización o colectivo?', fields: ['is_in_organization', 'organization_name'], icon: User },
  { id: 'interests', title: 'Temas de interés', fields: ['interests'], icon: Heart },
  { id: 'talents', title: 'Tus talentos ⭐', fields: ['talents', 'other_talent'] },
  { id: 'comments', title: 'Observaciones', fields: ['open_comments'], icon: MessageSquare },
  { id: 'submitting', title: 'Casi listo...', fields: ['data_authorization'], icon: CheckCircle2 }
];

export default function CharacterizationForm() {
  const [stepIndex, setStepIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOrgInfo, setShowOrgInfo] = useState(false);
  const [hasScrolledTalents, setHasScrolledTalents] = useState(false);
  const [hasScrolledStudyArea, setHasScrolledStudyArea] = useState(false);
  const [submittedUser, setSubmittedUser] = useState<{
    fullName: string;
    documentType: string;
    documentNumber: string;
    email: string;
    phone?: string;
    commune?: string;
    neighborhood?: string;
  } | null>(null);
  const [certificateCode, setCertificateCode] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'already_sent' | 'quota_exceeded' | 'error'>('idle');
  const navigate = useNavigate();

  const { control, handleSubmit, watch, setValue, trigger, setError, clearErrors, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
      defaultValues: {
        guardian_relationship: '',
        guardian_name: '',
        guardian_phone: '',
        interests: [],
        is_working: false,
        is_internal: false,
        is_entrepreneur: false,
        is_in_organization: false,
        is_infomira_subscribed: false,
        document_type: 'CC',
        military_status: '',
        data_authorization: false,
        commune: CALI_COMMUNES[0],
        registration_source: '',
        other_registration_source: '',
        church_headquarters: '',
        other_church_headquarters: ''
      }
  });

  // Debugging: see validation errors in console
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.warn('Form validation errors:', errors);
    }
  }, [errors]);

  const currentStep = QUESTION_STEPS[stepIndex];
  const birthDate = watch('birth_date');
  const age = calculateAge(birthDate);

  const nextStep = async () => {
    if (currentStep.fields) {
      const isValid = await trigger(currentStep.fields as any);
      if (!isValid) {
        // Shake feedback
        const element = document.getElementById('step-container');
        if (element) {
          element.classList.add('animate-shake');
          setTimeout(() => element.classList.remove('animate-shake'), 500);
        }
        return;
      }
    }

    if (currentStep.id === 'source') {
      const source = watch('registration_source');
      if (source === 'OTRO') {
        const otherSource = watch('other_registration_source');
        if (!otherSource || otherSource.length < 2) {
          trigger();
          const element = document.getElementById('step-container');
          if (element) {
            element.classList.add('animate-shake');
            setTimeout(() => element.classList.remove('animate-shake'), 500);
          }
          return;
        }
      }
    }

    if (currentStep.id === 'church') {
      const source = watch('registration_source');
      if (source === 'Iglesia') {
        const hq = watch('church_headquarters');
        if (!hq || hq.length < 2) {
          trigger();
          const element = document.getElementById('step-container');
          if (element) {
            element.classList.add('animate-shake');
            setTimeout(() => element.classList.remove('animate-shake'), 500);
          }
          return;
        }
        if (hq === 'OTRO') {
          const otherHq = watch('other_church_headquarters');
          if (!otherHq || otherHq.length < 2) {
            trigger();
            const element = document.getElementById('step-container');
            if (element) {
              element.classList.add('animate-shake');
              setTimeout(() => element.classList.remove('animate-shake'), 500);
            }
            return;
          }
        }
      }
    }

    if (currentStep.id === 'military') {
      const gender = watch('gender');
      const militaryStatus = watch('military_status');
      if (gender === 'Masculino' && (!militaryStatus || militaryStatus.trim().length === 0)) {
        trigger();
        const element = document.getElementById('step-container');
        if (element) {
          element.classList.add('animate-shake');
          setTimeout(() => element.classList.remove('animate-shake'), 500);
        }
        return;
      }
    }

    if (currentStep.id === 'id') {
      const docNum = watch('document_number');
      const docType = watch('document_type');
      const validation = validateDocumentNumber(docType, docNum);
      if (!validation.isValid) {
        setError('document_number', {
          type: 'manual',
          message: validation.message
        });
        const element = document.getElementById('step-container');
        if (element) {
          element.classList.add('animate-shake');
          setTimeout(() => element.classList.remove('animate-shake'), 500);
        }
        return;
      }
      clearErrors('document_number');
    }

    const numAge = typeof age === 'number' ? age : 0;

    if (currentStep.id === 'birth' && numAge > 0) {
      if (numAge < 14 || numAge > 28) {
        toast.error('Esta caracterización es para jóvenes de 14 a 28 años.');
        return;
      }
    }

    if (stepIndex < QUESTION_STEPS.length - 1) {
      let nextIndex = stepIndex + 1;
      while (nextIndex < QUESTION_STEPS.length) {
        if (QUESTION_STEPS[nextIndex].id === 'church' && watch('registration_source') !== 'Iglesia') {
          nextIndex++;
        } else if (QUESTION_STEPS[nextIndex].id === 'guardian' && numAge >= 18) {
          nextIndex++;
        } else if (QUESTION_STEPS[nextIndex].id === 'military' && watch('gender') !== 'Masculino') {
          nextIndex++;
        } else {
          break;
        }
      }
      setStepIndex(nextIndex);
    } else {
      handleSubmit(onSubmit)();
    }
  };

  const prevStep = () => {
    if (stepIndex > 0) {
      let prevIndex = stepIndex - 1;
      const numAge = typeof age === 'number' ? age : 0;
      while (prevIndex >= 0) {
        if (QUESTION_STEPS[prevIndex].id === 'church' && watch('registration_source') !== 'Iglesia') {
          prevIndex--;
        } else if (QUESTION_STEPS[prevIndex].id === 'guardian' && numAge >= 18) {
          prevIndex--;
        } else if (QUESTION_STEPS[prevIndex].id === 'military' && watch('gender') !== 'Masculino') {
          prevIndex--;
        } else {
          break;
        }
      }
      setStepIndex(prevIndex);
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      if (!supabase) throw new Error('Supabase no está configurado.');
      
      const { data_authorization, ...formFields } = data;
      
      // Removed ageToSubmit calculation since we do not save age to DB anymore
      
      const payload = {
        ...formFields,
        // Ensure arrays are handled correctly if empty
        interests: data.interests || [],
        study_area: (data.study_area || []).map(a => a === 'Otra' && data.other_study_area && data.other_study_area.trim() ? `Otra - ${data.other_study_area.trim()}` : a),
        // Explicitly set nulls for optional text fields if empty strings are passed
        entrepreneur_name: data.is_entrepreneur ? data.entrepreneur_name : null,
        organization_name: data.is_in_organization ? data.organization_name : null,
        registration_source: data.registration_source === 'OTRO' ? data.other_registration_source : data.registration_source,
        church_headquarters: data.registration_source === 'Iglesia' ? (data.church_headquarters === 'OTRO' ? data.other_church_headquarters : data.church_headquarters) : null,
        is_internal: data.registration_source === 'Iglesia',
        military_status: data.gender === 'Masculino' ? data.military_status : null,
        guardian_relationship: (typeof age === 'number' && age < 18) ? (data.guardian_relationship || null) : null,
        guardian_name: (typeof age === 'number' && age < 18) ? (data.guardian_name ? data.guardian_name.trim() : null) : null,
        guardian_phone: (typeof age === 'number' && age < 18) ? (data.guardian_phone ? data.guardian_phone.replace(/\D/g, '') : null) : null,
        guardian_token: (typeof age === 'number' && age < 18) ? generateGuardianToken() : null,
        talents: (() => {
          const arr = Array.isArray(data.talents) ? [...data.talents] : [];
          if (data.other_talent && data.other_talent.trim().length > 0) {
            arr.push(data.other_talent.trim());
          }
          return arr.length > 0 ? arr.join(', ') : null;
        })(),
        open_comments: data.open_comments || null
      };

      const isMinor = typeof age === 'number' && age < 18;
      const guardianToken = payload.guardian_token;

      delete (payload as any).other_church_headquarters;
      delete (payload as any).other_registration_source;
      delete (payload as any).other_talent;
      delete (payload as any).other_study_area;
      
      console.log('Enviando datos a Supabase:', payload);
      
      const { data: upsertResult, error: supabaseError } = await supabase.rpc('upsert_record_safely', {
        payload: payload
      });

      if (supabaseError) {
        console.error('Error detallado de Supabase:', supabaseError);
        throw new Error(supabaseError.message || 'Error desconocido al guardar');
      }

      // Si es menor de edad, aseguramos guardar el token y estado en characterization_records
      if (isMinor && guardianToken && supabase) {
        try {
          await supabase.from('characterization_records')
            .update({ 
              guardian_token: guardianToken,
              guardian_contact_status: 'pending'
            })
            .eq('document_number', data.document_number);
        } catch (errToken) {
          console.warn('Nota guardando guardian_token:', errToken);
        }
      }
      
      console.log('Registro exitoso. Respuesta:', upsertResult);
      const fullName = `${data.first_name} ${data.last_name}`.trim();
      const codeFromDb = upsertResult?.certificate_code || null;
      if (codeFromDb) {
        setCertificateCode(codeFromDb);
      }

      const userCertData = {
        fullName,
        firstName: data.first_name,
        lastName: data.last_name,
        documentType: data.document_type,
        documentNumber: data.document_number,
        email: data.email,
        phone: data.phone,
        commune: data.commune,
        neighborhood: data.neighborhood,
        code: codeFromDb || undefined,
        isMinor,
        age,
        gender: data.gender,
        guardianName: data.guardian_name,
        guardianPhone: data.guardian_phone,
        guardianRelationship: data.guardian_relationship,
        guardianToken: guardianToken
      };
      setSubmittedUser(userCertData);
      setIsCompleted(true);

      const dispatchStatus = upsertResult?.dispatch_status || 'can_send';

      // 1. Si ya se le había enviado antes un certificado a este documento -> No gastar cupo
      if (dispatchStatus === 'already_sent') {
        console.log('Certificado ya enviado previamente a este documento.');
        setEmailStatus('already_sent');
        return;
      }

      // 2. Si se alcanzó el límite diario protegido (95 correos hoy) -> Proteger cupo
      if (dispatchStatus === 'quota_exceeded') {
        console.warn('Límite de 95 correos diarios alcanzado. Guardado como pendiente.');
        setEmailStatus('quota_exceeded');
        return;
      }

      // 3. Si hay cupo disponible y es su primera vez -> Enviar por Resend
      if (data.email) {
        setEmailStatus('sending');
        fetch('/api/send-certificate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userCertData),
        })
          .then(async (res) => {
            const resData = await res.json().catch(() => ({}));
            if (res.ok && resData.success !== false) {
              setEmailStatus('sent');
              const finalCode = resData.code || codeFromDb;
              if (finalCode) setCertificateCode(finalCode);

              // Marcar en Supabase que el certificado fue enviado con éxito
              try {
                await supabase.rpc('mark_certificate_sent', {
                  doc_type: data.document_type,
                  doc_number: data.document_number,
                  cert_code: finalCode,
                });
              } catch (err) {
                console.warn('Aviso al actualizar estado en Supabase:', err);
              }
            } else {
              console.warn('Advertencia en envío de certificado:', resData);
              setEmailStatus('error');
            }
          })
          .catch((err) => {
            console.error('Error al enviar certificado por correo:', err);
            setEmailStatus('error');
          });
      }
    } catch (err: any) {
      console.error('Captura de error en onSubmit:', err);
      toast.error('Error al guardar: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCompleted) {
    return (
      <SuccessScreen 
        onExit={() => navigate('/')} 
        submittedUser={submittedUser}
        emailStatus={emailStatus}
        certificateCode={certificateCode}
      />
    );
  }

  const progress = (stepIndex / (QUESTION_STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-primary selection:text-white overflow-hidden">
      {/* Progress Header */}
      <header className="h-20 px-6 flex items-center gap-4 border-b border-foreground/5 glass-dark z-20">
        <button onClick={() => navigate('/')} className="p-2 opacity-40 hover:opacity-100 transition-opacity">
          <X className="w-6 h-6" />
        </button>
        <div className="flex-1 flex flex-col gap-1">
          <div className="w-full h-3 bg-foreground/5 rounded-full overflow-hidden relative">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-primary relative" 
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
            </motion.div>
          </div>
          <div className="text-[10px] font-black opacity-30 text-right">
            {Math.round(progress)}%
          </div>
        </div>
        <ThemeToggle />
      </header>

      <main 
        className="flex-1 relative flex flex-col items-center justify-start pt-12 md:pt-20 p-6 pb-32 overflow-y-auto"
        onScroll={(e) => {
          if (e.currentTarget.scrollTop > 20) {
            if (currentStep.id === 'study_area' && !hasScrolledStudyArea) {
              setHasScrolledStudyArea(true);
            }
            if (currentStep.id === 'talents' && !hasScrolledTalents) {
              setHasScrolledTalents(true);
            }
          }
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            id="step-container"
            key={currentStep.id}
            initial={{ opacity: 0, x: 20, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 1.02 }}
            className="w-full max-w-lg space-y-10"
          >
            <div className="flex flex-col items-center text-center space-y-6">
              {currentStep.icon && (
                <motion.div 
                  whileHover={{ scale: 1.05, rotate: 2 }}
                  className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-[2.5rem] flex items-center justify-center text-primary shadow-xl relative group"
                >
                   <currentStep.icon className="w-10 h-10 transition-transform group-hover:scale-110" />
                   <div className="absolute inset-0 bg-primary/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full -z-10" />
                </motion.div>
              )}
              <div className="flex flex-col items-center justify-center gap-2">
                <h2 className="text-3xl md:text-5xl font-black tracking-tighter leading-none italic uppercase flex flex-col md:flex-row items-center justify-center gap-3">
                  <span className="flex items-center justify-center gap-2 md:gap-3 flex-wrap">
                    {currentStep.id === 'study_area' 
                      ? (['Primaria', 'Bachillerato'].includes(watch('education_level')) 
                          ? '¿En qué área le gustaría trabajar o capacitarse?' 
                          : 'Área de estudio o experiencia') 
                      : currentStep.title}
                    {currentStep.id === 'is_in_organization' && (
                      <button 
                        onClick={() => setShowOrgInfo(!showOrgInfo)}
                        type="button" 
                        className="text-primary hover:scale-110 transition-transform opacity-80 hover:opacity-100 bg-primary/10 rounded-full p-1"
                      >
                        <Info className="w-5 h-5 md:w-8 md:h-8" />
                      </button>
                    )}
                  </span>
                  {['talents', 'comments'].includes(currentStep.id) && (
                    <span className="text-[12px] md:text-[14px] bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-full inline-flex w-fit not-italic font-bold tracking-widest uppercase mt-2 md:mt-0">
                      Opcional
                    </span>
                  )}
                </h2>
                
                {currentStep.id === 'is_in_organization' && (
                  <AnimatePresence>
                    {showOrgInfo && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        className="text-sm md:text-base font-bold text-muted-foreground not-italic tracking-tight mt-2 text-center max-w-sm px-4"
                      >
                        <span className="uppercase text-[10px] tracking-widest font-black text-primary mr-1 bg-primary/10 px-2 py-0.5 rounded-md">EJ:</span>
                        Indígena, afro, campesina, víctimas, mujeres, discapacidad u otra.
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {renderStepFields(currentStep.id, { control, errors, setValue, watch, age, isSubmitting, hasScrolledTalents, setHasScrolledTalents, hasScrolledStudyArea, setHasScrolledStudyArea, clearErrors, setError })}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Persistent Footer Nav */}
      <footer className="fixed bottom-0 left-0 right-0 p-6 glass-dark border-t border-foreground/5 flex gap-4 h-28 transform-gpu z-30">
        {stepIndex > 0 && (
          <Button 
            onClick={prevStep}
            variant="outline" 
            className="h-16 px-8 rounded-3xl border-foreground/10 opacity-60 hover:opacity-100 transition-all font-bold"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <Button 
          onClick={nextStep}
          disabled={isSubmitting}
          className="flex-1 h-16 rounded-3xl text-lg font-black shadow-2xl mira-blue-glow bg-primary hover:bg-primary/90 transition-all active:scale-95"
        >
          {stepIndex === QUESTION_STEPS.length - 1 ? 'FINALIZAR' : 'CONTINUAR'}
          <ChevronRight className="ml-2 w-6 h-6" />
        </Button>
      </footer>
    </div>
  );
}

function renderStepFields(id: string, { control, errors, setValue, watch, age, isSubmitting, hasScrolledTalents, setHasScrolledTalents, hasScrolledStudyArea, setHasScrolledStudyArea, clearErrors, setError }: any) {
  const inputClass = "h-16 bg-foreground/5 border-foreground/30 dark:border-foreground/10 rounded-2xl px-6 text-lg font-bold placeholder:text-foreground/40 dark:placeholder:text-foreground/30 focus:bg-foreground/10 transition-all focus:ring-4 focus:ring-primary/20";
  
  switch (id) {
    case 'welcome':
      return (
        <div className="space-y-3 text-left">
          <div className="flex bg-foreground/5 p-4 rounded-2xl items-center gap-4">
             <div className="text-2xl">🎓</div>
             <p className="text-sm font-medium opacity-90 leading-tight">Conoce ofertas de becas, cursos y capacitaciones según tus intereses.</p>
          </div>
          <div className="flex bg-foreground/5 p-4 rounded-2xl items-center gap-4">
             <div className="text-2xl">💼</div>
             <p className="text-sm font-medium opacity-90 leading-tight">Explora ofertas de empleo, vacantes y convocatorias para jóvenes.</p>
          </div>
          <div className="flex bg-foreground/5 p-4 rounded-2xl items-center gap-4">
             <div className="text-2xl">💙</div>
             <p className="text-sm font-medium opacity-90 leading-tight">Conoce actividades, líderes, novedades y espacios de participación de Juventudes MIRA.</p>
          </div>
          <div className="flex bg-foreground/5 p-4 rounded-2xl items-center gap-4">
             <div className="text-2xl">📚</div>
             <p className="text-sm font-medium opacity-90 leading-tight">Conozca ofertas de estudio: técnico, tecnólogo, pregrado y posgrado.</p>
          </div>
          <div className="flex bg-foreground/5 p-4 rounded-2xl items-center gap-4">
             <div className="text-2xl">🤝</div>
             <p className="text-sm font-medium opacity-90 leading-tight">Conéctese con oportunidades de liderazgo, emprendimiento y crecimiento personal.</p>
          </div>
          <div className="flex bg-foreground/5 p-4 rounded-2xl items-center gap-4">
             <div className="text-2xl">🔔</div>
             <p className="text-sm font-medium opacity-90 leading-tight">Reciba información útil y beneficios pensados para jóvenes.</p>
          </div>
          <div className="flex items-start gap-3 bg-primary/10 border border-primary/20 p-4 rounded-2xl mt-4">
             <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
             <p className="text-[11px] md:text-xs font-semibold text-primary/80 leading-relaxed">
               Aviso: Las ofertas presentadas se comparten con fines informativos. No somos los gestores ni oferentes directos de las mismas.
             </p>
          </div>
        </div>
      );
    case 'name':
      return (
        <div className="space-y-4">
          <Controller name="first_name" control={control} render={({ field }) => (
            <Input {...field} placeholder="Nombres" className={inputClass} />
          )} />
          <Controller name="last_name" control={control} render={({ field }) => (
            <Input {...field} placeholder="Apellidos" className={inputClass} />
          )} />
        </div>
      );
    case 'id':
      const currentDocType = watch('document_type');
      const rawDocNum = (watch('document_number') || '').replace(/\s/g, '');
      const docValidation = validateDocumentNumber(currentDocType, rawDocNum);
      const hasIdError = !!errors.document_number;
      
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-2 md:gap-3">
            {['CC', 'TI', 'CE', 'PPT'].map(type => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setValue('document_type', type as any);
                  setValue('document_number', ''); // Clear to avoid confusion
                  clearErrors('document_number');
                }}
                className={`h-14 rounded-2xl font-black text-[10px] tracking-widest transition-all ${currentDocType === type ? 'bg-primary text-white shadow-lg scale-105' : 'bg-foreground/15 dark:bg-foreground/5 border border-foreground/20 dark:border-foreground/10 opacity-80 hover:opacity-100'}`}
              >
                {type}
              </button>
            ))}
          </div>
          
          <div className="space-y-2">
            <Controller 
              name="document_number" 
              control={control} 
              render={({ field }) => (
                <div className="relative group">
                  <Input 
                    {...field} 
                    type="text"
                    inputMode={currentDocType === 'CC' || currentDocType === 'TI' ? 'numeric' : 'text'}
                    maxLength={currentDocType === 'CC' ? 10 : currentDocType === 'TI' ? 11 : 15}
                    placeholder={
                      currentDocType === 'CC' ? 'Ej: 1118234567' : 
                      currentDocType === 'TI' ? 'Ej: 1120456789' : 
                      currentDocType === 'CE' ? 'Ej: 123456' : 'Ej: PPT123456'
                    }
                    className={`${inputClass} ${hasIdError ? 'border-rose-500/50 ring-2 ring-rose-500/10' : 'border-foreground/10 group-focus-within:border-primary'}`}
                    autoComplete="off"
                    onChange={(e) => {
                      let val = e.target.value.replace(/\s/g, '');
                      if (currentDocType === 'CC' || currentDocType === 'TI') {
                        val = val.replace(/\D/g, '');
                      } else {
                        val = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                      }
                      field.onChange(val);
                      if (hasIdError) {
                        clearErrors('document_number');
                      }
                    }}
                  />
                  <div className={`absolute inset-0 -z-10 rounded-2xl transition-all duration-500 blur-xl ${hasIdError ? 'bg-rose-500/10' : 'bg-primary/5 opacity-0 group-focus-within:opacity-100'}`} />
                </div>
              )} 
            />
            
            {/* Mensajes de validación en tiempo real */}
            <AnimatePresence mode="wait">
              {hasIdError ? (
                <motion.p
                  key="error"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-rose-500 text-[10px] font-black uppercase tracking-wider pl-4 flex items-center gap-1.5"
                >
                  <span>⚠️</span>
                  <span>{errors.document_number?.message as string}</span>
                </motion.p>
              ) : rawDocNum ? (
                docValidation.isValid ? (
                  <motion.p
                    key="valid"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-emerald-500 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider pl-4 flex items-center gap-1.5"
                  >
                    <span>✓</span>
                    <span>{docValidation.message}</span>
                  </motion.p>
                ) : (
                  <motion.p
                    key="hint"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-amber-500 text-[10px] font-bold tracking-wide pl-4 flex items-center gap-1.5"
                  >
                    <span>•</span>
                    <span>{docValidation.message}</span>
                  </motion.p>
                )
              ) : (
                <p className="text-[10px] text-muted-foreground/60 pl-4">
                  {currentDocType === 'CC' ? 'Cédula de Ciudadanía: entre 6 y 10 dígitos numéricos' :
                   currentDocType === 'TI' ? 'Tarjeta de Identidad: entre 8 y 10 dígitos numéricos' :
                   'Entre 6 y 15 caracteres alfanuméricos'}
                </p>
              )}
            </AnimatePresence>
          </div>
        </div>
      );
    case 'birth':
      return (
        <div className="space-y-6">
          <Controller name="birth_date" control={control} render={({ field }) => (
            <Input {...field} type="date" className={inputClass + " block"} />
          )} />
          {age > 0 && (
            <div className="flex justify-center">
              <span className="text-4xl font-black italic text-primary animate-in zoom-in">{age} AÑOS</span>
            </div>
          )}
        </div>
      );
    case 'guardian':
      const guardianRoles = ['Mamá', 'Papá', 'Acudiente / Tutor'];
      return (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 space-y-1 text-center">
            <p className="text-xs font-black uppercase text-primary tracking-wider flex items-center justify-center gap-1.5">
              ¡Qué alegría tenerte con nosotros! 👨‍👩‍👧💙
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Al ser menor de edad (<strong className="text-foreground">{age} años</strong>), por tu seguridad y bienestar requerimos los datos de tu acudiente para validar tu participación.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              ¿Quién es tu acudiente?
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {guardianRoles.map(role => (
                <button
                  type="button"
                  key={role}
                  onClick={() => setValue('guardian_relationship', role, { shouldValidate: true })}
                  className={`py-3 px-2 rounded-2xl font-bold text-xs border text-center transition-all ${
                    watch('guardian_relationship') === role
                      ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-[1.02]'
                      : 'glass border-foreground/10 hover:border-primary/50 text-foreground'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
            {errors.guardian_relationship && (
              <p className="text-rose-500 text-[10px] font-bold pl-2">
                {errors.guardian_relationship.message as string}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Nombre y apellido de tu acudiente
            </Label>
            <Controller
              name="guardian_name"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="text"
                  placeholder="Ej: María Elena Gómez"
                  className={inputClass}
                  autoComplete="off"
                />
              )}
            />
            {errors.guardian_name && (
              <p className="text-rose-500 text-[10px] font-bold pl-2">
                {errors.guardian_name.message as string}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              WhatsApp / Celular de tu acudiente
            </Label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-xs font-bold text-muted-foreground select-none pointer-events-none">
                🇨🇴 +57
              </span>
              <Controller
                name="guardian_phone"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="300 123 4567"
                    className={`${inputClass} pl-20`}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      field.onChange(val);
                    }}
                  />
                )}
              />
            </div>
            {errors.guardian_phone && (
              <p className="text-rose-500 text-[10px] font-bold pl-2">
                {errors.guardian_phone.message as string}
              </p>
            )}
          </div>
        </div>
      );
    case 'gender':
      return (
        <div className="grid grid-cols-1 gap-3">
          {GENDERS.map(g => (
            <SelectableCard 
              key={g} 
              label={g} 
              active={watch('gender') === g} 
              onClick={() => setValue('gender', g)} 
            />
          ))}
        </div>
      );
    case 'military':
      const militaryOptions = ['Tiene libreta militar', 'Está en trámite', 'No la tiene'];
      return (
        <div className="grid grid-cols-1 gap-3">
          {militaryOptions.map(opt => (
            <SelectableCard 
              key={opt} 
              label={opt} 
              active={watch('military_status') === opt} 
              onClick={() => setValue('military_status', opt)} 
            />
          ))}
          <AnimatePresence>
            {errors.military_status && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-rose-500 text-[10px] font-black uppercase tracking-widest italic mt-2 text-center"
              >
                {errors.military_status.message as string}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      );
    case 'contact':
      const isSubscribed = watch('is_infomira_subscribed');
      return (
        <div className="space-y-6">
          <div className="space-y-4">
            <Controller name="email" control={control} render={({ field }) => (
              <div className="space-y-2">
                <Input {...field} type="email" placeholder="Correo electrónico" className={`${inputClass} ${errors.email ? 'border-rose-500/50 ring-2 ring-rose-500/10' : ''}`} />
                <AnimatePresence>
                  {errors.email && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-rose-500 text-[10px] font-black uppercase tracking-widest italic ml-2">
                      {errors.email.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            )} />
            <Controller name="phone" control={control} render={({ field }) => (
              <div className="space-y-2">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-foreground font-black border-r border-foreground/10 dark:border-foreground/20 pr-4 my-3 text-lg">
                    +57
                  </div>
                  <Input 
                    {...field}
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="Teléfono de contacto" 
                    className={`${inputClass} pl-[5.5rem] ${errors.phone ? 'border-rose-500/50 ring-2 ring-rose-500/10' : ''}`}
                    onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
                <AnimatePresence>
                  {errors.phone && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-rose-500 text-[10px] font-black uppercase tracking-widest italic ml-2">
                      {errors.phone.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            )} />
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] uppercase font-black tracking-widest text-foreground/50 dark:text-foreground/30 px-2">¿Estás suscrito a InfoMIRA?</h4>
            <div className="grid grid-cols-2 gap-3">
              <SelectableCard 
                label="SÍ" 
                active={isSubscribed === true} 
                onClick={() => setValue('is_infomira_subscribed', true)} 
              />
              <SelectableCard 
                label="NO" 
                active={isSubscribed === false} 
                onClick={() => setValue('is_infomira_subscribed', false)} 
              />
            </div>
          </div>
        </div>
      );
    case 'source':
      const isOtherSource = watch('registration_source') === 'OTRO';
      const mainSources = SOURCES.filter(s => s !== 'OTRO');
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 px-1">
            {mainSources.map((s) => (
              <div key={s}>
                <SelectableCard  
                  label={s} 
                  active={watch('registration_source') === s} 
                  onClick={() => {
                    setValue('registration_source', s);
                    setValue('other_registration_source', '');
                  }} 
                />
              </div>
            ))}
          </div>
          
          <div className="flex justify-center mt-6 mb-2">
            <button
              type="button"
              onClick={() => {
                setValue('registration_source', isOtherSource ? '' : 'OTRO');
                if (!isOtherSource) {
                  setTimeout(() => {
                    document.getElementById('other_source_input')?.focus();
                  }, 100);
                }
              }}
              className={`text-xs font-black tracking-widest uppercase transition-all border-b-2 pb-1 ${
                isOtherSource 
                  ? 'text-primary border-primary' 
                  : 'text-muted-foreground/60 border-transparent hover:text-foreground hover:border-foreground/20'
              }`}
            >
              ¿Te enteraste por otro medio?
            </button>
          </div>

          <AnimatePresence>
            {isOtherSource && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                className="px-1"
              >
                <Controller name="other_registration_source" control={control} render={({ field }) => (
                  <Input 
                    {...field} 
                    id="other_source_input"
                    value={field.value || ''}
                    placeholder="Escribe por dónde te enteraste..." 
                    className="h-14 bg-foreground/5 border-foreground/30 dark:border-foreground/10 rounded-2xl px-6 text-base font-bold placeholder:text-foreground/40 dark:placeholder:text-foreground/30 focus:bg-foreground/10 transition-all focus:ring-4 focus:ring-primary/20"
                  />
                )} />
                {errors.other_registration_source && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-rose-500 text-[10px] font-black uppercase tracking-widest italic mt-2 ml-2"
                  >
                    {errors.other_registration_source.message}
                  </motion.p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    case 'church':
      const isOtherChurch = watch('church_headquarters') === 'OTRO';
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 px-1 py-1">
            {CHURCH_HEADQUARTERS.map(h => (
              <SelectableCard
                key={h}
                label={h}
                active={watch('church_headquarters') === h}
                onClick={() => {
                  setValue('church_headquarters', h);
                  if (h !== 'OTRO') {
                    setValue('other_church_headquarters', '');
                  }
                }}
              />
            ))}
          </div>
          <AnimatePresence>
            {isOtherChurch && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-2"
              >
                <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-2 mb-2 block">¿Cuál Sede?</Label>
                <Controller name="other_church_headquarters" control={control} render={({ field }) => (
                  <Input 
                    {...field} 
                    value={field.value || ''}
                    placeholder="Escribe el nombre de tu sede" 
                    className="h-14 bg-foreground/5 border-foreground/30 dark:border-foreground/10 rounded-2xl px-6 text-base font-bold placeholder:text-foreground/40 dark:placeholder:text-foreground/30 focus:bg-foreground/10 transition-all focus:ring-4 focus:ring-primary/20"
                  />
                )} />
                {errors.other_church_headquarters && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-rose-500 text-[10px] font-black uppercase tracking-widest italic mt-2 ml-2"
                  >
                    {errors.other_church_headquarters.message}
                  </motion.p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {errors.church_headquarters && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-rose-500 text-[10px] font-black uppercase tracking-widest italic mt-2 text-center"
              >
                {errors.church_headquarters.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      );
    case 'location':
      const selectedCommune = watch('commune');
      return (
        <div className="space-y-4">
          <Controller name="commune" control={control} render={({ field }) => (
            <CommuneSelector 
              value={field.value} 
              onChange={(val) => {
                setValue('commune', val);
                setValue('neighborhood', '');
              }} 
            />
          )} />
          {selectedCommune && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <Controller name="neighborhood" control={control} render={({ field }) => (
                <NeighborhoodSelector 
                  value={field.value} 
                  commune={selectedCommune}
                  onChange={(val) => setValue('neighborhood', val)} 
                />
              )} />
            </div>
          )}
          {!selectedCommune && (
             <p className="text-center text-[10px] uppercase font-black opacity-20 italic">
               Primero selecciona tu zona para ver los barrios
             </p>
          )}
        </div>
      );
    case 'is_working':
      const working = watch('is_working');
      return (
        <div className="grid grid-cols-2 gap-4">
          <SelectableCard label="SÍ, TRABAJO" active={working === true} onClick={() => setValue('is_working', true)} />
          <SelectableCard label="NO POR AHORA" active={working === false} onClick={() => setValue('is_working', false)} />
        </div>
      );
    case 'profession':
      return (
        <div className="space-y-4">
          <Controller name="profession" control={control} render={({ field }) => (
            <Input {...field} placeholder="Ingresa tu profesión u ocupación" className={inputClass} />
          )} />
          <p className="text-center text-[10px] uppercase font-bold text-foreground/50 dark:text-foreground/30 italic leading-relaxed">
            Ej: Estudiante, Ingeniero, Vendedor, Emprendedor...
          </p>
        </div>
      );
    case 'is_entrepreneur':
      const hasBusiness = watch('is_entrepreneur');
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <SelectableCard label="SÍ, TENGO" active={hasBusiness === true} onClick={() => setValue('is_entrepreneur', true)} />
            <SelectableCard label="NO TENGO" active={hasBusiness === false} onClick={() => setValue('is_entrepreneur', false)} />
          </div>
          <AnimatePresence>
            {hasBusiness && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-3"
              >
                <Controller name="entrepreneur_name" control={control} render={({ field }) => (
                  <Input {...field} placeholder="¿Cuál es tu emprendimiento?" className={inputClass} />
                )} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    case 'is_in_organization':
      const inOrg = watch('is_in_organization');
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <SelectableCard label="SÍ, PERTENEZCO" active={inOrg === true} onClick={() => setValue('is_in_organization', true)} />
            <SelectableCard label="NO PERTENEZCO" active={inOrg === false} onClick={() => setValue('is_in_organization', false)} />
          </div>
          <AnimatePresence>
            {inOrg && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-3"
              >
                <Controller name="organization_name" control={control} render={({ field }) => (
                  <Input {...field} placeholder="¿A qué organización?" className={inputClass} />
                )} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    case 'talents':
      return (
        <div 
          className="space-y-6 animate-fade-in relative z-10 w-full max-h-[60vh] overflow-y-auto no-scrollbar pb-10"
          onScroll={(e) => {
            if (e.currentTarget.scrollTop > 20) {
              setHasScrolledTalents(true);
            }
          }}
        >
           <div className="text-center mb-6 space-y-2">
             <p className="text-[15px] sm:text-base font-bold text-foreground/90 leading-snug px-2">
               ¿Con qué talentos o habilidades podrías apoyar al Partido MIRA?
             </p>
           </div>
           
           <div className="space-y-6">
             {TALENTS_CATEGORIES.map(category => (
               <div key={category.category} className="space-y-5 flex flex-col items-start w-full">
                 <h4 className="text-[10px] text-left uppercase font-black tracking-widest opacity-50 px-2">{category.category}</h4>
                 <div className="flex overflow-x-auto w-full gap-4 px-2 pb-4 snap-x no-scrollbar">
                   {category.options.map(opt => {
                     const isSelected = watch('talents')?.includes(opt);
                     return (
                       <div 
                         key={opt}
                         className="flex flex-col items-center gap-3 snap-start min-w-[76px] cursor-pointer group"
                         onClick={() => {
                           const current = watch('talents') || [];
                           setValue('talents', 
                             isSelected 
                               ? current.filter(i => i !== opt) 
                               : [...current, opt]
                           );
                         }}
                       >
                         <div className={`w-[70px] h-[70px] rounded-full flex items-center justify-center transition-all duration-300 relative ${
                           isSelected 
                             ? 'bg-primary text-white shadow-[0_0_20px_rgba(var(--primary),0.5)] scale-110 border-2 border-primary' 
                             : 'bg-foreground/5 text-foreground/50 border-2 border-transparent hover:bg-foreground/10 hover:text-foreground/80 hover:scale-105'
                         }`}>
                           {isSelected && (
                             <div className="absolute inset-0 bg-primary/20 blur-md rounded-full -z-10" />
                           )}
                           {getTalentIcon(opt)}
                           {isSelected && (
                             <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 shadow-sm">
                               <CheckCircle2 className="w-5 h-5 text-primary fill-primary/10" />
                             </div>
                           )}
                         </div>
                         <span className={`text-[10px] leading-[1.2] text-center font-bold px-1 transition-colors ${
                           isSelected ? 'text-primary' : 'text-foreground/60 group-hover:text-foreground/90'
                         }`}>
                           {opt}
                         </span>
                       </div>
                     );
                   })}
                 </div>
               </div>
             ))}
             
             <div className="space-y-2 pt-4 border-t border-border/50">
               <h4 className="text-[10px] uppercase font-black tracking-widest opacity-50 px-2">Otro (Especifique)</h4>
               <Controller name="other_talent" control={control} render={({ field }) => (
                 <Input 
                   {...field} 
                   value={field.value || ''}
                   placeholder="Ej: Programación, Diseño..." 
                   className={inputClass}
                 />
               )} />
             </div>
           </div>

           <AnimatePresence>
             {!hasScrolledTalents && (
               <motion.div 
                 key="scroll-indicator"
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: 10 }}
                 className="sticky bottom-4 left-0 w-full flex flex-col items-center justify-end pb-4 pt-10 pointer-events-none z-50"
               >
                 <div className="flex flex-col items-center gap-1 text-primary animate-bounce">
                   <span className="text-[10px] font-black tracking-widest uppercase bg-primary/10 px-3 py-1 rounded-full backdrop-blur-sm border border-primary/20">
                     Desliza hacia abajo
                   </span>
                   <ChevronsDown className="w-5 h-5 opacity-80" />
                 </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      );
    case 'education':
      return (
        <div className="grid grid-cols-2 gap-2 px-1 max-h-[40vh] overflow-y-auto no-scrollbar py-2">
          {EDUCATION_LEVELS.map(e => (
            <SelectableCard 
              key={e} 
              label={e} 
              active={watch('education_level') === e} 
              onClick={() => setValue('education_level', e)} 
            />
          ))}
        </div>
      );
    case 'study_area':
      const hasOtherStudyArea = watch('study_area')?.includes('Otra');
      return (
        <div className="space-y-6 overflow-y-auto no-scrollbar pb-32 px-1 relative -mt-6">
          <div className="flex flex-wrap justify-center gap-2.5">
            {STUDY_AREAS.map(a => {
              const isSelected = watch('study_area')?.includes(a);
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => {
                    const current = watch('study_area') || [];
                    setValue('study_area', 
                      isSelected 
                        ? current.filter((i: string) => i !== a)
                        : [...current, a]
                    );
                    if (isSelected && a === 'Otra') {
                      setValue('other_study_area', '');
                    }
                  }}
                  className={`
                    px-5 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 border
                    ${isSelected 
                      ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25 scale-[1.02]' 
                      : 'bg-foreground/5 text-foreground/70 border-transparent hover:bg-foreground/10 hover:border-foreground/10'}
                  `}
                >
                  {a}
                </button>
              );
            })}
          </div>
          <AnimatePresence>
            {hasOtherStudyArea && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-2"
              >
                <Label className="text-[10px] uppercase font-black tracking-widest opacity-50 px-2 mb-2 block">¿Cuál área?</Label>
                <Controller name="other_study_area" control={control} render={({ field }) => (
                  <Input 
                    {...field} 
                    value={field.value || ''}
                    placeholder="Escribe tu área de estudio" 
                    className={inputClass}
                  />
                )} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    case 'interests':
      return (
        <div className="grid grid-cols-2 gap-3 px-1">
          {INTERESTS.map(interest => {
            const isSelected = watch('interests')?.includes(interest);
            return (
              <button
                key={interest}
                type="button"
                onClick={() => {
                  const current = watch('interests') || [];
                  if (isSelected) setValue('interests', current.filter((i: string) => i !== interest));
                  else setValue('interests', [...current, interest]);
                }}
                className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest h-20 flex items-center justify-center text-center transition-all ${isSelected ? 'bg-primary text-white scale-95 shadow-xl' : 'bg-foreground/15 dark:bg-foreground/5 border border-foreground/30 dark:border-foreground/10 opacity-100'}`}
              >
                {interest}
              </button>
            );
          })}
        </div>
      );
    case 'comments':
      return (
        <div className="space-y-4">
           <Controller name="open_comments" control={control} render={({ field }) => (
             <textarea 
               {...field} 
               placeholder="Ideas, sugerencias, reclamos..." 
               className="w-full h-40 bg-foreground/5 border border-foreground/30 dark:border-foreground/10 rounded-3xl p-6 font-bold focus:bg-foreground/10 transition-all outline-none text-foreground placeholder:text-foreground/50 dark:placeholder:text-foreground/30"
             />
           )} />
        </div>
      );
    case 'submitting':
      const isAuthorized = watch('data_authorization');
      return (
        <div className="flex flex-col space-y-6 w-full max-w-2xl mx-auto px-2">
          <div className="text-center space-y-2">
            <h2 className="text-[14px] font-black tracking-tight text-primary leading-tight uppercase">Autorización para la Recolección y Tratamiento de Datos Personales</h2>
          </div>

          <div className="w-full h-80 md:h-96 overflow-y-auto custom-scrollbar bg-zinc-50 dark:bg-zinc-900/50 border border-border p-5 rounded-2xl text-[11px] leading-relaxed text-foreground/80 dark:text-foreground/70 space-y-4 shadow-inner text-left">
            <p className="font-bold text-foreground/90">
              Mediante mi consentimiento consciente, libre y voluntario, autorizo para tratar los datos que proporciono en formularios físicos y electrónicos, incorporándolos en sus bases de datos.
            </p>
            <div>
              <p className="font-bold text-foreground/90 mb-1">Finalidades del Tratamiento de Datos</p>
              <p>He sido informado que mis datos serán utilizados para:</p>
              <ul className="list-disc pl-4 space-y-1 mt-1">
                <li>Cumplir con los deberes legales del Partido.</li>
                <li>Contactarme y enviarme información sobre actividades y proyectos del Partido.</li>
                <li>Invitarme a eventos y reuniones políticas y electorales.</li>
                <li>Difundir propaganda electoral y comunicados internos.</li>
                <li>Realizar sondeos, encuestas y estudios de opinión.</li>
                <li>Informarme sobre la plataforma ideológica y la gestión de representantes del Partido.</li>
                <li>Desarrollar estrategias políticas y electorales basadas en mis preferencias ideológicas y religiosas.</li>
                <li>Compartir mis datos con aspirantes y candidatos del Partido.</li>
                <li>Acompañarme en el proceso de definición de situación militar.</li>
                <li>Cualquier fin compatible con la gestión y defensa de mis derechos.</li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-foreground/90 mb-1">Datos Sensibles y de Menores de Edad</p>
              <p>Reconozco que no estoy obligado a proporcionar datos sensibles, tales como origen étnico, creencias religiosas, orientación política, entre otros. En caso de proporcionar datos de menores, esta autorización incluye el consentimiento de sus representantes legales.</p>
            </div>
            <div>
              <p className="font-bold text-foreground/90 mb-1">Tratamiento</p>
              <p>Autorizo al Partido a transferir mis datos a terceros y realizar diversas operaciones sobre ellos, incluyendo recolección, almacenamiento, uso, circulación, supresión, procesamiento y eliminación. También autorizo la transferencia internacional de mis datos.</p>
              <p className="mt-2">El Partido y los terceros autorizados pueden consultar mi información en bases de datos nacionales e internacionales sobre antecedentes penales, disciplinarios y otros.</p>
            </div>
            <div>
              <p className="font-bold text-foreground/90 mb-1">Derechos del Titular</p>
              <p>He sido informado de mis derechos, entre ellos:</p>
              <ul className="list-disc pl-4 space-y-1 mt-1">
                <li>Conocer, actualizar y rectificar mis datos.</li>
                <li>Solicitar prueba de la autorización otorgada.</li>
                <li>Ser informado sobre el uso de mis datos.</li>
                <li>Presentar quejas ante la Superintendencia de Industria y Comercio.</li>
                <li>Revocar la autorización y solicitar la supresión de mis datos.</li>
                <li>Acceder gratuitamente a mis datos tratados.</li>
              </ul>
              <p className="mt-2">Para ejercer mis derechos, puedo contactar al Partido a través del correo <a href="mailto:protecciondedatos@movimientomira.com.co" className="text-primary underline">protecciondedatos@movimientomira.com.co</a>, la dirección transversal 29 # 36 – 40 en Bogotá D.C., o al teléfono (057) 4432230.</p>
            </div>
            <div>
              <p className="font-bold text-foreground/90 mb-1">Otras Disposiciones</p>
              <p>Declaro que se me ha informado sobre su política de tratamiento de datos. Afirmo que los datos que proporciono son veraces y comprensibles, y que el manejo de los mismos respetará las leyes colombianas, especialmente la Ley 1581 de 2012 y el Decreto 1074 de 2015. Confirmo que he leído y comprendido esta autorización antes de proporcionar mis datos personales y que al dar clic en "ACEPTO", otorgo mi consentimiento libre y voluntario.</p>
            </div>
          </div>

          <button
            type="button"
            className={`w-full h-16 rounded-2xl font-black tracking-widest uppercase transition-all duration-300 border-2 flex items-center justify-center gap-3 ${isAuthorized ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-[0.98]' : 'bg-transparent border-primary text-primary hover:bg-primary/5'}`}
            onClick={() => setValue('data_authorization', !isAuthorized)}
          >
            <div className={`w-6 h-6 rounded-md flex items-center justify-center border-2 transition-all ${isAuthorized ? 'border-white bg-white/20' : 'border-primary/40'}`}>
              {isAuthorized && <CheckCircle2 className="w-4 h-4 text-white" />}
            </div>
            {isAuthorized ? 'ACEPTADO' : 'ACEPTO'}
          </button>

          <AnimatePresence>
             {errors.data_authorization && (
                <motion.p 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="text-rose-500 text-[10px] font-black uppercase tracking-widest italic text-center"
                >
                  DEBES ACEPTAR PARA CONTINUAR
                </motion.p>
             )}
          </AnimatePresence>

          {isSubmitting && (
             <div className="flex items-center justify-center gap-2 pt-4">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-[9px] font-black uppercase tracking-widest text-primary opacity-50">Enviando...</span>
             </div>
          )}
        </div>
      );
    default:
      return null;
  }
}

interface SelectableCardProps {
  label: string;
  active: boolean;
  onClick: () => void;
  centered?: boolean;
  key?: any;
}

function NeighborhoodSelector({ value, commune, onChange }: { value: string, commune: string, onChange: (val: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const neighborhoods = useMemo(() => {
    return NEIGHBORHOODS_BY_COMMUNE[commune] || [];
  }, [commune]);

  const filtered = useMemo(() => {
    if (!search.trim()) return neighborhoods;
    const s = search.toLowerCase().trim();
    return neighborhoods.filter(n => n.toLowerCase().includes(s));
  }, [search, neighborhoods]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full h-16 md:h-20 rounded-2xl bg-foreground/[0.03] dark:bg-foreground/5 border border-foreground/20 dark:border-foreground/10 px-6 flex items-center justify-between group hover:border-primary/50 transition-all shadow-sm"
      >
        <div className="flex flex-col items-start overflow-hidden text-left">
          <span className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-40">Barrio en {commune}</span>
          <span className="text-sm font-bold uppercase truncate max-w-[200px] text-foreground/90">{value || 'Seleccionar barrio...'}</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-all">
          <ChevronRight className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-4 bg-background/95 backdrop-blur-xl"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ y: '20%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '20%', opacity: 0 }}
              className="w-full max-w-lg bg-background border border-foreground/10 rounded-[2.5rem] p-4 md:p-8 shadow-2xl flex flex-col gap-6 max-h-[85vh] relative"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-2">
                 <div className="flex flex-col">
                    <h3 className="text-xl font-black uppercase italic tracking-tighter">Barrios - {commune}</h3>
                    <p className="text-[10px] font-bold opacity-30 uppercase">Selecciona tu barrio de la lista</p>
                 </div>
                 <button 
                  onClick={() => setIsOpen(false)} 
                  className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center text-foreground/50 hover:text-foreground hover:bg-foreground/10 transition-all active:scale-90"
                 >
                    <X className="w-5 h-5" />
                 </button>
              </div>

              <div className="relative px-2">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                <input 
                  autoFocus
                  placeholder="Escribe para buscar tu barrio..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full h-14 bg-foreground/5 border border-foreground/10 rounded-2xl pl-12 pr-4 text-sm font-bold focus:border-primary/50 outline-none transition-all placeholder:font-medium placeholder:opacity-20 uppercase"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 px-2 custom-scrollbar">
                <div className="grid grid-cols-1 gap-2">
                  {/* Dynamic 'Other' option at the TOP for quick access */}
                  {search.trim().length > 2 && !neighborhoods.some(n => n.toLowerCase() === search.toLowerCase().trim()) && (
                    <button
                        type="button"
                        onClick={() => {
                          onChange(search.trim());
                          setIsOpen(false);
                          setSearch('');
                        }}
                        className="w-full h-14 px-5 rounded-2xl flex items-center justify-between text-[11px] font-black uppercase tracking-widest border border-primary/40 bg-primary/10 text-primary mb-2 shadow-lg"
                      >
                        <div className="flex flex-col items-start text-left">
                          <span className="text-[8px] opacity-70">¿Usar nombre ingresado?</span>
                          <span className="truncate">OTRO: {search}</span>
                        </div>
                        <Sparkles className="w-4 h-4" />
                      </button>
                  )}

                  {filtered.map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => {
                        onChange(n);
                        setIsOpen(false);
                        setSearch('');
                      }}
                      className={`w-full h-14 px-5 rounded-2xl flex items-center justify-between text-[11px] font-black uppercase tracking-widest transition-all ${
                        value === n ? 'bg-primary text-white shadow-xl scale-[1.02]' : 'hover:bg-foreground/5 text-foreground/60 border border-foreground/5'
                      }`}
                    >
                      <span className="truncate">{n}</span>
                      {value === n && <CheckCircle2 className="w-4 h-4 shrink-0 ml-2" />}
                    </button>
                  ))}
                </div>
                {filtered.length === 0 && search.trim().length <= 2 && (
                  <div className="py-12 text-center opacity-30 flex flex-col items-center gap-3">
                    <Search className="w-8 h-8 opacity-20" />
                    <p className="text-[10px] uppercase font-black px-8">Selecciona o busca en los barrios oficiales de la {commune}</p>
                  </div>
                )}
                {filtered.length === 0 && search.trim().length > 2 && !neighborhoods.some(n => n.toLowerCase() === search.toLowerCase().trim()) && (
                   <div className="py-8 text-center px-4">
                     <p className="text-[10px] uppercase font-black opacity-30 italic leading-relaxed">
                       Si no encuentras el barrio en la {commune}, pulsa el botón "OTRO" arriba.
                     </p>
                   </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}


function CommuneSelector({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = CALI_COMMUNES.filter(c => 
    c.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full h-16 rounded-2xl bg-foreground/[0.03] dark:bg-foreground/5 border border-foreground/20 dark:border-foreground/10 px-6 flex items-center justify-between group hover:border-primary/50 transition-all shadow-sm"
      >
        <div className="flex flex-col items-start overflow-hidden">
          <span className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-40">Comuna / Corregimiento</span>
          <span className="text-sm font-bold uppercase truncate max-w-[200px] text-foreground/90">{value || 'Seleccionar...'}</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-all">
          <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4 bg-background/95 backdrop-blur-xl"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ y: '20%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '20%', opacity: 0 }}
              className="w-full max-w-lg bg-background border border-foreground/10 rounded-[2.5rem] p-4 md:p-8 shadow-2xl flex flex-col gap-6 max-h-[85vh] relative"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-2">
                 <div className="flex flex-col">
                    <h3 className="text-xl font-black uppercase italic tracking-tighter">Tu Zona</h3>
                    <p className="text-[10px] font-bold opacity-30 uppercase">Selecciona Comuna o Corregimiento</p>
                 </div>
                 <button 
                  onClick={() => setIsOpen(false)} 
                  className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center text-foreground/50 hover:text-foreground hover:bg-foreground/10 transition-all active:scale-90"
                 >
                    <X className="w-5 h-5" />
                 </button>
              </div>

              <div className="relative px-2">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                <input 
                  autoFocus
                  placeholder="Buscar..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full h-14 bg-foreground/5 border border-foreground/10 rounded-2xl pl-12 pr-4 text-sm font-bold focus:border-primary/50 outline-none transition-all placeholder:font-medium placeholder:opacity-20"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 px-2 custom-scrollbar">
                <div className="grid grid-cols-1 gap-2">
                  {filtered.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        onChange(c);
                        setIsOpen(false);
                      }}
                      className={`w-full h-14 px-5 rounded-2xl flex items-center justify-between text-[11px] font-black uppercase tracking-widest transition-all ${
                        value === c ? 'bg-primary text-white shadow-xl scale-[1.02]' : 'hover:bg-foreground/5 text-foreground/60 border border-foreground/5'
                      }`}
                    >
                      <span>{c}</span>
                      {value === c && <CheckCircle2 className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
                {filtered.length === 0 && (
                  <div className="py-12 text-center opacity-30 flex flex-col items-center gap-3">
                    <Search className="w-8 h-8 opacity-20" />
                    <p className="text-[10px] uppercase font-black">No se encontraron resultados</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function SelectableCard({ label, active, onClick, centered = false }: SelectableCardProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      type="button"
      onClick={onClick}
      className={`w-full h-14 md:h-16 rounded-2xl px-3 md:px-6 flex items-center ${
        centered ? 'justify-center relative' : 'justify-between'
      } font-bold text-[10px] md:text-sm transition-all ${
        active 
          ? 'bg-primary text-white shadow-2xl mira-blue-glow' 
          : 'bg-foreground/[0.03] dark:bg-foreground/5 border border-foreground/20 dark:border-foreground/10 text-foreground/80 hover:bg-foreground/[0.06] opacity-100'
      }`}
    >
      <span className={`uppercase tracking-tight leading-tight ${centered ? 'text-center' : 'text-left'}`}>{label}</span>
      {active && (
        <CheckCircle2 className={`w-4 h-4 md:w-5 md:h-5 text-white shrink-0 ${centered ? 'absolute right-4 md:right-6' : 'ml-2'}`} />
      )}
    </motion.button>
  );
}

function SelectablePill({ label, active, onClick }: SelectableCardProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      type="button"
      onClick={onClick}
      className={`relative inline-flex items-center px-4 py-2 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all duration-300 border shadow-sm ${
        active 
          ? 'bg-primary text-white border-primary shadow-primary/25 shadow-lg relative z-10' 
          : 'bg-background hover:bg-foreground/5 text-foreground/80 border-foreground/20 hover:border-foreground/40'
      }`}
    >
      {active && <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 shrink-0" />}
      {label}
    </motion.button>
  );
}

function SuccessScreen({ 
  onExit,
  submittedUser,
  emailStatus = 'idle',
  certificateCode
}: { 
  onExit: () => void;
  submittedUser?: any;
  emailStatus?: 'idle' | 'sending' | 'sent' | 'already_sent' | 'quota_exceeded' | 'error';
  certificateCode?: string | null;
}) {
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-8 bg-background relative overflow-hidden transition-colors duration-300">
       {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="max-w-md w-full p-8 sm:p-10 text-center space-y-8 bg-card/40 backdrop-blur-md rounded-3xl border border-foreground/5 shadow-xl"
      >
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 12 }}
          className="w-20 h-20 sm:w-24 sm:h-24 bg-primary text-white rounded-full mx-auto flex items-center justify-center shadow-2xl"
        > 
           <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
        </motion.div>
        
        <div className="space-y-3">
           <h2 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase italic text-foreground leading-none">¡Registrado!</h2>
           <p className="text-muted-foreground text-xs sm:text-sm font-bold uppercase tracking-widest leading-relaxed">
             Tus respuestas han sido procesadas correctamente.
           </p>
        </div>

        {/* Resend Email Status Notification */}
        {submittedUser?.email && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl border text-xs leading-relaxed space-y-1 bg-background/80 shadow-sm text-left flex items-start gap-3 border-foreground/10"
          >
            <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
              {emailStatus === 'sending' ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              ) : emailStatus === 'sent' ? (
                <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : emailStatus === 'already_sent' ? (
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              ) : emailStatus === 'quota_exceeded' ? (
                <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              ) : (
                <Mail className="w-4 h-4 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-extrabold uppercase tracking-wider text-[11px] text-foreground">
                {emailStatus === 'sending' && 'Enviando certificado oficial...'}
                {emailStatus === 'sent' && '¡Certificado enviado a tu correo!'}
                {emailStatus === 'already_sent' && 'Certificado generado previamente'}
                {emailStatus === 'quota_exceeded' && 'Certificado digital oficial listo'}
                {emailStatus === 'error' && 'Constancia lista para descargar'}
                {emailStatus === 'idle' && 'Certificado oficial generado'}
              </div>
              <p className="text-muted-foreground text-[11px] leading-tight">
                {emailStatus === 'already_sent'
                  ? 'Tu documento ya cuenta con un certificado registrado. Puedes descargarlo aquí abajo.'
                  : emailStatus === 'quota_exceeded'
                  ? 'Por cupo diario, descárgalo directamente aquí. Tu constancia es 100% válida.'
                  : emailStatus === 'sent'
                  ? `Enviado satisfactoriamente a ${submittedUser.email}`
                  : submittedUser.email}
              </p>
            </div>
          </motion.div>
        )}

        {/* Autorización de Acudiente Requerida para Menores */}
        {submittedUser?.isMinor && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 sm:p-5 rounded-3xl border border-amber-500/30 bg-amber-500/10 text-left space-y-3 shadow-md"
          >
            <div className="flex items-center gap-2 text-amber-500 font-black text-xs uppercase tracking-wider">
              <HeartHandshake className="w-4 h-4 text-amber-500" />
              <span>Autorización de Acudiente Requerida</span>
            </div>
            
            <p className="text-xs text-foreground/80 leading-relaxed">
              Como eres menor de edad ({submittedUser.age} años), tu {submittedUser.guardianRelationship || 'acudiente'} (<strong>{submittedUser.guardianName || 'responsable'}</strong>) debe confirmar tu participación mediante firma digital.
            </p>

            <div className="pt-1">
              <Button
                type="button"
                onClick={() => {
                  const url = buildGuardianAuthWhatsAppUrl({
                    first_name: submittedUser.firstName,
                    last_name: submittedUser.lastName,
                    age: submittedUser.age,
                    gender: submittedUser.gender,
                    guardian_name: submittedUser.guardianName,
                    guardian_phone: submittedUser.guardianPhone,
                    guardian_relationship: submittedUser.guardianRelationship,
                    guardian_token: submittedUser.guardianToken
                  });
                  window.open(url, '_blank');
                }}
                className="w-full h-12 rounded-2xl font-black text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-600/25 active:scale-95 transition-all cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                Enviar a mi acudiente por WhatsApp
              </Button>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {submittedUser && (
            <Button
              type="button"
              onClick={() => setShowCertificateModal(true)}
              variant="outline"
              size="lg"
              className="w-full h-14 rounded-2xl font-black text-sm tracking-wider uppercase border-2 border-primary/30 hover:bg-primary/5 hover:border-primary text-primary transition-all flex items-center justify-center gap-2"
            >
              <Award className="w-4 h-4" />
              Ver mi Certificado Digital
            </Button>
          )}

          <Button 
            onClick={onExit}
            size="lg"
            className="w-full h-14 sm:h-16 rounded-2xl font-black text-base sm:text-lg shadow-2xl bg-primary text-white hover:bg-primary/90 transition-all mira-blue-glow"
          >
            FINALIZAR
          </Button>
        </div>
      </motion.div>

      {/* Certificate Modal */}
      {submittedUser && (
        <CertificateModal
          isOpen={showCertificateModal}
          onClose={() => setShowCertificateModal(false)}
          data={{
            fullName: submittedUser.fullName,
            documentType: submittedUser.documentType,
            documentNumber: submittedUser.documentNumber,
            commune: submittedUser.commune,
            neighborhood: submittedUser.neighborhood,
            code: certificateCode || undefined,
          }}
        />
      )}
    </div>
  );
}
