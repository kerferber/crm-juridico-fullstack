import React, { useState, useMemo, useCallback } from 'react';
import { useApp } from '../store/AppContext';
import dayjs, { Dayjs } from 'dayjs';
import { ChevronLeft, ChevronRight, Plus, Check, Briefcase, Users, Flag } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

// --- SUGESTÃO 3: CÓDIGOS DE COR POR TIPO DE EVENTO ---
// Como não podemos alterar outros arquivos, definimos os tipos e dados localmente.
type EventType = 'Audiência' | 'Reunião Interna' | 'Prazo' | 'Pessoal';

interface AgendaEvent {
  id: number;
  title: string;
  start: Dayjs;
  end: Dayjs;
  type: EventType;
}

const eventTypesConfig: Record<EventType, { color: string; icon: React.ElementType }> = {
    'Audiência': { color: '#EF4444', icon: Briefcase }, // red
    'Reunião Interna': { color: '#3B82F6', icon: Users }, // blue
    'Prazo': { color: '#F59E0B', icon: Flag }, // amber
    'Pessoal': { color: '#10B981', icon: Check }, // emerald
};

// Dados fictícios locais para popular a agenda de forma rica
const localEvents: AgendaEvent[] = [
    { id: 1, title: 'Audiência - Proc. 2025/002-TRAB', start: dayjs('2025-10-14T10:00:00'), end: dayjs('2025-10-14T11:30:00'), type: 'Audiência' },
    { id: 2, title: 'Reunião com Empresa Alpha', start: dayjs('2025-10-16T15:00:00'), end: dayjs('2025-10-16T16:00:00'), type: 'Reunião Interna' },
    { id: 3, title: 'Prazo: Petição Inicial 2025/001-CIV', start: dayjs('2025-10-25T09:00:00'), end: dayjs('2025-10-25T09:30:00'), type: 'Prazo' },
    { id: 4, title: 'Almoço com Ricardo Neves', start: dayjs('2025-10-14T12:30:00'), end: dayjs('2025-10-14T14:00:00'), type: 'Pessoal' },
    { id: 5, title: 'Reunião de alinhamento semanal', start: dayjs('2025-10-13T09:00:00'), end: dayjs('2025-10-13T10:00:00'), type: 'Reunião Interna' },
    { id: 6, title: 'Preparar recurso de apelação', start: dayjs('2025-10-20T14:00:00'), end: dayjs('2025-10-20T17:00:00'), type: 'Prazo' },
];


const Agenda: React.FC = () => {
    // Como não podemos alterar o AppContext, usamos um estado local para os eventos da agenda
    const [events, setEvents] = useState<AgendaEvent[]>(localEvents);
    const [currentDate, setCurrentDate] = useState(dayjs("2025-10-14"));
    // --- SUGESTÃO 1: VISUALIZAÇÕES DE SEMANA E DIA ---
    const [view, setView] = useState<'month' | 'week' | 'day'>('month');
    // --- SUGESTÃO 3: FILTROS ---
    const [activeFilters, setActiveFilters] = useState<Set<EventType>>(new Set(Object.keys(eventTypesConfig) as EventType[]));
    
    // --- LÓGICA PARA CRIAÇÃO POR ARRASTE ---
    const [draftEvent, setDraftEvent] = useState<AgendaEvent | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFilterToggle = (type: EventType) => {
        setActiveFilters(prev => {
            const newSet = new Set(prev);
            if (newSet.has(type)) {
                newSet.delete(type);
            } else {
                newSet.add(type);
            }
            return newSet;
        });
    };
    
    const filteredEvents = useMemo(() => events.filter(e => activeFilters.has(e.type)), [events, activeFilters]);

    const addEvent = (newEvent: Omit<AgendaEvent, 'id'>) => {
        setEvents(prev => [...prev, { ...newEvent, id: Date.now() }]);
    };
    
    const renderHeader = () => (
        <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold capitalize">{currentDate.format('MMMM YYYY')}</h1>
                <div className="flex items-center">
                    {/* FIX: Corrected the number of arguments for dayjs `subtract` and simplified the logic. */}
                    <Button variant="ghost" size="icon" onClick={() => setCurrentDate(d => d.subtract(1, view))} aria-label="Anterior">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button variant="outline" onClick={() => setCurrentDate(dayjs())}>Hoje</Button>
                    {/* FIX: Corrected the number of arguments for dayjs `add` and simplified the logic. */}
                    <Button variant="ghost" size="icon" onClick={() => setCurrentDate(d => d.add(1, view))} aria-label="Próximo">
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>
                 {/* --- SUGESTÃO 1: BOTÕES DE VISUALIZAÇÃO --- */}
                <div className="flex items-center space-x-1 bg-gray-100 dark:bg-dark-border/50 p-1 rounded-lg">
                    <Button variant={view === 'month' ? 'default' : 'ghost'} size="sm" onClick={() => setView('month')}>Mês</Button>
                    <Button variant={view === 'week' ? 'default' : 'ghost'} size="sm" onClick={() => setView('week')}>Semana</Button>
                    <Button variant={view === 'day' ? 'default' : 'ghost'} size="sm" onClick={() => setView('day')}>Dia</Button>
                </div>
            </div>
            <div className="flex items-center flex-wrap gap-2">
                {Object.entries(eventTypesConfig).map(([type, { color }]) => (
                    <Button key={type} onClick={() => handleFilterToggle(type as EventType)} variant={activeFilters.has(type as EventType) ? 'default' : 'outline'} size="sm" style={{'--tw-bg-opacity': 0.2, backgroundColor: activeFilters.has(type as EventType) ? color : 'transparent', borderColor: color, color: activeFilters.has(type as EventType) ? (dayjs().hour() > 18 ? 'white' : 'black') : color}}>
                        {type}
                    </Button>
                ))}
            </div>
        </div>
    );

    const renderMonthView = () => {
        const startOfMonth = currentDate.startOf('month');
        const endOfMonth = currentDate.endOf('month');
        const startDate = startOfMonth.startOf('week');
        const endDate = endOfMonth.endOf('week');

        const days = [];
        let day = startDate;
        while (day.isBefore(endDate, 'day') || day.isSame(endDate, 'day')) {
            days.push(day);
            day = day.add(1, 'day');
        }

        return (
            <Card className="flex-grow flex flex-col">
                <div className="grid grid-cols-7 border-b dark:border-dark-border">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(weekday => (
                        <div key={weekday} className="p-4 text-center text-sm font-medium text-muted-foreground border-r dark:border-dark-border last:border-r-0">{weekday}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 flex-grow" style={{ gridTemplateRows: `repeat(${Math.ceil(days.length / 7)}, minmax(120px, 1fr))` }}>
                    {days.map((day, i) => {
                        const dayEvents = filteredEvents.filter(e => e.start.isSame(day, 'day'));
                        return (
                            <div key={day.format('YYYY-MM-DD')} className={cn("p-2 border-r border-b dark:border-dark-border flex flex-col relative", !day.isSame(currentDate, 'month') && "bg-gray-50 dark:bg-dark-border/20 text-muted-foreground", (i + 1) % 7 === 0 && "border-r-0")}>
                                <span className={cn("self-end text-sm font-medium w-7 h-7 flex items-center justify-center", day.isSame(dayjs(), 'day') && "bg-primary text-primary-foreground rounded-full")}>{day.format('D')}</span>
                                <div className="mt-1 flex-grow overflow-y-auto space-y-1 text-[11px] leading-tight">
                                    {dayEvents.map(event => (
                                        <div key={event.id} className="p-1 rounded-md text-white truncate" style={{ backgroundColor: eventTypesConfig[event.type].color }} title={event.title}>{event.title}</div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>
        );
    };

    const renderTimeGridView = (days: Dayjs[]) => {
        const hours = Array.from({ length: 24 }, (_, i) => i);

        const getEventPosition = (event: AgendaEvent, day: Dayjs) => {
            const dayStart = day.startOf('day');
            const eventStart = event.start;
            const eventEnd = event.end;

            if (!eventStart.isSame(dayStart, 'day')) return null;

            const startMinutes = eventStart.diff(dayStart, 'minute');
            const durationMinutes = eventEnd.diff(eventStart, 'minute');

            const top = (startMinutes / (24 * 60)) * 100;
            const height = (durationMinutes / (24 * 60)) * 100;

            return { top: `${top}%`, height: `${height}%` };
        };
        
        const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, day: Dayjs) => {
            if ((e.target as HTMLElement).closest('.event-card')) return;
            setIsDragging(true);
            const rect = e.currentTarget.getBoundingClientRect();
            const startY = e.clientY - rect.top;
            const startHour = Math.floor((startY / rect.height) * 24 * 2) / 2; // 30-min increments
            const startTime = day.startOf('day').add(startHour, 'hour');
            setDraftEvent({ id: -1, title: 'Novo Evento', start: startTime, end: startTime.add(30, 'minute'), type: 'Reunião Interna' });
        };
        
        const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, day: Dayjs) => {
            if (!isDragging || !draftEvent) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const currentY = e.clientY - rect.top;
            const currentHour = Math.ceil((currentY / rect.height) * 24 * 2) / 2;
            let endTime = day.startOf('day').add(currentHour, 'hour');
            if (endTime.isBefore(draftEvent.start)) {
                endTime = draftEvent.start.add(30, 'minute');
            }
            setDraftEvent(prev => prev ? { ...prev, end: endTime } : null);
        };

        const handleMouseUp = () => {
            if (isDragging && draftEvent) {
                const title = prompt("Título do evento:", "Novo Evento");
                if (title) {
                    addEvent({ ...draftEvent, title });
                }
            }
            setIsDragging(false);
            setDraftEvent(null);
        };

        return (
             <Card className="flex-grow flex">
                <div className="w-16 text-center text-xs pt-8">
                    {hours.map(h => h > 0 && <div key={h} className="h-12 flex items-center justify-center text-muted-foreground">{h}:00</div>)}
                </div>
                <div className="flex-grow grid" style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
                    {days.map((day) => (
                        <div key={day.toString()} className="relative border-l dark:border-dark-border" onMouseDown={(e) => handleMouseDown(e, day)} onMouseMove={(e) => handleMouseMove(e, day)} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
                             {hours.map(h => <div key={h} className="h-12 border-t dark:border-dark-border"></div>)}
                             {[...(draftEvent ? [draftEvent] : []), ...filteredEvents].map(event => {
                                 const pos = getEventPosition(event, day);
                                 if (!pos) return null;
                                 const isDraft = 'id' in event && event.id === -1;
                                 return (
                                     <div key={event.id} className={cn("absolute w-[95%] left-px p-2 rounded-lg text-white event-card", isDraft ? "opacity-70 z-10" : "z-20")} style={{ ...pos, backgroundColor: eventTypesConfig[event.type].color }}>
                                         <p className="font-bold text-xs">{event.title}</p>
                                         <p className="text-[10px] opacity-80">{event.start.format('HH:mm')} - {event.end.format('HH:mm')}</p>
                                     </div>
                                 );
                             })}
                        </div>
                    ))}
                </div>
             </Card>
        );
    };

    const renderWeekView = () => {
        const startOfWeek = currentDate.startOf('week');
        const weekDays = Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'));
        return (
            <div className="flex flex-col flex-grow">
                <div className="grid grid-cols-7 border-b dark:border-dark-border ml-16">
                    {weekDays.map(day => (
                        <div key={day.toString()} className="p-2 text-center text-sm font-medium border-l dark:border-dark-border">
                            <p>{day.format('ddd')}</p>
                            <p className={cn("text-xl font-bold", day.isSame(dayjs(), 'day') && 'text-primary')}>{day.format('D')}</p>
                        </div>
                    ))}
                </div>
                {renderTimeGridView(weekDays)}
            </div>
        );
    };

    const renderDayView = () => {
        return (
            <div className="flex flex-col flex-grow">
                <div className="border-b dark:border-dark-border ml-16">
                    <div className="p-2 text-center text-sm font-medium border-l dark:border-dark-border">
                        <p>{currentDate.format('dddd')}</p>
                        <p className={cn("text-xl font-bold", currentDate.isSame(dayjs(), 'day') && 'text-primary')}>{currentDate.format('D')}</p>
                    </div>
                </div>
                {renderTimeGridView([currentDate])}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full space-y-6">
            {renderHeader()}
            {view === 'month' && renderMonthView()}
            {view === 'week' && renderWeekView()}
            {view === 'day' && renderDayView()}
        </div>
    );
};

export default Agenda;