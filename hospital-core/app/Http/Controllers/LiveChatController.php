<?php

namespace App\Http\Controllers;

use App\Models\WhatsappSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;

class LiveChatController extends Controller
{
    public function index()
    {
        $sessions = WhatsappSession::where('needs_human', true)->orderBy('updated_at', 'desc')->get();
        return view('live-chat.index', compact('sessions'));
    }

    public function reply(Request $request, WhatsappSession $session)
    {
        $request->validate(['message' => 'required|string']);

        $token = DB::table('platform_settings')->where('setting_key', 'whatsapp_access_token')->value('setting_value');
        $phoneId = DB::table('platform_settings')->where('setting_key', 'whatsapp_phone_number_id')->value('setting_value');

        if ($token && $phoneId) {
            Http::withToken($token)->post("https://graph.facebook.com/v19.0/{$phoneId}/messages", [
                'messaging_product' => 'whatsapp',
                'to' => $session->phone_number,
                'type' => 'text',
                'text' => ['body' => $request->message]
            ]);
        }

        return back()->with('success', 'Message sent successfully.');
    }

    public function resolve(WhatsappSession $session)
    {
        $session->update([
            'needs_human' => false,
            'invalid_attempts' => 0
        ]);

        $token = DB::table('platform_settings')->where('setting_key', 'whatsapp_access_token')->value('setting_value');
        $phoneId = DB::table('platform_settings')->where('setting_key', 'whatsapp_phone_number_id')->value('setting_value');

        if ($token && $phoneId) {
            Http::withToken($token)->post("https://graph.facebook.com/v19.0/{$phoneId}/messages", [
                'messaging_product' => 'whatsapp',
                'to' => $session->phone_number,
                'type' => 'text',
                'text' => ['body' => 'Your chat session has been resolved. Returning you to the automated assistant. Type "Hi" to restart.']
            ]);
        }

        return back()->with('success', 'Session resolved and returned to bot.');
    }
}
