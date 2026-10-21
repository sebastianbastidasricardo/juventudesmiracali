/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import LandingPage from '@/modules/landing/LandingPage';
import CharacterizationForm from '@/modules/characterization/CharacterizationForm';
import AdminDashboard from '@/modules/admin/AdminDashboard';
import AdminLogin from '@/modules/admin/AdminLogin';
import AdminLayout from '@/modules/admin/AdminLayout';
import RegistrosPage from '@/modules/admin/RegistrosPage';
import PadresPage from '@/modules/admin/PadresPage';
import CertificadosPage from '@/modules/admin/CertificadosPage';
import SettingsPage from '@/modules/admin/SettingsPage';
import AutorizacionPadrePage from '@/modules/autorizacion/AutorizacionPadrePage';
import { supabase } from '@/lib/supabase';
import { AlertCircle } from 'lucide-react';

function SupabaseGuard({ children }: { children: React.ReactNode }) {
  if (!supabase) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full glass p-8 rounded-3xl border-destructive/20 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold">Configuración Requerida</h2>
          <p className="text-sm text-muted-foreground">
            Faltan las variables de entorno de Supabase. Por favor, configura 
            <code className="px-1 py-0.5 bg-muted rounded mx-1">VITE_SUPABASE_URL</code> y 
            <code className="px-1 py-0.5 bg-muted rounded mx-1">VITE_SUPABASE_ANON_KEY</code> en los Secrets de la plataforma.
          </p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <Toaster position="top-center" expand={false} richColors />
      <SupabaseGuard>
        <div className="min-h-screen bg-background text-foreground font-sans antialiased relative selection:bg-primary selection:text-white">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/encuesta" element={<CharacterizationForm />} />
          <Route path="/autorizacion" element={<AutorizacionPadrePage />} />
          <Route path="/autorizacion/:token" element={<AutorizacionPadrePage />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="registros" element={<RegistrosPage />} />
            <Route path="padres" element={<PadresPage />} />
            <Route path="certificados" element={<CertificadosPage />} />
            <Route path="config" element={<SettingsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      </SupabaseGuard>
    </Router>
  );
}

