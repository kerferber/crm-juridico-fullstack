import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { KanbanCard as KanbanCardType, KanbanColumn, KanbanPhase, User } from '../types/types';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Plus, Paperclip, MessageSquare, Bell, MoreHorizontal, Briefcase } from 'lucide-react';
import { cn } from '../lib/utils';

interface DraggableKanbanCardProps {
  card: KanbanCardType;
  users: User[];
}

const DraggableKanbanCard: React.FC<DraggableKanbanCardProps> = ({ card, users }) => {
  const responsible = users.find(u => u.id === card.responsibleId);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("cardId", card.id);
    setIsDragging(true);
  };
  
  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <Card 
      className={cn(
        "mb-4 cursor-grab active:cursor-grabbing transition-all duration-300 ease-in-out",
        // SUGESTÃO 1: Borda pulsante para cards atrasados
        card.isDelayed && "border-red-500 border-2 animate-pulse",
        // SUGESTÃO 2: Efeito no card ao ser arrastado
        isDragging && "opacity-50 shadow-2xl rotate-3"
      )}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
            <span className="text-sm font-semibold">{card.title}</span>
            <button className="text-muted-foreground"><MoreHorizontal size={16} /></button>
        </div>
        <div className={cn("text-xs px-2 py-0.5 rounded-full w-fit", 
            card.area === 'Cível' ? 'bg-blue-100 text-blue-800' : 
            card.area === 'Trabalhista' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
        )}>
            <div className="flex items-center gap-1">
              <Briefcase size={12}/> {card.area}
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex justify-between items-center">
        <div className="flex items-center space-x-2 text-muted-foreground">
          {card.hasAttachments && <Paperclip size={14} />}
          {card.commentsCount > 0 && <div className="flex items-center"><MessageSquare size={14} /><span className="text-xs ml-1">{card.commentsCount}</span></div>}
          {card.hasReminder && <Bell size={14} />}
          {/* O ponto vermelho original foi mantido, a borda pulsante é um adicional */}
          {card.isDelayed && <div className="w-2 h-2 bg-red-500 rounded-full" title="Atrasado"></div>}
        </div>
        {responsible && <img src={responsible.avatar} alt={responsible.name} className="h-6 w-6 rounded-full" title={responsible.name} />}
      </CardContent>
    </Card>
  );
};

interface QuickAddCardFormProps {
    column: KanbanColumn;
    phase: KanbanPhase;
    onAdd: (cardData: Omit<KanbanCardType, 'id'>) => void;
}

const QuickAddCardForm: React.FC<QuickAddCardFormProps> = ({ column, phase, onAdd }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [title, setTitle] = useState('');

    const handleSave = () => {
        if (title.trim()) {
            onAdd({
                title: title.trim(),
                column,
                phase,
                area: 'Não definido',
                responsibleId: 1, // Default to current user
                hasAttachments: false,
                commentsCount: 0,
                hasReminder: false,
                isDelayed: false,
            });
            setTitle('');
            setIsAdding(false);
        }
    };

    if (!isAdding) {
        return (
            <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => setIsAdding(true)}>
                <Plus size={14} className="mr-2" /> Adicionar Card
            </Button>
        );
    }

    return (
        <div className="mt-2">
            <textarea
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Digite o título do card..."
                className="w-full p-2 text-sm border rounded-md bg-background dark:bg-dark-background focus:ring-ring focus:outline-none"
                rows={3}
            />
            <div className="flex items-center space-x-2 mt-2">
                <Button size="sm" onClick={handleSave}>Salvar</Button>
                <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>Cancelar</Button>
            </div>
        </div>
    );
};


const CRM: React.FC = () => {
    const { kanbanCards, users, updateKanbanCardColumn, addKanbanCard } = useApp();
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
                                <DraggableKanbanCard key={card.id} card={card} users={users} />
                            ))}
                        </div>
                        <QuickAddCardForm column={column} phase={activeTab} onAdd={addKanbanCard} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CRM;
