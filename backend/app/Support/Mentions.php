<?php

namespace App\Support;

use App\Models\Contact;
use App\Models\User;

class Mentions
{
    /**
    * @return array{mentions: array<int, array{id:int,kind:string,label:string}>, user_ids: int[]}
    */
    public static function parse(int $tenantId, mixed $raw): array
    {
        if (! is_array($raw)) {
            return [
                'mentions' => [],
                'user_ids' => [],
            ];
        }

        $rawMentions = array_filter($raw, fn ($mention) => is_array($mention));

        $userIds = [];
        $contactIds = [];

        foreach ($rawMentions as $mention) {
            $kind = $mention['kind'] ?? null;
            $id = (int) ($mention['id'] ?? 0);

            if ($id <= 0) {
                continue;
            }

            if ($kind === 'user') {
                $userIds[] = $id;
            } elseif ($kind === 'contact') {
                $contactIds[] = $id;
            }
        }

        $userIds = array_values(array_unique($userIds));
        $contactIds = array_values(array_unique($contactIds));

        $users = $userIds
            ? User::query()
                ->where('tenant_id', $tenantId)
                ->whereIn('id', $userIds)
                ->get(['id', 'name'])
                ->keyBy('id')
            : collect();

        $contacts = $contactIds
            ? Contact::query()
                ->where('tenant_id', $tenantId)
                ->whereIn('id', $contactIds)
                ->get(['id', 'name'])
                ->keyBy('id')
            : collect();

        $normalized = [];
        $normalizedUserIds = [];

        foreach ($rawMentions as $mention) {
            $kind = $mention['kind'] ?? null;
            $id = (int) ($mention['id'] ?? 0);

            if ($id <= 0) {
                continue;
            }

            if ($kind === 'user') {
                $user = $users->get($id);
                if (! $user) {
                    continue;
                }
                $label = $mention['label'] ?? $user->name;
                $normalized[] = [
                    'id' => $user->id,
                    'kind' => 'user',
                    'label' => (string) $label,
                ];
                $normalizedUserIds[] = (int) $user->id;
            } elseif ($kind === 'contact') {
                $contact = $contacts->get($id);
                if (! $contact) {
                    continue;
                }
                $label = $mention['label'] ?? $contact->name;
                $normalized[] = [
                    'id' => $contact->id,
                    'kind' => 'contact',
                    'label' => (string) $label,
                ];
            }
        }

        return [
            'mentions' => $normalized,
            'user_ids' => array_values(array_unique($normalizedUserIds)),
        ];
    }
}
