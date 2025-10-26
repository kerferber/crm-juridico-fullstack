import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import {
  Heart,
  MessageCircle,
  Send,
  Trash2,
  ImageIcon,
  Feather,
  X,
  Sparkles,
  Users,
  Flame,
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { useAuth } from '../store/AuthContext';
import { MentionReference, SocialPost } from '../types/types';
import { Button } from '../components/ui/Button';
import MentionTextarea from '../components/inputs/MentionTextarea';
import MentionBadges from '../components/mentions/MentionBadges';
import { cn } from '../lib/utils';

const MAX_CONTENT_LENGTH = 2000;
const BLOCKED_IMAGE_HOSTS = ['via.placeholder.com', 'placehold.it'];

const sanitizeSocialImageUrl = (url?: string | null) => {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  try {
    const base = typeof window === 'undefined' ? 'http://localhost' : window.location.origin;
    const parsed = new URL(trimmed, base);
    const hostname = parsed.hostname?.toLowerCase() ?? '';
    const isBlocked = BLOCKED_IMAGE_HOSTS.some(blocked => hostname === blocked || hostname.endsWith(`.${blocked}`));
    if (isBlocked) {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
};

const getInitials = (name?: string | null) =>
  (name ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('');

const getPostPreview = (post: SocialPost) => {
  if (post.content) {
    const copy = post.content.replace(/\s+/g, ' ').trim();
    if (copy.length === 0) {
      return post.imageUrl ? 'Compartilhou uma imagem' : 'Nova atualização publicada';
    }
    return copy.length > 80 ? `${copy.slice(0, 80)}…` : copy;
  }
  if (post.imageUrl) {
    return 'Compartilhou uma imagem';
  }
  return 'Nova atualização publicada';
};

const Social: React.FC = () => {
  const {
    socialPosts,
    createSocialPost,
    deleteSocialPost,
    toggleSocialPostLike,
    addSocialComment,
    deleteSocialComment,
    users,
    contacts,
  } = useApp();
  const { user } = useAuth();

  const [composerText, setComposerText] = useState('');
  const [composerMentions, setComposerMentions] = useState<MentionReference[]>([]);
  const [composerImage, setComposerImage] = useState<File | null>(null);
  const [composerPreview, setComposerPreview] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const dropzoneRef = useRef<HTMLLabelElement | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});
  const [commentMentions, setCommentMentions] = useState<Record<number, MentionReference[]>>({});
  const [commentSubmitting, setCommentSubmitting] = useState<Record<number, boolean>>({});

  useEffect(() => {
    return () => {
      if (composerPreview) {
        URL.revokeObjectURL(composerPreview);
      }
    };
  }, [composerPreview]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (composerPreview) {
      URL.revokeObjectURL(composerPreview);
    }
    if (file) {
      setComposerImage(file);
      setComposerPreview(URL.createObjectURL(file));
    } else {
      setComposerImage(null);
      setComposerPreview(null);
    }
  };

  const resetComposer = () => {
    setComposerText('');
    setComposerMentions([]);
    setComposerImage(null);
    if (composerPreview) {
      URL.revokeObjectURL(composerPreview);
    }
    setComposerPreview(null);
  };

  const handlePublish = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPublishing) return;
    setIsPublishing(true);
    try {
      await createSocialPost({
        content: composerText,
        image: composerImage,
        mentions: composerMentions,
      });
      resetComposer();
      setIsComposerOpen(false);
    } finally {
      setIsPublishing(false);
    }
  };

  const setCommentDraft = useCallback((postId: number, value: string) => {
    setCommentDrafts(prev => ({ ...prev, [postId]: value }));
  }, []);

  const handleSubmitComment = async (postId: number) => {
    const draft = commentDrafts[postId]?.trim();
    if (!draft || commentSubmitting[postId]) return;
    setCommentSubmitting(prev => ({ ...prev, [postId]: true }));
    try {
      await addSocialComment(postId, draft, commentMentions[postId] ?? []);
      setCommentDrafts(prev => ({ ...prev, [postId]: '' }));
      setCommentMentions(prev => ({ ...prev, [postId]: [] }));
    } finally {
      setCommentSubmitting(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!window.confirm('Remover esta publicação?')) return;
    await deleteSocialPost(postId);
    setCommentDrafts(prev => {
      const next = { ...prev };
      delete next[postId];
      return next;
    });
    setCommentMentions(prev => {
      const next = { ...prev };
      delete next[postId];
      return next;
    });
  };

  const handleDeleteComment = async (post: SocialPost, commentId: number) => {
    if (!window.confirm('Remover este comentário?')) return;
    await deleteSocialComment(post.id, commentId);
  };

  const orderedPosts = useMemo(() =>
    [...socialPosts].sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()),
  [socialPosts]
  );

  const postsToday = useMemo(() => {
    const today = dayjs();
    return orderedPosts.filter(post => dayjs(post.createdAt).isSame(today, 'day')).length;
  }, [orderedPosts]);

  const totalComments = useMemo(
    () => orderedPosts.reduce((acc, post) => acc + post.comments.length, 0),
    [orderedPosts]
  );

  const mediaPosts = useMemo(
    () => orderedPosts.filter(post => Boolean(sanitizeSocialImageUrl(post.imageUrl))).length,
    [orderedPosts]
  );

  const totalMentions = useMemo(
    () =>
      orderedPosts.reduce((total, post) => {
        const postMentions = post.mentions?.length ?? 0;
        const commentMentions = post.comments.reduce(
          (sum, comment) => sum + (comment.mentions?.length ?? 0),
          0
        );
        return total + postMentions + commentMentions;
      }, 0),
    [orderedPosts]
  );

  const activeContributors = useMemo(() => {
    const unique = new Set<number>();
    orderedPosts.forEach(post => unique.add(post.userId));
    return unique.size;
  }, [orderedPosts]);

  const contributorsToday = useMemo(() => {
    const unique = new Set<number>();
    const today = dayjs();
    orderedPosts.forEach(post => {
      if (dayjs(post.createdAt).isSame(today, 'day')) {
        unique.add(post.userId);
      }
      post.comments.forEach(comment => {
        if (dayjs(comment.createdAt).isSame(today, 'day')) {
          unique.add(comment.userId);
        }
      });
    });
    return unique.size;
  }, [orderedPosts]);

  const topContributors = useMemo(
    () => {
      const contributions = new Map<number, { count: number; name: string; avatar?: string | null }>();
      orderedPosts.forEach(post => {
        const current = contributions.get(post.userId);
        contributions.set(post.userId, {
          count: (current?.count ?? 0) + 1,
          name: post.user?.name ?? 'Usuário',
          avatar: post.user?.avatar,
        });
      });
      return [...contributions.entries()]
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 3)
        .map(([userId, data]) => ({ userId, ...data }));
    },
    [orderedPosts]
  );

  const latestSnapshots = useMemo(
    () =>
      orderedPosts.slice(0, 4).map(post => ({
        id: post.id,
        author: post.user?.name ?? 'Usuário',
        preview: getPostPreview(post),
        timeAgo: dayjs(post.createdAt).fromNow(),
      })),
    [orderedPosts]
  );

  const publishingTips = useMemo(
    () => [
      {
        title: 'Celebrar vitórias',
        description: 'Compartilhe conquistas do time e reconheça quem participou com @menções.',
      },
      {
        title: 'Bastidores rápidos',
        description: 'Conte aprendizados de audiências e bastidores que ajudam o restante do escritório.',
      },
      {
        title: 'Contexto visual',
        description: 'Fotos e anexos deixam o feed mais humano. Combine com notas curtas e objetivas.',
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-border/60 bg-white px-5 py-4 shadow-sm dark:border-dark-border/60 dark:bg-dark-card/70">
        <div className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Feed interno
          </span>
          <h1 className="text-2xl font-semibold text-foreground dark:text-dark-foreground">
            Atualizações sofisticadas, com foco no conteúdo.
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Abra o feed e veja imediatamente as últimas conversas, menções e conquistas do time. Publique em segundos
            ou acompanhe quem já interagiu hoje.
          </p>
        </div>
        <div className="hero-actions hero-actions--compact">
          <Button
            type="button"
            className="hero-actions__primary gap-2 rounded-full"
            onClick={() => setIsComposerOpen(true)}
          >
            <Feather className="h-4 w-4" />
            Nova publicação
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="hero-actions__secondary gap-2 rounded-full"
            onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
          >
            <MessageCircle className="h-4 w-4" />
            Últimas conversas
          </Button>
          <div className="hero-actions__tools text-xs text-muted-foreground">
            <span>{contributorsToday} ativo{contributorsToday === 1 ? '' : 's'} hoje</span>
            <span className="h-1 w-1 rounded-full bg-border/70" />
            <span>{totalMentions} menções registradas</span>
          </div>
        </div>
      </div>

      {isComposerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="relative w-full max-w-2xl rounded-3xl border border-border/80 bg-white shadow-2xl dark:border-dark-border/60 dark:bg-dark-card/90">
            <button
              type="button"
              onClick={() => {
                resetComposer();
                setIsComposerOpen(false);
              }}
              className="absolute right-4 top-4 rounded-full border border-border/60 p-1 text-muted-foreground transition hover:text-foreground dark:border-dark-border/60"
              title="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
            <form className="flex flex-col gap-4 p-6" onSubmit={handlePublish}>
              <div className="flex items-center gap-3">
                <img
                  src={user?.avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? 'Você')}`}
                  alt="Você"
                  className="h-10 w-10 rounded-full border border-border/60 object-cover dark:border-dark-border/60"
                />
                <div>
                  <p className="text-sm font-semibold text-foreground dark:text-dark-foreground">{user?.name}</p>
                  <p className="text-xs text-muted-foreground dark:text-dark-muted">Compartilhe algo com o time</p>
                </div>
              </div>
              <MentionTextarea
                value={composerText}
                onChange={setComposerText}
                onMentionsChange={setComposerMentions}
                users={users}
                contacts={contacts}
                placeholder="Escreva aqui... use @ para mencionar colegas ou # para clientes"
                minRows={5}
                initialMentions={composerMentions}
              />
              {composerPreview && (
                <div className="max-h-[360px] overflow-hidden rounded-2xl border border-border/60 dark:border-dark-border/60">
                  <img
                    src={composerPreview}
                    alt="Pré-visualização"
                    className="h-auto w-full max-h-[360px] object-contain"
                  />
                </div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label
                  ref={dropzoneRef}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border/60 px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-primary dark:border-dark-border/60 dark:text-dark-muted dark:hover:text-dark-primary"
                >
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  <ImageIcon className="h-4 w-4" />
                  Anexar imagem
                </label>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {composerText.length}/{MAX_CONTENT_LENGTH}
                  <Button type="submit" size="sm" disabled={isPublishing} className="gap-2 rounded-full px-5">
                    <Send className="h-4 w-4" />
                    Publicar
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <section className="social-layout">
        <div className="space-y-4">
          <div className="social-composer-card">
            <div className="flex items-center gap-3">
              <img
                src={user?.avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? 'Você')}`}
                alt="Avatar"
                className="h-12 w-12 rounded-full border border-border/60 object-cover dark:border-dark-border/60"
              />
              <button
                type="button"
                onClick={() => setIsComposerOpen(true)}
                className="flex-1 rounded-full border border-dashed border-border/60 px-4 py-3 text-left text-sm text-muted-foreground transition hover:border-primary/40 hover:text-primary dark:border-dark-border/60"
              >
                Compartilhe um status rápido com o time...
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" className="gap-2 rounded-full" onClick={() => setIsComposerOpen(true)}>
                <Feather className="h-4 w-4" />
                Abrir editor completo
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="gap-2 rounded-full"
                onClick={() => setIsComposerOpen(true)}
              >
                <ImageIcon className="h-4 w-4" />
                Adicionar imagem
              </Button>
            </div>
          </div>

          {orderedPosts.length === 0 ? (
            <div className="social-empty">
              <Sparkles className="h-5 w-5" />
              <p className="text-base font-semibold text-foreground dark:text-dark-foreground">
                Ainda não há publicações
              </p>
              <p className="text-sm text-muted-foreground">
                Traga o primeiro update do dia para inspirar o restante do time.
              </p>
              <Button type="button" className="mt-4 gap-2 rounded-full" onClick={() => setIsComposerOpen(true)}>
                <Feather className="h-4 w-4" />
                Criar primeira publicação
              </Button>
            </div>
          ) : (
            orderedPosts.map(post => {
              const author = post.user;
              const canDelete = user && (post.userId === user.id || user.isTenantAdmin);
              const commentDraft = commentDrafts[post.id] ?? '';
              const safeImageUrl = sanitizeSocialImageUrl(post.imageUrl);
              const badges: string[] = [];
              if (safeImageUrl) {
                badges.push('Com imagem');
              }
              const postMentionsCount = post.mentions?.length ?? 0;
              if (postMentionsCount > 0) {
                badges.push(`${postMentionsCount} menção${postMentionsCount === 1 ? '' : 'es'}`);
              }
              return (
                <article key={post.id} className="social-card">
                  <header className="social-card__header">
                    <div className="social-card__profile">
                      <img
                        src={author?.avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(author?.name ?? 'Usuário')}`}
                        alt={author?.name ?? 'Autor'}
                        className="social-card__avatar"
                      />
                      <div>
                        <p className="social-card__name">{author?.name ?? 'Usuário'}</p>
                        <p className="social-card__meta">{dayjs(post.createdAt).format('DD MMM YYYY · HH:mm')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {badges.map(badge => (
                        <span key={badge} className="social-pill">
                          {badge}
                        </span>
                      ))}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDeletePost(post.id)}
                          className="rounded-full border border-transparent p-1.5 text-muted-foreground transition hover:border-red-200 hover:text-red-500 dark:hover:border-red-500/30 dark:hover:text-red-300"
                          title="Excluir publicação"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </header>
                  <div className="social-card__content">
                    {post.content && (
                      <p className="social-card__text whitespace-pre-line">{post.content}</p>
                    )}
                    {post.mentions && post.mentions.length > 0 && (
                      <MentionBadges
                        mentions={post.mentions}
                        users={users}
                        contacts={contacts}
                        className="mt-3"
                      />
                    )}
                    {safeImageUrl && (
                      <div className="social-card__media">
                        <img src={safeImageUrl} alt={`Publicação de ${author?.name ?? 'usuário'}`} />
                      </div>
                    )}
                  </div>
                  <footer className="social-card__footer">
                    <button
                      type="button"
                      className={cn('social-react', post.isLiked && 'is-active')}
                      onClick={() => toggleSocialPostLike(post.id)}
                    >
                      <Heart className={cn('h-4 w-4', post.isLiked ? 'fill-current' : '')} />
                      <span className="font-semibold">Curtir</span>
                      <span>{post.likesCount}</span>
                    </button>
                    <div className="social-react social-react--muted">
                      <MessageCircle className="h-4 w-4" />
                      <span>
                        {post.comments.length} comentário{post.comments.length === 1 ? '' : 's'}
                      </span>
                    </div>
                  </footer>
                  {post.comments.length > 0 && (
                    <div className="social-comments">
                      {post.comments.map(comment => {
                        const commentAuthor = comment.user;
                        const canRemoveComment =
                          user && (comment.userId === user.id || post.userId === user.id || user.isTenantAdmin);
                        return (
                          <div key={comment.id} className="social-comment">
                            <img
                              src={
                                commentAuthor?.avatar ??
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(commentAuthor?.name ?? 'Usuário')}`
                              }
                              alt={commentAuthor?.name ?? 'Autor'}
                              className="social-comment__avatar"
                            />
                            <div className="social-comment__body">
                              <div className="social-comment__header">
                                <div>
                                  <p className="social-comment__name">{commentAuthor?.name ?? 'Usuário'}</p>
                                  <p className="social-comment__meta">{dayjs(comment.createdAt).fromNow()}</p>
                                </div>
                                {canRemoveComment && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteComment(post, comment.id)}
                                    className="rounded-full p-1 text-muted-foreground transition hover:text-red-500"
                                    title="Excluir comentário"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                              <p className="social-comment__text">{comment.body}</p>
                              {comment.mentions && comment.mentions.length > 0 && (
                                <MentionBadges
                                  mentions={comment.mentions}
                                  users={users}
                                  contacts={contacts}
                                  className="mt-2"
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="social-comment-composer">
                    <img
                      src={user?.avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? 'Você')}`}
                      alt={user?.name ?? 'Você'}
                      className="social-comment__avatar"
                    />
                    <div className="flex-1">
                      <MentionTextarea
                        value={commentDraft}
                        onChange={value => setCommentDraft(post.id, value)}
                        onMentionsChange={mentions => setCommentMentions(prev => ({ ...prev, [post.id]: mentions }))}
                        users={users}
                        contacts={contacts}
                        placeholder="Comente algo..."
                        minRows={1}
                        initialMentions={commentMentions[post.id] ?? []}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSubmitComment(post.id)}
                      disabled={commentSubmitting[post.id] || !commentDraft.trim()}
                      className="gap-1 rounded-full px-3 text-xs"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </article>
              );
            })
          )}
        </div>
        <aside className="social-sidebar space-y-4">
          <div className="social-sidebar__card">
            <div className="social-panel-card__label">
              <Users className="h-3.5 w-3.5" />
              Pulso do feed
            </div>
            <h3>Atividade em tempo real</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {activeContributors} voz{activeContributors === 1 ? '' : 'es'} engajadas nesta semana.
            </p>
            <dl className="social-panel-card__stats">
              <div>
                <dt>Ativos hoje</dt>
                <dd>{contributorsToday}</dd>
              </div>
              <div>
                <dt>Posts com mídia</dt>
                <dd>{mediaPosts}</dd>
              </div>
              <div>
                <dt>Menções</dt>
                <dd>{totalMentions}</dd>
              </div>
            </dl>
            <Button
              type="button"
              size="sm"
              className="mt-4 w-full gap-2 rounded-full"
              onClick={() => setIsComposerOpen(true)}
            >
              <Feather className="h-4 w-4" />
              Abrir editor agora
            </Button>
          </div>
          <div className="social-sidebar__card">
            <div className="social-panel-card__label">
              <Flame className="h-3.5 w-3.5" />
              Top contribuidores
            </div>
            <h3>Quem mantém o feed vivo</h3>
            <ul className="social-panel-card__list">
              {topContributors.length === 0 && (
                <li className="text-sm text-muted-foreground">
                  Ainda não há publicações hoje. Que tal inaugurar o feed?
                </li>
              )}
              {topContributors.map((contributor, index) => (
                <li key={contributor.userId}>
                  <span className="social-panel-card__rank">#{index + 1}</span>
                  <div
                    className="social-panel-card__list-avatar"
                    style={{
                      backgroundImage: contributor.avatar ? `url(${contributor.avatar})` : undefined,
                    }}
                  >
                    {!contributor.avatar && <span>{getInitials(contributor.name)}</span>}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground dark:text-dark-foreground">
                      {contributor.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {contributor.count} publicação{contributor.count === 1 ? '' : 'es'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="social-sidebar__card">
            <div className="social-sidebar__eyebrow">Últimas conversas</div>
            <h3>Resumo em destaque</h3>
            <ul className="social-sidebar__timeline">
              {latestSnapshots.length === 0 && (
                <li className="text-sm text-muted-foreground">Sem interações recentes.</li>
              )}
              {latestSnapshots.map(snapshot => (
                <li key={snapshot.id}>
                  <span className="social-sidebar__timeline-dot" />
                  <div>
                    <p className="text-sm font-semibold text-foreground dark:text-dark-foreground">
                      {snapshot.author}
                    </p>
                    <p className="text-xs text-muted-foreground">{snapshot.preview}</p>
                    <span className="social-sidebar__timeline-meta">{snapshot.timeAgo}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="social-sidebar__card">
            <div className="social-sidebar__eyebrow">Inspiração</div>
            <h3>Ideias de publicação</h3>
            <ul className="social-sidebar__tips">
              {publishingTips.map(tip => (
                <li key={tip.title}>
                  <p className="text-sm font-semibold text-foreground dark:text-dark-foreground">{tip.title}</p>
                  <p className="text-xs text-muted-foreground">{tip.description}</p>
                </li>
              ))}
            </ul>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-4 w-full gap-2 rounded-full"
              onClick={() => setIsComposerOpen(true)}
            >
              <Sparkles className="h-4 w-4" />
              Planejar publicação
            </Button>
          </div>
        </aside>
      </section>
    </div>
  );
};

export default Social;
