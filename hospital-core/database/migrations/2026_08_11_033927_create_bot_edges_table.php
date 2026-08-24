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
        Schema::create('bot_edges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('from_node_id')->constrained('bot_nodes')->cascadeOnDelete();
            $table->foreignId('to_node_id')->constrained('bot_nodes')->cascadeOnDelete();
            $table->string('condition_type')->default('exact_match'); // exact_match, catch_all
            $table->string('condition_value')->nullable(); // e.g. "1", "yes", "hi"
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bot_edges');
    }
};
