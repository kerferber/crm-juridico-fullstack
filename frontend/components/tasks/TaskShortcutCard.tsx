import React from 'react';
import dayjs from 'dayjs';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { useTaskModal, TaskModalDefaults } from '../../hooks/useTaskModal';
import { ClipboardList, Sparkles } from 'lucide-react';

interface TaskShortcutCardProps {
  heading: string;
  description: string;
  defaults: TaskModalDefaults;
  ctaLabel?: string;
}

const TaskShortcutCard: React.FC<TaskShortcutCardProps> = ({
  heading,
  description,
  defaults,
  ctaLabel = 'Nova tarefa vinculada',
}) => {
  const { openForCreate } = useTaskModal();

  const handleOpen = () => {
    const today = dayjs();
    openForCreate({
      ...defaults,
      dueDate: defaults.dueDate ?? today.format('YYYY-MM-DD'),
      deadline: defaults.deadline ?? today.add(3, 'day').format('YYYY-MM-DD'),
      status: defaults.status,
    });
  };

  return (
    <Card className="border-dashed border-border/60 bg-white/70 shadow-none dark:border-dark-border/60 dark:bg-dark-card/60">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-primary/10 p-2 text-primary dark:bg-dark-primary/15 dark:text-dark-primary">
            <ClipboardList className="h-5 w-5" />
          </span>
          <div>
            <CardTitle className="text-base font-semibold text-foreground dark:text-dark-foreground">
              {heading}
            </CardTitle>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <Sparkles className="h-5 w-5 text-primary/60" />
      </CardHeader>
      <CardContent className="pt-0">
        <Button className="w-full" variant="secondary" onClick={handleOpen}>
          {ctaLabel}
        </Button>
      </CardContent>
    </Card>
  );
};

export default TaskShortcutCard;
