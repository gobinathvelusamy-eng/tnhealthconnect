<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Hospital;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Queue;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function summary()
    {
        $totalHospitals = DB::table('hospitals')->where('is_active', 1)->count();
        $totalDoctors = DB::table('doctors')->where('is_active', 1)->count();
        
        $totalAppointments = DB::table('appointments')->count();
        $totalPatientPayments = DB::table('payments')->sum('total_amount');
        $hospitalRevenue = DB::table('payments')->sum('consultation_fee');
        $platformFees = DB::table('payments')->sum('platform_fee');

        return response()->json([
            'total_hospitals' => $totalHospitals,
            'total_doctors' => $totalDoctors,
            'todays_appointments' => $totalAppointments,
            'todays_revenue' => $platformFees,
            'total_patient_payments' => $totalPatientPayments,
            'hospital_revenue' => $hospitalRevenue,
            'platform_fees' => $platformFees
        ]);
    }

    public function liveQueue()
    {
        $queue = DB::table('queues')
            ->join('appointments', 'queues.appointment_id', '=', 'appointments.id')
            ->join('patients', 'appointments.patient_id', '=', 'patients.id')
            ->join('hospitals', 'queues.hospital_id', '=', 'hospitals.id')
            ->join('doctors', 'queues.doctor_id', '=', 'doctors.id')
            ->join('users', 'doctors.user_id', '=', 'users.id')
            ->select(
                'queues.id',
                'queues.token_number',
                'queues.queue_position',
                'queues.status',
                'queues.queue_type',
                'appointments.booking_id',
                'appointments.appointment_date',
                'appointments.appointment_time',
                'patients.name as patient_name',
                'patients.whatsapp_number as patient_phone',
                'hospitals.name as hospital_name',
                'users.name as doctor_name'
            )
            ->orderBy('queues.queue_position')
            ->get();
            
        return response()->json($queue);
    }
}
