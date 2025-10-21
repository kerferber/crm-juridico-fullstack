import React from 'react';
import { Link } from 'react-router-dom';
import { Contact, MentionReference, User } from '../../types/types';
import { User as UserIcon, Users } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MentionBadgesProps {
  mentions?: MentionReference[];
  users: User[];
  contacts: Contact[];
  className?: string;
}

const MentionBadges: React.FC<MentionBadgesProps> = ({ mentions, users, contacts, className }) => {
  if (!mentions || mentions.length === 0) {
    return null;
  }

  const userMap = new Map<number, User>();
  users.forEach(user => userMap.set(user.id, user));

  const contactMap = new Map<number, Contact>();
  contacts.forEach(contact => contactMap.set(contact.id, contact));

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {mentions.map(mention => {
        if (mention.kind === 'contact') {
          const contact = contactMap.get(mention.id);
          if (!contact) return null;
          return (
            <Link
              key={`contact-${mention.id}`}
              to={`/contatos/${mention.id}`}
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary/10 dark:border-dark-primary/40 dark:bg-dark-primary/15 dark:text-dark-primary"
            >
              <Users className="h-3.5 w-3.5" />
              {mention.label}
            </Link>
          );
        }

        const user = userMap.get(mention.id);
        return (
          <span
            key={`user-${mention.id}`}
            className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-white px-3 py-1 text-xs font-semibold text-foreground shadow-sm dark:border-dark-border/60 dark:bg-dark-card/70 dark:text-dark-foreground"
          >
            <UserIcon className="h-3.5 w-3.5 text-primary dark:text-dark-primary" />
            {mention.label}
          </span>
        );
      })}
    </div>
  );
};

export default MentionBadges;
