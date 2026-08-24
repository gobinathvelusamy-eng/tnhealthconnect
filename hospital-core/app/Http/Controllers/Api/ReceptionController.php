<?php

namespace App\Http\Controllers\Api;

use App\Models\QrCode;
use App\Models\Queue;
use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class ReceptionController extends Controller
{
    /**
     * Handle Reception QR Code Scan
     */
    public function scanQr(Request $request)
    {
        $rawToken = trim($request->input('qr_token', ''));
        $hospitalId = $request->input('hospital_id');
        if ($hospitalId) {
            $hospitalId = intval(str_replace('h', '', $hospitalId));
        }

        if (empty($rawToken)) {
            return response()->json(['error' => 'No QR token provided'], 400);
        }

        // 1. Extract booking ID from various formats
        // Format A: Booking:TNHC-123456|Status:PAID...
        // Format B: TNHC-123456
        // Format C: BKG-1001
        $bookingId = $rawToken;
        if (preg_match('/Booking:([A-Za-z0-9_\-]+)/', $rawToken, $matches)) {
            $bookingId = $matches[1];
        }

        // Find appointment by booking_id or ID
        $appointment = DB::table('appointments')
            ->join('patients', 'appointments.patient_id', '=', 'patients.id')
            ->join('hospitals', 'appointments.hospital_id', '=', 'hospitals.id')
            ->join('doctors', 'appointments.doctor_id', '=', 'doctors.id')
            ->join('users', 'doctors.user_id', '=', 'users.id')
            ->join('departments', 'doctors.department_id', '=', 'departments.id')
            ->where('appointments.booking_id', $bookingId)
            ->orWhere('appointments.id', $bookingId)
            ->select(
                'appointments.id',
                'appointments.booking_id',
                'appointments.hospital_id',
                'appointments.doctor_id',
                'appointments.appointment_date',
                'appointments.appointment_time',
                'appointments.status',
                'patients.name as patientName',
                'patients.whatsapp_number as patientPhone',
                'patients.gender as patientGender',
                'patients.age as patientAge',
                'hospitals.name as hospitalName',
                'users.name as doctorName',
                'departments.name as departmentName'
            )
            ->first();

        if (!$appointment) {
            return response()->json(['error' => 'Booking ID (' . $bookingId . ') not found in database.'], 404);
        }

        return response()->json([
            'success' => true,
            'appointment' => [
                'id' => $appointment->booking_id,
                'numericId' => $appointment->id,
                'patientName' => $appointment->patientName,
                'patientPhone' => $appointment->patientPhone,
                'hospitalName' => $appointment->hospitalName,
                'doctorName' => 'Dr. ' . $appointment->doctorName,
                'department' => $appointment->departmentName,
                'status' => $appointment->status,
                'date' => $appointment->appointment_date,
                'time' => date('g:i A', strtotime($appointment->appointment_time))
            ]
        ]);
    }

    /**
     * Complete Check-in and push to queue
     */
    public function checkIn(Request $request)
    {
        $rawToken = trim($request->input('qr_token', ''));
        $bookingId = $rawToken;
        if (preg_match('/Booking:([A-Za-z0-9_\-]+)/', $rawToken, $matches)) {
            $bookingId = $matches[1];
        }

        $appointment = DB::table('appointments')
            ->where('booking_id', $bookingId)
            ->orWhere('id', $bookingId)
            ->first();

        if (!$appointment) {
            return response()->json(['error' => 'Appointment not found'], 404);
        }

        // Update status to Checked In
        DB::table('appointments')->where('id', $appointment->id)->update([
            'status' => 'Checked In',
            'updated_at' => now()
        ]);

        // Mark QR as used if exists
        DB::table('qr_codes')->where('appointment_id', $appointment->id)->update([
            'is_used' => 1,
            'scanned_at' => now(),
            'updated_at' => now()
        ]);

        // Ensure in Queue
        $queue = DB::table('queues')->where('appointment_id', $appointment->id)->first();
        if (!$queue) {
            $position = DB::table('queues')
                ->where('doctor_id', $appointment->doctor_id)
                ->whereDate('created_at', now()->toDateString())
                ->count() + 1;

            DB::table('queues')->insert([
                'hospital_id' => $appointment->hospital_id,
                'doctor_id' => $appointment->doctor_id,
                'appointment_id' => $appointment->id,
                'token_number' => 'TKN-' . ($position),
                'queue_position' => $position,
                'queue_type' => 'Online',
                'status' => 'Waiting',
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }

        return response()->json(['success' => true, 'message' => 'Patient Checked In Successfully!']);
    }
}
