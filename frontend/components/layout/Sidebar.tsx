import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { 
    LayoutDashboard, BarChart3, Users, Briefcase, CheckSquare, Calendar, DollarSign, Settings, ChevronsLeft, ChevronsRight, GitFork, Trophy
} from 'lucide-react';

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Visão Geral' },
    { to: '/crm', icon: BarChart3, label: 'CRM' },
    { to: '/contatos', icon: Users, label: 'Contatos' },
    { to: '/processos', icon: Briefcase, label: 'Processos' },
    { to: '/tarefas', icon: CheckSquare, label: 'Tarefas' },
    { to: '/agenda', icon: Calendar, label: 'Agenda' },
    { to: '/financeiro', icon: DollarSign, label: 'Financeiro' },
    { to: '/gestao', icon: GitFork, label: 'Gestão' },
    { to: '/gamificacao', icon: Trophy, label: 'Gamificação' },
];

const Sidebar: React.FC = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <aside
            className={cn(
                'relative z-20 flex flex-col border-r border-border/60 bg-white transition-all duration-200 ease-in-out dark:border-dark-border/70 dark:bg-dark-card/95',
                isCollapsed ? 'w-16' : 'w-60'
            )}
        >
            <div
                className={cn(
                    'flex items-center gap-3 border-b border-border/60 px-4 py-4 dark:border-dark-border/70',
                    isCollapsed ? 'justify-center' : 'justify-between'
                )}
            >
                {!isCollapsed && (
                    <span className="text-[15px] font-semibold tracking-tight text-foreground dark:text-dark-foreground">
                        CRM Jurídico
                    </span>
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="rounded-md border border-border/50 p-1.5 text-muted-foreground transition hover:text-foreground dark:border-dark-border/60 dark:hover:bg-dark-border/60"
                    aria-label="Alternar largura do menu"
                >
                    {isCollapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
                </button>
            </div>
            <nav className="flex-1 space-y-1 px-2 py-6">
                {navItems.map(item => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end
                        title={isCollapsed ? item.label : undefined}
                        className={({ isActive }) =>
                            cn(
                                'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20',
                                isCollapsed ? 'justify-center px-0 py-2' : 'justify-start',
                                isActive ? 'text-foreground dark:text-dark-foreground' : 'hover:text-foreground',
                                !isCollapsed && isActive && 'border-l-2 border-primary bg-primary/5 dark:border-dark-primary dark:bg-dark-primary/10'
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon className={cn('h-[18px] w-[18px]', isActive ? 'text-primary dark:text-dark-primary' : 'text-muted-foreground')} />
                                {!isCollapsed && <span className="text-[13px] tracking-tight">{item.label}</span>}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>
            <div className="border-t border-border/60 px-2 py-4 dark:border-dark-border/60">
                <NavLink
                    to="/config"
                    title={isCollapsed ? 'Configurações' : undefined}
                    className={({ isActive }) =>
                        cn(
                            'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground',
                            isCollapsed ? 'justify-center px-0 py-2' : 'justify-start',
                            isActive ? 'text-foreground dark:text-dark-foreground' : 'hover:text-foreground',
                            !isCollapsed && isActive && 'border-l-2 border-primary bg-primary/5 dark:border-dark-primary dark:bg-dark-primary/10'
                        )
                    }
                >
                    {({ isActive }) => (
                        <>
                            <Settings className={cn('h-[18px] w-[18px]', isActive ? 'text-primary dark:text-dark-primary' : 'text-muted-foreground')} />
                            {!isCollapsed && <span className="text-[13px] tracking-tight">Configurações</span>}
                        </>
                    )}
                </NavLink>
            </div>
        </aside>
    );
};

export default Sidebar;
