import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Briefcase, CheckSquare, User, Mail, Phone, ArrowLeft } from 'lucide-react';
import { formatDocument, formatDate } from '../lib/utils';
import { Button } from '../components/ui/Button';

const ContactDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { contacts, lawsuits, tasks, users } = useApp();
  
  const contactId = parseInt(id || '0');
  const contact = contacts.find(c => c.id === contactId);
  
  if (!contact) {
    return <div>Contato não encontrado.</div>;
  }
  
  const contactLawsuits = lawsuits.filter(l => l.clientId === contact.id);
  const contactTasks = tasks.filter(t => t.clientId === contact.id);
  const owner = users.find(u => u.id === contact.ownerId);

  return (
    <div className="space-y-6">
      <Link to="/contatos" className="flex items-center text-sm text-primary hover:underline mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar para todos os contatos
      </Link>
      
      <div className="flex items-center space-x-4">
        <div className="bg-primary/10 p-3 rounded-full">
            <User className="h-8 w-8 text-primary" />
        </div>
        <div>
            <h1 className="text-[22px] font-semibold">{contact.name}</h1>
            <p className="text-muted-foreground">{contact.profession} - {contact.status}</p>
        </div>
      </div>
      
      <Card>
          <CardHeader><CardTitle>Informações do Contato</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center"><Mail className="h-4 w-4 mr-2 text-muted-foreground"/><span>{contact.email}</span></div>
              <div className="flex items-center"><Phone className="h-4 w-4 mr-2 text-muted-foreground"/><span>{contact.phone}</span></div>
              <div className="flex items-center"><User className="h-4 w-4 mr-2 text-muted-foreground"/><span>{formatDocument(contact.document)}</span></div>
              <div className="flex items-center"><strong>Dono:</strong><span className="ml-2">{owner?.name || 'N/A'}</span></div>
          </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-6">
          <Card>
              <CardHeader><CardTitle>Processos Associados ({contactLawsuits.length})</CardTitle></CardHeader>
              <CardContent>
                  {contactLawsuits.length > 0 ? (
                    <ul className="space-y-2">
                      {contactLawsuits.map(l => (
                          <li key={l.id} className="rounded-2xl border border-transparent p-2 transition hover:border-border/50 hover:bg-white/70 dark:hover:border-dark-border/60 dark:hover:bg-dark-border/40">
                            <Link to={`/processos/${l.id}`} className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">{l.internalNumber}</p>
                                <p className="text-xs text-muted-foreground">{l.area}</p>
                              </div>
                              <span className="text-xs font-semibold">{l.status}</span>
                            </Link>
                          </li>
                      ))}
                    </ul>
                  ) : <p className="text-sm text-muted-foreground">Nenhum processo associado.</p>}
              </CardContent>
          </Card>
          <Card>
              <CardHeader><CardTitle>Tarefas Associadas ({contactTasks.length})</CardTitle></CardHeader>
              <CardContent>
                  {contactTasks.length > 0 ? (
                    <ul className="space-y-2">
                       {contactTasks.map(t => (
                           <li key={t.id} className="flex items-center justify-between rounded-2xl border border-transparent p-2 transition hover:border-border/50 hover:bg-white/70 dark:hover:border-dark-border/60 dark:hover:bg-dark-border/40">
                               <div>
                                 <p className="font-medium">{t.title}</p>
                                 <p className="text-xs text-muted-foreground">Prazo: {formatDate(t.deadline)}</p>
                               </div>
                               <span className="text-xs font-semibold">{t.status}</span>
                           </li>
                       ))}
                    </ul>
                  ) : <p className="text-sm text-muted-foreground">Nenhuma tarefa associada.</p>}
              </CardContent>
          </Card>
      </div>
    </div>
  );
};

export default ContactDetail;
