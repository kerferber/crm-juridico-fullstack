import React, { useMemo, useState } from 'react';
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
} from 'lucide-react';
import { useProcessModal } from '../hooks/useProcessModal';
import { useTaskModal } from '../hooks/useTaskModal';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

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

const Lawsuits: React.FC = () => {
  const { lawsuits, contacts, users, tasks } = useApp();
  const { open: openProcessModal } = useProcessModal();
  const { openForCreate: openTaskModal } = useTaskModal();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedArea, setSelectedArea] = useState('all');
  const [selectedResponsible, setSelectedResponsible] = useState('all');

  const activeCount = lawsuits.filter(l => l.status === 'Ativo').length;
  const closedCount = lawsuits.filter(l => l.status === 'Fechado').length;
  const archivedCount = lawsuits.filter(l => l.status === 'Arquivado').length;

  const statusOptions = useMemo(
    () => ['all', ...Array.from(new Set(lawsuits.map(l => l.status)))],
    [lawsuits]
  );
  const areaOptions = useMemo(
    () => ['all', ...Array.from(new Set(lawsuits.map(l => l.area)))],
    [lawsuits]
  );

  const filteredLawsuits = useMemo(() => {
    return lawsuits.filter(lawsuit => {
      const matchesSearch = lawsuit.internalNumber
        .toLowerCase()
        .includes(searchTerm.trim().toLowerCase());
      const matchesStatus = selectedStatus === 'all' || lawsuit.status === selectedStatus;
      const matchesArea = selectedArea === 'all' || lawsuit.area === selectedArea;
      const matchesResponsible =
        selectedResponsible === 'all' ||
        lawsuit.responsibleId === Number.parseInt(selectedResponsible, 10);
      return matchesSearch && matchesStatus && matchesArea && matchesResponsible;
    });
  }, [lawsuits, searchTerm, selectedStatus, selectedArea, selectedResponsible]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">
            Operações Jurídicas
          </p>
          <h1 className="mt-1 text-[26px] font-semibold tracking-tight">Processos & Pipeline</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitore cada fase do processo, visualize prazos prioritários e ative tarefas diretamente.
          </p>
        </div>
        <Button
          size="lg"
          onClick={() => openProcessModal()}
          className="gap-2 rounded-xl shadow-[0_22px_42px_-24px_rgba(79,70,229,0.48)]"
        >
          <Plus className="h-4 w-4" />
          Novo processo
        </Button>
      </header>

 	    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-white shadow-sm dark:border-dark-primary/40 dark:from-dark-primary/15 dark:via-dark-primary/10 dark:to-dark-card/80">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">
              Processos ativos
            </CardTitle>
            <Briefcase className="h-8 w-8 text-primary/70" />
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-foreground dark:text-dark-foreground">
            {activeCount}
          </CardContent>
        </Card>
        <Card className="border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white shadow-sm dark:border-emerald-500/30 dark:from-emerald-500/10 dark:via-dark-card/80 dark:to-dark-card/90">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">
              Fechamentos
            </CardTitle>
            <Trophy className="h-8 w-8 text-emerald-500" />
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-foreground dark:text-dark-foreground">
            {closedCount}
          </CardContent>
        </Card>
        <Card className="border border-slate-200 bg-gradient-to-br from-slate-100 via-white to-white shadow-sm dark:border-dark-border/60 dark:from-dark-card/80 dark:via-dark-card/70 dark:to-dark-card/60">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">
              Arquivados
            </CardTitle>
            <Archive className="h-8 w-8 text-slate-500" />
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-foreground dark:text-dark-foreground">
            {archivedCount}
          </CardContent>
        </Card>
        <Card className="border border-indigo-100 bg-gradient-to-br from-white via-white to-indigo-50/70 shadow-sm dark:border-dark-border/60 dark:from-dark-card/80 dark:via-dark-card/75 dark:to-dark-primary/10">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">
              Total
            </CardTitle>
            <Layers className="h-8 w-8 text-indigo-500" />
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-foreground dark:text-dark-foreground">
            {lawsuits.length}
          </CardContent>
        </Card>
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
          <div className="flex w-full max-w-xl items-center gap-3 rounded-xl border border-border/60 bg-white px-4 py-2 shadow-inner dark:border-dark-border/60 dark:bg-dark-background/70">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              placeholder="Buscar por número interno..."
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
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-border/60 bg-white dark:border-dark-border/60 dark:bg-dark-card/80">
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
            const overdueTasks = relatedTasks.filter(task => task.status === 'Atrasada').length;
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
    </div>
  );
};

export default Lawsuits;
