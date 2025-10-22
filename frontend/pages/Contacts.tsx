import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
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
  Mail,
  IdCard,
  Upload,
  Trash2,
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

const parseHexColor = (value?: string) => {
  if (!value) return null;
  let hex = value.trim();
  if (hex.startsWith('#')) {
    hex = hex.slice(1);
  }
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map(char => `${char}${char}`)
      .join('');
  }
  if (hex.length !== 6) {
    return null;
  }
  const numeric = Number.parseInt(hex, 16);
  if (Number.isNaN(numeric)) {
    return null;
  }
  return {
    r: (numeric >> 16) & 255,
    g: (numeric >> 8) & 255,
    b: numeric & 255,
  };
};

const getBadgeStyles = (color?: string): React.CSSProperties | undefined => {
  const rgb = parseHexColor(color);
  if (!rgb) return undefined;
  const { r, g, b } = rgb;
  return {
    backgroundColor: `rgba(${r}, ${g}, ${b}, 0.12)`,
    borderColor: `rgba(${r}, ${g}, ${b}, 0.28)`,
    color: `rgb(${r}, ${g}, ${b})`,
  };
};

const Contacts: React.FC = () => {
  const { contacts, users, lawsuits, tasks, categoryGroups, deleteContact } = useApp();
  const { open: openContactModal } = useContactModal();
  const { openForCreate: openTaskModal } = useTaskModal();
  const { open: openProcessModal } = useProcessModal();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContactCategory, setSelectedContactCategory] = useState('all');
  const [selectedLeadCategory, setSelectedLeadCategory] = useState('all');
  const [selectedOwner, setSelectedOwner] = useState('all');
  const [selectedOrigin, setSelectedOrigin] = useState('all');
  const [deletingContactId, setDeletingContactId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const contactsWithProcesses = useMemo(() => {
    return lawsuits.reduce<Record<number, number>>((acc, lawsuit) => {
      acc[lawsuit.clientId] = (acc[lawsuit.clientId] ?? 0) + 1;
      return acc;
    }, {});
  }, [lawsuits]);

  const tasksByContact = useMemo(() => {
    return tasks.reduce<Record<number, number>>((acc, task) => {
      if (task.clientId) {
        acc[task.clientId] = (acc[task.clientId] ?? 0) + 1;
      }
      return acc;
    }, {});
  }, [tasks]);

  const totalContacts = contacts.length;
  const totalWithProcess = Object.keys(contactsWithProcesses).length;
  const totalLeads = contacts.filter(contact => contact.status === 'Lead').length;
  const leadsWithoutProcess = totalContacts - totalWithProcess;
  const leadsPercentage = totalContacts > 0 ? Math.round((totalLeads / totalContacts) * 100) : 0;

  const highlightCards = useMemo(
    () => [
      {
        title: 'Total',
        value: totalContacts,
        description: 'Carteira completa cadastrada no CRM.',
        icon: Users,
      },
      {
        title: 'Com processos',
        value: totalWithProcess,
        description: 'Clientes já vinculados a casos ativos.',
        icon: Briefcase,
      },
      {
        title: 'Leads',
        value: totalLeads,
        description: 'Potenciais clientes em nutrição.',
        icon: Sparkles,
      },
      {
        title: 'Sem processo',
        value: leadsWithoutProcess,
        description: 'Oportunidades prontas para abordar.',
        icon: ClipboardList,
      },
    ],
    [totalContacts, totalWithProcess, totalLeads, leadsWithoutProcess]
  );

  const quickStats = [
    { label: 'Carteira total', value: totalContacts },
    { label: 'Com processos', value: totalWithProcess },
    { label: 'Leads ativos', value: totalLeads },
  ];

  const originOptions = useMemo(() => {
    const origins = contacts
      .map(contact => contact.origin)
      .filter((origin): origin is string => Boolean(origin));
    return ['all', ...Array.from(new Set(origins))];
  }, [contacts]);

  const contactCategories = useMemo(() => {
    return categoryGroups.find(group => group.id === 'contacts')?.items ?? [];
  }, [categoryGroups]);

  const leadCategories = useMemo(() => {
    return categoryGroups.find(group => group.id === 'leads')?.items ?? [];
  }, [categoryGroups]);

  const contactCategoryMap = useMemo(() => {
    return new Map(contactCategories.map(item => [item.id, item]));
  }, [contactCategories]);

  const leadCategoryMap = useMemo(() => {
    return new Map(leadCategories.map(item => [item.id, item]));
  }, [leadCategories]);

  const contactCategoryOptions = useMemo(() => {
    return [
      { id: 'all', label: 'Todas as categorias' },
      ...contactCategories.map(item => ({
        id: item.id,
        label: item.name,
        color: item.color,
      })),
      { id: 'none', label: 'Sem categoria atribuída' },
    ];
  }, [contactCategories]);

  const leadCategoryOptions = useMemo(() => {
    return [
      { id: 'all', label: 'Todos os estágios' },
      ...leadCategories.map(item => ({
        id: item.id,
        label: item.name,
        color: item.color,
      })),
      { id: 'none', label: 'Sem estágio' },
    ];
  }, [leadCategories]);

  const filteredContacts = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return contacts.filter(contact => {
      const searchPool = [contact.name, contact.document, contact.email, contact.phone].filter(
        (value): value is string => Boolean(value)
      );
      const matchesSearch =
        search.length === 0 || searchPool.some(value => value.toLowerCase().includes(search));

      const matchesOrigin = selectedOrigin === 'all' || contact.origin === selectedOrigin;
      const matchesOwner =
        selectedOwner === 'all' || contact.ownerId === Number.parseInt(selectedOwner, 10);

      const matchesContactCategory =
        selectedContactCategory === 'all'
          ? true
          : selectedContactCategory === 'none'
          ? !contact.categoryId
          : contact.categoryId === selectedContactCategory;

      const matchesLeadCategory =
        selectedLeadCategory === 'all'
          ? true
          : selectedLeadCategory === 'none'
          ? !contact.leadCategoryId
          : contact.leadCategoryId === selectedLeadCategory;

      return (
        matchesSearch &&
        matchesOrigin &&
        matchesOwner &&
        matchesContactCategory &&
        matchesLeadCategory
      );
    });
  }, [
    contacts,
    searchTerm,
    selectedOrigin,
    selectedOwner,
    selectedContactCategory,
    selectedLeadCategory,
  ]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedContactCategory('all');
    setSelectedLeadCategory('all');
    setSelectedOwner('all');
    setSelectedOrigin('all');
  };

  const handleDeleteContact = async (target: typeof contacts[number]) => {
    const confirmed = window.confirm(
      `Excluir o contato "${target.name}"? Esta ação não pode ser desfeita.`
    );
    if (!confirmed) {
      return;
    }

    try {
      setActionError(null);
      setDeletingContactId(target.id);
      await deleteContact(target.id);
    } catch (err) {
      console.error(err);
      setActionError('Não foi possível excluir o contato selecionado.');
    } finally {
      setDeletingContactId(null);
    }
  };

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-[#F1F6FF] via-white to-[#E9F2FF] px-6 py-7 text-slate-800 shadow-[0_24px_68px_-44px_rgba(15,23,42,0.35)] dark:border-dark-border/60 dark:from-[#1E1B4B] dark:via-[#3730A3] dark:to-[#1E3A8A] dark:text-white">
        <div className="pointer-events-none absolute inset-0 opacity-50">
          <div className="absolute -left-24 top-10 h-56 w-56 rounded-full bg-sky-200/60 blur-3xl" />
          <div className="absolute -bottom-28 right-0 h-64 w-64 rounded-full bg-indigo-200/60 blur-3xl" />
        </div>
        <div className="relative grid gap-6 lg:grid-cols-[1.5fr,0.7fr]">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-md border border-slate-100 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-600 shadow-sm dark:border-white/40 dark:bg-white/10 dark:text-white/80">
              <Sparkles className="h-4 w-4 text-sky-500 dark:text-white" />
              Relacionamentos Premium
            </span>
            <div className="space-y-3">
              <h1 className="text-[26px] font-semibold leading-tight text-slate-900 lg:text-[32px] dark:text-white">
                Transforme sua carteira em oportunidades com acompanhamento de alto nível.
              </h1>
              <p className="max-w-2xl text-[13px] text-slate-600 lg:text-sm dark:text-white/75">
                Centralize informações de clientes, leads e parceiros para priorizar follow-ups e
                ativar novos negócios com poucos cliques.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Button
                size="sm"
                className="rounded-md bg-sky-500 px-5 text-sm font-semibold text-white shadow-[0_16px_32px_-20px_rgba(56,189,248,0.4)] transition hover:bg-sky-600"
                onClick={openContactModal}
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo contato
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-md border border-slate-200 bg-white/80 px-5 text-sm font-semibold text-slate-600 shadow-inner transition hover:border-sky-300 hover:text-sky-600 dark:border-white/30 dark:bg-white/10 dark:text-white"
              >
                <Upload className="mr-2 h-4 w-4" />
                Importar planilha
              </Button>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-white/70">
              <span>{totalContacts} na carteira</span>
              <span>{totalWithProcess} com processos ativos</span>
              <span>{totalLeads} leads em nutrição</span>
            </div>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              {highlightCards.map(card => (
                <div
                  key={card.title}
                  className="rounded-lg border border-slate-200/70 bg-white p-4 shadow-[0_14px_36px_-28px_rgba(15,23,42,0.25)] backdrop-blur-sm dark:border-white/20 dark:bg-white/10"
                >
                  <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-white/70">
                    <span>{card.title}</span>
                    <card.icon className="h-5 w-5 text-slate-500 dark:text-white" />
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                    {card.value}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-white/70">
                    {card.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4 rounded-xl border border-slate-200/70 bg-white p-5 text-slate-700 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.28)] backdrop-blur-sm dark:border-white/20 dark:bg-white/10 dark:text-white">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-white/75">
              <span>Visão rápida</span>
              <Users className="h-4 w-4 text-slate-500 dark:text-white" />
            </div>
            <div className="space-y-3 text-sm">
              {quickStats.map(stat => (
                <div key={stat.label} className="flex items-center justify-between text-slate-600 dark:text-white/80">
                  <span>{stat.label}</span>
                  <span className="text-lg font-semibold text-slate-900 dark:text-white">{stat.value}</span>
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-white/70">
                <span>% Leads na base</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {leadsPercentage}%
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/50 dark:bg-white/15">
                <div
                  className="h-full rounded-full bg-sky-500 dark:bg-white"
                  style={{ width: `${leadsPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Card className="rounded-2xl border border-slate-200 bg-white shadow-[0_18px_48px_-38px_rgba(15,23,42,0.3)] backdrop-blur-sm dark:border-dark-border/60 dark:bg-dark-card/80">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-base font-semibold tracking-tight text-foreground dark:text-dark-foreground">
              Lista inteligente de contatos
            </CardTitle>
            <CardDescription className="text-[12px]">
              Acompanhe categorias, estágios e responsáveis para priorizar relacionamentos em alta.
            </CardDescription>
          </div>
          <div className="flex w-full max-w-xl items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-inner dark:border-dark-border/60 dark:bg-dark-background/70">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              placeholder="Buscar por nome, documento ou contato..."
              className="w-full border-none bg-transparent text-sm focus:outline-none dark:text-dark-foreground"
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {actionError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
              {actionError}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {contactCategoryOptions.map(option => {
              const isActive = selectedContactCategory === option.id;
              const badgeStyles = getBadgeStyles(option.color);
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedContactCategory(option.id)}
                  className={cn(
                    'inline-flex items-center rounded-md border px-3 py-1 text-xs font-semibold transition',
                    option.color
                      ? 'bg-white/80 text-foreground shadow-sm dark:bg-dark-card/60 dark:text-dark-foreground'
                      : 'border-slate-200 bg-white text-muted-foreground dark:border-dark-border/60 dark:bg-dark-card/70 dark:text-dark-foreground',
                    isActive
                      ? 'ring-2 ring-primary/40 ring-offset-1 ring-offset-white dark:ring-dark-primary/40 dark:ring-offset-dark-card'
                      : 'hover:border-sky-300 hover:text-sky-600 dark:hover:border-dark-primary/40 dark:hover:text-dark-primary'
                  )}
                  style={badgeStyles}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {leadCategoryOptions.map(option => {
              const isActive = selectedLeadCategory === option.id;
              const badgeStyles = getBadgeStyles(option.color);
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedLeadCategory(option.id)}
                  className={cn(
                    'inline-flex items-center rounded-md border px-3 py-1 text-xs font-semibold transition',
                    option.color
                      ? 'bg-white/80 text-foreground shadow-sm dark:bg-dark-card/60 dark:text-dark-foreground'
                      : 'border-slate-200 bg-white text-muted-foreground dark:border-dark-border/60 dark:bg-dark-card/70 dark:text-dark-foreground',
                    isActive
                      ? 'ring-2 ring-primary/40 ring-offset-1 ring-offset-white dark:ring-dark-primary/40 dark:ring-offset-dark-card'
                      : 'hover:border-sky-300 hover:text-sky-600 dark:hover:border-dark-primary/40 dark:hover:text-dark-primary'
                  )}
                  style={badgeStyles}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={selectedOwner}
              onChange={event => setSelectedOwner(event.target.value)}
              className="flex h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-sm text-foreground shadow-sm focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/60 dark:bg-dark-background/70 dark:text-dark-foreground"
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
              className="flex h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-sm text-foreground shadow-sm focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/60 dark:bg-dark-background/70 dark:text-dark-foreground"
            >
              {originOptions.map(option => (
                <option key={option} value={option}>
                  {option === 'all' ? 'Todas as origens' : option}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[960px] space-y-3">
              <div className="grid grid-cols-[1.6fr,1.1fr,1fr,1fr,auto] gap-5 rounded-xl border border-slate-200 bg-muted/30 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground dark:border-dark-border/60 dark:bg-dark-card/80">
                <span>Contato</span>
                <span>Segmentação</span>
                <span>Responsável</span>
                <span>Relacionamento</span>
                <span>Ações</span>
              </div>

              {filteredContacts.map(contact => {
                const owner = users.find(user => user.id === contact.ownerId);
                const processCount = contactsWithProcesses[contact.id] ?? 0;
                const taskCount = tasksByContact[contact.id] ?? 0;
                const statusClass =
                  STATUS_COLORS[contact.status] ??
                  'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-200';
                const contactCategory = contact.categoryId
                  ? contactCategoryMap.get(contact.categoryId)
                  : undefined;
                const leadCategory = contact.leadCategoryId
                  ? leadCategoryMap.get(contact.leadCategoryId)
                  : undefined;

                return (
                  <div
                    key={contact.id}
                    className="group grid grid-cols-[1.6fr,1.1fr,1fr,1fr,auto] items-center gap-5 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-[0_18px_42px_-32px_rgba(30,41,59,0.55)] transition hover:-translate-y-[2px] hover:border-sky-300 hover:shadow-[0_26px_56px_-40px_rgba(59,130,246,0.55)] dark:border-dark-border/60 dark:bg-dark-card/80"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-sky-100 text-sky-600 shadow-inner dark:bg-dark-primary/15 dark:text-dark-primary">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="space-y-2">
                        <Link
                          to={`/contatos/${contact.id}`}
                          className="text-sm font-semibold text-foreground transition hover:text-primary dark:text-dark-foreground dark:hover:text-dark-primary"
                        >
                          {contact.name}
                        </Link>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {contact.document && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-700/40 dark:text-slate-200">
                              <IdCard className="h-3 w-3" />
                              {formatDocument(contact.document)}
                            </span>
                          )}
                          {contact.email && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-700/40 dark:text-slate-200">
                              <Mail className="h-3 w-3" />
                              {contact.email}
                            </span>
                          )}
                          {contact.phone && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-700/40 dark:text-slate-200">
                              <Phone className="h-3 w-3" />
                              {contact.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-md px-3 py-1 uppercase tracking-[0.18em]',
                          statusClass
                        )}
                      >
                        {contact.status}
                      </span>
                      {contactCategory && contactCategory.name !== contact.status && (
                        <span
                          className="inline-flex items-center rounded-md border px-3 py-1"
                          style={getBadgeStyles(contactCategory.color)}
                        >
                          {contactCategory.name}
                        </span>
                      )}
                      {leadCategory && (
                        <span
                          className="inline-flex items-center rounded-md border px-3 py-1"
                          style={getBadgeStyles(leadCategory.color)}
                        >
                          {leadCategory.name}
                        </span>
                      )}
                      {!leadCategory && (
                        <span className="inline-flex items-center rounded-md border border-dashed border-border px-3 py-1 text-muted-foreground dark:border-dark-border">
                          Sem estágio
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 text-sm">
                      <p className="font-semibold text-foreground dark:text-dark-foreground">
                        {owner?.name ?? 'Equipe'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {taskCount} tarefas · {processCount} processos
                      </p>
                    </div>

                    <div className="space-y-1 text-sm">
                      <span className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-muted-foreground dark:border-dark-border/60 dark:bg-dark-card/70">
                        {contact.origin || 'Origem não informada'}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        Última interação:{' '}
                        {contact.lastInteraction
                          ? formatDate(contact.lastInteraction)
                          : 'Sem registro'}
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-md border border-slate-200 text-sky-600 hover:border-sky-300 hover:bg-sky-50 dark:border-dark-border/60 dark:text-dark-primary dark:hover:border-dark-primary/50 dark:hover:bg-dark-primary/15"
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
                      className="h-8 w-8 rounded-md border border-slate-200 text-sky-600 hover:border-sky-300 hover:bg-sky-50 dark:border-dark-border/60 dark:text-dark-primary dark:hover:border-dark-primary/50 dark:hover:bg-dark-primary/15"
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
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-md border border-red-200 text-red-600 hover:border-red-400 hover:bg-red-50 dark:border-red-500/40 dark:text-red-300 dark:hover:border-red-400 dark:hover:bg-red-500/15"
                      title="Excluir contato"
                      onClick={() => handleDeleteContact(contact)}
                      disabled={deletingContactId === contact.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-md border-sky-400 px-3 py-1 text-xs font-semibold text-sky-600 hover:bg-sky-50 dark:border-dark-primary/40 dark:text-dark-primary dark:hover:bg-dark-primary/15"
                      asChild
                      >
                        <Link to={`/contatos/${contact.id}`}>Ver perfil</Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {filteredContacts.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-muted/20 px-6 py-12 text-center text-sm text-muted-foreground dark:border-dark-border/60 dark:bg-dark-card/60">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-sky-100 text-sky-600 dark:bg-dark-primary/10 dark:text-dark-primary">
                <Users className="h-6 w-6" />
              </div>
              Nenhum contato encontrado com os filtros selecionados.
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="rounded-md border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-600 dark:border-dark-border/60 dark:text-dark-foreground"
              >
                Limpar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Contacts;
