import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Briefcase, User, Calendar, Flag, ArrowLeft, FileText, Check, AlertTriangle, PlayCircle, Scale } from 'lucide-react';
import Timeline from '../components/lawsuits/Timeline';
import { formatDate } from '../lib/utils';
import { TaskStatus, TimelineEvent } from '../types/types';
import dayjs from 'dayjs';
import TaskShortcutCard from '../components/tasks/TaskShortcutCard';

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

  const timelineEvents: TimelineEvent[] = [
    {
      date: dayjs().subtract(45, 'day').toISOString(),
      icon: PlayCircle,
      title: 'Início do Processo',
      description: `Processo ${lawsuit.internalNumber} foi criado.`,
      color: '#2563EB',
    },
    ...lawsuitTasks.map(task => {
      let icon = FileText;
      let color = '#64748B';
      if (task.status === TaskStatus.Concluida) {
        icon = Check;
        color = '#10B981';
      }
      if (task.status === TaskStatus.Atrasada) {
        icon = AlertTriangle;
        color = '#EF4444';
      }
      return {
        date: task.dueDate,
        icon,
        title: task.title,
        description: `Responsável: ${users.find(u => u.id === task.responsibleId)?.name || 'N/A'}`,
        color,
      } satisfies TimelineEvent;
    }),
    {
      date: lawsuit.deadline,
      icon: Flag,
      title: 'Prazo Fatal do Processo',
      description: 'Data limite para as ações principais do processo.',
      color: '#EF4444',
    },
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6">
      <Link to="/processos" className="mb-4 flex items-center text-sm text-primary hover:underline">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para todos os processos
      </Link>

      <div className="flex items-center space-x-4">
        <div className="rounded-full bg-primary/10 p-3">
          <Briefcase className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-[22px] font-semibold">{lawsuit.internalNumber}</h1>
          <p className="text-muted-foreground">
            {lawsuit.area} · {lawsuit.status}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-4 w-4" /> Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {client ? (
              <Link to={`/contatos/${client.id}`} className="font-semibold text-primary hover:underline">
                {client.name}
              </Link>
            ) : (
              <span className="text-sm text-muted-foreground">Sem cliente vinculado.</span>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Scale className="mr-2 h-4 w-4" /> Responsável
            </CardTitle>
          </CardHeader>
          <CardContent className="font-semibold">
            {responsible?.name || 'N/A'}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-4 w-4" /> Prazo fatal
            </CardTitle>
          </CardHeader>
          <CardContent className="font-semibold text-rose-500">
            {formatDate(lawsuit.deadline)}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Linha do tempo do processo</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline events={timelineEvents} />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <TaskShortcutCard
            heading="Agendar nova tarefa"
            description="Dispare tarefas relacionadas a este processo e mantenha o time alinhado."
            defaults={{
              lawsuitId: lawsuit.id,
              clientId: lawsuit.clientId,
              responsibleId: lawsuit.responsibleId ?? users[0]?.id,
            }}
            ctaLabel="Nova tarefa do processo"
          />
        </div>
      </div>
    </div>
  );
};

export default LawsuitDetail;
