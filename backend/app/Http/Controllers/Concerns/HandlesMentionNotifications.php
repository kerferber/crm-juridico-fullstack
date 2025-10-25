<?php

namespace App\Http\Controllers\Concerns;

use App\Events\NotificationCreated;
use App\Models\TenantNotification;
use App\Models\User;

trait HandlesMentionNotifications
{
    protected function notifyMentionedUsers(
        int $tenantId,
        array $recipients,
        ?User $actor,
        string $entityType,
        int|string $entityId,
        string $entityLabel
    ): void {
        $actorId = $actor?->id;
        $actorName = $actor?->name ?? 'Alguém';

        foreach (array_unique($recipients) as $recipientId) {
            $recipientId = (int) $recipientId;
            if ($recipientId <= 0) {
                continue;
            }

            if (! User::where('tenant_id', $tenantId)->where('id', $recipientId)->exists()) {
                continue;
            }

            if ($actorId && $recipientId === (int) $actorId) {
                continue;
            }

            $notification = TenantNotification::create([
                'tenant_id' => $tenantId,
                'recipient_id' => $recipientId,
                'actor_id' => $actorId,
                'title' => 'Você foi mencionado',
                'message' => "{$actorName} mencionou você na {$this->resolveEntityContext($entityType, $entityLabel)}.",
                'entity_type' => $entityType,
                'entity_id' => (string) $entityId,
                'meta' => [
                    'label' => $entityLabel,
                ],
            ]);

            NotificationCreated::dispatch($notification);
        }
    }

    protected function resolveEntityContext(string $entityType, string $label): string
    {
        return match ($entityType) {
            'task' => "tarefa \"{$label}\"",
            'lawsuit' => "processo \"{$label}\"",
            'contact' => "contato \"{$label}\"",
            'social' => "publicação \"{$label}\"",
            default => "item \"{$label}\"",
        };
    }
}
