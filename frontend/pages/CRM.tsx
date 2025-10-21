import React, { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useApp } from '../store/AppContext';
import { KanbanCard as KanbanCardType, KanbanColumn, KanbanPhase } from '../types/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  Plus,
  Paperclip,
  MessageSquare,
  Bell,
  MoreHorizontal,
  Briefcase,
  CalendarDays,
  Filter,
  ArrowUpDown,
  LayoutGrid,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useKanbanCardModal } from '../hooks/useKanbanCardModal';

interface DraggableKanbanCardProps {
  card: KanbanCardType;
  onOpen: (card: KanbanCardType) => void;
}

const areaStyles: Record<KanbanCardType['area'], string> = {
  'Cível': 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/15 dark:text-blue-200 dark:border-blue-400/30',
  'Trabalhista': 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-400/30',
  'Previdenciário': 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-500/15 dark:text-purple-200 dark:border-purple-400/30',
  'Não definido': 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-500/15 dark:text-slate-200 dark:border-slate-400/30',
};

const phaseStyles: Record<KanbanPhase, string> = {
  [KanbanPhase.Judicial]: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-200',
  [KanbanPhase.Extrajudicial]: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-200',
};

const DraggableKanbanCard: React.FC<DraggableKanbanCardProps> = ({ card, onOpen }) => {
  const [isDragging, setIsDragging] = useState(false);
  const descriptionPreview = useMemo(() => {
    if (!card.description) return '';
    const trimmed = card.description.trim();
    if (!trimmed) return '';
    if (trimmed.length <= 140) return trimmed;
    return `${trimmed.slice(0, 137)}...`;
  }, [card.description]);
  const formattedDeadline = card.deadline ? dayjs(card.deadline).format('DD/MM/YYYY') : null;

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("cardId", card.id);
    setIsDragging(true);
  };
  
  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    if (!isDragging) {
      onOpen(card);
    }
  };

  return (
    <Card
      className={cn(
        'group mb-3 cursor-grab overflow-hidden rounded-xl border border-border/60 bg-white shadow-[0_10px_30px_-24px_rgba(15,23,42,0.35)] transition-all duration-150 active:cursor-grabbing dark:border-dark-border/60 dark:bg-dark-card/80',
        card.isDelayed && 'border-red-300/60 shadow-[0_18px_34px_-24px_rgba(239,68,68,0.55)] dark:border-red-400/70',
        isDragging && 'scale-[0.99] shadow-lg'
      )}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
    >
      <CardHeader className="space-y-3 p-4 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-sm font-semibold leading-tight text-foreground transition-colors group-hover:text-primary dark:text-dark-foreground">
              {card.title}
            </p>
            <span
              className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide shadow-sm transition-colors', areaStyles[card.area])}
            >
              <Briefcase size={12} />
              {card.area}
            </span>
          </div>
          <button
            className="rounded-full bg-transparent p-1 text-muted-foreground transition hover:bg-muted/60 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:hover:bg-dark-border/40"
            onClick={event => event.stopPropagation()}
            aria-label="Opções do card"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
        {descriptionPreview && (
          <p
            className="text-xs leading-relaxed text-muted-foreground/80"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {descriptionPreview}
          </p>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3 border-t border-border/60 bg-white p-4 pt-3 dark:border-dark-border/50 dark:bg-dark-card/70">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {formattedDeadline && (
            <div
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold transition-colors',
                card.isDelayed
                  ? 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300'
                  : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-200'
              )}
            >
              <CalendarDays size={14} />
              {formattedDeadline}
            </div>
          )}
          {card.isDelayed && !formattedDeadline && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 font-semibold text-red-600 dark:bg-red-500/15 dark:text-red-300">
              <CalendarDays size={14} />
              Atrasado
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
            {card.phase && (
              <span className={cn('rounded-full px-2 py-1', phaseStyles[card.phase])}>{card.phase}</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            {card.hasAttachments && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted/40 px-2 py-1 text-[11px] font-medium">
                <Paperclip size={12} />
                Arquivo
              </span>
            )}
            {card.commentsCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted/40 px-2 py-1 text-[11px] font-medium">
                <MessageSquare size={12} />
                {card.commentsCount}
              </span>
            )}
            {card.hasReminder && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted/40 px-2 py-1 text-[11px] font-medium">
                <Bell size={12} />
                Lembrete
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface QuickAddCardFormProps {
    column: KanbanColumn;
    phase: KanbanPhase;
}

const QuickAddCardForm: React.FC<QuickAddCardFormProps> = ({ column, phase }) => {
  const { openForCreate } = useKanbanCardModal();
  return (
    <Button
      variant="ghost"
      size="sm"
      className="mt-2 w-full justify-center rounded-lg border border-dashed border-border/60 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary dark:border-dark-border/50"
      onClick={() => openForCreate({ column, phase })}
    >
      <Plus size={14} className="mr-2" />
      Adicionar card
    </Button>
  );
};


const CRM: React.FC = () => {
    const { kanbanCards, updateKanbanCardColumn } = useApp();
    const { openForEdit, openForCreate } = useKanbanCardModal();
    const [activeTab, setActiveTab] = useState<KanbanPhase>(KanbanPhase.Judicial);
    const [draggedOverColumn, setDraggedOverColumn] = useState<KanbanColumn | null>(null); // SUGESTÃO 2
    const tabs = Object.values(KanbanPhase);
    const columns = Object.values(KanbanColumn);

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, column: KanbanColumn) => {
        e.preventDefault();
        const cardId = e.dataTransfer.getData("cardId");
        updateKanbanCardColumn(cardId, column, activeTab);
        setDraggedOverColumn(null); // SUGESTÃO 2: Resetar highlight
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const filteredCards = kanbanCards.filter(c => c.phase === activeTab);
    const metrics = useMemo(() => {
        const totalCards = filteredCards.length;
        const attachments = filteredCards.filter(card => card.hasAttachments).length;
        const alerts = filteredCards.filter(card => card.isDelayed).length;
        const activeStages = new Set(filteredCards.map(card => card.column)).size;

        return {
            totalCards,
            attachments,
            alerts,
            activeStages,
        };
    }, [filteredCards]);
    const totalColumns = columns.length;
    const stageProgress =
        totalColumns > 0 ? Math.min(100, (metrics.activeStages / totalColumns) * 100) : 0;
    const highlightCards = [
        {
            title: 'Oportunidades',
            value: metrics.totalCards,
            description: 'Cards ativos em todas as etapas.',
        },
        {
            title: 'Alertas críticos',
            value: metrics.alerts,
            description: 'Cards com prazo vencido ou atenção imediata.',
        },
        {
            title: 'Etapas ativas',
            value:
                totalColumns > 0
                    ? `${metrics.activeStages}/${totalColumns}`
                    : `${metrics.activeStages}`,
            description: 'Etapas com cards movimentando hoje.',
        },
    ];
    const quickStats = [
        { label: 'Total no funil', value: metrics.totalCards },
        { label: 'Com anexos', value: metrics.attachments },
        { label: 'Alertas ativos', value: metrics.alerts },
    ];
    
    return (
        <div className="flex h-full flex-col space-y-5">
			<section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-[#F3F8FF] via-[#EAF4FF] to-white px-6 py-7 text-slate-800 shadow-[0_28px_70px_-48px_rgba(15,23,42,0.4)]">
				<div className="pointer-events-none absolute inset-0 opacity-40">
					<div className="absolute -left-28 top-10 h-56 w-56 rounded-full bg-sky-200/70 blur-3xl" />
					<div className="absolute -bottom-28 right-0 h-64 w-64 rounded-full bg-indigo-200/70 blur-3xl" />
                </div>
                <div className="relative grid gap-8 lg:grid-cols-[1.5fr,0.7fr]">
                    <div className="space-y-6">
						<span className="inline-flex items-center gap-2 rounded-md border border-sky-100 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-sky-600 shadow-sm">
							<Sparkles className="h-4 w-4 text-sky-500" />
                            CRM Premium
                        </span>
						<div className="space-y-3">
							<h1 className="text-[26px] font-semibold leading-tight text-slate-900 lg:text-[32px]">
								Domine seu pipeline e acelere conversões estratégicas.
							</h1>
							<p className="max-w-2xl text-[13px] text-slate-500 lg:text-sm">
                                Priorize etapas críticas, acompanhe alertas de prazo e mantenha as negociações avançando com uma visão premium do seu funil jurídico.
                            </p>
                        </div>
						<div className="flex flex-wrap gap-3">
							<Button
								size="sm"
								className="rounded-md bg-sky-500 px-5 text-sm font-semibold text-white shadow-[0_18px_40px_-25px_rgba(56,189,248,0.5)] transition hover:bg-sky-600"
								onClick={() => openForCreate({ column: KanbanColumn.Prospeccao, phase: activeTab })}
							>
								Nova oportunidade
								<ArrowRight className="ml-2 h-4 w-4" />
							</Button>
							<Button
								variant="ghost"
								size="sm"
								className="rounded-md border border-slate-200 bg-white/80 px-5 text-sm font-semibold text-slate-600 shadow-inner transition hover:border-sky-300 hover:text-sky-600"
							>
								Relatórios inteligentes
							</Button>
						</div>
                        <div className="space-y-4">
			<div className="flex flex-wrap gap-x-6 gap-y-3 text-xs uppercase tracking-[0.25em] text-slate-500">
                                <span>{metrics.totalCards} cards ativos</span>
                                <span>{metrics.activeStages} etapas com movimento</span>
                                <span>{metrics.alerts} com alerta de prazo</span>
                            </div>
                            <div className="grid gap-3 text-sm sm:grid-cols-3">
				{highlightCards.map(card => (
					<div
						key={card.title}
						className="rounded-lg border border-slate-200 bg-white p-4 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.3)]"
					>
						<p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
							{card.title}
						</p>
						<p className="mt-2 text-2xl font-semibold text-slate-900">
							{card.value}
						</p>
						<p className="mt-1 text-xs text-slate-500">{card.description}</p>
					</div>
				))}
                            </div>
                        </div>
                    </div>
		<div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 text-slate-700 shadow-[0_20px_56px_-40px_rgba(15,23,42,0.32)]">
			<div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
				<span>Visão rápida</span>
				<Briefcase className="h-4 w-4 text-slate-500" />
			</div>
			<div className="space-y-3 text-sm">
				{quickStats.map(stat => (
					<div key={stat.label} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-2.5">
						<span className="text-slate-600">{stat.label}</span>
						<span className="text-lg font-semibold text-slate-900">{stat.value}</span>
					</div>
				))}
			</div>
			<div>
				<p className="text-xs uppercase tracking-[0.24em] text-slate-500">Etapa selecionada</p>
				<div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/60">
					<div
						className="h-full rounded-full bg-sky-500"
						style={{ width: `${stageProgress}%` }}
					/>
				</div>
				<p className="mt-2 text-sm font-semibold uppercase tracking-[0.24em] text-slate-900">
					{activeTab}
				</p>
			</div>
		</div>
                </div>
            </section>

            <Card className="rounded-3xl border border-border/70 bg-white shadow-sm dark:border-dark-border/60 dark:bg-dark-card/70">
                <CardHeader className="flex flex-wrap items-center justify-between gap-3 pb-4">
                    <div className="space-y-1">
                        <CardTitle className="text-base font-semibold text-foreground dark:text-dark-foreground">
                            Gestão de pipeline
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Organize etapas, filtros e agrupamentos
                        </CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" size="sm" className="rounded-full border-border/60 px-3 text-xs font-semibold text-muted-foreground transition hover:border-primary hover:text-primary dark:border-dark-border/60 dark:text-dark-foreground">
                            <Filter className="mr-2 h-3.5 w-3.5" />
                            Filtros
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-full border-border/60 px-3 text-xs font-semibold text-muted-foreground transition hover:border-primary hover:text-primary dark:border-dark-border/60 dark:text-dark-foreground">
                            <ArrowUpDown className="mr-2 h-3.5 w-3.5" />
                            Ordenar
                        </Button>
                        <Button variant="ghost" size="sm" className="rounded-full border border-transparent px-3 text-xs font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-primary dark:text-dark-foreground dark:hover:border-dark-primary dark:hover:text-dark-primary">
                            <LayoutGrid className="mr-2 h-3.5 w-3.5" />
                            Agrupar
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="border-t border-border/60 pt-4 dark:border-dark-border/50">
                    <nav className="flex flex-wrap gap-2 text-xs font-medium text-muted-foreground" aria-label="Tabs">
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    'relative rounded-full border px-3 py-1 transition',
                                    activeTab === tab
                                        ? 'border-primary/60 bg-primary/10 text-primary shadow-sm dark:border-dark-primary/60 dark:bg-dark-primary/20 dark:text-dark-primary'
                                        : 'border-border/60 bg-white text-muted-foreground hover:border-primary/40 hover:text-primary dark:border-dark-border/60 dark:bg-dark-border/30 dark:text-dark-foreground dark:hover:text-dark-primary'
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </CardContent>
            </Card>

            <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-5">
                {columns.map(column => (
                    <div 
                        key={column} 
                        className={cn(
                            'flex h-full flex-col rounded-lg border border-border/60 bg-white p-4 shadow-[0_10px_24px_-22px_rgba(15,23,42,0.32)] transition-colors dark:border-dark-border/60 dark:bg-dark-card/80',
                            draggedOverColumn === column && 'border-primary/60 bg-primary/5 dark:border-dark-primary/70 dark:bg-dark-primary/10'
                        )}
                        onDrop={(e) => handleDrop(e, column)}
                        onDragOver={handleDragOver}
                        onDragEnter={() => setDraggedOverColumn(column)} // SUGESTÃO 2
                        onDragLeave={() => setDraggedOverColumn(null)}  // SUGESTÃO 2
                    >
                        <header className="mb-3 flex items-center justify-between">
                            <div>
                                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground/80">{column}</span>
                                <p className="text-[10px] text-muted-foreground">Organize leads nesta etapa</p>
                            </div>
                            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary dark:bg-dark-primary/20 dark:text-dark-primary">
                                {filteredCards.filter(c => c.column === column).length}
                            </span>
                        </header>
                        <div className="flex flex-1 flex-col overflow-hidden">
                            <div className="relative -mr-2 flex-1 space-y-3 overflow-y-auto pr-2">
                                {filteredCards.filter(c => c.column === column).map(card => (
                                    <DraggableKanbanCard key={card.id} card={card} onOpen={openForEdit} />
                                ))}
                            </div>
                            <QuickAddCardForm column={column} phase={activeTab} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CRM;
