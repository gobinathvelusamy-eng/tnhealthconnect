<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PlatformIntegrationController extends Controller
{
    public function getDistricts()
    {
        // For WhatsApp Bot: Return only districts that have active hospitals registered in the software
        $districts = DB::table('districts')
            ->join('hospitals', 'districts.id', '=', 'hospitals.district_id')
            ->where('districts.is_active', 1)
            ->where('hospitals.is_active', 1)
            ->select('districts.id', 'districts.name', 'districts.code')
            ->distinct()
            ->orderBy('districts.name')
            ->get();

        return response()->json($districts);
    }

    public function getAllDistricts()
    {
        // For Super Admin: Full district master list for registering new hospitals
        return response()->json(DB::table('districts')->where('is_active', 1)->orderBy('name')->get());
    }

    public function getPlaces(Request $request)
    {
        $query = DB::table('hospitals')
            ->where('is_active', 1)
            ->select('city as id', 'city as name')
            ->distinct();

        if ($request->has('district_id')) {
            $query->where('district_id', $request->district_id);
        }

        return response()->json($query->get());
    }

    public function getHospitals(Request $request)
    {
        $query = DB::table('hospitals')->where('is_active', 1);

        if ($request->has('district_id')) {
            $query->where('district_id', $request->district_id);
        }

        if ($request->has('place')) {
            $query->where('city', $request->place);
        }

        return response()->json($query->get());
    }

    public function getSpecialities(Request $request)
    {
        $query = DB::table('departments')
            ->where('is_active', 1)
            ->select('id', 'name', 'description', 'consultation_fee', 'hospital_id');

        if ($request->has('hospital_id')) {
            $query->where('hospital_id', $request->hospital_id);
        }

        return response()->json($query->get());
    }

    public function getDoctors(Request $request)
    {
        $query = DB::table('doctors')
            ->join('users', 'doctors.user_id', '=', 'users.id')
            ->join('departments', 'doctors.department_id', '=', 'departments.id')
            ->select(
                'doctors.id', 
                'users.name', 
                'departments.name as speciality', 
                'doctors.hospital_id',
                'departments.consultation_fee'
            )
            ->where('doctors.is_active', 1);

        if ($request->has('hospital_id')) {
            $query->where('doctors.hospital_id', $request->hospital_id);
        }

        if ($request->has('speciality_id')) {
            $query->where('doctors.department_id', $request->speciality_id);
        }

        $doctors = $query->get()->map(function ($doc) {
            $fee = floatval($doc->consultation_fee ?: 300);
            return [
                'id' => $doc->id,
                'name' => $doc->name,
                'speciality' => $doc->speciality,
                'hospital_id' => $doc->hospital_id,
                'consultation_fee' => $fee,
                'platform_fee' => 50.00,
                'total_fee' => $fee + 50.00
            ];
        });

        return response()->json($doctors);
    }

    public function getAvailableDates(Request $request, $doctorId)
    {
        // 1. Check doctor leave dates from doctor_schedules or doctor_slots where status = 'Leave'
        $leaveDates = DB::table('doctor_slots')
            ->where('doctor_id', $doctorId)
            ->where('status', 'Leave')
            ->pluck('appointment_date')
            ->toArray();

        $availableDates = [];
        for ($i = 1; $i <= 7; $i++) {
            $checkDate = date('Y-m-d', strtotime("+$i days"));
            // If date is not in leaves, make available
            if (!in_array($checkDate, $leaveDates)) {
                $availableDates[] = [
                    'id' => $checkDate,
                    'title' => date('D, d M Y', strtotime($checkDate)),
                    'raw_date' => $checkDate
                ];
            }
            if (count($availableDates) >= 3) break; // Offer top 3 days
        }

        if (empty($availableDates)) {
            return response()->json([
                'on_leave' => true,
                'message' => 'The selected doctor is currently on leave. Please select another doctor or date.'
            ]);
        }

        return response()->json($availableDates);
    }

    /**
     * Get Available Slots with Strict Duplicate Prevention (15-min intervals)
     */
    public function getAvailableSlots(Request $request, $doctorId)
    {
        $date = $request->input('date', date('Y-m-d', strtotime('+1 day')));

        // Check if date is blocked for leave
        $isLeave = DB::table('doctor_slots')
            ->where('doctor_id', $doctorId)
            ->where('appointment_date', $date)
            ->where('status', 'Leave')
            ->exists();

        if ($isLeave) {
            return response()->json([
                'on_leave' => true,
                'message' => 'Doctor is on leave on ' . $date . '. Please choose another date.'
            ]);
        }

        // Standard 15-minute slot intervals (9:00 AM to 5:00 PM)
        $standardSlots = [
            '09:00 AM', '09:15 AM', '09:30 AM', '09:45 AM',
            '10:00 AM', '10:15 AM', '10:30 AM', '10:45 AM',
            '11:00 AM', '11:15 AM', '11:30 AM', '11:45 AM',
            '02:00 PM', '02:15 PM', '02:30 PM', '02:45 PM',
            '03:00 PM', '03:15 PM', '03:30 PM', '03:45 PM',
            '04:00 PM', '04:15 PM', '04:30 PM', '04:45 PM',
        ];

        // 1. Fetch already booked appointments for this doctor & date
        $bookedTimes = DB::table('appointments')
            ->where('doctor_id', $doctorId)
            ->where('appointment_date', $date)
            ->whereNotIn('status', ['Cancelled', 'Refunded'])
            ->pluck('appointment_time')
            ->map(function ($time) {
                return date('h:i A', strtotime($time));
            })
            ->toArray();

        // 2. Filter out booked slots
        $availableSlots = [];
        foreach ($standardSlots as $idx => $slot) {
            $formattedSlot = date('h:i A', strtotime($slot));
            if (!in_array($formattedSlot, $bookedTimes)) {
                $availableSlots[] = [
                    'id' => 'slot_' . ($idx + 1) . '_' . str_replace(' ', '', $slot),
                    'title' => $slot
                ];
            }
        }

        return response()->json($availableSlots);
    }

    /**
     * Create Real Appointment from WhatsApp Platform
     */
    public function createAppointment(Request $request)
    {
        try {
            $patientName = $request->input('patient_name', 'Guest Patient');
            $patientPhone = $request->input('patient_phone', '919486639188');
            $age = $request->input('patient_age') ? intval($request->input('patient_age')) : 25;
            $gender = $request->input('patient_gender', 'Male');
            $hospitalId = $request->input('hospital_id') ? intval($request->input('hospital_id')) : 1;
            $doctorId = $request->input('doctor_id') ? intval($request->input('doctor_id')) : 1;
            $departmentId = $request->input('department_id') ? intval($request->input('department_id')) : 1;
            $date = $request->input('appointment_date') ?: date('Y-m-d', strtotime('+1 day'));
            $slotTime = $request->input('slot_time', '10:00 AM');
            $bookingId = $request->input('booking_id') ?: ('TNHC-' . rand(100000, 999999));
            $paymentId = $request->input('payment_id', 'pay_confirmed');
            $consultationFee = floatval($request->input('consultation_fee', 300));
            $platformFee = floatval($request->input('platform_fee', 50));
            $totalAmount = floatval($request->input('total_amount', $consultationFee + $platformFee));

            // Clean slot time format (e.g. slot_1_10:00AM -> 10:00 AM)
            if (strpos($slotTime, '_') !== false) {
                $parts = explode('_', $slotTime);
                $slotTime = end($parts);
            }
            $parsedTime = date('H:i:s', strtotime($slotTime));

            // Strict Concurrency Check: Check if slot was booked just now
            $existing = DB::table('appointments')
                ->where('doctor_id', $doctorId)
                ->where('appointment_date', $date)
                ->where('appointment_time', $parsedTime)
                ->whereNotIn('status', ['Cancelled', 'Refunded'])
                ->first();

            if ($existing) {
                return response()->json([
                    'success' => false,
                    'error' => 'SLOT_ALREADY_BOOKED',
                    'message' => 'This slot was just booked by another patient. Please choose a different time.'
                ], 409);
            }

            // 1. Find or create Patient
            $cleanPhone = preg_replace('/\D/', '', $patientPhone);
            $patient = DB::table('patients')->where('whatsapp_number', $cleanPhone)->first();
            
            if (!$patient) {
                $patientId = DB::table('patients')->insertGetId([
                    'name' => $patientName,
                    'whatsapp_number' => $cleanPhone,
                    'age' => $age,
                    'gender' => $gender,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            } else {
                $patientId = $patient->id;
                DB::table('patients')->where('id', $patientId)->update([
                    'name' => $patientName,
                    'age' => $age,
                    'gender' => $gender,
                    'updated_at' => now()
                ]);
            }

            // 2. Insert into Appointments
            $appointmentId = DB::table('appointments')->insertGetId([
                'booking_id' => $bookingId,
                'hospital_id' => $hospitalId,
                'doctor_id' => $doctorId,
                'patient_id' => $patientId,
                'appointment_date' => $date,
                'appointment_time' => $parsedTime,
                'status' => 'Booked',
                'type' => 'Online WhatsApp',
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // 3. Insert into Payments
            DB::table('payments')->insert([
                'appointment_id' => $appointmentId,
                'consultation_fee' => $consultationFee,
                'platform_fee' => $platformFee,
                'payment_gateway_fee' => 7.00,
                'gst' => 9.00,
                'net_platform_income' => $platformFee - 16.00,
                'hospital_amount' => $consultationFee,
                'total_amount' => $totalAmount,
                'transaction_id' => $paymentId,
                'payment_method' => 'UPI / Razorpay',
                'payment_status' => 'Success',
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // 4. Insert into QR Codes
            DB::table('qr_codes')->insert([
                'appointment_id' => $appointmentId,
                'qr_token' => $bookingId,
                'is_used' => 0,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // 5. Insert into Queue
            $queueCount = DB::table('queues')
                ->where('hospital_id', $hospitalId)
                ->where('doctor_id', $doctorId)
                ->whereDate('created_at', now()->toDateString())
                ->count();

            DB::table('queues')->insert([
                'hospital_id' => $hospitalId,
                'doctor_id' => $doctorId,
                'appointment_id' => $appointmentId,
                'token_number' => 'TKN-' . ($queueCount + 1),
                'queue_position' => $queueCount + 1,
                'queue_type' => 'WhatsApp',
                'status' => 'Waiting',
                'created_at' => now(),
                'updated_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'appointment_id' => $appointmentId,
                'booking_id' => $bookingId,
                'status' => 'CONFIRMED'
            ], 201);
        } catch (\Exception $e) {
            \Log::error('[PlatformIntegrationController] createAppointment error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get All Real Appointments for Super Admin & Hospital Dashboards
     */
    public function getAppointments(Request $request)
    {
        $query = DB::table('appointments')
            ->join('patients', 'appointments.patient_id', '=', 'patients.id')
            ->join('hospitals', 'appointments.hospital_id', '=', 'hospitals.id')
            ->join('doctors', 'appointments.doctor_id', '=', 'doctors.id')
            ->join('users as doc_users', 'doctors.user_id', '=', 'doc_users.id')
            ->join('departments', 'doctors.department_id', '=', 'departments.id')
            ->leftJoin('payments', 'appointments.id', '=', 'payments.appointment_id')
            ->leftJoin('queues', 'appointments.id', '=', 'queues.appointment_id')
            ->select(
                'appointments.id',
                'appointments.booking_id',
                'appointments.appointment_date',
                'appointments.appointment_time',
                'appointments.status',
                'appointments.type',
                'appointments.created_at',
                'patients.id as patient_db_id',
                'patients.name as patient_name',
                'patients.whatsapp_number',
                'patients.age as patient_age',
                'patients.gender as patient_gender',
                'hospitals.id as hospital_id',
                'hospitals.name as hospital_name',
                'hospitals.city as hospital_city',
                'doc_users.name as doctor_name',
                'departments.name as department_name',
                'departments.consultation_fee as dept_fee',
                'payments.total_amount',
                'payments.consultation_fee',
                'payments.platform_fee',
                'payments.payment_status',
                'payments.transaction_id',
                'queues.token_number',
                'queues.queue_position'
            )
            ->orderBy('appointments.id', 'desc');

        if ($request->has('hospital_id') && $request->hospital_id) {
            $query->where('appointments.hospital_id', $request->hospital_id);
        }

        $records = $query->get();

        $formatted = $records->map(function ($row) {
            $timeStr = date('g:i A', strtotime($row->appointment_time));
            return [
                'id' => $row->booking_id,
                'numericId' => $row->id,
                'patientId' => 'P-' . $row->patient_db_id,
                'patientName' => $row->patient_name,
                'patientPhone' => $row->whatsapp_number,
                'patientAge' => $row->patient_age,
                'patientGender' => $row->patient_gender,
                'healthIssue' => $row->department_name,
                'hospitalName' => $row->hospital_name,
                'hospitalId' => (string) $row->hospital_id,
                'doctorName' => str_starts_with($row->doctor_name, 'Dr.') ? $row->doctor_name : ('Dr. ' . $row->doctor_name),
                'department' => $row->department_name,
                'paymentMethod' => 'UPI / Razorpay',
                'paymentStatus' => $row->payment_status ?: 'Paid',
                'transactionId' => $row->transaction_id,
                'tokenNumber' => $row->token_number ?: ('TKN-' . $row->id),
                'financials' => [
                    'totalPaid' => floatval($row->total_amount ?: 350),
                    'consultationFee' => floatval($row->consultation_fee ?: 300),
                    'platformFee' => floatval($row->platform_fee ?: 50)
                ],
                'status' => $row->status ?: 'Booked',
                'date' => $row->appointment_date,
                'time' => $timeStr,
                'type' => $row->department_name, // Health Issue
                'auditTimeline' => [
                    ['time' => date('g:i A', strtotime($row->created_at)), 'action' => 'Booked via WhatsApp', 'user' => $row->patient_name]
                ]
            ];
        });

        return response()->json($formatted);
    }
}
