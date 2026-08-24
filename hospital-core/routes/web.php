<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\HospitalController;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/dashboard', function () {
    return view('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});
use App\Http\Controllers\BotBuilderController;
use App\Http\Controllers\LiveChatController;
use App\Http\Controllers\WhatsAppSettingsController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/settings/whatsapp', [WhatsAppSettingsController::class, 'index'])->name('settings.whatsapp');
    Route::post('/settings/whatsapp', [WhatsAppSettingsController::class, 'update'])->name('settings.whatsapp.update');
    Route::resource('hospitals', HospitalController::class);
    
    // Bot Builder Routes
    Route::get('/bot-builder', [BotBuilderController::class, 'index'])->name('bot-builder.index');
    Route::post('/bot-builder/node', [BotBuilderController::class, 'storeNode'])->name('bot-builder.store-node');
    Route::post('/bot-builder/edge', [BotBuilderController::class, 'storeEdge'])->name('bot-builder.store-edge');
    Route::post('/bot-builder/save-flow', [BotBuilderController::class, 'saveFlow'])->name('bot-builder.save-flow');
    Route::delete('/bot-builder/node/{node}', [BotBuilderController::class, 'destroyNode'])->name('bot-builder.destroy-node');

    // Live Chat Routes
    Route::get('/live-chat', [LiveChatController::class, 'index'])->name('live-chat.index');
    Route::post('/live-chat/{session}/reply', [LiveChatController::class, 'reply'])->name('live-chat.reply');
    Route::post('/live-chat/{session}/resolve', [LiveChatController::class, 'resolve'])->name('live-chat.resolve');
});
require __DIR__.'/auth.php';

Route::get('/{hospital}', function () { return view('welcome'); });
Route::get('/{hospital}/login', function () { return view('welcome'); });
