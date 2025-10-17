import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Contact } from '../../types/types';
import { Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatDocument } from '../../lib/utils';

interface ContactSearchInputProps {
  label: string;
  contacts: Contact[];
  value: number | '';
  onSelect: (contactId: number | '') => void;
  placeholder?: string;
  helperText?: string;
  disabled?: boolean;
}

const MIN_QUERY_LENGTH = 2;

const ContactSearchInput: React.FC<ContactSearchInputProps> = ({
  label,
  contacts,
  value,
  onSelect,
  placeholder = 'Buscar contato por nome, e-mail ou documento...',
  helperText,
  disabled,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (value && contacts.length > 0) {
      const selected = contacts.find(contact => contact.id === value);
      if (selected) {
        setQuery(selected.name);
      }
    }
    if (!value) {
      setQuery('');
    }
  }, [value, contacts]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveIndex(0);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  const filteredContacts = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (term.length < MIN_QUERY_LENGTH) return [];
    return contacts
      .filter(contact => {
        const searchString =
          `${contact.name} ${contact.email ?? ''} ${contact.phone ?? ''} ${
            contact.document ?? ''
          }`.toLowerCase();
        return searchString.includes(term);
      })
      .slice(0, 7);
  }, [contacts, query]);

  const handleSelect = (contactId: number) => {
    const selected = contacts.find(contact => contact.id === contactId);
    if (selected) {
      setQuery(selected.name);
      setIsOpen(false);
      setActiveIndex(0);
      onSelect(contactId);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextQuery = event.target.value;
    setQuery(nextQuery);
    setIsOpen(true);
    setActiveIndex(0);
    if (!nextQuery || nextQuery.trim().length < MIN_QUERY_LENGTH) {
      onSelect('');
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || filteredContacts.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex(prev => (prev + 1) % filteredContacts.length);
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex(prev => (prev - 1 + filteredContacts.length) % filteredContacts.length);
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const selected = filteredContacts[activeIndex];
      if (selected) handleSelect(selected.id);
    }
    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const clearSelection = () => {
    setQuery('');
    setIsOpen(false);
    setActiveIndex(0);
    onSelect('');
    inputRef.current?.focus();
  };

  const shouldShowDropdown = isOpen && !disabled;

  return (
    <div className="flex flex-col gap-1 text-xs font-medium" ref={containerRef}>
      <span>{label}</span>
      <div className="relative">
        <div
          className={cn(
            'flex items-center gap-2 rounded-md border border-border/60 bg-white px-3 py-2 text-sm shadow-inner transition focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 dark:border-dark-border/60 dark:bg-dark-background/70',
            disabled && 'pointer-events-none opacity-60'
          )}
        >
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={handleInputChange}
            onFocus={() => {
              if (!disabled) {
                setIsOpen(true);
                setActiveIndex(0);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 border-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none dark:text-dark-foreground"
            disabled={disabled}
          />
          {query && !disabled && (
            <button
              type="button"
              className="rounded-full p-1 text-muted-foreground transition hover:bg-muted/20"
              onClick={clearSelection}
              aria-label="Limpar seleção"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {shouldShowDropdown && (
          <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-lg border border-border/60 bg-white shadow-lg dark:border-dark-border/60 dark:bg-dark-card/90">
            {query.trim().length < MIN_QUERY_LENGTH ? (
              <div className="px-4 py-3 text-xs text-muted-foreground">
                Digite pelo menos {MIN_QUERY_LENGTH} letras para pesquisar.
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="px-4 py-3 text-xs text-muted-foreground">
                Nenhum contato encontrado com “{query.trim()}”.
              </div>
            ) : (
              filteredContacts.map((contact, index) => (
                <button
                  key={contact.id}
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={event => event.preventDefault()}
                  onClick={() => handleSelect(contact.id)}
                  className={cn(
                    'flex w-full flex-col items-start gap-1 px-4 py-3 text-left text-sm transition',
                    index === activeIndex
                      ? 'bg-primary/10 text-primary dark:bg-dark-primary/15 dark:text-dark-primary'
                      : 'hover:bg-muted/20 dark:hover:bg-dark-border/40'
                  )}
                >
                  <span className="font-semibold text-foreground dark:text-dark-foreground">
                    {contact.name}
                  </span>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {contact.email && <span>{contact.email}</span>}
                    {contact.phone && (
                      <span className="rounded-full bg-muted/20 px-2 py-0.5">{contact.phone}</span>
                    )}
                    {contact.document && (
                      <span className="rounded-full bg-muted/20 px-2 py-0.5">
                        {formatDocument(contact.document)}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
      {helperText && <span className="text-[11px] font-normal text-muted-foreground">{helperText}</span>}
    </div>
  );
};

export default ContactSearchInput;
