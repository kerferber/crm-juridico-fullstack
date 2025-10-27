import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import CRM from './pages/CRM';
import Contacts from './pages/Contacts.tsx';
import ContactDetail from './pages/ContactDetail';
import Lawsuits from './pages/Lawsuits';
import LawsuitDetail from './pages/LawsuitDetail';
import Tasks from './pages/Tasks';
import Agenda from './pages/Agenda';
import Financial from './pages/Financial';
import Management from './pages/Management';
import Gamification from './pages/Gamification';
import Insights from './pages/Insights';
import Settings from './pages/Settings';
import TaskDetail from './pages/TaskDetail';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
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
import { AdminAuthProvider, useAdminAuth } from './store/AdminAuthContext';
import { Spinner } from './components/ui/Spinner';
import Login from './pages/Login';
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTenants from './pages/admin/AdminTenants';
import AdminApiDocs from './pages/admin/AdminApiDocs';
import AdminAiSettings from './pages/admin/AdminAiSettings';
import AdminDeployGuide from './pages/admin/AdminDeployGuide';
import Payments from './pages/Payments';
import Social from './pages/Social';

dayjs.extend(relativeTime);

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
        <main className="relative flex-1 overflow-x-hidden overflow-y-auto bg-surface-muted px-4 py-4 dark:bg-dark-surface-muted sm:px-5 lg:px-7">
          <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-4 pb-6">
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

const AdminProtectedLayout: React.FC = () => {
  const { isAuthenticated } = useAdminAuth();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <AdminLayout />;
};

const App: React.FC = () => {
  return (
    <ThemeProvider defaultTheme="light" storageKey="crm-juridico-theme">
      <AdminAuthProvider>
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
                          <Route path="/admin/login" element={<AdminLogin />} />
                          <Route path="/admin" element={<AdminProtectedLayout />}>
                            <Route index element={<Navigate to="/admin/dashboard" replace />} />
                            <Route path="dashboard" element={<AdminDashboard />} />
                            <Route path="tenants" element={<AdminTenants />} />
                            <Route path="ai-settings" element={<AdminAiSettings />} />
                            <Route path="api-docs" element={<AdminApiDocs />} />
                            <Route path="deploy-guide" element={<AdminDeployGuide />} />
                          </Route>
                          <Route path="/" element={<ProtectedLayout />}>
                            <Route index element={<Dashboard />} />
                            <Route path="crm" element={<CRM />} />
                            <Route path="contatos" element={<Contacts />} />
                            <Route path="contatos/:id" element={<ContactDetail />} />
                            <Route path="processos" element={<Lawsuits />} />
                            <Route path="processos/:id" element={<LawsuitDetail />} />
                            <Route path="tarefas" element={<Tasks />} />
                            <Route path="tarefas/:id" element={<TaskDetail />} />
                            <Route path="agenda" element={<Agenda />} />
                            <Route path="notificacoes" element={<Notifications />} />
                            <Route path="financeiro" element={<Financial />} />
                            <Route path="pagamentos" element={<Payments />} />
                            <Route path="insights" element={<Insights />} />
                            <Route path="gestao" element={<Management />} />
                          <Route path="gamificacao" element={<Gamification />} />
                          <Route path="social" element={<Social />} />
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
    </AdminAuthProvider>
    </ThemeProvider>
  );
};

export default App;
