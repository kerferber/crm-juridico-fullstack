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
        <aside className={cn(
            "flex flex-col bg-card dark:bg-dark-card border-r border-border dark:border-dark-border transition-all duration-300 ease-in-out",
            isCollapsed ? "w-20" : "w-64"
        )}>
            <div className={cn("flex items-center p-4 border-b border-border dark:border-dark-border", isCollapsed ? "justify-center" : "justify-between")}>
                {!isCollapsed && <span className="text-xl font-bold text-primary dark:text-dark-primary">CRM Jurídico</span>}
                <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-dark-border">
                    {isCollapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
                </button>
            </div>
            <nav className="flex-1 px-2 py-4 space-y-2">
                {navItems.map(item => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end
                        className={({ isActive }) => cn(
                            "flex items-center p-2 rounded-lg text-foreground dark:text-dark-foreground hover:bg-gray-100 dark:hover:bg-dark-border",
                            isActive && "bg-primary/10 text-primary dark:bg-dark-primary/10 dark:text-dark-primary",
                            isCollapsed && "justify-center"
                        )}
                        title={isCollapsed ? item.label : undefined}
                    >
                        <item.icon className="h-5 w-5" />
                        {!isCollapsed && <span className="ml-3">{item.label}</span>}
                    </NavLink>
                ))}
            </nav>
            <div className="p-2 border-t border-border dark:border-dark-border">
                 <NavLink
                    to="/config"
                    className={({ isActive }) => cn(
                        "flex items-center p-2 rounded-lg text-foreground dark:text-dark-foreground hover:bg-gray-100 dark:hover:bg-dark-border",
                        isActive && "bg-primary/10 text-primary dark:bg-dark-primary/10 dark:text-dark-primary",
                        isCollapsed && "justify-center"
                    )}
                    title={isCollapsed ? "Configurações" : undefined}
                >
                    <Settings className="h-5 w-5" />
                    {!isCollapsed && <span className="ml-3">Configurações</span>}
                </NavLink>
            </div>
        </aside>
    );
};

export default Sidebar;