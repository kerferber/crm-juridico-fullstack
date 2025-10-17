import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useApp } from '../store/AppContext';
import { formatDocument, formatDate } from '../lib/utils';
import { Button } from '../components/ui/Button';
import {
  Plus,
  Search,
  Users,
  Briefcase,
  Sparkles,
  User,
  ClipboardList,
  Phone,
  MapPin,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useContactModal } from '../hooks/useContactModal';
import { useTaskModal } from '../hooks/useTaskModal';
import { useProcessModal } from '../hooks/useProcessModal';

const STATUS_COLORS: Record<string, string> = {
  Cliente: 'bg-primary/10 text-primary dark:bg-dark-primary/15 dark:text-dark-primary',
  Lead: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200',
};

const Contacts: React.FC = () => {
  const { contacts, users, lawsuits, tasks } = useApp();
  const { open: openContactModal } = useContactModal();
  const { openForCreate: openTaskModal } = useTaskModal();
  const { open: openProcessModal } = useProcessModal();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedOwner, setSelectedOwner] = useState('all');
  const [selectedOrigin, setSelectedOrigin] = useState('all');

  const contactsWithProcesses = lawsuits.reduce<Record<number, number>>((acc, lawsuit) => {
    acc[lawsuit.clientId] = (acc[lawsuit.clientId] ?? 0) + 1;
    return acc;
  }, {});

  const tasksByContact = tasks.reduce<Record<number, number>>((acc, task) => {
    if (task.clientId) {
      acc[task.clientId] = (acc[task.clientId] ?? 0) + 1;
    }
    return acc;
  }, {});

  const totalContacts = contacts.length;
  const totalWithProcess = Object.keys(contactsWithProcesses).length;
  const totalLeads = contacts.filter(contact => contact.status === 'Lead').length;

  const statusOptions = useMemo(
    () => ['all', ...Array.from(new Set(contacts.map(contact => contact.status)))],
    [contacts]
  );
  const originOptions = useMemo(
    () => ['all', ...Array.from(new Set(contacts.map(contact => contact.origin).filter(Boolean)))],
    [contacts]
  );

  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatus === 'all' || contact.status === selectedStatus;
      const matchesOrigin = selectedOrigin === 'all' || contact.origin === selectedOrigin;
      const matchesOwner =
        selectedOwner === 'all' || contact.ownerId === Number.parseInt(selectedOwner, 10);
      return matchesSearch && matchesStatus && matchesOrigin && matchesOwner;
    });
  }, [contacts, searchTerm, selectedStatus, selectedOrigin, selectedOwner]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">
            Pipeline de Relacionamento
          </p>
          <h1 className="mt-1 text-[26px] font-semibold tracking-tight">Contatos & Relacionamentos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visualize a jornada dos clientes, acompanhe responsáveis e mantenha as oportunidades em movimento.
          </p>
        </div>
        <Button
          size="lg"
          onClick={openContactModal}
          className="gap-2 rounded-xl shadow-[0_18px_40px_-22px_rgba(79,70,229,0.45)]"
        >
          <Plus className="h-4 w-4" />
          Novo contato
        </Button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border border-border/50 bg-gradient-to-br from-white via-white to-indigo-50/60 shadow-sm dark:border-dark-border/60 dark:from-dark-card/90 dark:via-dark-card/80 dark:to-dark-primary/10">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.32em] text-muted-foreground">
                Total
              </p>
              <CardTitle className="text-2xl font-semibold">{totalContacts}</CardTitle>
            </div>
            <Users className="h-8 w-8 text-primary/70" />
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Carteira completa de contatos cadastrados.
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-gradient-to-br from-primary/10 via-primary/5 to-white shadow-sm dark:border-dark-border/60 dark:from-dark-primary/15 dark:via-dark-primary/10 dark:to-dark-card/80">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.32em] text-muted-foreground">
                Com processos
              </p>
              <CardTitle className="text-2xl font-semibold">{totalWithProcess}</CardTitle>
            </div>
            <Briefcase className="h-8 w-8 text-primary/70" />
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Clientes que já possuem casos ativos com o escritório.
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-gradient-to-br from-amber-100/50 via-white to-white shadow-sm dark:border-dark-border/60 dark:from-amber-500/10 dark:via-dark-card/80 dark:to-dark-card/90">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.32em] text-muted-foreground">
                Leads
              </p>
              <CardTitle className="text-2xl font-semibold">{totalLeads}</CardTitle>
            </div>
            <Sparkles className="h-8 w-8 text-amber-500" />
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Potenciais clientes aguardando qualificação ou follow-up.
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-gradient-to-br from-slate-100/70 via-white to-white shadow-sm dark:border-dark-border/60 dark:from-dark-card/80 dark:via-dark-card/70 dark:to-dark-card/60">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.32em] text-muted-foreground">
                Sem processos
              </p>
              <CardTitle className="text-2xl font-semibold">
                {totalContacts - totalWithProcess}
              </CardTitle>
            </div>
            <ClipboardList className="h-8 w-8 text-muted-foreground/70" />
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Contatos com potencial para novas oportunidades.
          </CardContent>
        </Card>
      </section>

      <section className="rounded-3xl border border-border/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm dark:border-dark-border/60 dark:bg-dark-card/80">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground dark:text-dark-foreground">
              Lista inteligente de contatos
            </h2>
            <p className="text-xs text-muted-foreground">
              Filtre por status, responsável ou origem e atue de forma prioritária em cada relacionamento.
            </p>
          </div>
          <div className="flex w-full max-w-xl items-center gap-3 rounded-xl border border-border/60 bg-white px-4 py-2 shadow-inner dark:border-dark-border/60 dark:bg-dark-background/70">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              placeholder="Buscar por nome ou documento..."
              className="w-full border-none bg-transparent text-sm focus:outline-none dark:text-dark-foreground"
            />
          </div>
        </header>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          {statusOptions.map(option => (
            <button
              key={option}
              type="button"
              onClick={() => setSelectedStatus(option)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-semibold transition',
                option === selectedStatus
                  ? 'border-primary/40 bg-primary/10 text-primary shadow-sm dark:border-dark-primary/40 dark:bg-dark-primary/15 dark:text-dark-primary'
                  : 'border-border/50 bg-white text-muted-foreground hover:border-primary/30 hover:text-primary dark:border-dark-border/60 dark:bg-dark-card/70 dark:hover:border-dark-primary/40 dark:hover:text-dark-primary'
              )}
            >
              {option === 'all' ? 'Todos os status' : option}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <select
            value={selectedOwner}
            onChange={event => setSelectedOwner(event.target.value)}
            className="flex h-10 items-center rounded-lg border border-border/60 bg-white px-3 text-sm text-foreground shadow-sm focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/60 dark:bg-dark-background/70 dark:text-dark-foreground"
          >
            <option value="all">Todos os responsáveis</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>

          <select
            value={selectedOrigin}
            onChange={event => setSelectedOrigin(event.target.value)}
            className="flex h-10 items-center rounded-lg border border-border/60 bg-white px-3 text-sm text-foreground shadow-sm focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/60 dark:bg-dark-background/70 dark:text-dark-foreground"
          >
            {originOptions.map(option => (
              <option key={option} value={option}>
                {option === 'all' ? 'Todas as origens' : option}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredContacts.map(contact => {
            const owner = users.find(user => user.id === contact.ownerId);
            const processCount = contactsWithProcesses[contact.id] ?? 0;
            const taskCount = tasksByContact[contact.id] ?? 0;
            const statusClass =
              STATUS_COLORS[contact.status] ??
              'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-200';

            return (
              <Card
                key={contact.id}
                className="group relative overflow-hidden border border-border/50 bg-white/90 p-1 shadow-[0_16px_40px_-28px_rgba(12,10,29,0.45)] transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_30px_70px_-45px_rgba(79,70,229,0.55)] dark:border-dark-border/60 dark:bg-dark-card/85 dark:hover:border-dark-primary/40"
              >
                <span className="absolute inset-x-0 top-0 block h-1 bg-gradient-to-r from-primary/70 via-primary to-primary/70 opacity-0 transition group-hover:opacity-100 dark:from-dark-primary/70 dark:via-dark-primary dark:to-dark-primary/70" />
                <CardHeader className="pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-dark-primary/15 dark:text-dark-primary">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <Link
                          to={`/contatos/${contact.id}`}
                          className="text-base font-semibold text-foreground transition hover:text-primary dark:text-dark-foreground dark:hover:text-dark-primary"
                        >
                          {contact.name}
                        </Link>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5', statusClass)}>
                            {contact.status}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/60 px-2 py-0.5 dark:bg-dark-card/60">
                            <MapPin className="h-3 w-3 text-primary" />
                            {contact.origin || 'Origem não informada'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-4 text-sm">
                  <div className="grid gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-3 rounded-lg border border-border/40 bg-white/80 px-3 py-2 dark:border-dark-border/60 dark:bg-dark-card/60">
                      <Phone className="h-3.5 w-3.5 text-primary" />
                      <span>{contact.phone || 'Telefone não informado'}</span>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      <div className="rounded-lg border border-border/40 bg-muted/15 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground dark:border-dark-border/60 dark:bg-dark-card/50">
                        Documento
                        <p className="mt-1 text-[13px] font-semibold text-foreground dark:text-dark-foreground">
                          {formatDocument(contact.document)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border/40 bg-muted/15 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground dark:border-dark-border/60 dark:bg-dark-card/50">
                        Última interação
                        <p className="mt-1 text-[13px] font-semibold text-foreground dark:text-dark-foreground">
                          {formatDate(contact.lastInteraction)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-primary dark:border-dark-primary/30 dark:bg-dark-primary/10 dark:text-dark-primary">
                      <p className="font-semibold uppercase tracking-[0.28em]">Processos</p>
                      <p className="mt-1 text-[18px] font-semibold leading-none">{processCount}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600 dark:border-dark-border/30 dark:bg-dark-card/60 dark:text-dark-foreground">
                      <p className="font-semibold uppercase tracking-[0.28em]">Tarefas</p>
                      <p className="mt-1 text-[18px] font-semibold leading-none">{taskCount}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[11px] uppercase tracking-[0.26em] text-muted-foreground">
                      Responsável: {owner?.name ?? 'Equipe'}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg border border-border/60 text-primary hover:border-primary/40 hover:bg-primary/10 dark:border-dark-border/60 dark:text-dark-primary dark:hover:border-dark-primary/50 dark:hover:bg-dark-primary/15"
                        title="Novo processo"
                        onClick={() =>
                          openProcessModal({
                            clientId: contact.id,
                            responsibleId: contact.ownerId ?? users[0]?.id,
                          })
                        }
                      >
                        <Briefcase className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg border border-border/60 text-primary hover:border-primary/40 hover:bg-primary/10 dark:border-dark-border/60 dark:text-dark-primary dark:hover:border-dark-primary/50 dark:hover:bg-dark-primary/15"
                        title="Nova tarefa"
                        onClick={() =>
                          openTaskModal({
                            clientId: contact.id,
                            responsibleId: contact.ownerId ?? users[0]?.id,
                          })
                        }
                      >
                        <ClipboardList className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg border-primary/40 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/10 dark:border-dark-primary/40 dark:text-dark-primary dark:hover:bg-dark-primary/15"
                        asChild
                      >
                        <Link to={`/contatos/${contact.id}`}>Ver perfil</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {filteredContacts.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-16 text-center text-sm text-muted-foreground dark:border-dark-border/60 dark:bg-dark-card/60">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-dark-primary/10 dark:text-dark-primary">
                <Users className="h-6 w-6" />
              </div>
              Nenhum contato encontrado com os filtros selecionados.
              <Button variant="outline" size="sm" onClick={() => setSelectedStatus('all')}>
                Limpar filtros
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Contacts;
