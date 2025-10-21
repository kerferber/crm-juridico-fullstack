import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ShieldCheck, Users, BarChart2, LogOut } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAdminAuth } from '../../store/AdminAuthContext';

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: BarChart2 },
  { to: '/admin/tenants', label: 'Tenants', icon: Users },
];

const AdminLayout: React.FC = () => {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-surface-muted text-foreground dark:bg-dark-background">
      <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-border/70 bg-surface px-6 py-8 dark:border-dark-border/60 dark:bg-dark-surface lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Admin
            </p>
            <h1 className="text-lg font-semibold">Painel SaaS</h1>
          </div>
        </div>

        <nav className="mt-10 flex-1 space-y-2 text-sm">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 font-medium transition ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-border/30 hover:text-foreground dark:hover:bg-dark-border/40'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto rounded-xl bg-surface-muted p-4 text-sm dark:bg-dark-surface-muted">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Administrador</p>
          <p className="mt-2 font-semibold">{admin?.name ?? 'Admin'}</p>
          <p className="text-xs text-muted-foreground">{admin?.email ?? ''}</p>
          <Button
            variant="ghost"
            className="mt-4 w-full justify-center border border-border/60 text-sm text-muted-foreground hover:text-primary"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border/70 bg-surface px-4 py-3 dark:border-dark-border/60 dark:bg-dark-surface lg:px-8">
          <div className="lg:hidden">
            <h1 className="text-lg font-semibold">Painel SaaS</h1>
            <p className="text-xs text-muted-foreground">Administração central do CRM</p>
          </div>
          <Button variant="ghost" className="lg:hidden" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
          <div className="hidden items-center gap-4 text-sm text-muted-foreground lg:flex">
            <span>{admin?.name}</span>
            <span className="h-1 w-1 rounded-full bg-primary" />
            <span>{admin?.email}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-10 lg:py-8">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
