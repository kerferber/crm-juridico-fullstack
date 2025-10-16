import React from 'react';
import { TimelineEvent } from '../../types/types';
import { formatDate } from '../../lib/utils';
import { cn } from '../../lib/utils';

interface TimelineProps {
  events: TimelineEvent[];
}

const Timeline: React.FC<TimelineProps> = ({ events }) => {
  return (
    <div className="relative">
      <div className="absolute left-4 top-0 h-full w-0.5 bg-border dark:bg-dark-border" aria-hidden="true"></div>
      <ul className="space-y-8">
        {events.map((event, index) => (
          <li key={index} className="relative flex items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-4 z-10" style={{ backgroundColor: `${event.color}20` }}>
              <event.icon className="h-5 w-5" style={{ color: event.color }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{event.title}</p>
                <time className="text-sm text-muted-foreground">{formatDate(event.date)}</time>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Timeline;