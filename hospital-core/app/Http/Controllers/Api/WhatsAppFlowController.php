<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Models\Patient;
use phpseclib3\Crypt\RSA;

class WhatsAppFlowController extends Controller
{
    /**
     * Handle incoming WhatsApp Flow requests.
     */
    public function handle(Request $request)
    {
        try {
            $encryptedFlowData = $request->input('encrypted_flow_data');
            $encryptedAesKey = $request->input('encrypted_aes_key');
            $iv = $request->input('initial_vector');

            if (!$encryptedFlowData || !$encryptedAesKey || !$iv) {
                return response()->json(['error' => 'Missing encrypted payload fields'], 400);
            }

            // 1. Load Private Key
            $privateKeyStr = env('WHATSAPP_FLOW_PRIVATE_KEY');
            if (!$privateKeyStr) {
                Log::error('WHATSAPP_FLOW_PRIVATE_KEY is not configured');
                return response()->json(['error' => 'Server misconfiguration'], 500);
            }

            // Fix potential newline issues in env var
            $privateKeyStr = str_replace('\n', "\n", $privateKeyStr);

            // 2. Decrypt AES Key using RSA-OAEP SHA256
            $privateKey = RSA::loadPrivateKey($privateKeyStr)
                ->withPadding(RSA::ENCRYPTION_OAEP)
                ->withHash('sha256')
                ->withMGFHash('sha256');

            $aesKey = $privateKey->decrypt(base64_decode($encryptedAesKey));

            // 3. Decrypt Flow Data using AES-GCM
            $decryptedFlowData = $this->decryptAesGcm(
                base64_decode($encryptedFlowData),
                $aesKey,
                base64_decode($iv)
            );

            $payload = json_decode($decryptedFlowData, true);
            if (!$payload) {
                Log::error('Failed to decode decrypted flow data');
                return response()->json(['error' => 'Invalid flow payload'], 400);
            }

            // 4. Process Flow Data
            $responsePayload = $this->processFlowPayload($payload);

            // 5. Encrypt Response Data
            $rawIv = base64_decode($iv);
            $flippedIv = '';
            for ($i = 0; $i < strlen($rawIv); $i++) {
                $flippedIv .= chr(ord($rawIv[$i]) ^ 0xFF);
            }
            $encryptedResponseData = $this->encryptAesGcm(
                json_encode($responsePayload),
                $aesKey,
                $flippedIv
            );

            $encryptedResponseBase64 = base64_encode($encryptedResponseData);
            
            // Temporary debugging log per requirements
            Log::info('WHATSAPP FLOW RESPONSE DEBUG', [
                'length' => strlen($encryptedResponseBase64),
                'valid_base64' => base64_decode($encryptedResponseBase64, true) !== false,
                'roundtrip_valid' => base64_encode(base64_decode($encryptedResponseBase64, true)) === $encryptedResponseBase64,
                'first_20' => substr($encryptedResponseBase64, 0, 20),
                'last_20' => substr($encryptedResponseBase64, -20),
                'action' => $payload['action'] ?? 'unknown',
            ]);

            // Requirement 18: Verify base64 independently
            if (base64_decode($encryptedResponseBase64, true) === false) {
                throw new \RuntimeException('Generated response is not valid Base64');
            }

            return response($encryptedResponseBase64, 200)
                ->header('Content-Type', 'text/plain');

        } catch (\Exception $e) {
            Log::error('WhatsApp Flow Error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Internal server error', 'message' => $e->getMessage()], 500);
        }
    }

    private function processFlowPayload(array $payload): array
    {
        $action = $payload['action'] ?? '';
        $screen = $payload['screen'] ?? '';
        $data = $payload['data'] ?? [];
        
        if ($action === 'ping') {
            return [
                'version' => $payload['version'] ?? '3.0',
                'data' => [
                    'status' => 'active'
                ]
            ];
        }

        $response = [
            'version' => $payload['version'] ?? '3.0',
            'screen' => $screen,
            'data' => []
        ];

        if ($action === 'INIT' || $action === 'data_exchange') {
            if ($screen === 'APPOINTMENT') {
                $response['data'] = $this->getAppointmentScreenData($data);
                return $response;
            }
        }

        if ($action === 'data_exchange' && isset($data['submit_appointment'])) {
            return $this->handleAppointmentSubmission($payload);
        }

        return $response;
    }

    private function getAppointmentScreenData(array $currentData): array
    {
        $departments = DB::table('departments')->where('is_active', 1)->get();
        $departmentOptions = $departments->map(function ($dept) {
            return [
                'id' => (string) $dept->id,
                'title' => substr($dept->name, 0, 24),
                'description' => substr($dept->description ?? '', 0, 72)
            ];
        })->toArray();

        $locationOptions = [];
        $selectedDept = $currentData['department'] ?? null;
        if ($selectedDept) {
            $hospitals = DB::table('hospitals')
                ->join('departments', 'hospitals.id', '=', 'departments.hospital_id')
                ->where('departments.id', $selectedDept)
                ->where('hospitals.is_active', 1)
                ->select('hospitals.id', 'hospitals.name', 'hospitals.city')
                ->get();

            $locationOptions = $hospitals->map(function ($h) {
                return [
                    'id' => (string) $h->id,
                    'title' => substr($h->name, 0, 24),
                    'description' => substr($h->city ?? '', 0, 72)
                ];
            })->toArray();
        }

        $dateOptions = [];
        $selectedLoc = $currentData['location'] ?? null;
        if ($selectedDept && $selectedLoc) {
            for ($i = 0; $i < 7; $i++) {
                $date = now()->addDays($i)->toDateString();
                $dateOptions[] = [
                    'id' => $date,
                    'title' => date('M d, Y', strtotime($date))
                ];
            }
        }

        $timeOptions = [];
        $selectedDate = $currentData['date'] ?? null;
        if ($selectedDept && $selectedLoc && $selectedDate) {
            $doctors = DB::table('doctors')
                ->where('department_id', $selectedDept)
                ->where('hospital_id', $selectedLoc)
                ->pluck('id');

            $bookedTimes = DB::table('appointments')
                ->whereIn('doctor_id', $doctors)
                ->where('appointment_date', $selectedDate)
                ->whereNotIn('status', ['Cancelled', 'Rejected'])
                ->pluck('appointment_time')
                ->map(fn($t) => date('H:i', strtotime($t)))
                ->toArray();

            $startTime = strtotime('09:00');
            $endTime = strtotime('17:00');
            
            while ($startTime < $endTime) {
                $timeStr = date('H:i', $startTime);
                $isPast = ($selectedDate === now()->toDateString() && $startTime < time());
                
                if (!in_array($timeStr, $bookedTimes) && !$isPast) {
                    $timeOptions[] = [
                        'id' => $timeStr,
                        'title' => date('h:i A', $startTime)
                    ];
                }
                $startTime += 15 * 60; // 15 mins
            }
        }

        return [
            'department_options' => $departmentOptions,
            'location_options' => $locationOptions,
            'date_options' => $dateOptions,
            'time_options' => $timeOptions,
            'is_complete' => ($selectedDept && $selectedLoc && $selectedDate && isset($currentData['time']))
        ];
    }

    private function handleAppointmentSubmission(array $payload): array
    {
        $data = $payload['data'];
        $flowToken = $payload['flow_token'] ?? 'unknown';

        $deptId = $data['department'] ?? null;
        $locId = $data['location'] ?? null;
        $date = $data['date'] ?? null;
        $time = $data['time'] ?? null;

        if (!$deptId || !$locId || !$date || !$time) {
             return [
                'version' => $payload['version'],
                'screen' => 'SUCCESS', 
                'data' => [
                    'error_message' => 'Missing required appointment fields.'
                ]
            ];
        }

        $doctor = DB::table('doctors')
            ->where('department_id', $deptId)
            ->where('hospital_id', $locId)
            ->first();

        if (!$doctor) {
            return [
                'version' => $payload['version'],
                'screen' => 'SUCCESS',
                'data' => [
                    'error_message' => 'No doctors available for this department.'
                ]
            ];
        }

        // Check double booking
        $isBooked = DB::table('appointments')
            ->where('doctor_id', $doctor->id)
            ->where('appointment_date', $date)
            ->where('appointment_time', 'like', $time . '%')
            ->whereNotIn('status', ['Cancelled', 'Rejected'])
            ->exists();

        if ($isBooked) {
            return [
                'version' => $payload['version'],
                'screen' => 'SUCCESS',
                'data' => [
                    'error_message' => 'Sorry, this slot just got booked. Please try another time.'
                ]
            ];
        }

        $phoneNumber = is_numeric($flowToken) ? '+' . ltrim($flowToken, '+') : '+0000000000';
        $patient = Patient::firstOrCreate(
            ['whatsapp_number' => $phoneNumber],
            ['name' => $data['patient_name'] ?? 'WhatsApp User']
        );

        $bookingId = 'BKG-' . rand(1000, 9999);

        $appointmentId = DB::table('appointments')->insertGetId([
            'booking_id' => $bookingId,
            'hospital_id' => $locId,
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
            'appointment_date' => $date,
            'appointment_time' => $time,
            'status' => 'Pending',
            'type' => 'Online',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return [
            'version' => $payload['version'],
            'screen' => 'SUCCESS',
            'data' => [
                'booking_id' => $bookingId,
                'message' => 'Appointment successfully booked!'
            ]
        ];
    }

    private function decryptAesGcm(string $ciphertext, string $aesKey, string $iv): string
    {
        $tagLength = 16;
        $tag = substr($ciphertext, -$tagLength);
        $actualCiphertext = substr($ciphertext, 0, -$tagLength);
        $cipher = 'aes-' . (strlen($aesKey) * 8) . '-gcm';
        $decrypted = openssl_decrypt($actualCiphertext, $cipher, $aesKey, OPENSSL_RAW_DATA, $iv, $tag);
        if ($decrypted === false) {
            throw new \Exception('AES-GCM decryption failed: ' . openssl_error_string());
        }
        return $decrypted;
    }

    private function encryptAesGcm(string $plaintext, string $aesKey, string $spoomedIv): string
    {
        $cipher = 'aes-' . (strlen($aesKey) * 8) . '-gcm';
        $tag = '';
        $encrypted = openssl_encrypt($plaintext, $cipher, $aesKey, OPENSSL_RAW_DATA, $spoomedIv, $tag, '', 16);
        if ($encrypted === false) {
            throw new \Exception('AES-GCM encryption failed: ' . openssl_error_string());
        }
        return $encrypted . $tag;
    }
}






