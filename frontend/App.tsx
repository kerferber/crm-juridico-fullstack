import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
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
import Profile from './pages/Profile';
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
import { AuthProvider, useAuth } from './store/AuthContext';
import { Spinner } from './components/ui/Spinner';
import Login from './pages/Login';

const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isSidebarOpen) {
      return;
    }
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isSidebarOpen]);

  const handleCloseSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="relative flex h-screen flex-col text-foreground dark:text-dark-foreground md:flex-row">
      <Sidebar isMobileOpen={isSidebarOpen} onMobileClose={handleCloseSidebar} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onToggleSidebar={() => setIsSidebarOpen(true)} />
        <main className="relative flex-1 overflow-x-hidden overflow-y-auto bg-transparent px-4 py-6 sm:px-5 lg:px-8">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 pb-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

const ProtectedLayout: React.FC = () => {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout />;
};

const App: React.FC = () => {
  return (
    <ThemeProvider defaultTheme="light" storageKey="crm-juridico-theme">
      <AuthProvider>
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
                          <Route path="/login" element={<Login />} />
                          <Route path="/" element={<ProtectedLayout />}>
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
                            <Route path="perfil" element={<Profile />} />
                          </Route>
                          <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                      </Router>
                    </CommandPaletteProvider>
                  </KanbanCardModalProvider>
                </TransactionModalProvider>
              </TaskModalProvider>
            </ProcessModalProvider>
          </ContactModalProvider>
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
