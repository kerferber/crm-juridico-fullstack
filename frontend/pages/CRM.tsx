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
        <div className="flex flex-col h-full">
            <h1 className="text-2xl font-bold mb-4">CRM / Pipeline de Processos</h1>
            
            <div className="border-b border-border dark:border-dark-border mb-4">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm',
                                activeTab === tab
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="flex-grow grid grid-cols-5 gap-6">
                {columns.map(column => (
                    <div 
                        key={column} 
                        className={cn(
                            "bg-gray-50 dark:bg-dark-border/20 rounded-lg p-4 flex flex-col transition-colors",
                            // SUGESTÃO 2: Efeito de highlight na coluna de destino
                            draggedOverColumn === column && "bg-primary/10 dark:bg-dark-primary/10"
                        )}
                        onDrop={(e) => handleDrop(e, column)}
                        onDragOver={handleDragOver}
                        onDragEnter={() => setDraggedOverColumn(column)} // SUGESTÃO 2
                        onDragLeave={() => setDraggedOverColumn(null)}  // SUGESTÃO 2
                    >
                        <h2 className="font-semibold mb-4">{column} ({filteredCards.filter(c => c.column === column).length})</h2>
                        <div className="flex-grow overflow-y-auto pr-2 -mr-2">
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