<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use App\Services\WhatsApp\ConversationEngine;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class WhatsAppWebhookController extends Controller
{
    protected $engine;

    public function __construct(ConversationEngine $engine)
    {
        $this->engine = $engine;
    }

    /**
     * Webhook Verification for Meta.
     */
    public function verify(Request $request)
    {
        $verifyToken = DB::table('platform_settings')->where('setting_key', 'whatsapp_webhook_verify_token')->value('setting_value');

        if ($request->query('hub_mode') === 'subscribe' && $request->query('hub_verify_token') === $verifyToken) {
            return response($request->query('hub_challenge'), 200);
        }

        return response('Unauthorized', 403);
    }

    /**
     * Handle incoming WhatsApp messages.
     */
    public function handle(Request $request)
    {
        Log::info('[WHATSAPP DEBUG] WHATSAPP WEBHOOK RECEIVED');
        Log::info('[WHATSAPP DEBUG] Request method: ' . $request->method());
        Log::info('[WHATSAPP DEBUG] Request URL: ' . $request->fullUrl());
        
        $payload = $request->all();
        
        $message = $payload['entry'][0]['changes'][0]['value']['messages'][0] ?? null;
        if ($message) {
            $senderId = $message['from'] ?? 'unknown';
            $msgType = $message['type'] ?? 'unknown';
            $msgBody = '';
            
            if ($msgType === 'text') {
                $msgBody = $message['text']['body'] ?? '';
            }
            
            $maskedSender = strlen($senderId) > 4 ? substr($senderId, 0, 4) . '***' : '***';
            
            Log::info('[WHATSAPP DEBUG] Message type: ' . $msgType);
            Log::info('[WHATSAPP DEBUG] Sender WhatsApp ID: ' . $maskedSender);
            Log::info('[WHATSAPP DEBUG] Message body: ' . $msgBody);
        } else {
            Log::info('[WHATSAPP DEBUG] Incoming payload (no message found): ' . json_encode($payload));
        }

        Log::info('[WHATSAPP DEBUG] SENDING TO CONVERSATION ENGINE');

        try {
            $this->engine->process($payload);
            Log::info('[WHATSAPP DEBUG] CONVERSATION ENGINE COMPLETED');
        } catch (\Throwable $e) {
            Log::error('[WHATSAPP DEBUG] Error: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
        }

        return response('EVENT_RECEIVED', 200);
    }
}




