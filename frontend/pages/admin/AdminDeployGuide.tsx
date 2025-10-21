import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CloudCog,
  Database,
  Globe,
  LifeBuoy,
  Lock,
  PlugZap,
  ShieldCheck,
  TerminalSquare,
  Zap,
} from 'lucide-react';

const codeClass = "whitespace-pre-wrap rounded-xl bg-dark-background px-4 py-3 text-xs text-slate-100 dark:bg-slate-900/80";

const AdminDeployGuide: React.FC = () => {
  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-border/60 bg-surface p-8 shadow-sm dark:border-dark-border/50 dark:bg-dark-surface">
        <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-primary">
          Guia de deploy
        </span>
        <h1 className="mt-4 text-3xl font-semibold text-foreground">Publicar o CRM Jurídico em uma VPS do zero</h1>
        <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
          Este passo a passo presume uma VPS nova (Ubuntu Server 22.04) e domínio <strong>fernandokerber.com</strong>. Exploramos cada etapa: acesso via SSH,
          firewall, dependências, configuração do Laravel + React, Nginx interno e Traefik como reverse proxy com TLS automático.
        </p>
      </header>

      <section className="rounded-3xl border border-border/60 bg-surface p-8 shadow-sm dark:border-dark-border/50 dark:bg-dark-surface">
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-foreground"><ShieldCheck className="h-5 w-5 text-primary" /> 1. Preparativos & visão geral</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2 text-sm text-muted-foreground">
            <h3 className="text-sm font-semibold text-foreground">Checklist antes de começar</h3>
            <ul className="list-disc space-y-2 pl-5">
              <li>VPS (Ubuntu 22.04) com usuário sudo habilitado e acesso via <code>ssh usuario@IP</code>.</li>
              <li>Acesso ao DNS do domínio para criar registros A/CAA.</li>
              <li>Chaves SSH configuradas (evite senha). Caso não tenha, gere com <code>ssh-keygen</code>.</li>
              <li>Hostname configurado: <code>sudo hostnamectl set-hostname vps-crm</code>.</li>
            </ul>
          </div>
          <div className="space-y-3 rounded-2xl border border-slate-300/70 bg-slate-50/60 p-4 text-xs text-slate-700 dark:border-dark-border/40 dark:bg-dark-background/60 dark:text-slate-200">
            <strong>Subdomínios sugeridos</strong>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li><code>app.fernandokerber.com</code> &rarr; frontend React.</li>
              <li><code>api.fernandokerber.com</code> &rarr; backend Laravel.</li>
              <li>Ambos apontando para o IP público da VPS (registro A).</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border/60 bg-surface p-8 shadow-sm dark:border-dark-border/50 dark:bg-dark-surface">
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-foreground"><Lock className="h-5 w-5 text-primary" /> 2. Acesso remoto e firewall</h2>
        <ol className="mt-4 list-decimal space-y-3 pl-6 text-sm text-muted-foreground">
          <li>Conecte-se: <code>ssh usuario@IP_DA_VPS</code>.</li>
          <li>Atualize o sistema:<pre className={codeClass}>{`sudo apt update && sudo apt upgrade -y`}</pre></li>
          <li>Instale utilitários básicos:<pre className={codeClass}>{`sudo apt install -y build-essential curl wget git ufw unzip htop`}</pre></li>
          <li>Configuração do UFW (firewall):
            <pre className={codeClass}>{`sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status verbose`}</pre>
            Após isso, mantenha o terminal aberto para confirmar que o acesso SSH permanece ativo.
          </li>
        </ol>
      </section>

      <section className="rounded-3xl border border-border/60 bg-surface p-8 shadow-sm dark:border-dark-border/50 dark:bg-dark-surface">
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-foreground"><TerminalSquare className="h-5 w-5 text-primary" /> 3. Dependências do servidor</h2>
        <div className="mt-4 space-y-4 text-sm text-muted-foreground">
          <div>
            <h3 className="font-semibold text-foreground">PHP 8.2 + Composer</h3>
            <pre className={codeClass}>{`sudo add-apt-repository ppa:ondrej/php -y
sudo apt update
sudo apt install -y php8.2 php8.2-fpm php8.2-cli php8.2-common \
php8.2-mbstring php8.2-xml php8.2-curl php8.2-zip php8.2-mysql \
php8.2-bcmath php8.2-gd
curl -sS https://getcomposer.org/installer -o composer-setup.php
sudo php composer-setup.php --install-dir=/usr/local/bin --filename=composer`}</pre>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Node.js 20 + npm</h3>
            <pre className={codeClass}>{`curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v && npm -v`}</pre>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">MySQL/MariaDB</h3>
            <pre className={codeClass}>{`sudo apt install -y mysql-server
sudo mysql_secure_installation
sudo mysql -e "CREATE DATABASE crmjuridico CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER 'crm_user'@'localhost' IDENTIFIED BY 'senha-segura';"
sudo mysql -e "GRANT ALL PRIVILEGES ON crmjuridico.* TO 'crm_user'@'localhost';"`}</pre>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border/60 bg-surface p-8 shadow-sm dark:border-dark-border/50 dark:bg-dark-surface">
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-foreground"><CloudCog className="h-5 w-5 text-primary" /> 4. Estrutura de diretórios e repositório</h2>
        <ol className="mt-4 list-decimal space-y-3 pl-6 text-sm text-muted-foreground">
          <li>Defina o diretório base:<pre className={codeClass}>{`sudo mkdir -p /var/www
cd /var/www
sudo git clone https://github.com/seu-usuario/seu-repo.git crm-juridico
sudo chown -R $USER:$USER crm-juridico`}</pre></li>
          <li>Estrutura esperada:<pre className={codeClass}>{`/var/www/crm-juridico
└── dev/crm
    ├── backend    # Laravel
    └── frontend   # React + Vite`}</pre></li>
        </ol>
      </section>

      <section className="rounded-3xl border border-border/60 bg-surface p-8 shadow-sm dark:border-dark-border/50 dark:bg-dark-surface">
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-foreground"><Database className="h-5 w-5 text-primary" /> 5. Configuração do backend Laravel</h2>
        <ol className="mt-4 list-decimal space-y-3 pl-6 text-sm text-muted-foreground">
          <li>Entre no diretório:<pre className={codeClass}>{`cd /var/www/crm-juridico/dev/crm/backend`}</pre></li>
          <li>Dependências e ambiente:<pre className={codeClass}>{`composer install --optimize-autoloader --no-dev
cp .env.example .env`}</pre></li>
          <li>Edição do <code>.env</code> (trecho principal):
            <pre className={codeClass}>{`APP_NAME="CRM Juridico"
APP_ENV=production
APP_KEY=
APP_URL=https://api.fernandokerber.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=crmjuridico
DB_USERNAME=crm_user
DB_PASSWORD=senha-segura

QUEUE_CONNECTION=database
SESSION_DRIVER=file
CACHE_DRIVER=file`}</pre>
          </li>
          <li>Finalize setup:<pre className={codeClass}>{`php artisan key:generate
php artisan migrate --force
php artisan db:seed --force   # se desejar popular dados padrões
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache`}</pre></li>
        </ol>
      </section>

      <section className="rounded-3xl border border-border/60 bg-surface p-8 shadow-sm dark:border-dark-border/50 dark:bg-dark-surface">
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-foreground"><PlugZap className="h-5 w-5 text-primary" /> 6. Build do frontend React</h2>
        <ol className="mt-4 list-decimal space-y-3 pl-6 text-sm text-muted-foreground">
          <li>Instale dependências e configure a URL da API:<pre className={codeClass}>{`cd /var/www/crm-juridico/dev/crm/frontend
npm install
cp .env.example .env.development.local  # se existir
cat <<'ENV' > .env.production
VITE_API_BASE_URL=https://api.fernandokerber.com
ENV`}</pre></li>
          <li>Build de produção:<pre className={codeClass}>{`npm run build`}</pre></li>
          <li>Copie os arquivos compilados:<pre className={codeClass}>{`sudo mkdir -p /var/www/crm-frontend
sudo cp -r dist/* /var/www/crm-frontend/
sudo chown -R www-data:www-data /var/www/crm-frontend`}</pre></li>
        </ol>
      </section>

      <section className="rounded-3xl border border-border/60 bg-surface p-8 shadow-sm dark:border-dark-border/50 dark:bg-dark-surface">
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-foreground"><Globe className="h-5 w-5 text-primary" /> 7. Nginx interno (portas 8081/8082)</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Nginx servirá a aplicação internamente. Traefik fará o proxy público apontando para essas portas.
        </p>
        <div className="mt-4 space-y-4 text-sm text-muted-foreground">
          <div>
            <h3 className="font-semibold text-foreground">API Laravel (8081)</h3>
            <pre className={codeClass}>{`sudo tee /etc/nginx/sites-available/api-crm <<'CONF'
server {
    listen 8081;
    server_name api.internal;

    root /var/www/crm-juridico/dev/crm/backend/public;
    index index.php index.html;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \\.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.2-fpm.sock;
    }

    location ~ /\.ht {
        deny all;
    }
}
CONF
sudo ln -s /etc/nginx/sites-available/api-crm /etc/nginx/sites-enabled/api-crm`}</pre>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Frontend estático (8082)</h3>
            <pre className={codeClass}>{`sudo tee /etc/nginx/sites-available/app-crm <<'CONF'
server {
    listen 8082;
    server_name app.internal;

    root /var/www/crm-frontend;
    index index.html;

    location / {
        try_files $uri /index.html;
    }
}
CONF
sudo ln -s /etc/nginx/sites-available/app-crm /etc/nginx/sites-enabled/app-crm`}</pre>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Testar e aplicar</h3>
            <pre className={codeClass}>{`sudo nginx -t
sudo systemctl reload nginx`}</pre>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border/60 bg-surface p-8 shadow-sm dark:border-dark-border/50 dark:bg-dark-surface">
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-foreground"><Globe className="h-5 w-5 text-primary" /> 8. Traefik como reverse proxy</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Traefik ficará na porta 80/443, emitirá certificados e encaminhará tráfego para as portas internas 8081 (API) e 8082 (App).
        </p>
        <div className="mt-4 space-y-4 text-sm text-muted-foreground">
          <div>
            <h3 className="font-semibold text-foreground">Instalação e estrutura</h3>
            <pre className={codeClass}>{`cd ~
wget https://github.com/traefik/traefik/releases/download/v2.10.6/traefik_v2.10.6_linux_amd64.tar.gz
sudo tar -xzf traefik_v2.10.6_linux_amd64.tar.gz -C /usr/local/bin traefik
sudo mkdir -p /etc/traefik/dynamic
sudo touch /etc/traefik/acme.json
sudo chmod 600 /etc/traefik/acme.json`}</pre>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Configuração estática (<code>/etc/traefik/traefik.yml</code>)</h3>
            <pre className={codeClass}>{`sudo tee /etc/traefik/traefik.yml <<'CONF'
entryPoints:
  web:
    address: ":80"
  websecure:
    address: ":443"

providers:
  file:
    directory: /etc/traefik/dynamic
    watch: true

certificatesResolvers:
  letsencrypt:
    acme:
      email: contato@fernandokerber.com
      storage: /etc/traefik/acme.json
      httpChallenge:
        entryPoint: web

log:
  level: INFO
accessLog: {}
CONF`}</pre>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Configuração dinâmica (<code>/etc/traefik/dynamic/routes.yml</code>)</h3>
            <pre className={codeClass}>{`sudo tee /etc/traefik/dynamic/routes.yml <<'CONF'
http:
  routers:
    api-router:
      rule: "Host(\`api.fernandokerber.com\`)"
      entryPoints: ["websecure"]
      service: api-service
      tls:
        certResolver: letsencrypt
    app-router:
      rule: "Host(\`fernandokerber.com\`, \`www.fernandokerber.com\`)"
      entryPoints: ["websecure"]
      service: app-service
      tls:
        certResolver: letsencrypt
  middlewares:
    https-redirect:
      redirectScheme:
        scheme: https
        permanent: true
  services:
    api-service:
      loadBalancer:
        servers:
          - url: "http://127.0.0.1:8081"
    app-service:
      loadBalancer:
        servers:
          - url: "http://127.0.0.1:8082"
CONF`}</pre>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Systemd unit (<code>/etc/systemd/system/traefik.service</code>)</h3>
            <pre className={codeClass}>{`sudo tee /etc/systemd/system/traefik.service <<'CONF'
[Unit]
Description=Traefik Reverse Proxy
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/traefik --configFile=/etc/traefik/traefik.yml
Restart=on-failure

[Install]
WantedBy=multi-user.target
CONF
sudo systemctl daemon-reload
sudo systemctl enable traefik
sudo systemctl start traefik
sudo systemctl status traefik --no-pager`}</pre>
          </div>
        </div>
        <div className="mt-4 rounded-2xl border border-slate-300/60 bg-slate-50/70 p-4 text-xs text-slate-700 dark:border-dark-border/40 dark:bg-dark-background/60 dark:text-slate-200">
          <strong>DNS</strong>: aponte <code>app.fernandokerber.com</code> e <code>api.fernandokerber.com</code> para o IP da VPS. Aguarde propagação antes de testar HTTPS.
        </div>
      </section>

      <section className="rounded-3xl border border-border/60 bg-surface p-8 shadow-sm dark:border-dark-border/50 dark:bg-dark-surface">
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-foreground"><Zap className="h-5 w-5 text-primary" /> 9. Rotinas em background</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2 text-sm text-muted-foreground">
            <h3 className="font-semibold text-foreground">Scheduler (cron)</h3>
            <p>Execute <code>crontab -e</code> e adicione:</p>
            <pre className={codeClass}>{`* * * * * cd /var/www/crm-juridico/dev/crm/backend && php artisan schedule:run >> /dev/null 2>&1`}</pre>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <h3 className="font-semibold text-foreground">Filas com Supervisor</h3>
            <pre className={codeClass}>{`sudo apt install -y supervisor
sudo tee /etc/supervisor/conf.d/crm-queue.conf <<'CONF'
[program:crm-queue]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/crm-juridico/dev/crm/backend/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
user=www-data
numprocs=1
redirect_stderr=true
stdout_logfile=/var/www/crm-juridico/dev/crm/backend/storage/logs/queue.log
CONF
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start crm-queue:*`}</pre>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border/60 bg-surface p-8 shadow-sm dark:border-dark-border/50 dark:bg-dark-surface">
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-foreground"><CheckCircle2 className="h-5 w-5 text-primary" /> 10. Checklist final</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Firewall ativo (UFW) permitindo apenas portas 22, 80 e 443.</li>
          <li>Nginx interno ouvindo nas portas 8081/8082 e respondendo a <code>curl http://127.0.0.1:8081</code>.</li>
          <li>Traefik rodando (<code>systemctl status traefik</code>) e certificados emitidos (<code>/etc/traefik/acme.json</code> atualizado).</li>
          <li>DNS do domínio apontando corretamente para a VPS.</li>
          <li>Scheduler e Supervisor ativos executando comandos <code>schedule:run</code> e workers de fila.</li>
          <li>Backup do banco configurado (ex.: <code>mysqldump</code> diário via cron).</li>
        </ul>
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-300/60 bg-amber-50/70 p-4 text-xs text-amber-800 dark:border-amber-500/50 dark:bg-amber-900/30 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4" />
          <p>Primeiro acesso: cadastre uma conta admin via painel geral (rota <code>/admin/login</code>) usando as credenciais padrão ou criadas via seed. Em seguida gere os tenants e credenciais de cada workspace.</p>
        </div>
      </section>

      <section className="rounded-3xl border border-border/60 bg-surface p-8 shadow-sm dark:border-dark-border/50 dark:bg-dark-surface">
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-foreground"><LifeBuoy className="h-5 w-5 text-primary" /> 11. Diagnóstico rápido</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li><strong>Erro 502/504:</strong> verifique logs de Traefik (<code>journalctl -u traefik</code>) e Nginx (<code>/var/log/nginx/</code>).</li>
          <li><strong>HTTPS falhou:</strong> confirme DNS propagado e portas 80/443 liberadas. Rode <code>sudo certbot renew --dry-run</code>.</li>
          <li><strong>Laravel 500:</strong> cheque <code>/var/www/crm-juridico/dev/crm/backend/storage/logs/laravel.log</code>.</li>
          <li><strong>Build React desatualizado:</strong> refaça <code>npm run build</code> e copie novamente para <code>/var/www/crm-frontend</code>.</li>
        </ul>
      </section>
    </div>
  );
};

export default AdminDeployGuide;
