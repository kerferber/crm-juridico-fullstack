import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useApp } from '../store/AppContext';
import { formatDate } from '../lib/utils';
import { Button, buttonVariants } from '../components/ui/Button';
import { useProcessModal } from '../hooks/useProcessModal';
import { Plus, Edit, CalendarPlus, CheckSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

const StatusPill: React.FC<{ status: string }> = ({ status }) => {
    const statusClasses = {
        'Ativo': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        'Fechado': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        'Arquivado': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    };
    return <span className={cn('px-2 py-1 text-xs font-semibold rounded-full', statusClasses[status as keyof typeof statusClasses])}>{status}</span>;
};


const Lawsuits: React.FC = () => {
    const { lawsuits, contacts, users } = useApp();
    const { open: openProcessModal } = useProcessModal();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedArea, setSelectedArea] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedResponsible, setSelectedResponsible] = useState('all');
    
    const processosAtivos = lawsuits.filter(p => p.status === 'Ativo').length;
    const fechamentos = lawsuits.filter(p => p.status === 'Fechado').length;
    const arquivados = lawsuits.filter(p => p.status === 'Arquivado').length;
    
    const areas = [...new Set(lawsuits.map(l => l.area))];
    const statuses = [...new Set(lawsuits.map(l => l.status))];

    const filteredLawsuits = useMemo(() => {
        return lawsuits.filter(lawsuit => {
            const matchesSearch = lawsuit.internalNumber.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesArea = selectedArea === 'all' || lawsuit.area === selectedArea;
            const matchesStatus = selectedStatus === 'all' || lawsuit.status === selectedStatus;
            const matchesResponsible = selectedResponsible === 'all' || lawsuit.responsibleId === parseInt(selectedResponsible);
            return matchesSearch && matchesArea && matchesStatus && matchesResponsible;
        });
    }, [lawsuits, searchTerm, selectedArea, selectedStatus, selectedResponsible]);
    
    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-[22px] font-semibold tracking-tight">Processos</h1>
                    <p className="text-sm text-muted-foreground">
                        Visão consolidada dos casos ativos, encerrados e em fase de arquivamento.
                    </p>
                </div>
                <Button size="lg" className="shadow-[0_18px_35px_-24px_rgba(79,70,229,0.45)]" onClick={openProcessModal}>
                    <Plus className="mr-2 h-4 w-4" /> Novo Processo
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="bg-gradient-to-br from-white/95 to-white/80 shadow-[0_20px_50px_-32px_rgba(79,70,229,0.35)] dark:from-dark-card/90 dark:to-dark-card/75">
                    <CardHeader><CardTitle className="text-sm font-medium">Processos Ativos</CardTitle></CardHeader>
                    <CardContent><p className="text-lg font-semibold">{processosAtivos}</p></CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-slate-50/85 to-white/80 shadow-[0_20px_50px_-32px_rgba(15,23,42,0.25)] dark:from-dark-card/90 dark:to-dark-card/75">
                    <CardHeader><CardTitle className="text-sm font-medium">Fechamentos</CardTitle></CardHeader>
                    <CardContent><p className="text-lg font-semibold">{fechamentos}</p></CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-sky-50/85 to-white/80 shadow-[0_20px_50px_-32px_rgba(14,165,233,0.30)] dark:from-dark-card/90 dark:to-dark-card/75">
                    <CardHeader><CardTitle className="text-sm font-medium">Arquivados</CardTitle></CardHeader>
                    <CardContent><p className="text-lg font-semibold">{arquivados}</p></CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Lista de Processos</CardTitle>
                     {/* --- SUGESTÃO 2: FILTROS AVANÇADOS --- */}
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                        <input type="text" placeholder="Buscar por nº interno..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full rounded-full border border-border/60 bg-white/70 px-4 py-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:border-dark-border/60 dark:bg-dark-background/70 dark:text-dark-foreground md:w-1/4"/>
                        <select value={selectedArea} onChange={e => setSelectedArea(e.target.value)} className="rounded-full border border-border/60 bg-white/70 px-4 py-2.5 text-sm dark:border-dark-border/60 dark:bg-dark-background/70">
                            <option value="all">Todas as Áreas</option>
                            {areas.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                        <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className="rounded-full border border-border/60 bg-white/70 px-4 py-2.5 text-sm dark:border-dark-border/60 dark:bg-dark-background/70">
                            <option value="all">Todos Status</option>
                            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                         <select value={selectedResponsible} onChange={e => setSelectedResponsible(e.target.value)} className="rounded-full border border-border/60 bg-white/70 px-4 py-2.5 text-sm dark:border-dark-border/60 dark:bg-dark-background/70">
                            <option value="all">Todos Responsáveis</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-white/60 backdrop-blur-sm dark:bg-dark-border/40">
                                <tr>
                                    <th className="p-4">Nº Interno</th>
                                    <th className="p-4">Cliente</th>
                                    <th className="p-4">Responsável</th>
                                    <th className="p-4">Área</th>
                                    <th className="p-4">Prazo Fatal</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60 dark:divide-dark-border/60">
                                {filteredLawsuits.map(lawsuit => {
                                    const client = contacts.find(c => c.id === lawsuit.clientId);
                                    const responsible = users.find(u => u.id === lawsuit.responsibleId);
                                    return (
                                        <tr key={lawsuit.id} className="group transition hover:bg-white/55 dark:hover:bg-dark-border/25">
                                            <td className="p-4 font-medium">{lawsuit.internalNumber}</td>
                                            <td className="p-4">{client?.name || 'N/A'}</td>
                                            <td className="p-4">{responsible?.name || 'N/A'}</td>
                                            <td className="p-4">{lawsuit.area}</td>
                                            <td className="p-4 text-red-600">{formatDate(lawsuit.deadline)}</td>
                                            <td className="p-4">
                                                {/* --- SUGESTÃO 3: TAGS VISUAIS (PILLS) --- */}
                                                <StatusPill status={lawsuit.status} />
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-end space-x-1">
                                                    {/* --- SUGESTÃO 1: QUICK ACTIONS --- */}
                                                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button variant="ghost" size="icon" title="Criar Tarefa"><CheckSquare className="h-4 w-4"/></Button>
                                                        <Button variant="ghost" size="icon" title="Agendar Evento"><CalendarPlus className="h-4 w-4"/></Button>
                                                        <Button variant="ghost" size="icon" title="Editar"><Edit className="h-4 w-4"/></Button>
                                                    </div>
                                                    <Link to={`/processos/${lawsuit.id}`} className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>Ver</Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Lawsuits;
