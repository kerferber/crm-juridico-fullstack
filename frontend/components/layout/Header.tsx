
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
        <header className="flex items-center justify-between h-16 px-6 bg-card dark:bg-dark-card border-b border-border dark:border-dark-border flex-shrink-0">
            {/* Search */}
            <div className="flex-1">
                <div className="relative">
                    <button 
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        onClick={() => setIsOpen(true)}
                    >
                        <Search className="h-5 w-5" />
                    </button>
                    <button 
                        onClick={() => setIsOpen(true)}
                        className="w-full max-w-sm text-left pl-10 pr-4 py-2 text-sm bg-background dark:bg-dark-background border rounded-md text-muted-foreground dark:border-dark-border"
                    >
                        Pesquisar ou usar comando...
                        <kbd className="pointer-events-none ml-4 inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                            <span className="text-xs">⌘</span>K
                        </kbd>
                    </button>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon" onClick={toggleTheme}>
                    {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                    <span className="sr-only">Toggle theme</span>
                </Button>
                <Button variant="ghost" size="icon">
                    <Bell className="h-5 w-5" />
                    <span className="sr-only">Notifications</span>
                </Button>
                {currentUser ? (
                    <div className="flex items-center space-x-2">
                        <img src={currentUser.avatar} alt="User avatar" className="h-8 w-8 rounded-full" />
                        <div className="text-sm">
                            <p className="font-semibold">{currentUser.name}</p>
                        </div>
                    </div>
                ) : (
                    // Skeleton loader for when user data is not yet available
                    <div className="flex items-center space-x-2 animate-pulse">
                        <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-dark-border"></div>
                        <div className="h-4 w-24 bg-gray-200 dark:bg-dark-border rounded"></div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;