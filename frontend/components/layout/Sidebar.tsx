import React, { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Inbox,
  CheckSquare,
  LayoutDashboard,
  Users,
  Briefcase,
  DollarSign,
  BarChart3,
  Trophy,
  Settings,
  ChevronsRight,
  ChevronsLeft,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeColor?: string;
  exact?: boolean;
}

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const primaryNav: NavItem[] = [
  { to: '/', label: 'Página inicial', icon: Home, exact: true },
  { to: '/tarefas', label: 'Minhas tarefas', icon: CheckSquare },
  { to: '/agenda', label: 'Caixa de entrada', icon: Inbox },
];

const insightNav: NavItem[] = [
  { to: '/gestao', label: 'Relatórios', icon: BarChart3 },
  { to: '/financeiro', label: 'Portfólios', icon: DollarSign },
  { to: '/gamificacao', label: 'Metas & Gamificação', icon: Trophy },
];

const projectNav: NavItem[] = [
  { to: '/crm', label: 'CRM · Pipeline', icon: LayoutDashboard, badgeColor: 'bg-indigo-500' },
  { to: '/processos', label: 'Processos', icon: Briefcase, badgeColor: 'bg-sky-500' },
  { to: '/contatos', label: 'Contatos', icon: Users, badgeColor: 'bg-rose-500' },
];

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen = false, onMobileClose = () => {} }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isCollapsedDesktop = isCollapsed && !isMobileOpen;

  const sections = useMemo(
    () => [
      { id: 'main', title: 'Geral', items: primaryNav },
      { id: 'insights', title: 'Insights', items: insightNav },
      { id: 'projects', title: 'Projetos', items: projectNav },
    ],
    []
  );

  const handleToggleCollapse = () => setIsCollapsed(prev => !prev);

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/35 backdrop-blur-sm transition-opacity duration-200 md:hidden',
          isMobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onMobileClose}
        aria-hidden="true"
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-full min-h-0 w-[240px] flex-col border-r border-border/60 bg-white transition-transform duration-200 dark:border-dark-border/60 dark:bg-dark-card/95 md:relative md:z-30 md:w-auto md:translate-x-0 md:shadow-none',
          isCollapsedDesktop ? 'md:w-[68px]' : 'md:w-[240px]',
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex min-h-[72px] items-center justify-between border-b border-border/50 px-3 py-4 dark:border-dark-border/60">
          {!isCollapsedDesktop ? (
            <div className="flex flex-col gap-1">
              <span className="text-[13px] font-semibold tracking-tight leading-tight text-foreground dark:text-dark-foreground">
                CRM Jurídico
              </span>
              <span className="text-[9px] uppercase tracking-[0.26em] text-muted-foreground/70">
                Workflow Studio
              </span>
            </div>
          ) : (
            <span className="text-sm font-semibold text-primary">CJ</span>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={onMobileClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition hover:text-foreground dark:border-dark-border/60 dark:hover:bg-dark-border/50 md:hidden"
              aria-label="Fechar menu"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              onClick={handleToggleCollapse}
              className={cn(
                'hidden rounded-full border border-border/70 p-1 text-muted-foreground transition hover:text-foreground dark:border-dark-border/60 dark:hover:bg-dark-border/50 md:inline-flex',
                isCollapsedDesktop ? 'justify-center' : ''
              )}
              aria-label="Alternar largura do menu"
            >
              {isCollapsedDesktop ? <ChevronsRight className="h-3 w-3" /> : <ChevronsLeft className="h-3 w-3" />}
            </button>
          </div>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted/40">
          {sections.map(section => (
            <div key={section.id} className="space-y-2">
              {!isCollapsedDesktop && (
                <div className="px-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/80">
                  {section.title}
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.exact}
                    title={isCollapsedDesktop ? item.label : undefined}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center gap-3 rounded-md px-2.5 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15',
                        isCollapsedDesktop ? 'justify-center px-0 py-1.5' : 'justify-start',
                        isActive
                          ? 'bg-primary/10 text-primary dark:bg-dark-primary/10 dark:text-dark-primary'
                          : 'text-muted-foreground hover:bg-muted/20 dark:hover:bg-dark-border/40'
                      )
                    }
                    onClick={() => {
                      if (isMobileOpen) {
                        onMobileClose();
                      }
                    }}
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          className={cn(
                            'h-[17px] w-[17px]',
                            isActive ? 'text-primary dark:text-dark-primary' : 'text-muted-foreground'
                          )}
                        />
                        {!isCollapsedDesktop && (
                          <span className="flex-1 text-[13px] tracking-tight text-foreground dark:text-dark-foreground">
                            {item.label}
                          </span>
                        )}
                        {!isCollapsedDesktop && item.badgeColor && (
                          <span className={cn('h-2 w-2 rounded-full', item.badgeColor)} />
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className={cn('border-t border-border/60 px-3 py-3 dark:border-dark-border/60', isCollapsedDesktop && 'px-2')}>
          <NavLink
            to="/config"
            title={isCollapsedDesktop ? 'Configurações' : undefined}
            onClick={() => {
              if (isMobileOpen) {
                onMobileClose();
              }
            }}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-2.5 py-1.5 text-sm font-medium transition hover:bg-muted/25 dark:hover:bg-dark-border/40',
                isCollapsedDesktop ? 'justify-center px-0 py-1.5' : 'justify-start',
                isActive
                  ? 'bg-primary/10 text-primary dark:bg-dark-primary/10 dark:text-dark-primary'
                  : 'text-muted-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Settings
                  className={cn(
                    'h-[17px] w-[17px]',
                    isActive ? 'text-primary dark:text-dark-primary' : 'text-muted-foreground'
                  )}
                />
                {!isCollapsedDesktop && <span className="text-[13px] tracking-tight">Configurações</span>}
              </>
            )}
          </NavLink>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
