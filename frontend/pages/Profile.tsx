import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { useAuth } from '../store/AuthContext';
import { useApp } from '../store/AppContext';
import { User } from '../types/types';

type FeedbackState = { type: 'success' | 'error'; message: string } | null;

const emptyForm = (user?: User) => ({
  name: user?.name ?? '',
  email: user?.email ?? '',
  avatar: user?.avatar ?? '',
  jobTitle: user?.jobTitle ?? '',
  personalEmail: user?.personalEmail ?? '',
  phone: user?.phone ?? '',
  secondaryPhone: user?.secondaryPhone ?? '',
  whatsapp: user?.whatsapp ?? '',
  address: user?.address ?? '',
  city: user?.city ?? '',
  state: user?.state ?? '',
  postalCode: user?.postalCode ?? '',
  birthdate: user?.birthdate ?? '',
  linkedinUrl: user?.linkedinUrl ?? '',
  instagramUrl: user?.instagramUrl ?? '',
  bio: user?.bio ?? '',
});

const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { updateUserCache } = useApp();
  const [form, setForm] = useState(emptyForm(user || undefined));
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  useEffect(() => {
    setForm(emptyForm(user || undefined));
  }, [user]);

  const avatarPreview = useMemo(() => {
    if (form.avatar && form.avatar.trim().length > 0) {
      return form.avatar.trim();
    }
    return user?.avatar ?? '';
  }, [form.avatar, user]);

  if (!user) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Spinner />
          Carregando perfil...
        </div>
      </div>
    );
  }

  const handleChange = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    setFeedback(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setFeedback(null);
    try {
      const payloadEntries = (Object.entries(form) as [keyof typeof form, string][])
        .map(([key, value]) => [key, value.trim() === '' ? undefined : value] as const)
        .filter(([, value]) => value !== undefined);

      const payload = Object.fromEntries(payloadEntries) as Partial<Omit<User, 'id'>>;

      const updated = await updateProfile(payload);
      updateUserCache(updated);
      setFeedback({
        type: 'success',
        message: 'Perfil atualizado com sucesso!',
      });
      setForm(emptyForm(updated));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar o perfil. Tente novamente.';
      setFeedback({
        type: 'error',
        message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-[24px] font-semibold tracking-tight">Meu perfil</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie suas informações pessoais, contatos e presença digital.
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <Card className="border border-border/70 shadow-sm">
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Informações pessoais</CardTitle>
              <CardDescription>Atualize dados básicos, foto e apresentação.</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative h-16 w-16 overflow-hidden rounded-full border border-border/50 bg-muted/20">
                {avatarPreview ? (
                  <img src={avatarPreview} alt={form.name || user.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                    Sem foto
                  </div>
                )}
              </div>
              <div className="space-y-2 text-xs text-muted-foreground">
                <span className="font-semibold uppercase tracking-[0.3em] text-primary/70">
                  avatar
                </span>
                <p>Informe a URL de uma imagem quadrada ou use o campo abaixo para alterar.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-muted-foreground">Nome completo</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={handleChange('name')}
                className="w-full rounded-lg border border-border/60 bg-white px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30 dark:bg-dark-background/70 dark:text-dark-foreground"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">E-mail corporativo</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={handleChange('email')}
                className="w-full rounded-lg border border-border/60 bg-white px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30 dark:bg-dark-background/70 dark:text-dark-foreground"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Cargo / Função</label>
              <input
                type="text"
                value={form.jobTitle}
                onChange={handleChange('jobTitle')}
                placeholder="Ex: Coordenador Jurídico"
                className="w-full rounded-lg border border-border/60 bg-white px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30 dark:bg-dark-background/70 dark:text-dark-foreground"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Data de nascimento</label>
              <input
                type="date"
                value={form.birthdate}
                onChange={handleChange('birthdate')}
                className="w-full rounded-lg border border-border/60 bg-white px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30 dark:bg-dark-background/70 dark:text-dark-foreground"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">URL do avatar</label>
              <input
                type="url"
                value={form.avatar}
                onChange={handleChange('avatar')}
                placeholder="https://..."
                className="w-full rounded-lg border border-border/60 bg-white px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30 dark:bg-dark-background/70 dark:text-dark-foreground"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-muted-foreground">Bio / apresentação</label>
              <textarea
                rows={4}
                value={form.bio}
                onChange={handleChange('bio')}
                placeholder="Conte um pouco sobre sua experiência e atuação."
                className="w-full rounded-lg border border-border/60 bg-white px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30 dark:bg-dark-background/70 dark:text-dark-foreground"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Informações de contato</CardTitle>
            <CardDescription>Dados pessoais e telefones para contato direto.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">E-mail pessoal</label>
              <input
                type="email"
                value={form.personalEmail}
                onChange={handleChange('personalEmail')}
                placeholder="nome@email.com"
                className="w-full rounded-lg border border-border/60 bg-white px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30 dark:bg-dark-background/70 dark:text-dark-foreground"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Telefone principal</label>
              <input
                type="tel"
                value={form.phone}
                onChange={handleChange('phone')}
                placeholder="(00) 00000-0000"
                className="w-full rounded-lg border border-border/60 bg-white px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30 dark:bg-dark-background/70 dark:text-dark-foreground"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Telefone alternativo</label>
              <input
                type="tel"
                value={form.secondaryPhone}
                onChange={handleChange('secondaryPhone')}
                placeholder="(00) 00000-0000"
                className="w-full rounded-lg border border-border/60 bg-white px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30 dark:bg-dark-background/70 dark:text-dark-foreground"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">WhatsApp</label>
              <input
                type="tel"
                value={form.whatsapp}
                onChange={handleChange('whatsapp')}
                placeholder="+55 00 00000-0000"
                className="w-full rounded-lg border border-border/60 bg-white px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30 dark:bg-dark-background/70 dark:text-dark-foreground"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-muted-foreground">Endereço</label>
              <input
                type="text"
                value={form.address}
                onChange={handleChange('address')}
                placeholder="Rua, número, complemento"
                className="w-full rounded-lg border border-border/60 bg-white px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30 dark:bg-dark-background/70 dark:text-dark-foreground"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Cidade</label>
              <input
                type="text"
                value={form.city}
                onChange={handleChange('city')}
                className="w-full rounded-lg border border-border/60 bg-white px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30 dark:bg-dark-background/70 dark:text-dark-foreground"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Estado</label>
              <input
                type="text"
                value={form.state}
                onChange={handleChange('state')}
                className="w-full rounded-lg border border-border/60 bg-white px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30 dark:bg-dark-background/70 dark:text-dark-foreground"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">CEP</label>
              <input
                type="text"
                value={form.postalCode}
                onChange={handleChange('postalCode')}
                placeholder="00000-000"
                className="w-full rounded-lg border border-border/60 bg-white px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30 dark:bg-dark-background/70 dark:text-dark-foreground"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Presença digital</CardTitle>
            <CardDescription>Links profissionais e redes sociais.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">LinkedIn</label>
              <input
                type="url"
                value={form.linkedinUrl}
                onChange={handleChange('linkedinUrl')}
                placeholder="https://linkedin.com/in/usuario"
                className="w-full rounded-lg border border-border/60 bg-white px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30 dark:bg-dark-background/70 dark:text-dark-foreground"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Instagram</label>
              <input
                type="url"
                value={form.instagramUrl}
                onChange={handleChange('instagramUrl')}
                placeholder="https://instagram.com/usuario"
                className="w-full rounded-lg border border-border/60 bg-white px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30 dark:bg-dark-background/70 dark:text-dark-foreground"
              />
            </div>
          </CardContent>
        </Card>

        {feedback && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              feedback.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-600'
            }`}
          >
            {feedback.message}
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <Button
            type="submit"
            disabled={isSaving}
            className="flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            {isSaving ? (
              <>
                <Spinner size="sm" />
                Salvando
              </>
            ) : (
              'Salvar alterações'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
