<?php

namespace App\Services\WhatsApp;

use App\Models\WhatsappSession;
use App\Models\BotNode;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ConversationEngine
{
    protected function getSetting($key) {
        // Map database keys to .env variable names
        $envMap = [
            'whatsapp_access_token' => 'WHATSAPP_ACCESS_TOKEN',
            'whatsapp_phone_number_id' => 'WHATSAPP_PHONE_NUMBER_ID',
            'whatsapp_webhook_verify_token' => 'WHATSAPP_WEBHOOK_VERIFY_TOKEN'
        ];
        
        if (isset($envMap[$key])) {
            $envVal = env($envMap[$key]);
            if (!empty($envVal)) {
                return $envVal;
            }
        }
        
        return DB::table('platform_settings')->where('setting_key', $key)->value('setting_value');
    }

    protected function sendMessage($to, $messageData) {
        $token = $this->getSetting('whatsapp_access_token');
        $phoneId = $this->getSetting('whatsapp_phone_number_id');

        if (!$token || !$phoneId) {
            Log::error("WhatsApp credentials not set in platform_settings.");
            return false;
        }

        $payload = array_merge([
            'messaging_product' => 'whatsapp',
            'to' => $to,
        ], $messageData);

        $response = Http::withToken($token)
            ->post("https://graph.facebook.com/v19.0/{$phoneId}/messages", $payload);

        Log::info('[WHATSAPP DEBUG] Meta response status: ' . $response->status());
        Log::info('[WHATSAPP DEBUG] Meta response body: ' . $response->body());

        if (!$response->successful()) {
            Log::error("WhatsApp API Error: " . $response->body());
        }

        return $response->successful();
    }

    protected function sendTextMessage($to, $text) {
        return $this->sendMessage($to, [
            'type' => 'text',
            'text' => ['body' => $text]
        ]);
    }

    protected function sendNodeMessage($to, BotNode $node, $session = null) {
        $rows = [];
        $header = '';
        $buttonText = '';

        if ($node->system_action === 'choice_node') {
            $edges = $node->outboundEdges;
            foreach ($edges as $edge) {
                if ($edge->condition_type === 'exact_match') {
                    $rows[] = ['id' => $edge->condition_value, 'title' => substr($edge->condition_value, 0, 20)];
                }
            }
        }
        elseif ($node->system_action === 'capture_patient_gender') {
            $rows = [
                ['id' => 'Male', 'title' => 'Male'],
                ['id' => 'Female', 'title' => 'Female'],
                ['id' => 'Other', 'title' => 'Other']
            ];
        }
        elseif ($node->system_action === 'district_selection') {
            $items = DB::table('districts')->where('is_active', 1)->get();
            if ($items->isEmpty()) return $this->sendTextMessage($to, "No districts are available right now. Type 'Hi' to start over.");
            
            foreach ($items->take(10) as $item) {
                $rows[] = ['id' => 'dist_' . $item->id, 'title' => substr($item->name, 0, 24)];
            }
            $header = 'Select District';
            $buttonText = 'View Districts';
        } 
        elseif ($node->system_action === 'place_selection' && $session) {
            $items = DB::table('hospitals')
                ->where('district_id', $session->selected_district)
                ->where('is_active', 1)
                ->select('city')
                ->distinct()
                ->get();
            if ($items->isEmpty()) return $this->sendTextMessage($to, "No places are available for this district. Type 'Hi' to start over.");

            foreach ($items->take(10) as $item) {
                // Ensure ID has no spaces for Meta list ID constraints
                $safeCityId = 'plc_' . str_replace(' ', '---', $item->city);
                $rows[] = ['id' => $safeCityId, 'title' => substr($item->city, 0, 24)];
            }
            $header = 'Select Place';
            $buttonText = 'View Places';
        }
        elseif ($node->system_action === 'hospital_selection' && $session) {
            $items = DB::table('hospitals')
                ->where('district_id', $session->selected_district)
                ->where('city', $session->selected_place)
                ->where('is_active', 1)
                ->get();
            if ($items->isEmpty()) return $this->sendTextMessage($to, "No hospitals are currently available here. Type 'Hi' to start over.");

            foreach ($items->take(10) as $item) {
                $rows[] = ['id' => 'hosp_' . $item->id, 'title' => substr($item->name, 0, 24)];
            }
            $header = 'Select Hospital';
            $buttonText = 'View Hospitals';
        }
        elseif ($node->system_action === 'department_selection' && $session) {
            $items = DB::table('departments')->where('hospital_id', $session->selected_hospital)->where('is_active', 1)->get();
            if ($items->isEmpty()) return $this->sendTextMessage($to, "No departments are available for this hospital. Type 'Hi' to start over.");

            foreach ($items->take(10) as $item) {
                $rows[] = ['id' => 'dept_' . $item->id, 'title' => substr($item->name, 0, 24)];
            }
            $header = 'Select Department';
            $buttonText = 'View Departments';
        }
        elseif ($node->system_action === 'doctor_selection' && $session) {
            $items = DB::table('doctors')
                ->join('users', 'doctors.user_id', '=', 'users.id')
                ->where('doctors.department_id', $session->selected_department)
                ->where('doctors.is_active', 1)
                ->select('doctors.id', 'users.name')
                ->get();
            if ($items->isEmpty()) return $this->sendTextMessage($to, "No doctors are currently available. Type 'Hi' to start over.");

            foreach ($items->take(10) as $item) {
                $rows[] = ['id' => 'doc_' . $item->id, 'title' => substr($item->name, 0, 24)];
            }
            $header = 'Select Doctor';
            $buttonText = 'View Doctors';
        }
        elseif ($node->system_action === 'finalize_booking' && $session) {
            // Finalize booking logic
            $patient = \App\Models\Patient::where('whatsapp_number', '+' . ltrim($to, '+'))->first();
            if ($patient && $session->selected_hospital && $session->selected_doctor) {
                $bookingId = 'BKG-' . strtoupper(uniqid());
                
                $appointmentId = DB::table('appointments')->insertGetId([
                    'booking_id' => $bookingId,
                    'hospital_id' => $session->selected_hospital,
                    'doctor_id' => $session->selected_doctor,
                    'patient_id' => $patient->id,
                    'appointment_date' => now()->toDateString(),
                    'appointment_time' => '10:00:00', // Static for prototype
                    'status' => 'Pending Payment',
                    'type' => 'Online',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                // Fetch global platform settings
                $globalConsultationFee = DB::table('platform_settings')->where('setting_key', 'default_consultation_fee')->value('setting_value') ?? 500;
                $globalPlatformFee = DB::table('platform_settings')->where('setting_key', 'default_platform_fee')->value('setting_value') ?? 25;

                // Fetch custom consultation fee from department, fallback to global
                $deptFee = DB::table('departments')->where('id', $session->selected_department)->value('consultation_fee');
                $consultationFee = (!empty($deptFee) && $deptFee > 0) ? $deptFee : $globalConsultationFee;
                
                $platformFee = $globalPlatformFee;
                $totalAmount = $consultationFee + $platformFee;

                // Generate Razorpay Payment Link
                $paymentLinkUrl = '';
                try {
                    $api = new \Razorpay\Api\Api(config('services.razorpay.key'), config('services.razorpay.secret'));
                    
                    $receiptId = 'rcpt_' . $appointmentId;
                    
                    $paymentLink = $api->paymentLink->create([
                        'amount' => $totalAmount * 100, // INR in paise
                        'currency' => 'INR',
                        'accept_partial' => false,
                        'description' => 'Consultation Fee for ' . $bookingId,
                        'customer' => [
                            'name' => $patient->name,
                            'contact' => str_replace('+', '', $patient->whatsapp_number),
                        ],
                        'notify' => [
                            'sms' => false,
                            'email' => false
                        ],
                        'reminder_enable' => false,
                        'notes' => [
                            'appointment_id' => $appointmentId,
                            'whatsapp_number' => $to
                        ],
                        'callback_url' => url('/'),
                        'callback_method' => 'get'
                    ]);
                    
                    $paymentLinkUrl = $paymentLink->short_url;

                    // Store pending payment in DB
                    DB::table('payments')->insert([
                        'appointment_id' => $appointmentId,
                        'consultation_fee' => $consultationFee,
                        'platform_fee' => $platformFee,
                        'payment_gateway_fee' => 10,
                        'gst' => 6,
                        'net_platform_income' => 9,
                        'hospital_amount' => $consultationFee,
                        'total_amount' => $totalAmount,
                        'transaction_id' => $paymentLink->id, // Store link ID temporarily
                        'payment_status' => 'Pending',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                } catch (\Exception $e) {
                    Log::error("Razorpay Error: " . $e->getMessage());
                    return $this->sendTextMessage($to, "Sorry, we couldn't generate a payment link at this moment. Please try again later.");
                }

                // Reset session fields so they can book again later
                $session->update([
                    'selected_district' => null,
                    'selected_hospital' => null,
                    'selected_department' => null,
                    'selected_doctor' => null,
                    'appointment_id' => $appointmentId, // store reference
                    'completed' => true
                ]);

                $finalText = $node->message_text . "\n\n???? *Please pay ???{$totalAmount} to confirm your booking:*\n" . $paymentLinkUrl . "\n\nOnce paid, you will automatically receive your QR code here.";
                return $this->sendTextMessage($to, $finalText);
            } else {
                return $this->sendTextMessage($to, "Sorry, we could not finalize your booking. Missing information.");
            }
        }
        elseif ($node->system_action === 'refund_request') {
            return $this->sendTextMessage($to, $node->message_text . "\n\n???? Your refund request has been logged. Our accounts team will review it within 24 hours.");
        }

        if (count($rows) > 0) {
            return $this->sendMessage($to, [
                'type' => 'interactive',
                'interactive' => [
                    'type' => 'list',
                    'header' => ['type' => 'text', 'text' => $header],
                    'body' => ['text' => $node->message_text],
                    'action' => [
                        'button' => $buttonText,
                        'sections' => [
                            [
                                'title' => 'Available Options',
                                'rows' => $rows
                            ]
                        ]
                    ]
                ]
            ]);
        }

        // Default: send static text
        $this->sendTextMessage($to, $node->message_text);
    }

    /**
     * Entry point for processing a webhook payload from Meta
     */
    public function process(array $payload)
    {
        try {
            $message = $payload['entry'][0]['changes'][0]['value']['messages'][0] ?? null;
            if (!$message) return;

            $phoneNumber = $message['from'];
            $messageType = $message['type'];
            
            $messageText = '';
            if ($messageType === 'text') {
                $messageText = $message['text']['body'];
            } elseif ($messageType === 'interactive') {
                if (isset($message['interactive']['list_reply'])) {
                    $messageText = $message['interactive']['list_reply']['id'];
                } elseif (isset($message['interactive']['button_reply'])) {
                    $messageText = $message['interactive']['button_reply']['id'];
                }
            }

            // Retrieve or create session
            $session = WhatsappSession::firstOrCreate(
                ['phone_number' => $phoneNumber, 'completed' => false],
                ['current_step' => 'dynamic']
            );

            $session->update(['last_activity' => now()]);

            $currentNode = null;
            if ($session->current_node_id) {
                $currentNode = BotNode::with('outboundEdges')->find($session->current_node_id);
            }

            // Process Post-Reply System Actions (Save data to DB)
            $inputValid = true;

            if ($currentNode && $currentNode->system_action) {
                $patient = \App\Models\Patient::firstOrCreate(
                    ['whatsapp_number' => '+' . ltrim($phoneNumber, '+')]
                );

                switch ($currentNode->system_action) {
                    case 'capture_patient_name':
                        $patient->update(['name' => $messageText]);
                        break;
                    case 'capture_patient_gender':
                        $patient->update(['gender' => $messageText]);
                        break;
                    case 'capture_patient_age':
                        if (!is_numeric($messageText) || $messageText < 1 || $messageText > 120) {
                            $inputValid = false;
                        } else {
                            $patient->update(['age' => $messageText]);
                        }
                        break;
                    case 'district_selection':
                        // Meta List returns "dist_1"
                        $districtId = str_replace('dist_', '', $messageText);
                        $session->update(['selected_district' => $districtId]);
                        break;
                    case 'place_selection':
                        // Reverse the space replacement
                        $placeName = str_replace(['plc_', '---'], ['', ' '], $messageText);
                        $session->update(['selected_place' => $placeName]);
                        break;
                    case 'hospital_selection':
                        $hospitalId = str_replace('hosp_', '', $messageText);
                        $session->update(['selected_hospital' => $hospitalId]);
                        break;
                    case 'department_selection':
                        $deptId = str_replace('dept_', '', $messageText);
                        $session->update(['selected_department' => $deptId]);
                        break;
                    case 'doctor_selection':
                        $docId = str_replace('doc_', '', $messageText);
                        $session->update(['selected_doctor' => $docId]);
                        break;
                }
            }

            $normalizedMsg = strtolower(trim($messageText));

            // Intercept WhatsApp Flow Trigger
            if ($normalizedMsg === '/start') {
                Log::info('[WHATSAPP DEBUG] /start command detected');
                Log::info('[WHATSAPP DEBUG] Sending method: App\Services\WhatsApp\ConversationEngine::sendMessage');

                $token = $this->getSetting('whatsapp_access_token');
                $phoneId = $this->getSetting('whatsapp_phone_number_id');

                Log::info('[WHATSAPP DEBUG] whatsapp_access_token exists: ' . ($token ? 'YES' : 'NO'));
                Log::info('[WHATSAPP DEBUG] whatsapp_phone_number_id exists: ' . ($phoneId ? 'YES' : 'NO'));
                Log::info('[WHATSAPP DEBUG] graph_api_version: v19.0'); // Hardcoded in current implementation

                // Reset session for a fresh flow
                $session->update([
                    'current_node_id' => null,
                    'invalid_attempts' => 0,
                    'needs_human' => false
                ]);

                Log::info('[WHATSAPP DEBUG] Sending Flow message to Meta');
                Log::info('[WHATSAPP DEBUG] Meta API URL: https://graph.facebook.com/v19.0/' . $phoneId . '/messages');
                Log::info('[WHATSAPP DEBUG] Phone Number ID: ' . $phoneId);
                Log::info('[WHATSAPP DEBUG] Flow ID: 3447277955454518');

                $this->sendMessage($phoneNumber, [
                    'type' => 'interactive',
                    'interactive' => [
                        'type' => 'flow',
                        'header' => [
                            'type' => 'text',
                            'text' => 'TN Health Connect'
                        ],
                        'body' => [
                            'text' => 'Find a doctor and book an appointment.'
                        ],
                        'footer' => [
                            'text' => 'TN Health Connect'
                        ],
                        'action' => [
                            'name' => 'flow',
                            'parameters' => [
                                'flow_message_version' => '3',
                                'flow_id' => '3447277955454518',
                                'flow_cta' => 'Find Doctor'
                            ]
                        ]
                    ]
                ]);

                return;
            }

            // Intercept Global Human Reply
            if ($session->needs_human) {
                // Stop automated processing so the Super Admin can chat manually
                return;
            }

            // Intercept RESCHED token
            if (str_starts_with($normalizedMsg, 'resched-')) {
                $tokenRecord = \App\Models\RescheduleToken::where('token', strtoupper(trim($messageText)))->first();
                if ($tokenRecord && !$tokenRecord->is_used) {
                    $this->sendTextMessage($phoneNumber, "??? Reschedule code accepted! Your previous fee is waived. Please select your new slot.");
                    $tokenRecord->update(['is_used' => true]);
                    // Prototype: You would transition them to a specific "Select Slot" step here.
                    return;
                } else {
                    $this->sendTextMessage($phoneNumber, "Invalid or expired reschedule code.");
                    return;
                }
            }

            // Global reset on 'hi' or 'hello', OR if we don't have a starting node yet
            if ($normalizedMsg === 'hi' || $normalizedMsg === 'hello' || !$currentNode) {
                $startNode = BotNode::where('is_starting_node', true)->first();
                if ($startNode) {
                    $this->sendNodeMessage($phoneNumber, $startNode, $session);
                    $session->update(['current_node_id' => $startNode->id, 'invalid_attempts' => 0]);
                } else {
                    $this->sendTextMessage($phoneNumber, "The dynamic bot is not configured yet. Please ask the Super Admin to create a Starting Step in the Bot Builder.");
                }
                return;
            }

            // Evaluate edges (rules) from the current node
            $nextNodeId = null;
            $catchAllEdge = null;
            
            if ($inputValid && $currentNode) {
                foreach ($currentNode->outboundEdges as $edge) {
                    if ($edge->condition_type === 'exact_match' && strtolower(trim($edge->condition_value)) === $normalizedMsg) {
                        $nextNodeId = $edge->to_node_id;
                        break;
                    }
                    if ($edge->condition_type === 'catch_all') {
                        $catchAllEdge = $edge;
                    }
                }

                // Fallback to catch_all if no exact match
                if (!$nextNodeId && $catchAllEdge) {
                    $nextNodeId = $catchAllEdge->to_node_id;
                }
            }

            if ($nextNodeId) {
                $session->update(['invalid_attempts' => 0]); // Reset on success
                $nextNode = BotNode::find($nextNodeId);
                $this->sendNodeMessage($phoneNumber, $nextNode, $session);
                $session->update(['current_node_id' => $nextNode->id]);
            } else {
                // No rule matched -> fallback logic
                if ($messageText === 'human_yes') {
                    $session->update(['needs_human' => true, 'invalid_attempts' => 0]);
                    $this->sendTextMessage($phoneNumber, "An agent will be with you shortly. You will receive a reply here.");
                    return;
                } elseif ($messageText === 'human_no') {
                    $session->update(['invalid_attempts' => 0]);
                    $this->sendNodeMessage($phoneNumber, $currentNode, $session);
                    return;
                }

                $session->increment('invalid_attempts');
                $attempts = $session->fresh()->invalid_attempts;

                if ($attempts === 1) {
                    // Send the SAME message again
                    $this->sendTextMessage($phoneNumber, "I didn't understand that. Let's try again.");
                    $this->sendNodeMessage($phoneNumber, $currentNode, $session);
                } elseif ($attempts >= 2) {
                    // Ask if they want human
                    $this->sendMessage($phoneNumber, [
                        'type' => 'interactive',
                        'interactive' => [
                            'type' => 'button',
                            'body' => ['text' => "I'm still having trouble. Would you like to chat with a human agent?"],
                            'action' => [
                                'buttons' => [
                                    ['type' => 'reply', 'reply' => ['id' => 'human_yes', 'title' => 'Yes, please']],
                                    ['type' => 'reply', 'reply' => ['id' => 'human_no', 'title' => 'No, try again']]
                                ]
                            ]
                        ]
                    ]);
                }
            }
        } catch (\Exception $e) {
            Log::error("Error in dynamic ConversationEngine process: " . $e->getMessage());
        }
    }
}







