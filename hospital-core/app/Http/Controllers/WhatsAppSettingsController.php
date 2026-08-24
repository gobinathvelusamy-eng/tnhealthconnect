<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WhatsAppSettingsController extends Controller
{
    public function index()
    {
        $settings = DB::table('platform_settings')
            ->whereIn('setting_key', [
                'whatsapp_access_token',
                'whatsapp_phone_number_id',
                'webhook_verify_token'
            ])
            ->pluck('setting_value', 'setting_key')
            ->toArray();

        // Ensure verify token exists, or generate one
        if (!isset($settings['webhook_verify_token'])) {
            $settings['webhook_verify_token'] = 'vh_' . bin2hex(random_bytes(16));
            DB::table('platform_settings')->insert([
                'setting_key' => 'webhook_verify_token',
                'setting_value' => $settings['webhook_verify_token']
            ]);
        }

        return view('settings.whatsapp', compact('settings'));
    }

    public function update(Request $request)
    {
        $request->validate([
            'whatsapp_access_token' => 'required|string',
            'whatsapp_phone_number_id' => 'required|string',
        ]);

        DB::table('platform_settings')->updateOrInsert(
            ['setting_key' => 'whatsapp_access_token'],
            ['setting_value' => $request->whatsapp_access_token]
        );

        DB::table('platform_settings')->updateOrInsert(
            ['setting_key' => 'whatsapp_phone_number_id'],
            ['setting_value' => $request->whatsapp_phone_number_id]
        );

        return redirect()->back()->with('success', 'WhatsApp settings updated successfully!');
    }
}
