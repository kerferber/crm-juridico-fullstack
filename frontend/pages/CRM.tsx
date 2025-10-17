import React, { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useApp } from '../store/AppContext';
import { KanbanCard as KanbanCardType, KanbanColumn, KanbanPhase } from '../types/types';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Plus, Paperclip, MessageSquare, Bell, MoreHorizontal, Briefcase, CalendarDays } from 'lucide-react';
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
        "group mb-4 cursor-grab overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-white/90 via-white to-indigo-50/25 shadow-sm transition-all duration-300 ease-out active:cursor-grabbing dark:border-dark-border/60 dark:from-dark-card/95 dark:via-dark-card/90 dark:to-indigo-500/10",
        card.isDelayed && "border-red-300/70 shadow-[0_14px_28px_-18px_rgba(239,68,68,0.8)] dark:border-red-400/60",
        isDragging && "rotate-1 scale-[0.99] shadow-xl",
      )}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
    >
      <CardHeader className="space-y-3 p-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-sm font-semibold leading-tight text-foreground transition-colors group-hover:text-primary dark:text-dark-foreground">
              {card.title}
            </p>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide shadow-sm transition-colors",
                areaStyles[card.area]
              )}
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
      <CardContent className="flex flex-col gap-3 border-t border-border/40 bg-white/70 p-4 pt-3 dark:border-dark-border/40 dark:bg-dark-card/50">
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
              <span className="rounded-full bg-primary/10 px-2 py-1 text-primary dark:bg-dark-primary/20 dark:text-dark-primary">
                {card.phase}
              </span>
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
            className="w-full mt-2"
            onClick={() => openForCreate({ column, phase })}
        >
            <Plus size={14} className="mr-2" /> Adicionar card
        </Button>
    );
};


const CRM: React.FC = () => {
    const { kanbanCards, updateKanbanCardColumn } = useApp();
    const { openForEdit } = useKanbanCardModal();
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
    
    return (
        <div className="flex h-full flex-col">
            <div className="mb-6">
                <h1 className="text-[22px] font-semibold tracking-tight text-foreground dark:text-dark-foreground">
                    CRM · Pipeline de Processos
                </h1>
                <p className="text-sm text-muted-foreground">
                    Acompanhe o fluxo dos casos e distribua responsabilidades com fluidez.
                </p>
            </div>
            
            <div className="mb-6 border-b border-border/60 pb-1 dark:border-dark-border/70">
                <nav className="-mb-px flex space-x-6 text-sm font-medium text-muted-foreground" aria-label="Tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                'relative whitespace-nowrap pb-3 transition',
                                activeTab === tab
                                    ? 'text-primary after:absolute after:bottom-0 after:left-0 after:h-[3px] after:w-full after:rounded-full after:bg-gradient-to-r after:from-primary after:to-indigo-500'
                                    : 'after:absolute after:bottom-0 after:left-0 after:h-[3px] after:w-full after:scale-x-0 after:rounded-full after:bg-primary/40 after:transition-transform hover:text-foreground hover:after:scale-x-100'
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="grid flex-1 grid-cols-5 gap-5">
                {columns.map(column => (
                    <div 
                        key={column} 
                        className={cn(
                            'flex flex-col rounded-xl border border-border/50 bg-white p-4 shadow-sm transition-colors dark:border-dark-border/60 dark:bg-dark-card/80',
                            // SUGESTÃO 2: Efeito de highlight na coluna de destino
                            draggedOverColumn === column &&
                                'border-primary/60 bg-primary/5 shadow-none dark:border-dark-primary/60 dark:bg-dark-primary/10'
                        )}
                        onDrop={(e) => handleDrop(e, column)}
                        onDragOver={handleDragOver}
                        onDragEnter={() => setDraggedOverColumn(column)} // SUGESTÃO 2
                        onDragLeave={() => setDraggedOverColumn(null)}  // SUGESTÃO 2
                    >
                        <h2 className="mb-4 flex items-center justify-between text-sm font-semibold text-muted-foreground">
                            <span className="uppercase tracking-[0.18em] text-xs text-muted-foreground/80">
                                {column}
                            </span>
                            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary dark:bg-dark-primary/15">
                                {filteredCards.filter(c => c.column === column).length}
                            </span>
                        </h2>
                        <div className="relative -mr-2 flex-grow overflow-y-auto pr-2">
                            {filteredCards.filter(c => c.column === column).map(card => (
                                <DraggableKanbanCard key={card.id} card={card} onOpen={openForEdit} />
                            ))}
                        </div>
                        <QuickAddCardForm column={column} phase={activeTab} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CRM;
