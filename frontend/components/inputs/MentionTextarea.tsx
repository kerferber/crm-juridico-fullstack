import React, { useEffect, useMemo, useRef, useState } from 'react';
import { User, Contact, MentionReference } from '../../types/types';
import { cn } from '../../lib/utils';

type TriggerType = '@' | '#';

interface MentionTextareaProps {
  label?: string;
  description?: string;
  placeholder?: string;
  value: string;
  onChange: (next: string) => void;
  onMentionsChange?: (mentions: MentionReference[]) => void;
  users: User[];
  contacts: Contact[];
  disabled?: boolean;
  minRows?: number;
  initialMentions?: MentionReference[];
}

interface MentionCandidate {
  id: number;
  label: string;
  subtitle?: string;
  kind: MentionReference['kind'];
}

const detectTrigger = (text: string, caretPosition: number) => {
  const slice = text.slice(0, caretPosition);
  const match = slice.match(/(?:^|\s)([@#])([A-Za-zÀ-ÖØ-öø-ÿ0-9_'-]*)$/);
  if (!match) return null;
  const trigger = match[1] as TriggerType;
  const query = match[2] ?? '';
  const start = caretPosition - query.length - 1;
  if (start > 0) {
    const boundary = text[start - 1];
    if (boundary && !/\s/.test(boundary)) {
      return null;
    }
  }
  return { trigger, query, start };
};

const MentionTextarea: React.FC<MentionTextareaProps> = ({
  label,
  description,
  placeholder,
  value,
  onChange,
  onMentionsChange,
  users,
  contacts,
  disabled,
  minRows = 3,
  initialMentions,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [activeTrigger, setActiveTrigger] = useState<TriggerType | null>(null);
  const [query, setQuery] = useState('');
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [mentions, setMentions] = useState<MentionReference[]>(initialMentions ?? []);
  const [caretPosition, setCaretPosition] = useState(0);

  useEffect(() => {
    const normalized = Array.isArray(initialMentions) ? initialMentions : [];
    setMentions(prev => {
      if (prev.length === normalized.length) {
        const unchanged = prev.every((item, index) => {
          const other = normalized[index];
          return (
            other &&
            item.id === other.id &&
            item.kind === other.kind &&
            item.label === other.label
          );
        });
        if (unchanged) {
          return prev;
        }
      }
      return normalized;
    });
  }, [JSON.stringify(initialMentions ?? [])]);

  useEffect(() => {
    onMentionsChange?.(mentions);
  }, [mentions, onMentionsChange]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [activeTrigger, query]);

  const suggestionCandidates = useMemo<MentionCandidate[]>(() => {
    if (!activeTrigger) return [];
    const lowerQuery = query.toLowerCase();
    if (activeTrigger === '@') {
      return users
        .filter(user => user.name.toLowerCase().includes(lowerQuery))
        .slice(0, 8)
        .map(user => ({
          id: user.id,
          label: user.name,
          subtitle: user.jobTitle || user.email,
          kind: 'user' as const,
        }));
    }
    return contacts
      .filter(contact => contact.name.toLowerCase().includes(lowerQuery))
      .slice(0, 8)
      .map(contact => ({
        id: contact.id,
        label: contact.name,
        subtitle: contact.status ?? contact.email,
        kind: 'contact' as const,
      }));
  }, [activeTrigger, contacts, query, users]);

  const syncMentionsWithValue = (nextValue: string) => {
    setMentions(prev =>
      prev.filter(mention => {
        const symbol = mention.kind === 'user' ? '@' : '#';
        const label = `${symbol}${mention.label}`;
        return nextValue.includes(label);
      })
    );
  };

  const closeSuggestions = () => {
    setActiveTrigger(null);
    setQuery('');
    setMentionStart(null);
  };

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = event.target.value;
    const nextCaret = event.target.selectionStart ?? nextValue.length;
    onChange(nextValue);
    setCaretPosition(nextCaret);
    syncMentionsWithValue(nextValue);

    const detection = detectTrigger(nextValue, nextCaret);
    if (!detection) {
      closeSuggestions();
      return;
    }
    setActiveTrigger(detection.trigger);
    setQuery(detection.query);
    setMentionStart(detection.start);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!activeTrigger || suggestionCandidates.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex(prev => (prev + 1) % suggestionCandidates.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex(prev =>
        prev === 0 ? suggestionCandidates.length - 1 : prev - 1
      );
    } else if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      const candidate = suggestionCandidates[highlightedIndex];
      if (candidate) {
        applyMention(candidate);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeSuggestions();
    }
  };

  const applyMention = (candidate: MentionCandidate) => {
    if (mentionStart === null || !textareaRef.current) return;
    const symbol = candidate.kind === 'user' ? '@' : '#';
    const mentionText = `${symbol}${candidate.label}`;

    const before = value.slice(0, mentionStart);
    const after = value.slice(caretPosition);
    const needsSpace = after.length === 0 || !/^\s/.test(after);
    const insertion = needsSpace ? `${mentionText} ` : mentionText;

    const nextValue = `${before}${insertion}${after}`;
    const nextCaret = before.length + insertion.length;

    onChange(nextValue);
    setCaretPosition(nextCaret);
    closeSuggestions();

    setMentions(prev => {
      const exists = prev.some(
        mention => mention.id === candidate.id && mention.kind === candidate.kind
      );
      if (exists) return prev;
      return [
        ...prev,
        { id: candidate.id, kind: candidate.kind, label: candidate.label },
      ];
    });

    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(nextCaret, nextCaret);
    });
  };

  const handleSuggestionClick = (candidate: MentionCandidate) => {
    applyMention(candidate);
  };

  const updateCaretFromDom = () => {
    if (!textareaRef.current) return;
    const position = textareaRef.current.selectionStart ?? value.length;
    setCaretPosition(position);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
      )}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onKeyUp={updateCaretFromDom}
          onClick={updateCaretFromDom}
          onBlur={closeSuggestions}
          placeholder={placeholder}
          disabled={disabled}
          rows={minRows}
          className={cn(
            'w-full resize-none rounded-lg border border-border/60 bg-white px-3 py-2 text-sm text-foreground shadow-sm transition focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/25 dark:border-dark-border/60 dark:bg-dark-card/70 dark:text-dark-foreground',
            disabled && 'cursor-not-allowed opacity-60'
          )}
        />
        {activeTrigger && suggestionCandidates.length > 0 && (
          <div className="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-xl border border-border/60 bg-white shadow-lg dark:border-dark-border/70 dark:bg-dark-card/90">
            <ul className="max-h-56 overflow-y-auto py-2 text-sm">
              {suggestionCandidates.map((candidate, index) => (
                <li key={`${candidate.kind}-${candidate.id}`}>
                  <button
                    type="button"
                    onMouseDown={event => event.preventDefault()}
                    onClick={() => handleSuggestionClick(candidate)}
                    className={cn(
                      'flex w-full items-center justify-between px-3 py-2 text-left transition',
                      index === highlightedIndex
                        ? 'bg-primary/10 text-primary dark:bg-dark-primary/20 dark:text-dark-primary'
                        : 'text-muted-foreground hover:bg-muted/40 dark:hover:bg-dark-border/40'
                    )}
                  >
                    <span className="flex flex-col">
                      <span className="font-medium text-foreground dark:text-dark-foreground">
                        {candidate.label}
                      </span>
                      {candidate.subtitle && (
                        <span className="text-[11px] text-muted-foreground">
                          {candidate.subtitle}
                        </span>
                      )}
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                      {candidate.kind === 'user' ? 'Equipe' : 'Contato'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );
};

export default MentionTextarea;
