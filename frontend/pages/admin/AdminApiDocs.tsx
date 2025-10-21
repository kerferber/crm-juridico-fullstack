import React from 'react';
import { Copy } from 'lucide-react';

type EndpointDoc = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  title: string;
  description: string;
  auth: 'admin' | 'tenant' | 'public';
  curl: string;
  notes?: string[];
};

type SectionDoc = {
  id: string;
  title: string;
  description: string;
  endpoints: EndpointDoc[];
};

const sections: SectionDoc[] = [
  {
    id: 'admin-auth',
    title: 'Autenticação do Painel Administrativo',
    description:
      'Use estas rotas para obter um token de administrador, gerenciar workspaces e consultar métricas globais.',
    endpoints: [
      {
        method: 'POST',
        path: '/api/admin/login',
        title: 'Login admin',
        description:
          'Recebe e-mail e senha do operador administrativo e retorna um token Bearer (Sanctum).',
        auth: 'public',
        curl: `curl -X POST "$BASE_URL/api/admin/login" \\
  -H 'Content-Type: application/json' \\
  -d '{
    "email": "admin@empresa.com",
    "password": "sua-senha"
  }'`,
        notes: [
          'Armazene o token retornado em um cofre seguro (por exemplo, credenciais do n8n) para usá-lo no cabeçalho Authorization.',
        ],
      },
      {
        method: 'POST',
        path: '/api/admin/logout',
        title: 'Logout admin',
        description: 'Revoga o token administrativo atual.',
        auth: 'admin',
        curl: `curl -X POST "$BASE_URL/api/admin/logout" \\
  -H "Authorization: Bearer $ADMIN_TOKEN"`,
      },
    ],
  },
  {
    id: 'tenant-management',
    title: 'Gestão de Tenants',
    description:
      'Provisiona ou lista workspaces (tenants). Todas as chamadas exigem token administrativo.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/admin/tenants',
        title: 'Listar tenants',
        description: 'Retorna todos os tenants com contagem de usuários e metadados.',
        auth: 'admin',
        curl: `curl "$BASE_URL/api/admin/tenants" \\
  -H "Authorization: Bearer $ADMIN_TOKEN"`,
      },
      {
        method: 'POST',
        path: '/api/admin/tenants',
        title: 'Criar tenant',
        description:
          'Cria um workspace e, opcionalmente, o usuário administrador inicial (campos admin_*).',
        auth: 'admin',
        curl: `curl -X POST "$BASE_URL/api/admin/tenants" \\
  -H 'Authorization: Bearer $ADMIN_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "name": "Studio Legal",
    "slug": "studio-legal",            // opcional
    "status": "active",               // active | inactive
    "admin_name": "Diego Carvalho",    // opcional, obrigatório com email/senha
    "admin_email": "diego@studio.com",
    "admin_password": "SenhaForte123",
    "admin_password_confirmation": "SenhaForte123"
  }'`,
        notes: [
          'Ao informar admin_email e admin_password o backend cria o usuário com privilégio total no workspace.',
          'Se o slug informado já existir, será gerado automaticamente um sufixo aleatório para garantir unicidade.',
        ],
      },
    ],
  },
  {
    id: 'tenant-auth',
    title: 'Autenticação do Workspace (Tenant)',
    description:
      'Endpoints usados pelos usuários finais do CRM. Sempre inclua o cabeçalho X-Tenant com o slug do workspace.',
    endpoints: [
      {
        method: 'POST',
        path: '/api/auth/register',
        title: 'Registrar usuário',
        description: 'Cria um usuário dentro do tenant. Pode ser útil em fluxos automáticos de onboarding.',
        auth: 'public',
        curl: `curl -X POST "$BASE_URL/api/auth/register" \\
  -H 'Content-Type: application/json' \\
  -H 'X-Tenant: studio-legal' \\
  -d '{
    "name": "Diego Carvalho",
    "email": "diego@studio.com",
    "password": "SenhaForte123",
    "password_confirmation": "SenhaForte123"
  }'`,
      },
      {
        method: 'POST',
        path: '/api/auth/login',
        title: 'Login do usuário do tenant',
        description: 'Retorna token e dados do usuário. Use o token nas próximas chamadas.',
        auth: 'public',
        curl: `curl -X POST "$BASE_URL/api/auth/login" \\
  -H 'Content-Type: application/json' \\
  -H 'X-Tenant: studio-legal' \\
  -d '{
    "email": "diego@studio.com",
    "password": "SenhaForte123"
  }'`,
        notes: ['O corpo da resposta contém o token Bearer em "token".'],
      },
      {
        method: 'POST',
        path: '/api/auth/logout',
        title: 'Logout do usuário',
        description: 'Revoga o token do usuário atual.',
        auth: 'tenant',
        curl: `curl -X POST "$BASE_URL/api/auth/logout" \\
  -H "Authorization: Bearer $TENANT_TOKEN" \\
  -H "X-Tenant: studio-legal"`,
      },
      {
        method: 'GET',
        path: '/api/auth/user',
        title: 'Perfil autenticado',
        description: 'Retorna dados do usuário logado e informações do tenant.',
        auth: 'tenant',
        curl: `curl "$BASE_URL/api/auth/user" \\
  -H "Authorization: Bearer $TENANT_TOKEN" \\
  -H "X-Tenant: studio-legal"`,
      },
    ],
  },
  {
    id: 'users',
    title: 'Usuários do Tenant',
    description: 'CRUD de usuários utilizados na aplicação (rotas protegidas por token do tenant).',
    endpoints: [
      {
        method: 'GET',
        path: '/api/users',
        title: 'Listar usuários',
        description: 'Retorna todos os usuários cadastrados no workspace.',
        auth: 'tenant',
        curl: `curl "$BASE_URL/api/users" \\
  -H "Authorization: Bearer $TENANT_TOKEN" \\
  -H "X-Tenant: studio-legal"`,
      },
      {
        method: 'POST',
        path: '/api/users',
        title: 'Criar usuário',
        description: 'Cria um novo usuário (ex.: automações internas).',
        auth: 'tenant',
        curl: `curl -X POST "$BASE_URL/api/users" \\
  -H 'Authorization: Bearer $TENANT_TOKEN' \\
  -H 'X-Tenant: studio-legal' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "name": "Ana Lima",
    "email": "ana@studio.com",
    "password": "SenhaForte123",
    "password_confirmation": "SenhaForte123"
  }'`,
      },
      {
        method: 'GET',
        path: '/api/users/{id}',
        title: 'Mostrar usuário',
        description: 'Busca um usuário específico pelo ID.',
        auth: 'tenant',
        curl: `curl "$BASE_URL/api/users/42" \\
  -H "Authorization: Bearer $TENANT_TOKEN" \\
  -H "X-Tenant: studio-legal"`,
      },
      {
        method: 'PUT',
        path: '/api/users/{id}',
        title: 'Atualizar usuário',
        description: 'Altera dados como nome, função e permissões.',
        auth: 'tenant',
        curl: `curl -X PUT "$BASE_URL/api/users/42" \\
  -H 'Authorization: Bearer $TENANT_TOKEN' \\
  -H 'X-Tenant: studio-legal' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "name": "Ana Lima (Atualizado)",
    "job_title": "Coordenadora Jurídica"
  }'`,
      },
      {
        method: 'DELETE',
        path: '/api/users/{id}',
        title: 'Excluir usuário',
        description: 'Remove o usuário do tenant.',
        auth: 'tenant',
        curl: `curl -X DELETE "$BASE_URL/api/users/42" \\
  -H "Authorization: Bearer $TENANT_TOKEN" \\
  -H "X-Tenant: studio-legal"`,
      },
    ],
  },
  {
    id: 'contacts',
    title: 'Contatos',
    description: 'Cadastro de contatos/clientes com notas e metadados.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/contacts',
        title: 'Listar contatos',
        description: 'Aceita paginação (page, per_page) e filtros específicos.',
        auth: 'tenant',
        curl: `curl "$BASE_URL/api/contacts?per_page=20" \\
  -H "Authorization: Bearer $TENANT_TOKEN" \\
  -H "X-Tenant: studio-legal"`,
      },
      {
        method: 'POST',
        path: '/api/contacts',
        title: 'Criar contato',
        description: 'Cria um novo contato com dados de origem, documento e responsável.',
        auth: 'tenant',
        curl: `curl -X POST "$BASE_URL/api/contacts" \\
  -H 'Authorization: Bearer $TENANT_TOKEN' \\
  -H 'X-Tenant: studio-legal' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "name": "Maria Souza",
    "email": "maria@cliente.com",
    "phone": "5511999999999",
    "document": "12345678901",
    "origin": "Indicação",
    "status": "Cliente",
    "owner_id": 3
  }'`,
      },
      {
        method: 'GET',
        path: '/api/contacts/{id}',
        title: 'Mostrar contato',
        description: 'Retorna detalhes completos do contato.',
        auth: 'tenant',
        curl: `curl "$BASE_URL/api/contacts/15" \\
  -H "Authorization: Bearer $TENANT_TOKEN" \\
  -H "X-Tenant: studio-legal"`,
      },
      {
        method: 'PUT',
        path: '/api/contacts/{id}',
        title: 'Atualizar contato',
        description: 'Atualiza informações como status comercial, telefone e notas.',
        auth: 'tenant',
        curl: `curl -X PUT "$BASE_URL/api/contacts/15" \\
  -H 'Authorization: Bearer $TENANT_TOKEN' \\
  -H 'X-Tenant: studio-legal' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "status": "Lead",
    "origin": "Campanha"
  }'`,
      },
      {
        method: 'DELETE',
        path: '/api/contacts/{id}',
        title: 'Excluir contato',
        description: 'Remove o contato e relações diretas.',
        auth: 'tenant',
        curl: `curl -X DELETE "$BASE_URL/api/contacts/15" \\
  -H "Authorization: Bearer $TENANT_TOKEN" \\
  -H "X-Tenant: studio-legal"`,
      },
    ],
  },
  {
    id: 'lawsuits',
    title: 'Processos (Lawsuits)',
    description: 'Gerencia processos jurídicos, incluindo movimentação no kanban.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/lawsuits',
        title: 'Listar processos',
        description: 'Suporta filtros por fase, responsável, status, etc.',
        auth: 'tenant',
        curl: `curl "$BASE_URL/api/lawsuits" \\
  -H "Authorization: Bearer $TENANT_TOKEN" \\
  -H "X-Tenant: studio-legal"`,
      },
      {
        method: 'POST',
        path: '/api/lawsuits',
        title: 'Criar processo',
        description: 'Cadastra um novo processo com prazo e responsável.',
        auth: 'tenant',
        curl: `curl -X POST "$BASE_URL/api/lawsuits" \\
  -H 'Authorization: Bearer $TENANT_TOKEN' \\
  -H 'X-Tenant: studio-legal' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "internal_number": "2025-0001",
    "client_id": 14,
    "responsible_id": 3,
    "area": "Cível",
    "phase": "Inicial",
    "deadline": "2025-10-30",
    "status": "Ativo"
  }'`,
      },
      {
        method: 'GET',
        path: '/api/lawsuits/{id}',
        title: 'Mostrar processo',
        description: 'Detalha o processo, incluindo responsável e datas principais.',
        auth: 'tenant',
        curl: `curl "$BASE_URL/api/lawsuits/10" \\
  -H "Authorization: Bearer $TENANT_TOKEN" \\
  -H "X-Tenant: studio-legal"`,
      },
      {
        method: 'PUT',
        path: '/api/lawsuits/{id}',
        title: 'Atualizar processo',
        description: 'Edita informações como fase, status e prazos.',
        auth: 'tenant',
        curl: `curl -X PUT "$BASE_URL/api/lawsuits/10" \\
  -H 'Authorization: Bearer $TENANT_TOKEN' \\
  -H 'X-Tenant: studio-legal' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "phase": "Audiência",
    "status": "Ativo"
  }'`,
      },
      {
        method: 'DELETE',
        path: '/api/lawsuits/{id}',
        title: 'Excluir processo',
        description: 'Remove o processo.',
        auth: 'tenant',
        curl: `curl -X DELETE "$BASE_URL/api/lawsuits/10" \\
  -H "Authorization: Bearer $TENANT_TOKEN" \\
  -H "X-Tenant: studio-legal"`,
      },
      {
        method: 'PUT',
        path: '/api/lawsuits/{id}/kanban',
        title: 'Mover processo no Kanban',
        description: 'Atualiza coluna e fase do processo no board.',
        auth: 'tenant',
        curl: `curl -X PUT "$BASE_URL/api/lawsuits/10/kanban" \\
  -H 'Authorization: Bearer $TENANT_TOKEN' \\
  -H 'X-Tenant: studio-legal' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "kanban_column": "in_progress",
    "kanban_phase": "Audiência"
  }'`,
      },
    ],
  },
  {
    id: 'tasks',
    title: 'Tarefas',
    description: 'Automatize rotinas criando e atualizando tarefas via API.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/tasks',
        title: 'Listar tarefas',
        description: 'Aceita filtros por status, responsável e datas.',
        auth: 'tenant',
        curl: `curl "$BASE_URL/api/tasks" \\
  -H "Authorization: Bearer $TENANT_TOKEN" \\
  -H "X-Tenant: studio-legal"`,
      },
      {
        method: 'POST',
        path: '/api/tasks',
        title: 'Criar tarefa',
        description: 'Cria tarefas com prazos e pontuação.',
        auth: 'tenant',
        curl: `curl -X POST "$BASE_URL/api/tasks" \\
  -H 'Authorization: Bearer $TENANT_TOKEN' \\
  -H 'X-Tenant: studio-legal' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "title": "Agendar reunião",
    "responsible_id": 3,
    "due_date": "2025-10-21",
    "deadline": "2025-10-20",
    "status": "Pendente",
    "score": 10
  }'`,
      },
      {
        method: 'GET',
        path: '/api/tasks/{id}',
        title: 'Mostrar tarefa',
        description: 'Retorna detalhes da tarefa e relacionamento com lead/processo.',
        auth: 'tenant',
        curl: `curl "$BASE_URL/api/tasks/55" \\
  -H "Authorization: Bearer $TENANT_TOKEN" \\
  -H "X-Tenant: studio-legal"`,
      },
      {
        method: 'PUT',
        path: '/api/tasks/{id}',
        title: 'Atualizar tarefa',
        description: 'Permite alterar campos como título, responsável e pontos.',
        auth: 'tenant',
        curl: `curl -X PUT "$BASE_URL/api/tasks/55" \\
  -H 'Authorization: Bearer $TENANT_TOKEN' \\
  -H 'X-Tenant: studio-legal' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "title": "Revisar peças",
    "score": 15
  }'`,
      },
      {
        method: 'DELETE',
        path: '/api/tasks/{id}',
        title: 'Excluir tarefa',
        description: 'Remove a tarefa.',
        auth: 'tenant',
        curl: `curl -X DELETE "$BASE_URL/api/tasks/55" \\
  -H "Authorization: Bearer $TENANT_TOKEN" \\
  -H "X-Tenant: studio-legal"`,
      },
      {
        method: 'PUT',
        path: '/api/tasks/{id}/status',
        title: 'Alterar status',
        description: 'Endpoint dedicado para mudar rapidamente o status da tarefa.',
        auth: 'tenant',
        curl: `curl -X PUT "$BASE_URL/api/tasks/55/status" \\
  -H 'Authorization: Bearer $TENANT_TOKEN' \\
  -H 'X-Tenant: studio-legal' \\
  -H 'Content-Type: application/json' \\
  -d '{ "status": "Concluída" }'`,
      },
    ],
  },
  {
    id: 'calendar-events',
    title: 'Agenda (Calendar Events)',
    description: 'Gerencie compromissos e bloqueios da agenda do tenant.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/calendar-events',
        title: 'Listar eventos',
        description: 'Retorna compromissos, podendo filtrar por período.',
        auth: 'tenant',
        curl: `curl "$BASE_URL/api/calendar-events" \\
  -H "Authorization: Bearer $TENANT_TOKEN" \\
  -H "X-Tenant: studio-legal"`,
      },
      {
        method: 'POST',
        path: '/api/calendar-events',
        title: 'Criar evento',
        description: 'Agenda um novo compromisso.',
        auth: 'tenant',
        curl: `curl -X POST "$BASE_URL/api/calendar-events" \\
  -H 'Authorization: Bearer $TENANT_TOKEN' \\
  -H 'X-Tenant: studio-legal' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "title": "Reunião com cliente",
    "start": "2025-10-15T14:00:00-03:00",
    "end": "2025-10-15T15:00:00-03:00",
    "location": "Sala 2"
  }'`,
      },
      {
        method: 'GET',
        path: '/api/calendar-events/{id}',
        title: 'Mostrar evento',
        description: 'Detalha um compromisso específico.',
        auth: 'tenant',
        curl: `curl "$BASE_URL/api/calendar-events/9" \\
  -H "Authorization: Bearer $TENANT_TOKEN" \\
  -H "X-Tenant: studio-legal"`,
      },
      {
        method: 'PUT',
        path: '/api/calendar-events/{id}',
        title: 'Atualizar evento',
        description: 'Permite mudar data, título e demais campos.',
        auth: 'tenant',
        curl: `curl -X PUT "$BASE_URL/api/calendar-events/9" \\
  -H 'Authorization: Bearer $TENANT_TOKEN' \\
  -H 'X-Tenant: studio-legal' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "title": "Reunião ajustada",
    "end": "2025-10-15T15:30:00-03:00"
  }'`,
      },
      {
        method: 'DELETE',
        path: '/api/calendar-events/{id}',
        title: 'Excluir evento',
        description: 'Remove o compromisso da agenda.',
        auth: 'tenant',
        curl: `curl -X DELETE "$BASE_URL/api/calendar-events/9" \\
  -H "Authorization: Bearer $TENANT_TOKEN" \\
  -H "X-Tenant: studio-legal"`,
      },
    ],
  },
  {
    id: 'transactions',
    title: 'Financeiro (Transactions)',
    description: 'Gerencia receitas e despesas ligadas ao tenant.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/transactions',
        title: 'Listar transações',
        description: 'Retorna o histórico financeiro com filtros por tipo e datas.',
        auth: 'tenant',
        curl: `curl "$BASE_URL/api/transactions" \\
  -H "Authorization: Bearer $TENANT_TOKEN" \\
  -H "X-Tenant: studio-legal"`,
      },
      {
        method: 'POST',
        path: '/api/transactions',
        title: 'Criar transação',
        description: 'Registra uma nova receita ou despesa.',
        auth: 'tenant',
        curl: `curl -X POST "$BASE_URL/api/transactions" \\
  -H 'Authorization: Bearer $TENANT_TOKEN' \\
  -H 'X-Tenant: studio-legal' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "title": "Pagamento de honorários",
    "type": "revenue",
    "amount": 5000,
    "date": "2025-10-10"
  }'`,
      },
      {
        method: 'GET',
        path: '/api/transactions/{id}',
        title: 'Mostrar transação',
        description: 'Consulta detalhes de uma transação específica.',
        auth: 'tenant',
        curl: `curl "$BASE_URL/api/transactions/18" \\
  -H "Authorization: Bearer $TENANT_TOKEN" \\
  -H "X-Tenant: studio-legal"`,
      },
      {
        method: 'PUT',
        path: '/api/transactions/{id}',
        title: 'Atualizar transação',
        description: 'Altera tipo, valor ou data.',
        auth: 'tenant',
        curl: `curl -X PUT "$BASE_URL/api/transactions/18" \\
  -H 'Authorization: Bearer $TENANT_TOKEN' \\
  -H 'X-Tenant: studio-legal' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "amount": 6200
  }'`,
      },
      {
        method: 'DELETE',
        path: '/api/transactions/{id}',
        title: 'Excluir transação',
        description: 'Remove uma transação do registro.',
        auth: 'tenant',
        curl: `curl -X DELETE "$BASE_URL/api/transactions/18" \\
  -H "Authorization: Bearer $TENANT_TOKEN" \\
  -H "X-Tenant: studio-legal"`,
      },
    ],
  },
  {
    id: 'reports',
    title: 'Relatórios e Indicadores',
    description: 'Endpoints que alimentam dashboards internos do tenant.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/dashboard/summary',
        title: 'Resumo operacional',
        description: 'KPIs consolidados (tarefas, leads, processos e finanças).',
        auth: 'tenant',
        curl: `curl "$BASE_URL/api/dashboard/summary" \\
  -H "Authorization: Bearer $TENANT_TOKEN" \\
  -H "X-Tenant: studio-legal"`,
      },
      {
        method: 'GET',
        path: '/api/management/agility',
        title: 'Indicadores de agilidade',
        description: 'Métricas de tempo de resposta, SLA e fluxo do funil.',
        auth: 'tenant',
        curl: `curl "$BASE_URL/api/management/agility" \\
  -H "Authorization: Bearer $TENANT_TOKEN" \\
  -H "X-Tenant: studio-legal"`,
      },
      {
        method: 'GET',
        path: '/api/management/productivity',
        title: 'Indicadores de produtividade',
        description: 'Pontuação de tarefas concluídas e desempenho da equipe.',
        auth: 'tenant',
        curl: `curl "$BASE_URL/api/management/productivity" \\
  -H "Authorization: Bearer $TENANT_TOKEN" \\
  -H "X-Tenant: studio-legal"`,
      },
      {
        method: 'GET',
        path: '/api/management/office',
        title: 'Indicadores do escritório',
        description: 'Métricas gerais do escritório/tenant.',
        auth: 'tenant',
        curl: `curl "$BASE_URL/api/management/office" \\
  -H "Authorization: Bearer $TENANT_TOKEN" \\
  -H "X-Tenant: studio-legal"`,
      },
    ],
  },
  {
    id: 'gamification',
    title: 'Gamificação',
    description: 'Pontuação e engajamento da equipe.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/gamification/status',
        title: 'Status de gamificação',
        description: 'Mostra a pontuação atual do usuário autenticado.',
        auth: 'tenant',
        curl: `curl "$BASE_URL/api/gamification/status" \\
  -H "Authorization: Bearer $TENANT_TOKEN" \\
  -H "X-Tenant: studio-legal"`,
      },
      {
        method: 'GET',
        path: '/api/gamification/ranking',
        title: 'Ranking de gamificação',
        description: 'Retorna os melhores colocados no período recente.',
        auth: 'tenant',
        curl: `curl "$BASE_URL/api/gamification/ranking" \\
  -H "Authorization: Bearer $TENANT_TOKEN" \\
  -H "X-Tenant: studio-legal"`,
      },
    ],
  },
  {
    id: 'admin-metrics',
    title: 'Métricas Globais (Admin)',
    description: 'Relatórios consolidados para o painel administrativo.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/admin/metrics/overview',
        title: 'Resumo consolidado',
        description: 'KPIs agregados por tenant (tarefas, usuários, contatos, processos, finanças).',
        auth: 'admin',
        curl: `curl "$BASE_URL/api/admin/metrics/overview" \\
  -H "Authorization: Bearer $ADMIN_TOKEN"`,
      },
      {
        method: 'GET',
        path: '/api/admin/metrics/timeseries',
        title: 'Séries temporais',
        description: 'Recebe parâmetro opcional ?days=7|30 e retorna evolução diária de tarefas, receitas e despesas.',
        auth: 'admin',
        curl: `curl "$BASE_URL/api/admin/metrics/timeseries?days=30" \\
  -H "Authorization: Bearer $ADMIN_TOKEN"`,
      },
    ],
  },
];

const authBadge: Record<EndpointDoc['auth'], { label: string; className: string }> = {
  public: {
    label: 'Público',
    className: 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-200',
  },
  admin: {
    label: 'Admin',
    className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200',
  },
  tenant: {
    label: 'Tenant',
    className: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200',
  },
};

const methodColors: Record<EndpointDoc['method'], string> = {
  GET: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
  POST: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200',
  PUT: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200',
  PATCH: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-200',
  DELETE: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200',
};

const AdminApiDocs: React.FC = () => {
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {
      /* noop */
    });
  };

  return (
    <div className="space-y-12">
      <section className="rounded-3xl border border-border/60 bg-surface p-8 shadow-sm dark:border-dark-border/50 dark:bg-dark-surface">
        <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-primary">
          API pública + Admin
        </span>
        <h1 className="mt-4 text-3xl font-semibold text-foreground">Documentação da API</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Consulte abaixo os endpoints disponíveis tanto para o painel administrativo quanto para os workspaces de cada tenant. Todos os exemplos utilizam o
          placeholder <code className="rounded bg-surface-muted px-1 py-0.5 text-xs">$BASE_URL</code>, que deve apontar para a instância Laravel (ex.: <code>https://crm.example.com</code> ou <code>http://localhost:8000</code>).
        </p>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-surface-muted p-4 text-sm dark:border-dark-border/60 dark:bg-dark-surface-muted">
            <h3 className="text-sm font-semibold text-foreground">Cabeçalhos importantes</h3>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              <li><span className="font-semibold text-foreground">Authorization:</span> Bearer &lt;token&gt; — obrigatório para rotas protegidas.</li>
              <li><span className="font-semibold text-foreground">X-Tenant:</span> informe o slug do workspace ao chamar rotas do tenant (ex.: <code>studio-legal</code>).</li>
              <li><span className="font-semibold text-foreground">Content-Type:</span> <code>application/json</code> para requisições com corpo.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-border/60 bg-surface-muted p-4 text-sm dark:border-dark-border/60 dark:bg-dark-surface-muted">
            <h3 className="text-sm font-semibold text-foreground">Fluxo sugerido</h3>
            <ol className="mt-3 space-y-2 text-xs text-muted-foreground">
              <li>1. Admin realiza <code>POST /api/admin/login</code> e gera o workspace via <code>POST /api/admin/tenants</code>.</li>
              <li>2. Usuário administrador recebe credenciais, faz login em <code>/api/auth/login</code> com o slug apropriado.</li>
              <li>3. Com o token do tenant, consome os recursos de CRM, processos, tarefas, agenda e financeiro.</li>
            </ol>
          </div>
          <div className="rounded-2xl border border-border/60 bg-surface-muted p-4 text-sm dark:border-dark-border/60 dark:bg-dark-surface-muted">
            <h3 className="text-sm font-semibold text-foreground">Integração rápida com n8n</h3>
            <ol className="mt-3 space-y-2 text-xs text-muted-foreground">
              <li>1. Crie uma credencial HTTP no n8n contendo o token (Authorization: Bearer) e, se for tenant, adicione X-Tenant no campo "Header".</li>
              <li>2. Em um nó "HTTP Request", defina Método, URL (<code>$BASE_URL</code> + endpoint) e selecione a credencial criada.</li>
              <li>3. Para enviar JSON, marque "Send Body" &gt; JSON e informe o objeto. O n8n adiciona automaticamente o cabeçalho <code>Content-Type: application/json</code>.</li>
              <li>4. Teste a requisição. A resposta (body) pode ser utilizada em nós subsequentes, por exemplo para criar registros ou disparar webhooks.</li>
            </ol>
          </div>
        </div>
      </section>

      <nav className="grid gap-3 rounded-2xl border border-border/60 bg-surface p-6 text-sm shadow-sm dark:border-dark-border/50 dark:bg-dark-surface">
        <h2 className="text-base font-semibold text-foreground">Sumário</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map(section => (
            <a key={section.id} href={`#${section.id}`} className="rounded-xl border border-border/50 px-3 py-2 text-xs text-muted-foreground transition hover:border-primary/60 hover:text-primary">
              {section.title}
            </a>
          ))}
        </div>
      </nav>

      {sections.map(section => (
        <section
          key={section.id}
          id={section.id}
          className="space-y-6 rounded-3xl border border-border/60 bg-surface p-8 shadow-sm dark:border-dark-border/50 dark:bg-dark-surface"
        >
          <div>
            <h2 className="text-2xl font-semibold text-foreground">{section.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{section.description}</p>
          </div>

          <div className="space-y-6">
            {section.endpoints.map(endpoint => (
              <article key={`${endpoint.method}-${endpoint.path}`} className="rounded-2xl border border-border/60 bg-surface-muted p-6 text-sm shadow-sm dark:border-dark-border/60 dark:bg-dark-surface-muted">
                <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${methodColors[endpoint.method]}`}>
                      {endpoint.method}
                    </span>
                    <code className="rounded bg-background px-2 py-1 text-xs text-foreground dark:bg-dark-background">{endpoint.path}</code>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${authBadge[endpoint.auth].className}`}>
                      {authBadge[endpoint.auth].label}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{endpoint.title}</h3>
                </header>
                <p className="mt-3 text-xs text-muted-foreground">{endpoint.description}</p>

                {endpoint.notes && endpoint.notes.length > 0 && (
                  <ul className="mt-3 space-y-2 rounded-xl border border-dashed border-border/60 bg-background px-4 py-3 text-xs text-muted-foreground dark:border-dark-border/60 dark:bg-dark-background">
                    {endpoint.notes.map(note => (
                      <li key={note}>• {note}</li>
                    ))}
                  </ul>
                )}

                <div className="mt-4 rounded-2xl border border-border/60 bg-background p-4 text-xs dark:border-dark-border/60 dark:bg-dark-background">
                  <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    <span>Exemplo em cURL</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(endpoint.curl)}
                      className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-1 text-[10px] font-semibold text-muted-foreground transition hover:border-primary/60 hover:text-primary"
                    >
                      <Copy className="h-3 w-3" /> Copiar
                    </button>
                  </div>
                  <pre className="overflow-x-auto text-[11px] leading-relaxed text-foreground"><code>{endpoint.curl}</code></pre>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default AdminApiDocs;
