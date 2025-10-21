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
  Sparkles,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  accentClass?: string;
  exact?: boolean;
}

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const primaryNav: NavItem[] = [
  { to: '/', label: 'Página inicial', icon: Home, accentClass: 'bg-primary/90', exact: true },
  { to: '/tarefas', label: 'Minhas tarefas', icon: CheckSquare, accentClass: 'bg-emerald-500' },
  { to: '/agenda', label: 'Caixa de entrada', icon: Inbox, accentClass: 'bg-sky-500' },
];

const insightNav: NavItem[] = [
  { to: '/insights', label: 'Insights', icon: Sparkles, accentClass: 'bg-amber-500' },
  { to: '/gestao', label: 'Relatórios', icon: BarChart3, accentClass: 'bg-primary/80' },
  { to: '/financeiro', label: 'Portfólios', icon: DollarSign, accentClass: 'bg-indigo-500' },
  { to: '/gamificacao', label: 'Metas & Gamificação', icon: Trophy, accentClass: 'bg-purple-500' },
];

const projectNav: NavItem[] = [
  { to: '/crm', label: 'CRM · Pipeline', icon: LayoutDashboard, accentClass: 'bg-primary' },
  { to: '/processos', label: 'Processos', icon: Briefcase, accentClass: 'bg-sky-500' },
  { to: '/contatos', label: 'Contatos', icon: Users, accentClass: 'bg-rose-500' },
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
          'fixed inset-y-0 left-0 z-50 flex h-full min-h-0 w-[232px] flex-col border-r border-slate-200 bg-surface transition-transform duration-200 dark:border-dark-border/60 dark:bg-dark-surface md:relative md:z-30 md:w-auto md:translate-x-0 md:shadow-none',
          isCollapsedDesktop ? 'md:w-[84px]' : 'md:w-[248px]',
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex min-h-[64px] items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-dark-border/60">
          {!isCollapsedDesktop ? (
            <div className="flex flex-col">
              <span className="text-base font-semibold leading-tight text-foreground dark:text-dark-foreground">
                CRM Jurídico
              </span>
              <span className="text-xs font-medium text-muted-foreground dark:text-dark-muted">
                Workflow Studio
              </span>
            </div>
          ) : (
            <span className="text-sm font-semibold text-primary">CJ</span>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={onMobileClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-surface text-muted-foreground transition hover:border-primary/40 hover:text-foreground dark:border-dark-border/60 dark:bg-dark-surface dark:hover:bg-dark-border/40 md:hidden"
              aria-label="Fechar menu"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              onClick={handleToggleCollapse}
              className={cn(
                'hidden rounded-md border border-slate-200 p-1.5 text-muted-foreground transition hover:border-primary/40 hover:text-foreground dark:border-dark-border/60 dark:bg-dark-surface dark:hover:bg-dark-border/50 md:inline-flex',
                isCollapsedDesktop ? 'justify-center' : ''
              )}
              aria-label="Alternar largura do menu"
            >
              {isCollapsedDesktop ? <ChevronsRight className="h-3 w-3" /> : <ChevronsLeft className="h-3 w-3" />}
            </button>
          </div>
        </div>

        <nav className="flex-1 space-y-3 overflow-y-auto px-3 py-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted/40">
          {sections.map(section => (
            <div key={section.id} className="space-y-2">
              {!isCollapsedDesktop && (
                <div className="px-1.5 text-xs font-semibold text-muted-foreground/80">
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
                        'group relative flex items-center gap-3 rounded-md py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15',
                        isCollapsedDesktop ? 'justify-center px-0' : 'pl-6 pr-3',
                        isActive
                          ? 'bg-primary/10 text-foreground dark:bg-dark-primary/15 dark:text-dark-foreground'
                          : 'text-muted-foreground hover:bg-surface-muted dark:hover:bg-dark-surface-muted'
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
                        {!isCollapsedDesktop && (
                          <span
                            className={cn(
                              'absolute left-3 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-sm transition-opacity duration-200',
                              item.accentClass ?? 'bg-primary',
                              isActive ? 'opacity-100' : 'opacity-0'
                            )}
                            aria-hidden="true"
                          />
                        )}
                        <item.icon
                          className={cn(
                            'h-[18px] w-[18px] flex-shrink-0 transition-colors',
                            isActive ? 'text-primary dark:text-dark-primary' : 'text-muted-foreground'
                          )}
                        />
                        {!isCollapsedDesktop && (
                          <span className="flex-1 text-sm leading-none text-foreground dark:text-dark-foreground">
                            {item.label}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className={cn('border-t border-slate-200 px-3 py-3 dark:border-dark-border/60', isCollapsedDesktop && 'px-2')}>
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
                'group relative flex items-center gap-3 rounded-md py-1.5 text-sm font-medium transition hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15 dark:hover:bg-dark-surface-muted',
                isCollapsedDesktop ? 'justify-center px-0' : 'pl-6 pr-3',
                isActive
                  ? 'bg-primary/10 text-foreground dark:bg-dark-primary/15 dark:text-dark-foreground'
                  : 'text-muted-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                {!isCollapsedDesktop && (
                  <span
                    className={cn(
                      'absolute left-3 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full transition-opacity duration-200',
                      'bg-primary/80',
                      isActive ? 'opacity-100' : 'opacity-0'
                    )}
                    aria-hidden="true"
                  />
                )}
                <Settings
                  className={cn(
                    'h-[18px] w-[18px] flex-shrink-0 transition-colors',
                    isActive ? 'text-primary dark:text-dark-primary' : 'text-muted-foreground'
                  )}
                />
                {!isCollapsedDesktop && (
                  <span className="text-sm leading-none text-foreground dark:text-dark-foreground">Configurações</span>
                )}
              </>
            )}
          </NavLink>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
