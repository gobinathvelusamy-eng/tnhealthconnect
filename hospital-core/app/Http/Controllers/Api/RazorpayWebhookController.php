<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Services\WhatsApp\ConversationEngine;

class RazorpayWebhookController extends Controller
{
    public function handleWebhook(Request $request)
    {
        $payload = $request->all();
        $signature = $request->header('X-Razorpay-Signature');
        $secret = config('services.razorpay.webhook_secret');

        // Note: For production, you MUST verify the signature using Razorpay SDK.
        // $api = new \Razorpay\Api\Api(config('services.razorpay.key'), config('services.razorpay.secret'));
        // $api->utility->verifyWebhookSignature(json_encode($payload), $signature, $secret);

        if (isset($payload['event']) && $payload['event'] === 'payment_link.paid') {
            $paymentLinkId = $payload['payload']['payment_link']['entity']['id'];
            $notes = $payload['payload']['payment_link']['entity']['notes'];
            $whatsappNumber = $notes['whatsapp_number'] ?? null;
            $appointmentId = $notes['appointment_id'] ?? null;

            if ($appointmentId) {
                // Update Payment Status
                DB::table('payments')->where('appointment_id', $appointmentId)->update([
                    'payment_status' => 'Completed',
                    'updated_at' => now(),
                ]);

                // Update Appointment Status
                DB::table('appointments')->where('id', $appointmentId)->update([
                    'status' => 'Booked',
                    'updated_at' => now(),
                ]);

                // Generate QR Code
                $qrToken = 'QR-' . uniqid();
                DB::table('qr_codes')->insert([
                    'appointment_id' => $appointmentId,
                    'qr_token' => $qrToken,
                    'is_used' => false,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                // Send WhatsApp Confirmation
                if ($whatsappNumber) {
                    $booking = DB::table('appointments')->where('id', $appointmentId)->first();
                    $msg = "🎉 *Payment Successful!*\n\nYour appointment is confirmed.\n✅ *Booking ID:* " . $booking->booking_id . "\n\nShow this QR token at reception: *" . $qrToken . "*";
                    
                    $token = DB::table('platform_settings')->where('setting_key', 'whatsapp_access_token')->value('setting_value');
                    $phoneId = DB::table('platform_settings')->where('setting_key', 'whatsapp_phone_number_id')->value('setting_value');
                    
                    if ($token && $phoneId) {
                        \Illuminate\Support\Facades\Http::withToken($token)
                            ->post("https://graph.facebook.com/v19.0/{$phoneId}/messages", [
                                'messaging_product' => 'whatsapp',
                                'to' => $whatsappNumber,
                                'type' => 'text',
                                'text' => ['body' => $msg]
                            ]);
                    }
                }
            }
        }

        return response()->json(['status' => 'success']);
    }
}
