

import React from 'react';
import { HashRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import CRM from './pages/CRM';
import Contacts from './pages/Contacts';
import ContactDetail from './pages/ContactDetail';
import Lawsuits from './pages/Lawsuits';
import LawsuitDetail from './pages/LawsuitDetail';
import Tasks from './pages/Tasks';
import Agenda from './pages/Agenda';
import Financial from './pages/Financial';
import Management from './pages/Management';
import Gamification from './pages/Gamification';
import Settings from './pages/Settings';
import { AppProvider } from './store/AppContext';
import { ThemeProvider } from './hooks/useTheme';
import CommandPalette from './components/global/CommandPalette';
import { CommandPaletteProvider } from './hooks/useCommandPalette';
import { ContactModalProvider } from './hooks/useContactModal';
import CreateContactModal from './components/contacts/CreateContactModal';


const Layout: React.FC = () => {
    return (
        <div className="flex h-screen bg-background text-foreground dark:bg-dark-background dark:text-dark-foreground">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-dark-background p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};


const App: React.FC = () => {
  return (
    <ThemeProvider defaultTheme="light" storageKey="crm-juridico-theme">
        <AppProvider>
            <ContactModalProvider>
                <CommandPaletteProvider>
                    <Router>
                        <CommandPalette />
                        <CreateContactModal />
                        <Routes>
                            <Route path="/" element={<Layout />}>
                                <Route index element={<Dashboard />} />
                                <Route path="crm" element={<CRM />} />
                                <Route path="contatos" element={<Contacts />} />
                                <Route path="contatos/:id" element={<ContactDetail />} />
                                <Route path="processos" element={<Lawsuits />} />
                                <Route path="processos/:id" element={<LawsuitDetail />} />
                                <Route path="tarefas" element={<Tasks />} />
                                <Route path="agenda" element={<Agenda />} />
                                <Route path="financeiro" element={<Financial />} />
                                <Route path="gestao" element={<Management />} />
                                <Route path="gamificacao" element={<Gamification />} />
                                <Route path="config" element={<Settings />} />
                            </Route>
                        </Routes>
                    </Router>
                </CommandPaletteProvider>
            </ContactModalProvider>
        </AppProvider>
    </ThemeProvider>
  );
};

export default App;
