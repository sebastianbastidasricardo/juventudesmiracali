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
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 -mt-10 sm:-mt-14">
        <div className="w-full max-w-sm flex flex-col items-center text-center space-y-12 sm:space-y-14">
          
          <div className="flex flex-col items-center">
            {/* Pill: • CARACTERIZACIÓN (Entrada suave desde arriba) */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2.5 px-6 py-1.5 rounded-full bg-[#f0f4fc] dark:bg-primary/15 border border-[#d3e0f5] dark:border-primary/30 mb-3 shadow-xs transition-colors"
            >
              <div className="w-2 h-2 rounded-full bg-[#002b79] dark:bg-primary shrink-0 transition-colors" />
              <span className="text-[11px] sm:text-xs font-[900] uppercase tracking-[0.28em] text-[#002b79] dark:text-primary transition-colors">
                CARACTERIZACIÓN
              </span>
            </motion.div>

            {/* Título: ¡MIRA VÉ! entrando desde la izquierda y CALI ES DE TODOS desde la derecha */}
            <h1 className="flex flex-col items-center select-none overflow-visible">
              {/* ¡MIRA VÉ!: animación suave y pausada deslizándose desde la izquierda */}
              <motion.span
                initial={{ opacity: 0, x: -35 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="text-[52px] sm:text-[68px] md:text-[76px] font-[900] leading-[0.92] tracking-tight text-[#002b79] dark:text-white transition-colors"
              >
                ¡MIRA VÉ!
              </motion.span>

              {/* CALI ES DE TODOS: animación suave y pausada deslizándose desde la derecha */}
              <motion.span
                initial={{ opacity: 0, x: 35 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1.4, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="text-[26px] sm:text-[38px] md:text-[44px] font-[900] italic uppercase leading-none tracking-tight text-[#94a3b8] dark:text-primary mt-0.5 sm:mt-1 transition-colors whitespace-nowrap"
              >
                CALI ES DE TODOS
              </motion.span>
            </h1>
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
          <span className="tracking-[0.25em]">LEY 1581</span>
        </div>
      </motion.footer>

    </div>
  );
}
