

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
import { ProcessModalProvider } from './hooks/useProcessModal';
import { TaskModalProvider } from './hooks/useTaskModal';
import { TransactionModalProvider } from './hooks/useTransactionModal';
import { KanbanCardModalProvider } from './hooks/useKanbanCardModal';
import KanbanCardModal from './components/kanban/KanbanCardModal';
import CreateContactModal from './components/contacts/CreateContactModal';
import CreateLawsuitModal from './components/processes/CreateLawsuitModal';
import CreateTaskModal from './components/tasks/CreateTaskModal';
import CreateTransactionModal from './components/financial/CreateTransactionModal';


const Layout: React.FC = () => {
  return (
    <div className="relative flex h-screen text-foreground dark:text-dark-foreground">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="relative flex-1 overflow-x-hidden overflow-y-auto px-6 py-8 lg:px-10">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
            <Outlet />
          </div>
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
          <ProcessModalProvider>
            <TaskModalProvider>
              <TransactionModalProvider>
                <KanbanCardModalProvider>
                  <CommandPaletteProvider>
                    <Router>
                      <CommandPalette />
                      <CreateContactModal />
                      <CreateLawsuitModal />
                      <CreateTaskModal />
                      <CreateTransactionModal />
                      <KanbanCardModal />
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
                </KanbanCardModalProvider>
              </TransactionModalProvider>
            </TaskModalProvider>
          </ProcessModalProvider>
        </ContactModalProvider>
      </AppProvider>
    </ThemeProvider>
  );
};

export default App;
