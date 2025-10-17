import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Bell, Sun, Moon, Plus, Menu, LogOut, User as UserIcon, Settings as SettingsIcon, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../ui/Button';
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
  const { user: authUser, logout } = useAuth();
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
    <header className="sticky top-0 z-40 border-b border-border/50 bg-white/90 backdrop-blur-lg transition dark:border-dark-border/60 dark:bg-dark-card/70">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-6 py-3 lg:px-10">
        <div className="flex flex-1 items-center" ref={searchRef}>
          <button
            onClick={onToggleSidebar}
            className="mr-2 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-white text-muted-foreground transition hover:border-primary/40 hover:text-primary dark:border-dark-border/60 dark:bg-dark-background/70 dark:text-dark-muted md:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="relative flex w-full max-w-xl flex-col">
            <div className="group flex items-center gap-3 rounded-lg border border-border/60 bg-white px-3 py-2 text-xs text-muted-foreground/90 shadow-sm transition hover:border-primary/40 hover:text-primary dark:border-dark-border/60 dark:bg-dark-background/70 dark:text-dark-muted/80">
              <Search className="h-4 w-4 text-muted-foreground/80 transition group-hover:text-primary" />
              <input
                ref={searchInputRef}
                value={query}
                onChange={event => setQuery(event.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Buscar clientes por nome..."
                className="flex-1 border-none bg-transparent text-[13px] font-medium tracking-tight text-foreground placeholder:text-muted-foreground focus:outline-none dark:text-dark-foreground"
              />
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="hidden items-center gap-1 rounded border border-border/60 bg-white px-2 py-0.5 text-[10px] font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-primary dark:border-dark-border/60 dark:bg-dark-card/70 md:inline-flex"
              >
                ⌘ K
              </button>
            </div>
            {showResults && (
              <div className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-border/60 bg-white/95 shadow-xl backdrop-blur-md dark:border-dark-border/60 dark:bg-dark-card/95">
                <div className="border-b border-border/60 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground/70 dark:border-dark-border/60">
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
                            ? 'bg-primary/10 text-primary dark:bg-dark-primary/15 dark:text-dark-primary'
                            : 'hover:bg-muted/30 dark:hover:bg-dark-border/40'
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
            className="hidden rounded-md bg-primary px-3 text-xs font-semibold text-white shadow-sm transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-primary/50 sm:inline-flex"
            onClick={() => setIsOpen(true)}
          >
            <Plus className="mr-2 h-3 w-3" />
            Criar
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full border border-border/50 bg-white/80 text-muted-foreground hover:bg-primary/10 hover:text-primary dark:border-dark-border/50 dark:bg-dark-card/80 dark:hover:bg-dark-primary/15 dark:hover:text-dark-primary"
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            <span className="sr-only">Alternar tema</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full border border-border/50 bg-white/80 text-muted-foreground hover:bg-primary/10 hover:text-primary dark:border-dark-border/50 dark:bg-dark-card/80 dark:hover:bg-dark-primary/15 dark:hover:text-dark-primary"
          >
            <Bell className="h-4 w-4" />
            <span className="sr-only">Notificações</span>
          </Button>
          <div className="relative" ref={menuRef}>
            {currentUser ? (
              <button
                type="button"
                onClick={() => setIsMenuOpen(prev => !prev)}
                className="flex items-center gap-2 rounded-lg border border-border/60 bg-white px-2.5 py-1 shadow-sm transition hover:border-primary/40 hover:bg-primary/5 dark:border-dark-border/60 dark:bg-dark-card/80 dark:hover:border-dark-primary/40 dark:hover:bg-dark-primary/10"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="h-8 w-8 rounded-full object-cover"
                />
                <div className="hidden text-left text-[11px] leading-tight md:block">
                  <p className="font-semibold text-foreground dark:text-dark-foreground">
                    {currentUser.name}
                  </p>
                  {currentUser.jobTitle ? (
                    <span className="text-[10px] uppercase tracking-[0.28em] text-primary/70">
                      {currentUser.jobTitle}
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">
                      {currentUser.email}
                    </span>
                  )}
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition md:block" />
              </button>
            ) : (
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted/50" />
            )}

            {isMenuOpen && (
              <div className="absolute right-0 mt-3 w-56 overflow-hidden rounded-xl border border-border/70 bg-white shadow-lg backdrop-blur-sm dark:border-dark-border/70 dark:bg-dark-card/90">
                <div className="border-b border-border/60 px-4 py-3 text-xs text-muted-foreground dark:border-dark-border/60">
                  <p className="font-semibold text-foreground dark:text-dark-foreground">
                    {currentUser?.name}
                  </p>
                  <span>{currentUser?.email}</span>
                </div>
                <div className="p-1">
                  <button
                    type="button"
                    onClick={() => handleNavigate('/perfil')}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-primary/10 hover:text-primary dark:hover:bg-dark-primary/15 dark:hover:text-dark-primary"
                  >
                    <UserIcon className="h-4 w-4" />
                    Perfil
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigate('/config')}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-primary/10 hover:text-primary dark:hover:bg-dark-primary/15 dark:hover:text-dark-primary"
                  >
                    <SettingsIcon className="h-4 w-4" />
                    Configurações
                  </button>
                </div>
                <div className="border-t border-border/60 bg-muted/20 px-1 py-1 dark:border-dark-border/60 dark:bg-dark-card/70">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10"
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
