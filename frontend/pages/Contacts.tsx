import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useApp } from '../store/AppContext';
import { formatDocument, formatDate } from '../lib/utils';
import { Button, buttonVariants } from '../components/ui/Button';
import { Plus, Edit, CalendarPlus, CheckSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useContactModal } from '../hooks/useContactModal';

const StatusPill: React.FC<{ status: string }> = ({ status }) => {
    const statusClasses = {
        'Cliente': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        'Lead': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    };
    return <span className={cn('px-2 py-1 text-xs font-semibold rounded-full', statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800')}>{status}</span>;
};


const Contacts: React.FC = () => {
  const { contacts, users, lawsuits } = useApp();
  const { open } = useContactModal();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedOrigin, setSelectedOrigin] = useState('all');
  const [selectedOwner, setSelectedOwner] = useState('all');

  const contactsAtivos = lawsuits.map(p => p.clientId);
  const contatosComProcesso = contacts.filter(c => contactsAtivos.includes(c.id)).length;
  const contatosSemProcesso = contacts.length - contatosComProcesso;
  
  const origins = [...new Set(contacts.map(c => c.origin))];
  
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
        const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = selectedStatus === 'all' || contact.status === selectedStatus;
        const matchesOrigin = selectedOrigin === 'all' || contact.origin === selectedOrigin;
        const matchesOwner = selectedOwner === 'all' || contact.ownerId === parseInt(selectedOwner);
        return matchesSearch && matchesStatus && matchesOrigin && matchesOwner;
    });
  }, [contacts, searchTerm, selectedStatus, selectedOrigin, selectedOwner]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Contatos</h1>
          <p className="text-sm text-muted-foreground">
            Centralize informações de relacionamento e organize a carteira de clientes.
          </p>
        </div>
        <Button size="lg" onClick={open} className="shadow-[0_18px_35px_-24px_rgba(79,70,229,0.45)]">
            <Plus className="mr-2 h-4 w-4" /> Novo Contato
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Contatos Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{contacts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Com Processo Ativo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{contatosComProcesso}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Sem Processo Ativo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{contatosSemProcesso}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-[0_26px_55px_-35px_rgba(79,70,229,0.28)]">
        <CardHeader>
            <CardTitle>Lista de Contatos</CardTitle>
            {/* --- SUGESTÃO 2: FILTROS AVANÇADOS --- */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
                <input type="text" placeholder="Buscar por nome..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full rounded-full border border-border/60 bg-white/70 px-4 py-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:border-dark-border/60 dark:bg-dark-background/70 dark:text-dark-foreground md:w-1/3"/>
                <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className="rounded-full border border-border/60 bg-white/70 px-4 py-2.5 text-sm dark:border-dark-border/60 dark:bg-dark-background/70">
                    <option value="all">Todos Status</option>
                    <option value="Cliente">Cliente</option>
                    <option value="Lead">Lead</option>
                </select>
                <select value={selectedOrigin} onChange={e => setSelectedOrigin(e.target.value)} className="rounded-full border border-border/60 bg-white/70 px-4 py-2.5 text-sm dark:border-dark-border/60 dark:bg-dark-background/70">
                    <option value="all">Todas Origens</option>
                    {origins.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <select value={selectedOwner} onChange={e => setSelectedOwner(e.target.value)} className="rounded-full border border-border/60 bg-white/70 px-4 py-2.5 text-sm dark:border-dark-border/60 dark:bg-dark-background/70">
                    <option value="all">Todos Donos</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
            </div>
        </CardHeader>
        <CardContent>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-white/60 backdrop-blur-sm dark:bg-dark-border/40">
                        <tr>
                            <th className="p-4">Nome</th>
                            <th className="p-4">CPF/CNPJ</th>
                            <th className="p-4">Origem</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Dono</th>
                            <th className="p-4">Última Interação</th>
                            <th className="p-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 dark:divide-dark-border/60">
                        {filteredContacts.map(contact => {
                            const owner = users.find(u => u.id === contact.ownerId);
                            return (
                                <tr key={contact.id} className="group transition hover:bg-white/55 dark:hover:bg-dark-border/30">
                                    <td className="p-4 font-medium">{contact.name}</td>
                                    <td className="p-4">{formatDocument(contact.document)}</td>
                                    <td className="p-4">{contact.origin}</td>
                                    <td className="p-4">
                                        {/* --- SUGESTÃO 3: TAGS VISUAIS (PILLS) --- */}
                                        <StatusPill status={contact.status} />
                                    </td>
                                    <td className="p-4">{owner?.name || 'N/A'}</td>
                                    <td className="p-4">{formatDate(contact.lastInteraction)}</td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-end space-x-1">
                                            {/* --- SUGESTÃO 1: QUICK ACTIONS --- */}
                                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" title="Criar Tarefa"><CheckSquare className="h-4 w-4"/></Button>
                                                <Button variant="ghost" size="icon" title="Agendar Evento"><CalendarPlus className="h-4 w-4"/></Button>
                                                <Button variant="ghost" size="icon" title="Editar"><Edit className="h-4 w-4"/></Button>
                                            </div>
                                            <Link to={`/contatos/${contact.id}`} className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>Ver</Link>
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

export default Contacts;
