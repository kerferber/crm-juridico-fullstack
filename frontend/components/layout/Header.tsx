import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Sun, Moon, Plus, Menu, LogOut, User as UserIcon, Settings as SettingsIcon, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../ui/Button';
import NotificationBell from '../notifications/NotificationBell';
import { useCommandPalette } from '../../hooks/useCommandPalette';
import { useApp } from '../../store/AppContext';
import { useAuth } from '../../store/AuthContext';
import { Contact } from '../../types/types';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { theme, setTheme } = useTheme();
  const { setIsOpen } = useCommandPalette();
  const { users, contacts } = useApp();
  const { user: authUser, tenant, logout } = useAuth();
  const currentUser = authUser ?? users[0];
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current && menuRef.current.contains(event.target as Node)) {
        return;
      }
      if (searchRef.current && searchRef.current.contains(event.target as Node)) {
        return;
      }
      setIsMenuOpen(false);
      setIsSearchFocused(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (normalizedQuery.length < 2) {
      return [] as Contact[];
    }
    const filtered = contacts.filter(contact =>
      contact.name.toLowerCase().includes(normalizedQuery)
    );
    return filtered.slice(0, 8);
  }, [contacts, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [results.length, query]);

  const closeMenu = () => setIsMenuOpen(false);

  const handleNavigate = (path: string) => {
    navigate(path);
    closeMenu();
  };

  const handleLogout = () => {
    closeMenu();
    logout().catch(err => console.error(err));
  };

  const resetSearch = () => {
    setQuery('');
    setIsSearchFocused(false);
    setActiveIndex(0);
    searchInputRef.current?.blur();
  };

  const handleSelectContact = (contact: Contact) => {
    navigate(`/contatos/${contact.id}`);
    resetSearch();
  };

  const highlightMatch = (name: string) => {
    const normalizedQuery = query.trim().toLowerCase();
    if (normalizedQuery.length < 2) {
      return name;
    }
    const index = name.toLowerCase().indexOf(normalizedQuery);
    if (index === -1) {
      return name;
    }
    const before = name.slice(0, index);
    const match = name.slice(index, index + normalizedQuery.length);
    const after = name.slice(index + normalizedQuery.length);
    return (
      <>
        {before}
        <span className="text-primary">{match}</span>
        {after}
      </>
    );
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (results.length === 0) return;
      setActiveIndex(prev => (prev + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (results.length === 0) return;
      setActiveIndex(prev => (prev - 1 + results.length) % results.length);
    } else if (event.key === 'Enter') {
      if (results.length === 0) return;
      event.preventDefault();
      handleSelectContact(results[Math.max(0, activeIndex)]);
    } else if (event.key === 'Escape') {
      resetSearch();
      searchInputRef.current?.blur();
    }
  };

  const showResults = isSearchFocused && query.trim().length >= 2;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-surface/95 backdrop-blur-lg transition dark:border-dark-border/60 dark:bg-dark-surface/90">
      <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between gap-3 px-5 py-2 lg:px-7">
        <div className="flex flex-1 items-center" ref={searchRef}>
          <button
            onClick={onToggleSidebar}
            className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-muted-foreground transition hover:border-primary/40 hover:text-primary dark:border-dark-border/60 dark:bg-dark-background/70 dark:text-dark-muted md:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="h-4 w-4" />
          </button>
          {tenant && (
            <span className="mr-3 hidden items-center gap-2 rounded-lg border border-primary/40 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary dark:border-dark-primary/40 dark:bg-dark-primary/10 dark:text-dark-primary md:inline-flex">
              {tenant.slug}
            </span>
          )}
          <div className="relative flex w-full max-w-xl flex-col">
            <div className="group flex items-center gap-3 rounded-lg border border-slate-200 bg-surface px-3 py-2 text-[13px] text-muted-foreground shadow-sm transition hover:border-primary/50 hover:text-primary dark:border-dark-border/60 dark:bg-dark-surface dark:text-dark-muted">
              <Search className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
              <input
                ref={searchInputRef}
                value={query}
                onChange={event => setQuery(event.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Buscar clientes por nome..."
                className="flex-1 border-none bg-transparent text-[13px] font-medium text-foreground placeholder:text-muted-foreground focus:outline-none dark:text-dark-foreground"
              />
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="hidden items-center gap-1 rounded-md border border-slate-200 bg-surface px-2 py-1 text-[11px] font-medium text-muted-foreground transition hover:border-primary/40 hover:text-primary dark:border-dark-border/60 dark:bg-dark-surface dark:text-dark-muted md:inline-flex"
              >
                ⌘ K
              </button>
            </div>
            {showResults && (
              <div className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-lg border border-slate-200 bg-surface shadow-xl dark:border-dark-border/60 dark:bg-dark-surface">
                <div className="border-b border-slate-200 px-3 py-2 text-xs font-semibold text-muted-foreground dark:border-dark-border/60">
                  Clientes
                </div>
                <div className="max-h-64 overflow-y-auto py-1">
                  {results.length > 0 ? (
                    results.map((contact, index) => (
                      <button
                        key={contact.id}
                        type="button"
                        onMouseDown={event => event.preventDefault()}
                        onClick={() => handleSelectContact(contact)}
                        className={`flex w-full flex-col items-start gap-1 px-3 py-2 text-left text-sm transition ${
                          index === activeIndex
                            ? 'bg-primary/10 text-foreground dark:bg-dark-primary/15 dark:text-dark-foreground'
                            : 'hover:bg-surface-muted dark:hover:bg-dark-surface-muted'
                        }`}
                        onMouseEnter={() => setActiveIndex(index)}
                      >
                        <span className="font-semibold text-foreground dark:text-dark-foreground">
                          {highlightMatch(contact.name)}
                        </span>
                        <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground/80">
                          {contact.status || 'Cliente'}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-sm text-muted-foreground">
                      {query.trim().length < 2
                        ? 'Digite pelo menos 2 letras para iniciar a busca.'
                        : 'Nenhum cliente encontrado.'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="inline-flex rounded-md bg-primary px-3 text-[12px] font-semibold text-white shadow-sm transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-primary/40"
            onClick={() => setIsOpen(true)}
          >
            <Plus className="mr-2 h-3 w-3" />
            Criar
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-md border border-slate-200 bg-surface text-muted-foreground hover:border-primary/50 hover:bg-primary/10 hover:text-primary dark:border-dark-border/60 dark:bg-dark-surface dark:hover:bg-dark-primary/15 dark:hover:text-dark-primary"
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            <span className="sr-only">Alternar tema</span>
          </Button>
          <NotificationBell />
          <div className="relative" ref={menuRef}>
            {currentUser ? (
              <button
                type="button"
                onClick={() => setIsMenuOpen(prev => !prev)}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-surface px-2.5 py-1.5 shadow-sm transition hover:border-primary/40 hover:bg-surface-muted dark:border-dark-border/60 dark:bg-dark-surface dark:hover:border-dark-primary/40 dark:hover:bg-dark-surface-muted"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="h-8 w-8 rounded-lg object-cover"
                />
                <div className="hidden text-left text-[11px] leading-tight md:block">
                  <p className="font-semibold text-foreground dark:text-dark-foreground">
                    {currentUser.name}
                  </p>
                  {currentUser.jobTitle ? (
                    <span className="text-xs font-medium text-muted-foreground">{currentUser.jobTitle}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">{currentUser.email}</span>
                  )}
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition md:block" />
              </button>
            ) : (
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted/50" />
            )}

            {isMenuOpen && (
              <div className="absolute right-0 mt-3 w-56 overflow-hidden rounded-lg border border-slate-200 bg-surface shadow-lg dark:border-dark-border/70 dark:bg-dark-surface">
                <div className="border-b border-slate-200 px-4 py-3 text-xs text-muted-foreground dark:border-dark-border/60">
                  <p className="font-semibold text-foreground dark:text-dark-foreground">
                    {currentUser?.name}
                  </p>
                  <span>{currentUser?.email}</span>
                  {tenant && (
                    <span className="mt-2 inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-primary dark:bg-dark-primary/15 dark:text-dark-primary">
                      {tenant.name}
                    </span>
                  )}
                </div>
                <div className="p-1">
                  <button
                    type="button"
                    onClick={() => handleNavigate('/perfil')}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-surface-muted hover:text-foreground dark:hover:bg-dark-surface-muted dark:hover:text-dark-foreground"
                  >
                    <UserIcon className="h-4 w-4" />
                    Perfil
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigate('/config')}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-surface-muted hover:text-foreground dark:hover:bg-dark-surface-muted dark:hover:text-dark-foreground"
                  >
                    <SettingsIcon className="h-4 w-4" />
                    Configurações
                  </button>
                </div>
                <div className="border-t border-slate-200 bg-surface-muted px-1 py-1 dark:border-dark-border/60 dark:bg-dark-surface-muted">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
