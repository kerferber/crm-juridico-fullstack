import React, { useMemo, useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
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

const CONTACT_SEGMENTS_KEY = 'workflow-studio:contact-segments:v1';

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

type SavedSegment = {
  id: string;
  name: string;
  filters: {
    contactCategory: string;
    leadCategory: string;
    owner: string;
    origin: string;
  };
};

const loadSegments = (): SavedSegment[] => {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(CONTACT_SEGMENTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as SavedSegment[];
    }
  } catch (error) {
    console.warn('Não foi possível carregar segmentos salvos', error);
  }
  return [];
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
  const [savedSegments, setSavedSegments] = useState<SavedSegment[]>(() => loadSegments());
  const [selectedSegmentId, setSelectedSegmentId] = useState('');
  const [importing, setImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(CONTACT_SEGMENTS_KEY, JSON.stringify(savedSegments));
  }, [savedSegments]);

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
  const followUpAlerts = useMemo(() => {
    const threshold = dayjs().subtract(21, 'day');
    return contacts
      .filter(contact => contact.status === 'Lead' && (!contact.lastInteraction || dayjs(contact.lastInteraction).isBefore(threshold)))
      .slice(0, 4);
  }, [contacts]);

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
    setSelectedSegmentId('');
  };

  const handleApplySegment = (segmentId: string) => {
    setSelectedSegmentId(segmentId);
    const segment = savedSegments.find(item => item.id === segmentId);
    if (!segment) return;
    setSelectedContactCategory(segment.filters.contactCategory);
    setSelectedLeadCategory(segment.filters.leadCategory);
    setSelectedOwner(segment.filters.owner);
    setSelectedOrigin(segment.filters.origin);
  };

  const handleSaveSegment = () => {
    const name = window.prompt('Nome do segmento');
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const newSegment: SavedSegment = {
      id: `${Date.now()}`,
      name: trimmed,
      filters: {
        contactCategory: selectedContactCategory,
        leadCategory: selectedLeadCategory,
        owner: selectedOwner,
        origin: selectedOrigin,
      },
    };
    setSavedSegments(prev => [...prev, newSegment]);
    setSelectedSegmentId(newSegment.id);
  };

  const handleDeleteSegment = (segmentId: string) => {
    setSavedSegments(prev => prev.filter(segment => segment.id !== segmentId));
    if (selectedSegmentId === segmentId) {
      setSelectedSegmentId('');
    }
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setTimeout(() => {
      setImporting(false);
      window.alert(`Arquivo "${file.name}" enviado para processamento.`);
      if (importInputRef.current) {
        importInputRef.current.value = '';
      }
    }, 800);
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
      <section className="premium-hero contacts-premium">
        <div className="premium-hero__overlay" />
        <div className="premium-hero__content">
          <div className="premium-hero__main">
            <span className="premium-badge">Relacionamentos</span>
            <h1 className="premium-hero__title">Carteira ativa e oportunidades quentes</h1>
            <p className="premium-hero__subtitle">
              Monitore indicadores críticos e use segmentos salvos para agir com rapidez.
            </p>
            <div className="hero-actions hero-actions--compact">
              <Button className="hero-actions__primary gap-2 rounded-full" onClick={openContactModal}>
                <Plus className="h-4 w-4" />
                Novo contato
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="hero-actions__secondary gap-2 rounded-full"
                onClick={() => importInputRef.current?.click()}
                disabled={importing}
              >
                <Upload className="h-4 w-4" />
                {importing ? 'Importando...' : 'Importar planilha'}
              </Button>
              <Button
                variant="ghost"
                className="hero-actions__secondary gap-2 rounded-full"
                onClick={() => {
                  const csvRows = [
                    [
                      'nome',
                      'email',
                      'telefone',
                      'documento',
                      'status',
                      'origem',
                      'responsavel_id',
                      'categoria_id',
                      'lead_categoria_id',
                      'ultima_interacao',
                      'anotacoes',
                    ],
                    [
                      'Empresa Alpha Ltda',
                      'contato@alpha.com',
                      '(11) 99999-9999',
                      '12345678000190',
                      'Cliente',
                      'Indicação',
                      '1',
                      'contacts-cliente',
                      'leads-clientes-ativos',
                      '2025-01-15',
                      'Validar proposta com @Sofia.',
                    ],
                  ];
                  const csvContent = csvRows.map(row => row.map(value => `"${value}"`).join(',')).join('\n');
                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'modelo-importacao-contatos.csv';
                  link.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Baixar modelo
              </Button>
            </div>
            <input
              ref={importInputRef}
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              onChange={handleImportFile}
            />
          </div>
        </div>
      </section>

      <div className="premium-metrics">
        {highlightCards.map(card => (
          <div key={card.title} className="premium-metric-card">
            <div className="premium-metric-card__label">
              <span>{card.title}</span>
              <card.icon className="h-4 w-4" />
            </div>
            <p className="premium-metric-card__value">{card.value}</p>
            <p className="premium-metric-card__description">{card.description}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
          <div className="premium-panel">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Segmentos salvos
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="rounded-full text-xs" onClick={handleSaveSegment}>
                  Salvar segmento
                </Button>
                {savedSegments.length > 0 && (
                  <Button variant="ghost" size="sm" className="rounded-full text-xs" onClick={() => setSavedSegments([])}>
                    Limpar favoritos
                  </Button>
                )}
              </div>
            </div>
            {savedSegments.length === 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Crie combinações personalizadas de filtros e salve para acesso rápido.
              </p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {savedSegments.map(segment => (
                  <div
                    key={segment.id}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold',
                      selectedSegmentId === segment.id
                        ? 'border-primary/40 bg-primary/10 text-primary dark:border-dark-primary/40 dark:bg-dark-primary/15 dark:text-dark-primary'
                        : 'border-border/60 bg-white text-muted-foreground dark:border-dark-border/60 dark:bg-dark-card/70 dark:text-dark-muted'
                    )}
                  >
                    <button type="button" onClick={() => handleApplySegment(segment.id)}>
                      {segment.name}
                    </button>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-red-500"
                      onClick={() => handleDeleteSegment(segment.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="premium-panel">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Follow-ups sugeridos
            </p>
            {followUpAlerts.length === 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Nenhum lead crítico aguardando interação.
              </p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {followUpAlerts.map(alert => (
                  <li key={alert.id} className="flex items-center justify-between gap-2 text-foreground dark:text-dark-foreground">
                    <span>{alert.name}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full px-2 text-[11px]"
                      onClick={() =>
                        openTaskModal({
                          clientId: alert.id,
                          responsibleId: alert.ownerId ?? users[0]?.id,
                        })
                      }
                    >
                      Criar tarefa
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      <Card className="premium-shell">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-base font-semibold tracking-tight text-foreground dark:text-dark-foreground">
              Lista inteligente de contatos
            </CardTitle>
            <CardDescription className="text-[12px]">
              Acompanhe categorias, estágios e responsáveis para priorizar relacionamentos em alta.
            </CardDescription>
          </div>
          <div className="flex w-full max-w-xl items-center gap-2.5">
            <label className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-muted-foreground shadow-inner dark:border-dark-border/60 dark:bg-dark-background/70">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
                placeholder="Buscar por nome, documento ou contato..."
                className="w-full border-none bg-transparent text-sm focus:outline-none dark:text-dark-foreground"
              />
            </label>
            <Button variant="ghost" size="sm" className="rounded-full text-xs" onClick={resetFilters}>
              Limpar filtros
            </Button>
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

          <div className="space-y-3">
            <div className="contact-inbox">
              {filteredContacts.map((contact, index) => {
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
                  <div key={contact.id} className="contact-inbox__item">
                    <div className="contact-inbox__rail">
                      <span className="contact-inbox__dot" />
                      {index !== filteredContacts.length - 1 && <span className="contact-inbox__line" />}
                    </div>
                    <article className="contact-inbox__card">
                      <header className="contact-inbox__header">
                        <div className="contact-inbox__avatar">
                          <User className="h-5 w-5" />
                        </div>
                        <div className="contact-inbox__title">
                          <Link to={`/contatos/${contact.id}`} className="contact-inbox__name">
                            {contact.name}
                          </Link>
                          <div className="contact-inbox__chips">
                            {contact.document && (
                              <span className="contact-inbox__chip">
                                <IdCard className="h-3 w-3" />
                                {formatDocument(contact.document)}
                              </span>
                            )}
                            {contact.email && (
                              <span className="contact-inbox__chip">
                                <Mail className="h-3 w-3" />
                                {contact.email}
                              </span>
                            )}
                            {contact.phone && (
                              <span className="contact-inbox__chip">
                                <Phone className="h-3 w-3" />
                                {contact.phone}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button variant="secondary" size="sm" className="contact-inbox__cta" asChild>
                          <Link to={`/contatos/${contact.id}`}>Ver perfil</Link>
                        </Button>
                      </header>

                      <div className="contact-inbox__badges">
                        <span className={cn('contact-pill', statusClass)}>{contact.status}</span>
                        {contactCategory && contactCategory.name !== contact.status && (
                          <span className="contact-pill" style={getBadgeStyles(contactCategory.color)}>
                            {contactCategory.name}
                          </span>
                        )}
                        {leadCategory ? (
                          <span className="contact-pill" style={getBadgeStyles(leadCategory.color)}>
                            {leadCategory.name}
                          </span>
                        ) : (
                          <span className="contact-pill contact-pill--muted">Sem estágio</span>
                        )}
                      </div>

                      <div className="contact-inbox__details">
                        <div>
                          <span className="contact-inbox__label">Responsável</span>
                          <p className="contact-inbox__value">{owner?.name ?? 'Equipe'}</p>
                          <div className="contact-inbox__links">
                            <Link to={`/processos?cliente=${contact.id}`}>{processCount} processo(s)</Link>
                            <Link to={`/tarefas?clientId=${contact.id}`}>{taskCount} tarefa(s)</Link>
                          </div>
                        </div>
                        <div>
                          <span className="contact-inbox__label">Origem</span>
                          <p className="contact-inbox__value">{contact.origin || 'Origem não informada'}</p>
                          <p className="contact-inbox__hint">
                            Última interação:{' '}
                            {contact.lastInteraction ? formatDate(contact.lastInteraction) : 'Sem registro'}
                          </p>
                        </div>
                      </div>

                      <footer className="contact-inbox__footer">
                        <div className="contact-inbox__actions">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="contact-inbox__icon-btn"
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
                            className="contact-inbox__icon-btn"
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
                            className="contact-inbox__icon-btn contact-inbox__icon-btn--danger"
                            title="Excluir contato"
                            onClick={() => handleDeleteContact(contact)}
                            disabled={deletingContactId === contact.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="contact-inbox__status-chip">
                          {contact.leadCategoryId ? 'Em acompanhamento' : 'Sem fluxo definido'}
                        </div>
                      </footer>
                    </article>
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
