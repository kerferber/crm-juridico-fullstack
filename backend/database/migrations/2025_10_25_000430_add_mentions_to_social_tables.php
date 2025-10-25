<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('social_posts') && ! Schema::hasColumn('social_posts', 'mentions')) {
            Schema::table('social_posts', function (Blueprint $table) {
                $table->json('mentions')->nullable()->after('image_path');
            });
        }

        if (Schema::hasTable('social_comments') && ! Schema::hasColumn('social_comments', 'mentions')) {
            Schema::table('social_comments', function (Blueprint $table) {
                $table->json('mentions')->nullable()->after('body');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('social_posts') && Schema::hasColumn('social_posts', 'mentions')) {
            Schema::table('social_posts', function (Blueprint $table) {
                $table->dropColumn('mentions');
            });
        }

        if (Schema::hasTable('social_comments') && Schema::hasColumn('social_comments', 'mentions')) {
            Schema::table('social_comments', function (Blueprint $table) {
                $table->dropColumn('mentions');
            });
        }
    }
};
