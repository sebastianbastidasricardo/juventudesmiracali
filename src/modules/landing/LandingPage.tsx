import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex flex-col justify-between overflow-x-hidden bg-white dark:bg-background text-slate-900 dark:text-foreground selection:bg-[#002b79] selection:text-white transition-colors duration-300">
      
      {/* Botón de Modo Claro / Oscuro en la esquina superior derecha */}
      <header className="relative z-30 w-full flex justify-end p-5 sm:p-7">
        <ThemeToggle />
      </header>

      {/* Contenido Central */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 -mt-8 sm:-mt-12">
        <div className="w-full max-w-md sm:max-w-lg flex flex-col items-center text-center space-y-10 sm:space-y-12">
          
          <div className="flex flex-col items-center w-full">
            {/* Pill: • CARACTERIZACIÓN (Entrada suave desde arriba) */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2.5 px-6 py-1.5 rounded-full bg-[#f0f4fc] dark:bg-primary/15 border border-[#d3e0f5] dark:border-primary/30 mb-4 shadow-xs transition-colors"
            >
              <div className="w-2 h-2 rounded-full bg-[#002b79] dark:bg-primary shrink-0 transition-colors" />
              <span className="text-[11px] sm:text-xs font-[900] uppercase tracking-[0.28em] text-[#002b79] dark:text-primary transition-colors">
                CARACTERIZACIÓN
              </span>
            </motion.div>

            {/* Logo Oficial: ¡MIRÁ ve, CALI es DE TODOS! con animación suave */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1.1, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-[340px] sm:max-w-[420px] md:max-w-[460px] px-2 flex items-center justify-center select-none"
            >
              <img
                src="/assets/aistudio/_MIRA_ve__CALI_es_DE_TODOS__06ff50a0.png"
                alt="¡MIRÁ ve, CALI es DE TODOS!"
                className="w-full h-auto object-contain drop-shadow-md dark:drop-shadow-[0_10px_30px_rgba(0,132,255,0.35)] select-none pointer-events-none"
                draggable={false}
              />
            </motion.div>
          </div>

          {/* Botón COMENZAR: Entrada suave desde abajo y animación continua de respiración */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.3, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[320px]"
          >
            <motion.div
              animate={{
                scale: [1, 1.03, 1],
                boxShadow: [
                  "0 10px 25px -4px rgba(0, 43, 121, 0.25)",
                  "0 20px 35px -4px rgba(0, 132, 255, 0.45)",
                  "0 10px 25px -4px rgba(0, 43, 121, 0.25)"
                ]
              }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              className="w-full rounded-full"
            >
              <button 
                type="button"
                onClick={() => navigate('/encuesta')}
                className="w-full h-15 sm:h-16 rounded-full text-base sm:text-lg font-[900] tracking-wider uppercase text-white bg-[#002b79] dark:bg-primary hover:brightness-110 active:brightness-95 transition-all flex items-center justify-center gap-3 cursor-pointer border-0 shadow-lg dark:mira-blue-glow"
              >
                <span>COMENZAR</span>
                <ArrowRight className="w-5 h-5 text-white stroke-[2.5]" />
              </button>
            </motion.div>
          </motion.div>

        </div>
      </main>

      {/* Footer Minimalista con fade-in */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.45 }}
        className="w-full py-6 flex justify-center"
      >
        <div className="flex items-center space-x-4 sm:space-x-6 text-[10px] sm:text-[11px] font-[900] uppercase text-[#94a3b8]/90 dark:text-muted-foreground/80 transition-colors">
          <span className="tracking-[0.25em]">2026</span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <button 
            type="button"
            onClick={() => navigate('/admin/login')} 
            className="tracking-[0.18em] hover:text-[#002b79] dark:hover:text-primary transition-colors cursor-pointer"
          >
            Admin Portal
          </button>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span className="tracking-[0.25em]">CALI</span>
        </div>
      </motion.footer>

      {/* Botón flotante de WhatsApp en la esquina inferior derecha */}
      <motion.a
        href="https://chat.whatsapp.com/IsrWnCEzUcP4KTyL2Xx8yC"
        target="_blank"
        rel="noopener noreferrer"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-16 right-5 sm:bottom-12 sm:right-7 z-40 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center justify-center shadow-lg shadow-[#25D366]/30 transition-colors cursor-pointer"
        title="Unirse al grupo de WhatsApp"
        aria-label="Unirse al grupo de WhatsApp"
      >
        <svg className="w-6 h-6 sm:w-7 sm:h-7 fill-white" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
      </motion.a>

    </div>
  );
}
