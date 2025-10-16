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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Contatos</h1>
        <Button onClick={open}>
            <Plus className="mr-2 h-4 w-4" /> Novo Contato
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Contatos Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{contacts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Com Processo Ativo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{contatosComProcesso}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Sem Processo Ativo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{contatosSemProcesso}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Lista de Contatos</CardTitle>
            {/* --- SUGESTÃO 2: FILTROS AVANÇADOS --- */}
            <div className="mt-4 flex items-center space-x-2">
                <input type="text" placeholder="Buscar por nome..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full md:w-1/3 p-2 text-sm bg-background dark:bg-dark-background border rounded-md dark:border-dark-border"/>
                <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className="p-2 text-sm bg-background dark:bg-dark-background border rounded-md dark:border-dark-border">
                    <option value="all">Todos Status</option>
                    <option value="Cliente">Cliente</option>
                    <option value="Lead">Lead</option>
                </select>
                <select value={selectedOrigin} onChange={e => setSelectedOrigin(e.target.value)} className="p-2 text-sm bg-background dark:bg-dark-background border rounded-md dark:border-dark-border">
                    <option value="all">Todas Origens</option>
                    {origins.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <select value={selectedOwner} onChange={e => setSelectedOwner(e.target.value)} className="p-2 text-sm bg-background dark:bg-dark-background border rounded-md dark:border-dark-border">
                    <option value="all">Todos Donos</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
            </div>
        </CardHeader>
        <CardContent>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-dark-border/20">
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
                    <tbody>
                        {filteredContacts.map(contact => {
                            const owner = users.find(u => u.id === contact.ownerId);
                            return (
                                <tr key={contact.id} className="border-b dark:border-dark-border group">
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
