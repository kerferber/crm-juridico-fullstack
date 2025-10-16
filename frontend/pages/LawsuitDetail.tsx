import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Briefcase, User, Calendar, Flag, ArrowLeft, FileText, Check, AlertTriangle, PlayCircle, Scale, Plus } from 'lucide-react';
import Timeline from '../components/lawsuits/Timeline';
import { formatDate } from '../lib/utils';
import { TaskStatus, TimelineEvent } from '../types/types';
import dayjs from 'dayjs';
import { Button } from '../components/ui/Button';

// FIX: Destructured 'lawsuitId' from props to make it available within the component scope.
const QuickAddTask: React.FC<{ lawsuitId: number }> = ({ lawsuitId }) => {
    const { addTask, users } = useApp();
    const currentUser = users[0];
    const [title, setTitle] = useState('');

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim()) {
            addTask({
                title: title.trim(),
                lawsuitId,
                dueDate: dayjs().toISOString(),
                deadline: dayjs().add(7, 'day').toISOString(),
                responsibleId: currentUser.id,
                score: 20, // Default score
            });
            setTitle('');
        }
    };

    return (
        <Card>
            <CardHeader><CardTitle>Adicionar Tarefa Rápida</CardTitle></CardHeader>
            <CardContent>
                <form onSubmit={handleAddTask} className="flex space-x-2">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Descreva a nova tarefa..."
                        className="flex-grow p-2 text-sm bg-background dark:bg-dark-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <Button type="submit"><Plus className="h-4 w-4 mr-2"/> Criar</Button>
                </form>
            </CardContent>
        </Card>
    );
};


const LawsuitDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { lawsuits, contacts, users, tasks } = useApp();
  
  const lawsuitId = parseInt(id || '0');
  const lawsuit = lawsuits.find(l => l.id === lawsuitId);

  if (!lawsuit) {
    return <div>Processo não encontrado.</div>;
  }
  
  const client = contacts.find(c => c.id === lawsuit.clientId);
  const responsible = users.find(u => u.id === lawsuit.responsibleId);
  const lawsuitTasks = tasks.filter(t => t.lawsuitId === lawsuit.id);

  // Build timeline events
  const timelineEvents: TimelineEvent[] = [
    {
      date: dayjs().subtract(45, 'day').toISOString(), // Fictional creation date
      icon: PlayCircle,
      title: 'Início do Processo',
      description: `Processo ${lawsuit.internalNumber} foi criado.`,
      color: '#2563EB',
    },
    ...lawsuitTasks.map(task => {
        let icon = FileText;
        let color = '#64748B';
        if (task.status === TaskStatus.Concluida) { icon = Check; color = '#10B981'; }
        if (task.status === TaskStatus.Atrasada) { icon = AlertTriangle; color = '#EF4444'; }
        return {
            date: task.dueDate,
            icon,
            title: task.title,
            description: `Responsável: ${users.find(u => u.id === task.responsibleId)?.name || 'N/A'}`,
            color,
        }
    }),
    {
      date: lawsuit.deadline,
      icon: Flag,
      title: 'Prazo Fatal do Processo',
      description: 'Data limite para as ações principais do processo.',
      color: '#EF4444'
    }
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());


  return (
    <div className="space-y-6">
       <Link to="/processos" className="flex items-center text-sm text-primary hover:underline mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar para todos os processos
      </Link>

      <div className="flex items-center space-x-4">
        <div className="bg-primary/10 p-3 rounded-full">
            <Briefcase className="h-8 w-8 text-primary" />
        </div>
        <div>
            <h1 className="text-[22px] font-semibold">{lawsuit.internalNumber}</h1>
            <p className="text-muted-foreground">{lawsuit.area} - {lawsuit.status}</p>
        </div>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
          <Card>
              <CardHeader><CardTitle className="flex items-center"><User className="h-4 w-4 mr-2" /> Cliente</CardTitle></CardHeader>
              <CardContent><Link to={`/contatos/${client?.id}`} className="font-semibold text-primary hover:underline">{client?.name || 'N/A'}</Link></CardContent>
          </Card>
          <Card>
              <CardHeader><CardTitle className="flex items-center"><Scale className="h-4 w-4 mr-2" /> Responsável</CardTitle></CardHeader>
              <CardContent className="font-semibold">{responsible?.name || 'N/A'}</CardContent>
          </Card>
          <Card>
              <CardHeader><CardTitle className="flex items-center"><Calendar className="h-4 w-4 mr-2" /> Prazo Fatal</CardTitle></CardHeader>
              <CardContent className="font-semibold text-red-600">{formatDate(lawsuit.deadline)}</CardContent>
          </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
                <CardHeader><CardTitle>Linha do Tempo do Processo</CardTitle></CardHeader>
                <CardContent>
                    <Timeline events={timelineEvents} />
                </CardContent>
            </Card>
          </div>
          <div>
            <QuickAddTask lawsuitId={lawsuitId} />
          </div>
      </div>
    </div>
  );
};

export default LawsuitDetail;
