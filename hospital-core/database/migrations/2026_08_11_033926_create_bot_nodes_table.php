<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('bot_nodes', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('message_text');
            $table->string('node_type')->default('text'); // text, list, buttons
            $table->boolean('is_starting_node')->default(false);
            $table->json('interactive_options')->nullable(); // To store list rows or button titles
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bot_nodes');
    }
};
