import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import { Heart, MessageCircle, Send, Trash2, ImageIcon, Feather, X } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { useAuth } from '../store/AuthContext';
import { MentionReference, SocialPost } from '../types/types';
import { Button } from '../components/ui/Button';
import MentionTextarea from '../components/inputs/MentionTextarea';
import MentionBadges from '../components/mentions/MentionBadges';
import { cn } from '../lib/utils';

const MAX_CONTENT_LENGTH = 2000;

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

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-[26px] font-semibold tracking-tight text-foreground dark:text-dark-foreground">
          Feed colaborativo
        </h1>
        <p className="text-sm text-muted-foreground dark:text-dark-muted">
          Compartilhe atualizações rápidas, vitórias do time e fotos do dia a dia. Apenas membros do
          seu escritório visualizarão estas postagens.
        </p>
      </header>

      <section className="rounded-3xl border border-border/60 bg-white shadow-sm dark:border-dark-border/60 dark:bg-dark-card/80">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground dark:text-dark-foreground">Nova publicação</h2>
            <p className="text-xs text-muted-foreground dark:text-dark-muted">Compartilhe um insight, foto do time ou celebre uma conquista.</p>
          </div>
          <Button type="button" size="sm" className="gap-2 rounded-full" onClick={() => setIsComposerOpen(true)}>
            <Feather className="h-4 w-4" />
            Criar publicação
          </Button>
        </div>
      </section>

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
      <section className="flex flex-col gap-4">
        {orderedPosts.length === 0 ? (
          <div className="rounded-3xl border border-border/60 bg-muted/20 px-6 py-8 text-center text-sm text-muted-foreground dark:border-dark-border/60 dark:bg-dark-card/80">
            Ainda não há publicações. Seja o primeiro a compartilhar uma atualização!
          </div>
        ) : (
          orderedPosts.map(post => {
            const author = post.user;
            const canDelete = user && (post.userId === user.id || user.isTenantAdmin);
            const commentDraft = commentDrafts[post.id] ?? '';
            return (
              <article
                key={post.id}
                className="rounded-3xl border border-border/60 bg-white px-5 py-5 shadow-sm dark:border-dark-border/60 dark:bg-dark-card/80"
              >
                <header className="mb-4 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <img
                      src={author?.avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(author?.name ?? 'Usuário')}`}
                      alt={author?.name ?? 'Autor'}
                      className="h-10 w-10 rounded-full border border-border/60 object-cover dark:border-dark-border/60"
                    />
                    <div>
                      <p className="text-sm font-semibold text-foreground dark:text-dark-foreground">
                        {author?.name ?? 'Usuário'}
                      </p>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground dark:text-dark-muted">
                        {dayjs(post.createdAt).format('DD MMM YYYY · HH:mm')}
                      </p>
                    </div>
                  </div>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDeletePost(post.id)}
                      className="rounded-full border border-transparent p-1 text-muted-foreground transition hover:border-red-200 hover:text-red-500 dark:hover:border-red-500/30 dark:hover:text-red-300"
                      title="Excluir publicação"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </header>
                {post.content && (
                  <p className="mb-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground dark:text-dark-foreground">
                    {post.content}
                  </p>
                )}
                {post.mentions && post.mentions.length > 0 && (
                  <MentionBadges
                    mentions={post.mentions}
                    users={users}
                    contacts={contacts}
                    className="mb-4"
                  />
                )}
                {post.imageUrl && (
                  <div className="mb-4 overflow-hidden rounded-2xl border border-border/60 dark:border-dark-border/60">
                    <img src={post.imageUrl} alt="Publicação" className="h-auto w-full object-cover" />
                  </div>
                )}
                <footer className="mb-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <button
                    type="button"
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border px-3 py-1 transition',
                      post.isLiked
                        ? 'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-400/40 dark:bg-rose-500/10 dark:text-rose-300'
                        : 'border-border/60 hover:border-primary/40 hover:text-primary dark:border-dark-border/60 dark:hover:border-dark-primary/40'
                    )}
                    onClick={() => toggleSocialPostLike(post.id)}
                  >
                    <Heart className={cn('h-4 w-4', post.isLiked ? 'fill-current' : '')} />
                    <span>{post.likesCount}</span>
                  </button>
                  <span className="inline-flex items-center gap-1 rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground dark:border-dark-border/60">
                    <MessageCircle className="h-4 w-4" />
                    {post.comments.length}
                  </span>
                </footer>
                <div className="space-y-3">
                  {post.comments.map(comment => {
                    const commentAuthor = comment.user;
                    const canRemoveComment =
                      user && (comment.userId === user.id || post.userId === user.id || user.isTenantAdmin);
                    return (
                      <div key={comment.id} className="flex gap-3 rounded-2xl bg-muted/30 px-3 py-3 dark:bg-dark-border/20">
                        <img
                          src={commentAuthor?.avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(commentAuthor?.name ?? 'Usuário')}`}
                          alt={commentAuthor?.name ?? 'Autor'}
                          className="h-8 w-8 rounded-full border border-border/60 object-cover dark:border-dark-border/60"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold text-foreground dark:text-dark-foreground">
                                {commentAuthor?.name ?? 'Usuário'}
                              </p>
                              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground dark:text-dark-muted">
                                {dayjs(comment.createdAt).fromNow()}
                              </p>
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
                          <p className="mt-1 text-sm text-foreground dark:text-dark-foreground">{comment.body}</p>
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
                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/10 px-3 py-2 dark:border-dark-border/60 dark:bg-dark-border/20">
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
      </section>
    </div>
  );
};

export default Social;
