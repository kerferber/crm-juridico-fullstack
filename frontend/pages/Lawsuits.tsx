import React, { useMemo, useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useApp } from '../store/AppContext';
import { formatDate } from '../lib/utils';
import { Button } from '../components/ui/Button';
import {
  Plus,
  Search,
  Briefcase,
  Layers,
  Trophy,
  Archive,
  User,
  CalendarDays,
  ClipboardList,
  Trash2,
  Filter,
  X,
} from 'lucide-react';
import { useProcessModal } from '../hooks/useProcessModal';
import { useTaskModal } from '../hooks/useTaskModal';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { TaskStatus } from '../types/types';

const STATUS_COLORS: Record<string, string> = {
  Ativo: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200',
  Fechado: 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-200',
  Arquivado: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200',
};

const AREA_COLORS: Record<string, string> = {
  'Cível': 'bg-primary/10 text-primary dark:bg-dark-primary/15 dark:text-dark-primary',
  'Trabalhista': 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200',
  'Previdenciário': 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-200',
};

const FILTERS_STORAGE_KEY = 'workflow-studio:lawsuits:filters:v1';

const Lawsuits: React.FC = () => {
  const { lawsuits, contacts, users, tasks, deleteLawsuit } = useApp();
  const { open: openProcessModal } = useProcessModal();
  const { openForCreate: openTaskModal } = useTaskModal();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedArea, setSelectedArea] = useState('all');
  const [selectedResponsible, setSelectedResponsible] = useState('all');
  const [selectedPhase, setSelectedPhase] = useState('all');
  const [deadlinePreset, setDeadlinePreset] = useState<'all' | 'next7' | 'next30' | 'overdue' | 'noDeadline'>('all');
  const [deletingLawsuitId, setDeletingLawsuitId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<typeof lawsuits[number] | null>(null);
  const [deleteConfirmValue, setDeleteConfirmValue] = useState('');
  const [filtersLoaded, setFiltersLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || filtersLoaded) return;
    try {
      const stored = window.localStorage.getItem(FILTERS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as {
          search?: string;
          status?: string;
          area?: string;
          responsible?: string;
          phase?: string;
          deadline?: typeof deadlinePreset;
        };
        if (parsed.search) setSearchTerm(parsed.search);
        if (parsed.status) setSelectedStatus(parsed.status);
        if (parsed.area) setSelectedArea(parsed.area);
        if (parsed.responsible) setSelectedResponsible(parsed.responsible);
        if (parsed.phase) setSelectedPhase(parsed.phase);
        if (parsed.deadline) setDeadlinePreset(parsed.deadline);
      }
    } catch (error) {
      console.warn('Não foi possível carregar filtros de processos.', error);
    } finally {
      setFiltersLoaded(true);
    }
  }, [filtersLoaded]);

  useEffect(() => {
    if (typeof window === 'undefined' || !filtersLoaded) return;
    const payload = {
      search: searchTerm,
      status: selectedStatus,
      area: selectedArea,
      responsible: selectedResponsible,
      phase: selectedPhase,
      deadline: deadlinePreset,
    };
    window.localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(payload));
  }, [
    filtersLoaded,
    searchTerm,
    selectedStatus,
    selectedArea,
    selectedResponsible,
    selectedPhase,
    deadlinePreset,
  ]);

  const today = dayjs();
  const deadlinePresetOptions: { id: typeof deadlinePreset; label: string }[] = [
    { id: 'all', label: 'Todos os prazos' },
    { id: 'next7', label: '7 dias' },
    { id: 'next30', label: '30 dias' },
    { id: 'overdue', label: 'Atrasados' },
    { id: 'noDeadline', label: 'Sem prazo' },
  ];
  const quickPresets = [
    {
      id: 'week-focus',
      label: 'Semana crítica',
      description: 'Ativos com prazo em até 7 dias',
      apply: () => {
        setSelectedStatus('Ativo');
        setDeadlinePreset('next7');
      },
    },
    {
      id: 'overdue-focus',
      label: 'Prazos vencidos',
      description: 'Processos com prazo expirado',
      apply: () => {
        setSelectedStatus('Ativo');
        setDeadlinePreset('overdue');
      },
    },
    {
      id: 'no-phase',
      label: 'Sem fase definida',
      description: 'Revisar processos incompletos',
      apply: () => {
        setSelectedPhase('Sem fase');
        setSelectedStatus('all');
      },
    },
  ];
  const activeCount = lawsuits.filter(l => l.status === 'Ativo').length;
  const closedCount = lawsuits.filter(l => l.status === 'Fechado').length;
  const archivedCount = lawsuits.filter(l => l.status === 'Arquivado').length;
  const criticalDeadlines = useMemo(
    () =>
      lawsuits.filter(lawsuit => {
        if (!lawsuit.deadline || lawsuit.status !== 'Ativo') return false;
        const deadlineDate = dayjs(lawsuit.deadline);
        return deadlineDate.isSameOrBefore(today.add(7, 'day'), 'day');
      }).length,
    [lawsuits, today]
  );
  const pipelinePhases = useMemo(() => {
    const phaseMap = new Map<
      string,
      {
        count: number;
        nextDeadline: string | null;
      }
    >();
    lawsuits.forEach(lawsuit => {
      const phase = lawsuit.phase ?? 'Sem fase definida';
      const current = phaseMap.get(phase) ?? { count: 0, nextDeadline: null };
      let nextDeadline = current.nextDeadline;
      if (lawsuit.deadline) {
        if (!nextDeadline || dayjs(lawsuit.deadline).isBefore(dayjs(nextDeadline))) {
          nextDeadline = lawsuit.deadline;
        }
      }
      phaseMap.set(phase, {
        count: current.count + 1,
        nextDeadline,
      });
    });
    return Array.from(phaseMap.entries())
      .map(([phase, data]) => ({
        phase,
        count: data.count,
        nextDeadline: data.nextDeadline,
      }))
      .sort((a, b) => b.count - a.count);
  }, [lawsuits]);

  const statusOptions = useMemo(
    () => ['all', ...Array.from(new Set(lawsuits.map(l => l.status)))],
    [lawsuits]
  );
  const areaOptions = useMemo(
    () => ['all', ...Array.from(new Set(lawsuits.map(l => l.area)))],
    [lawsuits]
  );
  const phaseOptions = useMemo(
    () => ['all', ...Array.from(new Set(lawsuits.map(l => l.phase ?? 'Sem fase')))],
    [lawsuits]
  );

  const contactsMap = useMemo(() => {
    const map = new Map<number, typeof contacts[number]>();
    contacts.forEach(contact => map.set(contact.id, contact));
    return map;
  }, [contacts]);

  const filteredLawsuits = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return lawsuits.filter(lawsuit => {
      const client = lawsuit.clientId ? contactsMap.get(lawsuit.clientId) : undefined;
      if (normalizedSearch) {
        const haystack = [
          lawsuit.internalNumber,
          lawsuit.area,
          lawsuit.phase,
          lawsuit.notes,
          client?.name,
        ]
          .filter((value): value is string => Boolean(value))
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(normalizedSearch)) {
          return false;
        }
      }
      const matchesStatus = selectedStatus === 'all' || lawsuit.status === selectedStatus;
      const matchesArea = selectedArea === 'all' || lawsuit.area === selectedArea;
      const matchesResponsible =
        selectedResponsible === 'all' ||
        lawsuit.responsibleId === Number.parseInt(selectedResponsible, 10);
      const matchesPhase =
        selectedPhase === 'all' || (lawsuit.phase ?? 'Sem fase') === selectedPhase;
      const deadlineDate = lawsuit.deadline ? dayjs(lawsuit.deadline) : null;
      const matchesDeadline = (() => {
        const diffInDays = deadlineDate ? deadlineDate.diff(today, 'day') : null;
        switch (deadlinePreset) {
          case 'next7':
            return (
              deadlineDate !== null &&
              diffInDays !== null &&
              diffInDays >= 0 &&
              diffInDays <= 7
            );
          case 'next30':
            return (
              deadlineDate !== null &&
              diffInDays !== null &&
              diffInDays >= 0 &&
              diffInDays <= 30
            );
          case 'overdue':
            return deadlineDate !== null && deadlineDate.isBefore(today, 'day');
          case 'noDeadline':
            return !deadlineDate;
          case 'all':
          default:
            return true;
        }
      })();

      return (
        matchesStatus &&
        matchesArea &&
        matchesResponsible &&
        matchesPhase &&
        matchesDeadline
      );
    });
  }, [
    lawsuits,
    contactsMap,
    searchTerm,
    selectedStatus,
    selectedArea,
    selectedResponsible,
    selectedPhase,
    deadlinePreset,
    today,
  ]);

  const requestDeleteLawsuit = (target: typeof lawsuits[number]) => {
    setPendingDelete(target);
    setDeleteConfirmValue('');
    setActionError(null);
  };

  const handleDeleteLawsuit = async () => {
    if (!pendingDelete) return;
    try {
      setActionError(null);
      setDeletingLawsuitId(pendingDelete.id);
      await deleteLawsuit(pendingDelete.id);
      setPendingDelete(null);
      setDeleteConfirmValue('');
    } catch (err) {
      console.error(err);
      setActionError('Não foi possível excluir o processo selecionado.');
    } finally {
      setDeletingLawsuitId(null);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border/60 bg-white px-5 py-5 shadow-sm dark:border-dark-border/60 dark:bg-dark-card/80">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
              Operações jurídicas
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground dark:text-dark-foreground">
              Pipeline de processos e prazos críticos
            </h1>
            <p className="text-sm text-muted-foreground">
              Visualize fases, riscos e direcione tarefas com um clique.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="gap-2 rounded-full" onClick={() => openProcessModal()}>
              <Plus className="h-4 w-4" />
              Novo processo
            </Button>
            <Button
              variant="outline"
              className="gap-2 rounded-full"
              onClick={() => setSelectedStatus('Ativo')}
            >
              <Briefcase className="h-4 w-4" />
              Somente ativos
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: 'Ativos',
              value: activeCount,
              description: 'Processos em andamento',
              icon: Briefcase,
              accent: 'text-emerald-600 bg-emerald-50 dark:text-emerald-200 dark:bg-emerald-500/10',
              action: () => setSelectedStatus('Ativo'),
            },
            {
              title: 'Prazos 7 dias',
              value: criticalDeadlines,
              description: 'Com prazo até ' + today.add(7, 'day').format('DD/MM'),
              icon: CalendarDays,
              accent: 'text-amber-600 bg-amber-50 dark:text-amber-200 dark:bg-amber-500/10',
              action: () => setSelectedStatus('Ativo'),
            },
            {
              title: 'Fechados (30 dias)',
              value: closedCount,
              description: 'Resultados recentes',
              icon: Trophy,
              accent: 'text-primary bg-primary/10 dark:text-dark-primary dark:bg-dark-primary/15',
              action: () => setSelectedStatus('Fechado'),
            },
            {
              title: 'Total na base',
              value: lawsuits.length,
              description: `${archivedCount} arquivados`,
              icon: Layers,
              accent: 'text-slate-600 bg-slate-100 dark:text-dark-foreground dark:bg-dark-border/30',
              action: () => setSelectedStatus('all'),
            },
          ].map(card => (
            <div
              key={card.title}
              className="rounded-2xl border border-border/60 bg-surface px-4 py-4 shadow-sm dark:border-dark-border/60 dark:bg-dark-surface/60"
            >
              <div className="flex items-center gap-2">
                <div className={cn('inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold', card.accent)}>
                  <card.icon className="h-3.5 w-3.5" />
                  {card.title}
                </div>
              </div>
              <p className="mt-3 text-3xl font-semibold text-foreground dark:text-dark-foreground">
                {card.value}
              </p>
              <p className="text-xs text-muted-foreground">{card.description}</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2 px-0 text-left text-xs font-semibold"
                onClick={card.action}
              >
                Ajustar filtros
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-white px-5 py-5 shadow-sm dark:border-dark-border/60 dark:bg-dark-card/80">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />
              Presets inteligentes
            </span>
            {quickPresets.map(preset => (
              <Button
                key={preset.id}
                type="button"
                size="sm"
                variant="ghost"
                className="rounded-full border border-border/60 px-3 py-1 text-xs font-semibold text-muted-foreground hover:border-primary/50 hover:text-primary dark:border-dark-border/60 dark:text-dark-muted dark:hover:text-dark-primary"
                onClick={preset.apply}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Use presets para aplicar rapidamente combinações de filtros e destravar gargalos críticos.
          </p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {pipelinePhases.map(phase => (
            <div
              key={phase.phase}
              className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-surface px-4 py-4 shadow-sm dark:border-dark-border/60 dark:bg-dark-surface/60"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {phase.phase}
                </span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary dark:bg-dark-primary/15 dark:text-dark-primary">
                  {phase.count}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {phase.nextDeadline
                  ? `Próximo prazo ${formatDate(phase.nextDeadline)}`
                  : 'Sem prazo futuro'}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full px-3 text-xs"
                  onClick={() => setSelectedPhase(phase.phase)}
                >
                  Filtrar fase
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full px-3 text-xs"
                  onClick={() => {
                    setSelectedPhase('all');
                    setSelectedStatus('Ativo');
                    setDeadlinePreset('next7');
                  }}
                >
                  Reatribuir
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-border/60 bg-white/85 p-6 shadow-sm backdrop-blur-xl dark:border-dark-border/60 dark:bg-dark-card/80">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground dark:text-dark-foreground">
              Processos em andamento
            </h2>
            <p className="text-xs text-muted-foreground">
              Busque por número, filtre por status ou área e direcione as próximas ações com um clique.
            </p>
          </div>
          <div className="flex w-full max-w-2xl items-center gap-3 rounded-xl border border-border/60 bg-white px-4 py-2 shadow-inner dark:border-dark-border/60 dark:bg-dark-background/70">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              placeholder="Buscar por número interno, cliente ou palavra-chave..."
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
            value={selectedArea}
            onChange={event => setSelectedArea(event.target.value)}
            className="flex h-10 items-center rounded-lg border border-border/60 bg-white px-3 text-sm text-foreground shadow-sm focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/60 dark:bg-dark-background/70 dark:text-dark-foreground"
          >
            {areaOptions.map(option => (
              <option key={option} value={option}>
                {option === 'all' ? 'Todas as áreas' : option}
              </option>
            ))}
          </select>

          <select
            value={selectedResponsible}
            onChange={event => setSelectedResponsible(event.target.value)}
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
            value={selectedPhase}
            onChange={event => setSelectedPhase(event.target.value)}
            className="flex h-10 items-center rounded-lg border border-border/60 bg-white px-3 text-sm text-foreground shadow-sm focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/60 dark:bg-dark-background/70 dark:text-dark-foreground"
          >
            {phaseOptions.map(option => (
              <option key={option} value={option}>
                {option === 'all' ? 'Todas as fases' : option}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap items-center gap-2">
            {deadlinePresetOptions.map(option => (
              <button
                key={option.id}
                type="button"
                onClick={() => setDeadlinePreset(option.id)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-semibold transition',
                  option.id === deadlinePreset
                    ? 'border-primary/40 bg-primary/10 text-primary shadow-sm dark:border-dark-primary/40 dark:bg-dark-primary/15 dark:text-dark-primary'
                    : 'border-border/50 bg-white text-muted-foreground hover:border-primary/30 hover:text-primary dark:border-dark-border/60 dark:bg-dark-card/70 dark:hover:border-dark-primary/40 dark:hover:text-dark-primary'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full text-xs"
            onClick={() => {
              setSearchTerm('');
              setSelectedStatus('all');
              setSelectedArea('all');
              setSelectedResponsible('all');
              setSelectedPhase('all');
              setDeadlinePreset('all');
            }}
          >
            Limpar filtros
          </Button>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-border/60 bg-white dark:border-dark-border/60 dark:bg-dark-card/80">
          {actionError && (
            <p className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
              {actionError}
            </p>
          )}
          <div className="hidden grid-cols-[minmax(220px,1fr),minmax(180px,0.8fr),minmax(160px,0.7fr),minmax(200px,0.8fr),120px] border-b border-border/60 bg-muted/30 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground dark:border-dark-border/60 dark:bg-dark-card/70 md:grid">
            <span>Processo</span>
            <span>Cliente & Área</span>
            <span>Responsável</span>
            <span>Prazos & Tarefas</span>
            <span className="text-right">Ações</span>
          </div>

          {filteredLawsuits.map(lawsuit => {
            const client = contacts.find(contact => contact.id === lawsuit.clientId);
            const responsible = users.find(user => user.id === lawsuit.responsibleId);
            const relatedTasks = tasks.filter(task => task.lawsuitId === lawsuit.id);
            const overdueTasks = relatedTasks.filter(task => {
              if (task.status === TaskStatus.Concluida) return false;
              if (!task.deadline) return false;
              return dayjs(task.deadline).isBefore(today, 'day');
            }).length;
            const isDeadlineLate =
              lawsuit.deadline &&
              lawsuit.status === 'Ativo' &&
              dayjs().isAfter(dayjs(lawsuit.deadline), 'day');

            return (
              <div
                key={lawsuit.id}
                className="flex flex-col gap-4 border-b border-border/60 px-4 py-5 transition hover:bg-muted/30 dark:border-dark-border/60 dark:hover:bg-dark-card/60 md:grid md:grid-cols-[minmax(220px,1fr),minmax(180px,0.8fr),minmax(160px,0.7fr),minmax(200px,0.8fr),120px] md:items-center md:px-6"
              >
                <div>
                  <Link
                    to={`/processos/${lawsuit.id}`}
                    className="text-sm font-semibold text-foreground transition hover:text-primary dark:text-dark-foreground dark:hover:text-dark-primary"
                  >
                    {lawsuit.internalNumber}
                  </Link>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full border px-2 py-0.5',
                        STATUS_COLORS[lawsuit.status] ??
                          'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-500/20 dark:bg-slate-500/10 dark:text-slate-200'
                      )}
                    >
                      {lawsuit.status}
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full border px-2 py-0.5',
                        AREA_COLORS[lawsuit.area] ??
                          'border-primary/20 bg-primary/10 text-primary dark:border-dark-primary/20 dark:bg-dark-primary/15 dark:text-dark-primary'
                      )}
                    >
                      {lawsuit.area}
                    </span>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground dark:text-dark-muted">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-primary dark:text-dark-primary" />
                    <span className="font-medium text-foreground dark:text-dark-foreground">
                      {client?.name ?? 'Cliente não informado'}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px]">Fase: {lawsuit.phase || 'Não informada'}</p>
                </div>

                <div className="text-sm text-muted-foreground dark:text-dark-muted">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-3.5 w-3.5 text-primary dark:text-dark-primary" />
                    <span>{responsible ? responsible.name : 'Responsável não atribuído'}</span>
                  </div>
                  {lawsuit.clientId && (
                    <p className="mt-1 text-[12px]">
                      Vínculo:&nbsp;
                      <Link
                        to={`/contatos/${lawsuit.clientId}`}
                        className="font-medium text-primary hover:underline dark:text-dark-primary"
                      >
                        Ver contato
                      </Link>
                    </p>
                  )}
                </div>

                <div className="space-y-1 text-sm text-muted-foreground dark:text-dark-muted">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5 text-primary dark:text-dark-primary" />
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.28em]',
                        isDeadlineLate
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-200'
                          : 'bg-primary/10 text-primary dark:bg-dark-primary/15 dark:text-dark-primary'
                      )}
                    >
                      {lawsuit.deadline ? `Prazo ${formatDate(lawsuit.deadline)}` : 'Sem prazo definido'}
                    </span>
                  </div>
                  <p className="text-[12px]">
                    {relatedTasks.length} tarefas ·{' '}
                    {overdueTasks > 0 ? `${overdueTasks} atrasada(s)` : 'em dia'}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg border-primary/40 px-3 text-xs font-semibold text-primary hover:bg-primary/10 dark:border-dark-primary/40 dark:text-dark-primary dark:hover:bg-dark-primary/15"
                    asChild
                  >
                    <Link to={`/processos/${lawsuit.id}`}>Detalhes</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg border border-border/60 text-primary hover:border-primary/40 hover:bg-primary/10 dark:border-dark-border/60 dark:text-dark-primary dark:hover:border-dark-primary/40 dark:hover:bg-dark-primary/10"
                    title="Criar tarefa ligada ao processo"
                    onClick={() =>
                      openTaskModal({
                        lawsuitId: lawsuit.id,
                        clientId: lawsuit.clientId,
                        responsibleId: lawsuit.responsibleId,
                      })
                    }
                  >
                    <ClipboardList className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg border border-border/60 text-primary hover:border-primary/40 hover:bg-primary/10 dark:border-dark-border/60 dark:text-dark-primary dark:hover:border-dark-primary/40 dark:hover:bg-dark-primary/10"
                    title="Novo processo vinculado"
                    onClick={() =>
                      openProcessModal({
                        clientId: lawsuit.clientId,
                        responsibleId: lawsuit.responsibleId,
                      })
                    }
                  >
                    <Briefcase className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg border border-red-200 text-red-600 hover:border-red-400 hover:bg-red-50 dark:border-red-500/40 dark:text-red-300 dark:hover:border-red-400 dark:hover:bg-red-500/15"
                    title="Excluir processo"
                    onClick={() => requestDeleteLawsuit(lawsuit)}
                    disabled={deletingLawsuitId === lawsuit.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}

          {filteredLawsuits.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center text-sm text-muted-foreground dark:text-dark-muted">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-dark-primary/10 dark:text-dark-primary">
                <Briefcase className="h-6 w-6" />
              </div>
              Nenhum processo encontrado com os filtros selecionados.
              <Button variant="outline" size="sm" onClick={() => setSelectedStatus('all')}>
                Limpar filtros
              </Button>
            </div>
          )}
        </div>
      </section>
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-md rounded-2xl border border-border/60 bg-white p-6 shadow-2xl dark:border-dark-border/60 dark:bg-dark-card/90">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  Confirmar exclusão
                </p>
                <h3 className="mt-1 text-lg font-semibold text-foreground dark:text-dark-foreground">
                  {pendingDelete.internalNumber}
                </h3>
              </div>
              <button
                type="button"
                className="rounded-full border border-border/60 p-1 text-muted-foreground hover:text-foreground dark:border-dark-border/60"
                onClick={() => setPendingDelete(null)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Essa ação não pode ser desfeita. Digite o número interno{' '}
              <span className="font-semibold text-foreground dark:text-dark-foreground">
                {pendingDelete.internalNumber}
              </span>{' '}
              para prosseguir.
            </p>
            <input
              value={deleteConfirmValue}
              onChange={event => setDeleteConfirmValue(event.target.value)}
              placeholder={pendingDelete.internalNumber}
              className="mt-3 w-full rounded-lg border border-border/60 px-3 py-2 text-sm focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/60 dark:bg-dark-card/70 dark:text-dark-foreground"
            />
            {actionError && (
              <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
                {actionError}
              </p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setPendingDelete(null)}>
                Cancelar
              </Button>
              <Button
                className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                disabled={
                  deleteConfirmValue.trim() !== pendingDelete.internalNumber ||
                  deletingLawsuitId === pendingDelete.id
                }
                onClick={handleDeleteLawsuit}
              >
                Excluir definitivamente
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lawsuits;
