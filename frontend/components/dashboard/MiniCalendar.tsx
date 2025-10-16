import React, { useState } from 'react';
import dayjs from 'dayjs';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useApp } from '../../store/AppContext';
import { Link } from 'react-router-dom';

export const MiniCalendar: React.FC = () => {
    const { calendarEvents } = useApp();
    const [currentDate, setCurrentDate] = useState(dayjs("2025-10-14")); // Pinned to screenshot date for consistency

    const startOfMonth = currentDate.startOf('month');
    const daysInMonth = currentDate.daysInMonth();
    
    // Create an array of all days to display in the grid
    const firstDayOfMonth = startOfMonth.day(); // 0 (Sun) to 6 (Sat)
    const days = Array.from({ length: daysInMonth + firstDayOfMonth }, (_, i) => {
        if (i < firstDayOfMonth) return null; // Empty cells before the 1st
        return startOfMonth.date(i - firstDayOfMonth + 1);
    });
    
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    const eventsByDay = calendarEvents.reduce((acc, event) => {
        const day = dayjs(event.start).format('YYYY-MM-DD');
        if (!acc[day]) acc[day] = 0;
        acc[day]++;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                 <h3 className="font-semibold capitalize text-lg flex items-center">
                    {currentDate.format('MMMM YYYY')}
                    <span className="ml-2 text-xs bg-red-500 text-white rounded-full h-4 w-4 flex items-center justify-center">
                        {Object.keys(eventsByDay).filter(d => dayjs(d).isSame(currentDate, 'month')).length}
                    </span>
                 </h3>
                <div className="flex items-center">
                    <button onClick={() => setCurrentDate(d => d.subtract(1, 'month'))} className="rounded-full p-1 hover:bg-white/70 dark:hover:bg-dark-border/60" aria-label="Mês anterior"> <ChevronLeft size={20} /> </button>
                    <button onClick={() => setCurrentDate(d => d.add(1, 'month'))} className="rounded-full p-1 hover:bg-white/70 dark:hover:bg-dark-border/60" aria-label="Próximo mês"> <ChevronRight size={20} /> </button>
                </div>
            </div>
            <div className="grid grid-cols-7 text-center text-sm">
                {weekdays.map(day => <div key={day} className="text-muted-foreground font-medium pb-2">{day}</div>)}
                {days.map((day, i) => {
                    if (!day) return <div key={`empty-${i}`}></div>;

                    const isToday = day.isSame(dayjs("2025-10-14"), 'day');
                    const dayEventCount = eventsByDay[day.format('YYYY-MM-DD')] || 0;

                    return (
                        <div key={day.format('YYYY-MM-DD')} className="relative py-1 flex justify-center items-center">
                            <button className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-sm",
                                isToday && "bg-foreground text-background dark:bg-dark-foreground dark:text-dark-background font-bold",
                                !isToday && "hover:bg-white/70 dark:hover:bg-dark-border/60"
                            )}>
                                {day.format('D')}
                            </button>
                            {dayEventCount > 0 && (
                                <div className="absolute top-1 right-1 text-xs bg-red-500 text-white rounded-full h-4 w-4 flex items-center justify-center text-white font-semibold">
                                  {dayEventCount}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
            <Link to="/agenda" className="text-primary dark:text-dark-primary text-sm mt-auto pt-4 block text-center hover:underline">
                Mostrar agenda completa &gt;
            </Link>
        </div>
    )
}
