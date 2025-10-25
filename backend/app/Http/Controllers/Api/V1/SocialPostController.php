<?php

namespace App\Http\Controllers\Api\V1;

use App\Events\SocialCommentCreated;
use App\Events\SocialCommentDeleted;
use App\Events\SocialLikeUpdated;
use App\Events\SocialPostCreated;
use App\Events\SocialPostDeleted;
use App\Http\Controllers\Concerns\HandlesMentionNotifications;
use App\Http\Controllers\Controller;
use App\Http\Resources\SocialCommentResource;
use App\Http\Resources\SocialPostResource;
use App\Models\SocialComment;
use App\Models\SocialLike;
use App\Models\SocialPost;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Support\Mentions;

class SocialPostController extends Controller
{
    use HandlesMentionNotifications;

    public function index(Request $request)
    {
        $tenantId = $this->ensureTenantId($request);
        $userId = $request->user()?->id ?? 0;

        $posts = SocialPost::query()
            ->with(['user', 'comments' => function ($query) {
                $query->with('user')->latest();
            }])
            ->withCount('likes')
            ->withExists(['likes as liked_by_current' => function ($query) use ($userId) {
                $query->where('user_id', $userId);
            }])
            ->where('tenant_id', $tenantId)
            ->latest()
            ->paginate(20);

        return SocialPostResource::collection($posts);
    }

    public function store(Request $request)
    {
        $tenantId = $this->ensureTenantId($request);
        $user = $request->user();

        $data = $request->validate([
            'content' => ['nullable', 'string'],
            'image' => ['nullable', 'image', 'max:5120'],
            'mentions' => ['nullable'],
        ]);

        if (! $user) {
            abort(401, 'Unauthorized');
        }

        $content = trim((string) Arr::get($data, 'content'));
        if (! $content && ! $request->hasFile('image')) {
            abort(422, 'Informe um texto ou imagem para publicar.');
        }

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('social-posts', 'public');
        }

        $rawMentions = $request->input('mentions', []);
        if (is_string($rawMentions)) {
            $rawMentions = json_decode($rawMentions, true) ?? [];
        }
        $mentionsPayload = Mentions::parse($tenantId, $rawMentions);
        $mentions = $mentionsPayload['mentions'];
        $mentionUserIds = $mentionsPayload['user_ids'];

        $post = SocialPost::create([
            'tenant_id' => $tenantId,
            'user_id' => $user->id,
            'content' => $content ?: null,
            'image_path' => $imagePath,
            'mentions' => $mentions,
        ]);

        $post->load(['user', 'comments.user'])->loadCount('likes');

        SocialPostCreated::dispatch($post);

        if (! empty($mentionUserIds)) {
            $label = Str::limit($post->content ?? 'publicação', 80);
            $this->notifyMentionedUsers(
                tenantId: $tenantId,
                recipients: $mentionUserIds,
                actor: $user,
                entityType: 'social',
                entityId: (int) $post->id,
                entityLabel: $label ?: 'publicação'
            );
        }

        return SocialPostResource::make($post)
            ->response()
            ->setStatusCode(201);
    }

    public function destroy(Request $request, SocialPost $post)
    {
        $tenantId = $this->ensureTenantId($request);
        abort_unless((int) $post->tenant_id === $tenantId, 404);

        $user = $request->user();
        abort_unless($user, 401);
        abort_unless($user->id === $post->user_id || $user->is_tenant_admin, 403);

        $postId = (int) $post->id;

        if ($post->image_path) {
            Storage::disk('public')->delete($post->image_path);
        }

        $post->delete();

        SocialPostDeleted::dispatch($tenantId, $postId);

        return response()->noContent();
    }

    public function storeComment(Request $request, SocialPost $post)
    {
        $tenantId = $this->ensureTenantId($request);
        abort_unless((int) $post->tenant_id === $tenantId, 404);

        $user = $request->user();
        abort_unless($user, 401);

        $data = $request->validate([
            'body' => ['required', 'string', 'max:1000'],
            'mentions' => ['nullable'],
        ]);

        $rawMentions = $request->input('mentions', []);
        if (is_string($rawMentions)) {
            $rawMentions = json_decode($rawMentions, true) ?? [];
        }
        $mentionsPayload = Mentions::parse($tenantId, $rawMentions);
        $mentions = $mentionsPayload['mentions'];
        $mentionUserIds = $mentionsPayload['user_ids'];

        $comment = SocialComment::create([
            'tenant_id' => $tenantId,
            'post_id' => $post->id,
            'user_id' => $user->id,
            'body' => trim($data['body']),
            'mentions' => $mentions,
        ]);

        $comment->load('user');

        SocialCommentCreated::dispatch($comment);

        if (! empty($mentionUserIds)) {
            $label = Str::limit($post->content ?? 'publicação', 80);
            $this->notifyMentionedUsers(
                tenantId: $tenantId,
                recipients: $mentionUserIds,
                actor: $user,
                entityType: 'social',
                entityId: (int) $post->id,
                entityLabel: $label ?: 'publicação'
            );
        }

        return SocialCommentResource::make($comment)
            ->response()
            ->setStatusCode(201);
    }

    public function destroyComment(Request $request, SocialPost $post, SocialComment $comment)
    {
        $tenantId = $this->ensureTenantId($request);
        abort_unless((int) $post->tenant_id === $tenantId, 404);
        abort_unless((int) $comment->tenant_id === $tenantId && (int) $comment->post_id === (int) $post->id, 404);

        $user = $request->user();
        abort_unless($user, 401);
        abort_unless($user->id === $comment->user_id || $user->id === $post->user_id || $user->is_tenant_admin, 403);

        $commentId = (int) $comment->id;
        $comment->delete();

        SocialCommentDeleted::dispatch($tenantId, (int) $post->id, $commentId);

        return response()->noContent();
    }

    public function toggleLike(Request $request, SocialPost $post)
    {
        $tenantId = $this->ensureTenantId($request);
        abort_unless((int) $post->tenant_id === $tenantId, 404);

        $user = $request->user();
        abort_unless($user, 401);

        $like = SocialLike::where('tenant_id', $tenantId)
            ->where('post_id', $post->id)
            ->where('user_id', $user->id)
            ->first();

        if ($like) {
            $like->delete();
        } else {
            SocialLike::create([
                'tenant_id' => $tenantId,
                'post_id' => $post->id,
                'user_id' => $user->id,
            ]);
        }

        $likesCount = $post->likes()->count();
        $likerIds = $post->likes()->pluck('user_id')->map(fn ($id) => (int) $id)->toArray();

        SocialLikeUpdated::dispatch($tenantId, (int) $post->id, $likesCount, $likerIds);

        return response()->json([
            'postId' => (int) $post->id,
            'likesCount' => $likesCount,
            'isLiked' => in_array($user->id, $likerIds, true),
        ]);
    }
}
