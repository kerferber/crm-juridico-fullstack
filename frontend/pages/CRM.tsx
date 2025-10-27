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
      className="crm-add-card mt-3 w-full justify-center rounded-full text-xs font-semibold"
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
            <section className="premium-hero crm-premium">
                <div className="premium-hero__overlay" />
                <div className="premium-hero__content">
                    <div className="premium-hero__main">
                        <span className="premium-badge">
                            <Sparkles className="h-3.5 w-3.5" />
                            CRM · Pipeline
                        </span>
                        <h1 className="premium-hero__title">Domine seu pipeline e acelere conversões estratégicas.</h1>
                        <p className="premium-hero__subtitle">
                            Priorize etapas críticas, acompanhe prazos e mantenha as negociações avançando com uma visão premium do funil jurídico.
                        </p>
                        <div className="hero-actions hero-actions--compact">
                            <Button
                                className="hero-actions__primary gap-2 rounded-full"
                                onClick={() => openForCreate({ column: KanbanColumn.Prospeccao, phase: activeTab })}
                            >
                                Nova oportunidade
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" className="hero-actions__secondary gap-2 rounded-full">
                                <LayoutGrid className="h-4 w-4" />
                                Relatórios inteligentes
                            </Button>
                            <div className="hero-actions__tools crm-premium__tools">
                                <span>{metrics.totalCards} cards ativos</span>
                                <span className="crm-premium__dot" />
                                <span>{metrics.alerts} alertas críticos</span>
                            </div>
                        </div>
                        <div className="crm-premium__metrics">
                            {highlightCards.map(card => (
                                <div key={card.title} className="crm-premium__metric-card">
                                    <p className="crm-premium__metric-label">{card.title}</p>
                                    <p className="crm-premium__metric-value">{card.value}</p>
                                    <p className="crm-premium__metric-description">{card.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="hero-sidecard crm-premium__sidecard">
                        <p className="hero-sidecard__eyebrow">Pulso do pipeline</p>
                        <h3 className="hero-sidecard__title">{Math.round(stageProgress)}% das etapas ativas</h3>
                        <p className="hero-sidecard__subtitle">
                            {metrics.activeStages} de {totalColumns} fases com movimento hoje.
                        </p>
                        <div className="crm-premium__progress">
                            <span style={{ width: `${stageProgress}%` }} />
                        </div>
                        <div className="hero-sidecard__grid">
                            {quickStats.map(stat => (
                                <div key={stat.label}>
                                    <span className="hero-sidecard__label">{stat.label}</span>
                                    <span className="hero-sidecard__value">{stat.value}</span>
                                </div>
                            ))}
                        </div>
                        <div className="crm-premium__note">
                            Última movimentação às {dayjs().subtract(32, 'minute').format('HH:mm')} · 3 cards adicionados hoje
                        </div>
                    </div>
                </div>
            </section>

            <Card className="crm-panel">
                <CardHeader className="crm-panel__header">
                    <div className="space-y-1">
                        <CardTitle className="crm-panel__title">Gestão de pipeline</CardTitle>
                        <CardDescription className="crm-panel__description">
                            Organize etapas, filtros e agrupamentos
                        </CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" size="sm" className="crm-chip-button">
                            <Filter className="mr-2 h-3.5 w-3.5" />
                            Filtros
                        </Button>
                        <Button variant="outline" size="sm" className="crm-chip-button">
                            <ArrowUpDown className="mr-2 h-3.5 w-3.5" />
                            Ordenar
                        </Button>
                        <Button variant="ghost" size="sm" className="crm-chip-button crm-chip-button--ghost">
                            <LayoutGrid className="mr-2 h-3.5 w-3.5" />
                            Agrupar
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="crm-panel__body">
                    <nav className="crm-tabs" aria-label="Tabs">
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn('crm-tab', activeTab === tab && 'is-active')}
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
                            'kanban-column',
                            draggedOverColumn === column && 'is-active'
                        )}
                        onDrop={(e) => handleDrop(e, column)}
                        onDragOver={handleDragOver}
                        onDragEnter={() => setDraggedOverColumn(column)} // SUGESTÃO 2
                        onDragLeave={() => setDraggedOverColumn(null)}  // SUGESTÃO 2
                    >
                        <header className="kanban-column__header">
                            <div className="kanban-column__title">
                                <span>{column}</span>
                                <p>Organize leads nesta etapa</p>
                            </div>
                            <span className="kanban-column__count">
                                {filteredCards.filter(c => c.column === column).length}
                            </span>
                        </header>
                        <div className="kanban-column__body">
                            <div className="kanban-column__cards">
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
