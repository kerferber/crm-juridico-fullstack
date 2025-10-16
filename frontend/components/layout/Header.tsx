
import React from 'react';
import { Search, Bell, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../ui/Button';
import { useCommandPalette } from '../../hooks/useCommandPalette';
import { useApp } from '../../store/AppContext';

const Header: React.FC = () => {
    const { theme, setTheme } = useTheme();
    const { setIsOpen } = useCommandPalette();
    const { users } = useApp();
    const currentUser = users[0]; // Assuming the first user is the current user

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    return (
        <header className="sticky top-0 z-30 flex flex-col gap-3 px-6 pb-4 pt-5 lg:px-10">
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-white px-4 py-2.5 shadow-sm dark:border-dark-border/70 dark:bg-dark-card/90">
                <div className="flex flex-1 items-center">
                    <button
                        className="relative flex w-full max-w-sm items-center rounded-md border border-border/50 bg-white px-4 py-2 text-xs text-muted-foreground transition hover:border-border/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 dark:border-dark-border/60 dark:bg-dark-background/70 dark:text-dark-muted"
                        onClick={() => setIsOpen(true)}
                    >
                        <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="flex-1 text-left font-medium tracking-tight">Pesquisar ou executar comando</span>
                        <kbd className="inline-flex select-none items-center gap-1 rounded border border-border/70 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground dark:border-dark-border/60 dark:bg-dark-card/70">
                            ⌘ K
                        </kbd>
                    </button>
                </div>
                <div className="flex items-center gap-2 pl-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleTheme}
                        className="rounded-md border border-border/50 bg-white text-muted-foreground hover:bg-border/20 dark:border-dark-border/60 dark:bg-dark-background/70"
                    >
                        {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                        <span className="sr-only">Alternar tema</span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-md border border-border/50 bg-white text-muted-foreground hover:bg-border/20 dark:border-dark-border/60 dark:bg-dark-background/70"
                    >
                        <Bell className="h-4 w-4" />
                        <span className="sr-only">Notificações</span>
                    </Button>
                    {currentUser ? (
                        <div className="flex items-center gap-2 rounded-md border border-border/60 bg-white px-3 py-1.5 shadow-sm dark:border-dark-border/60 dark:bg-dark-card/70">
                            <img src={currentUser.avatar} alt="User avatar" className="h-7 w-7 rounded-full" />
                            <div className="hidden text-xs leading-tight md:block">
                                <p className="font-semibold text-foreground dark:text-dark-foreground">
                                    {currentUser.name}
                                </p>
                                <span className="text-[11px] text-muted-foreground">Bem-vindo de volta</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <div className="h-9 w-9 animate-pulse rounded-full bg-gray-200 dark:bg-dark-border" />
                            <div className="h-3 w-20 animate-pulse rounded bg-gray-200 dark:bg-dark-border" />
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
