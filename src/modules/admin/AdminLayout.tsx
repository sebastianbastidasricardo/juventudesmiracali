import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { MiraLogo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BarChart3, 
  Users, 
  Settings, 
  LogOut, 
  FileText, 
  LayoutDashboard,
  Menu,
  X,
  UserCircle,
  Award,
  HeartHandshake
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Open sidebar by default on large screens
    if (window.innerWidth >= 768) {
      setIsSidebarOpen(true);
    }
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/admin/login');
      } else {
        setUser(session.user);
      }
    };
    checkUser();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.info('Sesión cerrada');
    navigate('/admin/login');
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { label: 'Registros', icon: Users, path: '/admin/registros' },
    { label: 'Padres', icon: HeartHandshake, path: '/admin/padres' },
    { label: 'Certificados', icon: Award, path: '/admin/certificados' },
    { label: 'Configuración', icon: Settings, path: '/admin/config' },
  ];

  return (
    <div className="flex h-[100dvh] bg-background text-foreground overflow-hidden">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden text-foreground hover:bg-foreground/10"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X /> : <Menu />}
      </Button>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 glass transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 border-r border-foreground/5
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center px-6 border-b glass-dark border-foreground/5">
            <MiraLogo />
          </div>
          
          <ScrollArea className="flex-1 py-6 px-4">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                    ${location.pathname === item.path 
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]' 
                      : 'hover:bg-foreground/5 text-muted-foreground hover:text-foreground'}
                  `}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </ScrollArea>

          <div className="p-4 border-t space-y-4">
            <div className="flex items-center gap-3 px-4 py-2">
              <UserCircle className="h-8 w-8 text-muted-foreground" />
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-bold truncate">{user?.email}</span>
                <span className="text-[10px] text-muted-foreground uppercase">Administrador</span>
              </div>
            </div>
            <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full h-full relative overflow-y-auto">
        <header className="h-16 shrink-0 sticky top-0 flex items-center justify-between px-4 md:px-8 glass-dark border-b border-foreground/5 z-20">
          <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
            <div className="w-8 md:hidden flex-shrink-0" />
            <h2 className="font-black text-sm md:text-lg uppercase tracking-tight truncate">
              {navItems.find(i => i.path === location.pathname)?.label || 'Panel Admin'}
            </h2>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <span className="hidden sm:inline-block text-[10px] text-muted-foreground bg-foreground/5 dark:bg-white/5 border border-foreground/10 px-2 py-1 rounded uppercase font-black tracking-tighter">Realtime Connected</span>
            <ThemeToggle />
            <div className="w-8 h-8 rounded-full bg-primary/20 flex md:hidden items-center justify-center font-black text-[10px] text-primary">
               {user?.email?.[0].toUpperCase() || 'A'}
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 w-full max-w-full mx-auto pb-24">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
