<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('job_title')->nullable()->after('avatar');
            $table->string('personal_email')->nullable()->after('job_title');
            $table->string('phone')->nullable()->after('personal_email');
            $table->string('secondary_phone')->nullable()->after('phone');
            $table->string('whatsapp')->nullable()->after('secondary_phone');
            $table->string('address')->nullable()->after('whatsapp');
            $table->string('city')->nullable()->after('address');
            $table->string('state')->nullable()->after('city');
            $table->string('postal_code', 20)->nullable()->after('state');
            $table->date('birthdate')->nullable()->after('postal_code');
            $table->string('linkedin_url')->nullable()->after('birthdate');
            $table->string('instagram_url')->nullable()->after('linkedin_url');
            $table->text('bio')->nullable()->after('instagram_url');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'job_title',
                'personal_email',
                'phone',
                'secondary_phone',
                'whatsapp',
                'address',
                'city',
                'state',
                'postal_code',
                'birthdate',
                'linkedin_url',
                'instagram_url',
                'bio',
            ]);
        });
    }
};
