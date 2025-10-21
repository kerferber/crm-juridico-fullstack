
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCommandPalette } from '../../hooks/useCommandPalette';
import { useContactModal } from '../../hooks/useContactModal';
import { useProcessModal } from '../../hooks/useProcessModal';
import { useTaskModal } from '../../hooks/useTaskModal';
import { useTransactionModal } from '../../hooks/useTransactionModal';
import { TransactionType } from '../../types/types';
import {
    LayoutDashboard,
    BarChart3,
    Users,
    Briefcase,
    CheckSquare,
    Calendar,
    DollarSign,
    Settings,
    GitFork,
    Trophy,
    Plus,
    Search,
    Sparkles,
} from 'lucide-react';

interface Command {
    id: string;
    title: string;
    icon: React.ElementType;
    action: () => void;
    section: 'Navegação' | 'Ações Rápidas';
}

const CommandPalette: React.FC = () => {
    const { isOpen, setIsOpen } = useCommandPalette();
    const { open: openContactModal } = useContactModal();
    const { open: openProcessModal } = useProcessModal();
    const { open: openTaskModal } = useTaskModal();
    const { open: openTransactionModal } = useTransactionModal();
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    const commands: Command[] = [
        // Navigation
        { id: 'nav-1', title: 'Visão Geral', icon: LayoutDashboard, action: () => navigate('/'), section: 'Navegação' },
        { id: 'nav-2', title: 'CRM', icon: BarChart3, action: () => navigate('/crm'), section: 'Navegação' },
        { id: 'nav-3', title: 'Contatos', icon: Users, action: () => navigate('/contatos'), section: 'Navegação' },
        { id: 'nav-4', title: 'Processos', icon: Briefcase, action: () => navigate('/processos'), section: 'Navegação' },
        { id: 'nav-5', title: 'Tarefas', icon: CheckSquare, action: () => navigate('/tarefas'), section: 'Navegação' },
        { id: 'nav-6', title: 'Agenda', icon: Calendar, action: () => navigate('/agenda'), section: 'Navegação' },
        { id: 'nav-7', title: 'Financeiro', icon: DollarSign, action: () => navigate('/financeiro'), section: 'Navegação' },
        { id: 'nav-8', title: 'Insights', icon: Sparkles, action: () => navigate('/insights'), section: 'Navegação' },
        { id: 'nav-9', title: 'Gestão', icon: GitFork, action: () => navigate('/gestao'), section: 'Navegação' },
        { id: 'nav-10', title: 'Gamificação', icon: Trophy, action: () => navigate('/gamificacao'), section: 'Navegação' },
        { id: 'nav-11', title: 'Configurações', icon: Settings, action: () => navigate('/config'), section: 'Navegação' },

        // Quick Actions
        { id: 'act-1', title: 'Novo Contato', icon: Plus, action: () => { navigate('/contatos'); openContactModal(); }, section: 'Ações Rápidas' },
        { id: 'act-2', title: 'Novo Processo', icon: Plus, action: () => { navigate('/processos'); openProcessModal(); }, section: 'Ações Rápidas' },
        { id: 'act-3', title: 'Nova Tarefa', icon: Plus, action: () => { navigate('/tarefas'); openTaskModal(); }, section: 'Ações Rápidas' },
        { id: 'act-4', title: 'Registrar Receita', icon: Plus, action: () => { navigate('/financeiro'); openTransactionModal(TransactionType.Receita); }, section: 'Ações Rápidas' },
        { id: 'act-5', title: 'Registrar Despesa', icon: Plus, action: () => { navigate('/financeiro'); openTransactionModal(TransactionType.Despesa); }, section: 'Ações Rápidas' },
    ];
    
    const handleAction = (action: () => void) => {
        action();
        setIsOpen(false);
    };
    
    useEffect(() => {
        if (!isOpen) {
            setSearch('');
        }
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    const filteredCommands = commands.filter(cmd => cmd.title.toLowerCase().includes(search.toLowerCase()));
    
    const groupedCommands = filteredCommands.reduce((acc, cmd) => {
        if (!acc[cmd.section]) {
            acc[cmd.section] = [];
        }
        acc[cmd.section].push(cmd);
        return acc;
    }, {} as Record<string, Command[]>);

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-start pt-20" onClick={() => setIsOpen(false)}>
            <div className="w-full max-w-lg bg-card dark:bg-dark-card rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center p-4 border-b dark:border-dark-border">
                    <Search className="h-5 w-5 mr-3 text-muted-foreground"/>
                    <input 
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Digite um comando ou pesquise..."
                        className="w-full bg-transparent outline-none"
                        autoFocus
                    />
                </div>
                <div className="p-2 max-h-[400px] overflow-y-auto">
                    {Object.entries(groupedCommands).map(([section, cmds]) => (
                        <div key={section} className="mb-2">
                            <h3 className="px-2 py-1 text-xs font-semibold text-muted-foreground">{section}</h3>
                            <ul>
                                {cmds.map(cmd => (
                                    <li key={cmd.id} 
                                        onClick={() => handleAction(cmd.action)}
                                        className="flex items-center rounded-2xl p-2 transition hover:bg-white/70 dark:hover:bg-dark-border/60 cursor-pointer"
                                    >
                                        <cmd.icon className="h-4 w-4 mr-3 text-muted-foreground" />
                                        <span>{cmd.title}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                    {filteredCommands.length === 0 && <p className="text-center text-sm text-muted-foreground p-4">Nenhum resultado encontrado.</p>}
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;
