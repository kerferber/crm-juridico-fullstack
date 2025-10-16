import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { useApp } from '../../store/AppContext';
import { formatDate } from '../../lib/utils';
import { Flag, Coffee } from 'lucide-react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';

export const UpcomingDeadlinesCard: React.FC = () => {
    const { lawsuits, contacts } = useApp();

    const upcomingDeadlines = lawsuits
        .filter(l => l.status === 'Ativo' && dayjs(l.deadline).isAfter(dayjs()))
        .sort((a, b) => dayjs(a.deadline).diff(dayjs(b.deadline)))
        .slice(0, 5);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <Flag className="mr-2 h-5 w-5 text-red-500" />
                    Próximos Prazos Fatais
                </CardTitle>
                <CardDescription>Prazos de processos que se aproximam.</CardDescription>
            </CardHeader>
            <CardContent>
                {upcomingDeadlines.length > 0 ? (
                    <ul className="space-y-3">
                        {upcomingDeadlines.map(lawsuit => {
                            const client = contacts.find(c => c.id === lawsuit.clientId);
                            return (
                                <li key={lawsuit.id} className="flex justify-between items-center">
                                    <div>
                                        <Link to={`/processos/${lawsuit.id}`} className="font-medium hover:underline">{lawsuit.internalNumber}</Link>
                                        <p className="text-xs text-muted-foreground">{client?.name}</p>
                                    </div>
                                    <span className="text-sm font-semibold text-red-600">{formatDate(lawsuit.deadline)}</span>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <div className="text-center text-muted-foreground py-4 flex flex-col items-center justify-center">
                        <Coffee className="h-8 w-8 mb-2 text-secondary" />
                        <p className="font-semibold">Nenhum prazo urgente!</p>
                        <p className="text-xs">Aproveite para planejar a semana.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};