import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApiClient } from '../../services/adminApi';
import { ApiError } from '../../services/api';
import { useAdminAuth } from '../../store/AdminAuthContext';
import { Tenant } from '../../types/types';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';

interface AiSettingsResponse {
  model?: string | null;
  openai_key?: string | null;
  prompt?: string | null;
}

const mapTenantFromApi = (raw: any): Tenant => ({
  id: Number(raw?.id) ?? 0,
  name: typeof raw?.name === 'string' ? raw.name : 'Tenant',
  slug: typeof raw?.slug === 'string' ? raw.slug : '',
  status: typeof raw?.status === 'string' ? raw.status : 'active',
  createdAt: typeof raw?.created_at === 'string' ? raw.created_at : undefined,
  updatedAt: typeof raw?.updated_at === 'string' ? raw.updated_at : undefined,
  usersCount: typeof raw?.users_count === 'number' ? raw.users_count : undefined,
});

const AdminAiSettings: React.FC = () => {
  const { token, logout } = useAdminAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [model, setModel] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [prompt, setPrompt] = useState('');

  const selectedTenant = useMemo(
    () => tenants.find(tenant => tenant.id === selectedTenantId) ?? null,
    [selectedTenantId, tenants]
  );

  const fetchTenants = useCallback(async () => {
    if (!token) {
      return;
    }
    setLoadingTenants(true);
    setError(null);
    try {
      const response = await adminApiClient.get<any[]>('tenants', token);
      const mapped = Array.isArray(response) ? response.map(mapTenantFromApi) : [];
      setTenants(mapped);
      if (mapped.length > 0 && !selectedTenantId) {
        setSelectedTenantId(mapped[0].id);
      } else if (mapped.length === 0) {
        setSelectedTenantId(null);
      } else if (selectedTenantId && !mapped.some(item => item.id === selectedTenantId)) {
        setSelectedTenantId(mapped[0]?.id ?? null);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401 || err.status === 403) {
          await logout();
          return;
        }
        setError(err.message || 'Falha ao carregar a lista de tenants.');
      } else {
        setError('Não foi possível carregar a lista de tenants.');
      }
    } finally {
      setLoadingTenants(false);
    }
  }, [logout, selectedTenantId, token]);

  const fetchAiSettings = useCallback(async (tenantId: number) => {
    if (!token) {
      return;
    }
    setLoadingSettings(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await adminApiClient.get<AiSettingsResponse>(`tenants/${tenantId}/ai-settings`, token);
      setModel(typeof response?.model === 'string' ? response.model : '');
      setOpenaiKey(typeof response?.openai_key === 'string' ? response.openai_key : '');
      setPrompt(typeof response?.prompt === 'string' ? response.prompt : '');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401 || err.status === 403) {
          await logout();
          return;
        }
        setError(err.message || 'Falha ao carregar as configurações de IA.');
      } else {
        setError('Não foi possível carregar as configurações de IA.');
      }
      setModel('');
      setOpenaiKey('');
      setPrompt('');
    } finally {
      setLoadingSettings(false);
    }
  }, [logout, token]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  useEffect(() => {
    if (selectedTenantId) {
      fetchAiSettings(selectedTenantId);
    } else {
      setModel('');
      setOpenaiKey('');
      setPrompt('');
    }
  }, [fetchAiSettings, selectedTenantId]);

  const handleSave = useCallback(async () => {
    if (!token) {
      setError('Sessão administrativa inválida.');
      return;
    }

    if (!selectedTenantId) {
      setError('Selecione um tenant para configurar.');
      return;
    }

    if (!model.trim() || !openaiKey.trim() || !prompt.trim()) {
      setError('Preencha todos os campos antes de salvar.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await adminApiClient.put(`tenants/${selectedTenantId}/ai-settings`, {
        model: model.trim(),
        openai_key: openaiKey.trim(),
        prompt: prompt.trim(),
      }, token);
      setSuccess('Configurações salvas com sucesso.');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401 || err.status === 403) {
          await logout();
          return;
        }

        let validationMessage = '';
        if (typeof err.data === 'object' && err.data) {
          if ('message' in (err.data as Record<string, unknown>)) {
            validationMessage = String((err.data as Record<string, unknown>).message ?? '');
          }
          if (!validationMessage && 'errors' in (err.data as Record<string, unknown>)) {
            const errors = (err.data as { errors?: Record<string, string[] | string> }).errors;
            if (errors) {
              const firstError = Object.values(errors).flat().find(Boolean);
              if (typeof firstError === 'string') {
                validationMessage = firstError;
              }
            }
          }
        }
        setError(validationMessage || err.message || 'Não foi possível salvar as configurações.');
      } else {
        setError('Não foi possível salvar as configurações.');
      }
    } finally {
      setSaving(false);
    }
  }, [logout, model, openaiKey, prompt, selectedTenantId, token]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Admin &mdash; Tenants
        </p>
        <h1 className="mt-2 text-[26px] font-semibold tracking-tight">Configurações de IA</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Escolha o tenant e gerencie o modelo, a chave da OpenAI e o prompt usado para gerar insights.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tenant</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loadingTenants ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner size="sm" />
              <span>Carregando lista de tenants...</span>
            </div>
          ) : tenants.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum tenant cadastrado até o momento. Crie um tenant para configurar a integração de IA.
            </p>
          ) : (
            <label className="flex flex-col gap-2 text-sm font-medium text-muted-foreground dark:text-dark-muted">
              Selecione o tenant
              <select
                value={selectedTenantId ?? ''}
                onChange={event => setSelectedTenantId(event.target.value ? Number(event.target.value) : null)}
                className="h-11 rounded-lg border border-border/60 bg-background px-3 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/70 dark:bg-dark-card dark:text-dark-foreground"
              >
                {tenants.map(tenant => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name} &mdash; {tenant.slug}
                  </option>
                ))}
              </select>
            </label>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuração do motor de IA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedTenant ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-muted-foreground dark:text-dark-muted">
                  Modelo
                  <input
                    type="text"
                    value={model}
                    onChange={event => setModel(event.target.value)}
                    placeholder="ex: gpt-4o, gpt-5-2025-08-07"
                    className="h-11 rounded-lg border border-border/60 bg-background px-3 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/70 dark:bg-dark-card dark:text-dark-foreground"
                    disabled={loadingSettings || saving}
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium text-muted-foreground dark:text-dark-muted">
                  OpenAI API Key
                  <input
                    type="text"
                    value={openaiKey}
                    onChange={event => setOpenaiKey(event.target.value)}
                    placeholder="sk-..."
                    className="h-11 rounded-lg border border-border/60 bg-background px-3 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/70 dark:bg-dark-card dark:text-dark-foreground"
                    disabled={loadingSettings || saving}
                  />
                </label>
              </div>

              <label className="flex flex-col gap-2 text-sm font-medium text-muted-foreground dark:text-dark-muted">
                Prompt
                <textarea
                  value={prompt}
                  onChange={event => setPrompt(event.target.value)}
                  rows={8}
                  className="rounded-lg border border-border/60 bg-background px-3 py-3 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/70 dark:bg-dark-card dark:text-dark-foreground"
                  placeholder="Descreva o prompt padrão a ser utilizado pelo modelo..."
                  disabled={loadingSettings || saving}
                />
              </label>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm">
                  {error && (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
                      {error}
                    </p>
                  )}
                  {success && !error && (
                    <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-600 dark:border-green-500/40 dark:bg-green-500/10 dark:text-green-200">
                      {success}
                    </p>
                  )}
                  {loadingSettings && !error && !success && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Spinner size="sm" />
                      <span>Carregando configurações do tenant selecionado...</span>
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || loadingSettings}
                >
                  {saving ? 'Salvando...' : 'Salvar configurações'}
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Selecione um tenant para editar suas configurações de IA.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAiSettings;
