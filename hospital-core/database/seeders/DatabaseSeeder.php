<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        // 1. Platform Settings
        DB::table('platform_settings')->insert([
            ['setting_key' => 'whatsapp_access_token', 'setting_value' => '', 'description' => 'Meta WhatsApp Cloud API Access Token'],
            ['setting_key' => 'whatsapp_phone_number_id', 'setting_value' => '', 'description' => 'Meta WhatsApp Phone Number ID'],
            ['setting_key' => 'whatsapp_webhook_verify_token', 'setting_value' => 'salem_health_secure_token_123', 'description' => 'Webhook Verification Token'],
            ['setting_key' => 'platform_fee_percentage', 'setting_value' => '5', 'description' => 'Platform Service Fee (%)'],
        ]);

        // 2. Districts
        $districtId = DB::table('districts')->insertGetId([
            'name' => 'Salem',
            'code' => 'SLM',
            'is_active' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 3. Hospitals
        $hospitalId = DB::table('hospitals')->insertGetId([
            'district_id' => $districtId,
            'name' => 'Salem City Hospital',
            'city' => 'Salem',
            'address' => '123 Main St, Salem',
            'is_active' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 4. Users (Super Admin & Hospital Admin)
        DB::table('users')->insert([
            [
                'name' => 'Super Admin',
                'email' => 'admin@salemhealth.com',
                'password' => Hash::make('password'),
                'role' => 'SuperAdmin',
                'hospital_id' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Hospital Admin',
                'email' => 'hospital@salemhealth.com',
                'password' => Hash::make('password'),
                'role' => 'HospitalAdmin',
                'hospital_id' => $hospitalId,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);

        // 5. Departments
        $cardiologyId = DB::table('departments')->insertGetId([
            'hospital_id' => $hospitalId,
            'name' => 'Cardiology',
            'description' => 'Heart and blood vessel conditions',
            'icon' => 'heartbeat',
            'consultation_fee' => 500,
            'is_active' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $neurologyId = DB::table('departments')->insertGetId([
            'hospital_id' => $hospitalId,
            'name' => 'Neurology',
            'description' => 'Brain and nervous system',
            'icon' => 'brain',
            'consultation_fee' => 600,
            'is_active' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 6. Treatments
        DB::table('treatments')->insert([
            ['department_id' => $cardiologyId, 'treatment_name' => 'ECG', 'keywords' => 'heart, ecg, chest pain', 'created_at' => now(), 'updated_at' => now()],
            ['department_id' => $neurologyId, 'treatment_name' => 'EEG', 'keywords' => 'brain, eeg, headache', 'created_at' => now(), 'updated_at' => now()],
        ]);

        // 7. Doctors
        $doctorUserId = DB::table('users')->insertGetId([
            'name' => 'Dr. Rajesh Kumar',
            'email' => 'rajesh@salemhealth.com',
            'password' => Hash::make('password'),
            'role' => 'Doctor',
            'hospital_id' => $hospitalId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $doctorId = DB::table('doctors')->insertGetId([
            'user_id' => $doctorUserId,
            'hospital_id' => $hospitalId,
            'department_id' => $cardiologyId,
            'is_active' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 8. Doctor Slots
        DB::table('doctor_slots')->insert([
            ['doctor_id' => $doctorId, 'appointment_date' => now()->toDateString(), 'slot_time' => '10:00:00', 'status' => 'Available', 'created_at' => now(), 'updated_at' => now()],
            ['doctor_id' => $doctorId, 'appointment_date' => now()->toDateString(), 'slot_time' => '10:15:00', 'status' => 'Available', 'created_at' => now(), 'updated_at' => now()],
        ]);

        // 9. Patients & Appointments
        $patientId = DB::table('patients')->insertGetId([
            'name' => 'Ramesh',
            'whatsapp_number' => '+919876543210',
            'age' => 45,
            'gender' => 'Male',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $appointmentId = DB::table('appointments')->insertGetId([
            'booking_id' => 'BKG-1001',
            'hospital_id' => $hospitalId,
            'doctor_id' => $doctorId,
            'patient_id' => $patientId,
            'appointment_date' => now()->toDateString(),
            'appointment_time' => '09:30:00',
            'status' => 'Checked In',
            'type' => 'Online',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $upcomingPatientId = DB::table('patients')->insertGetId([
            'name' => 'Suresh Kumar',
            'whatsapp_number' => '+919876543211',
            'age' => 38,
            'gender' => 'Male',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $upcomingAppointmentId = DB::table('appointments')->insertGetId([
            'booking_id' => 'BKG-1002',
            'hospital_id' => $hospitalId,
            'doctor_id' => $doctorId,
            'patient_id' => $upcomingPatientId,
            'appointment_date' => now()->toDateString(),
            'appointment_time' => '10:00:00',
            'status' => 'Upcoming',
            'type' => 'Online',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Generate QR code for the upcoming appointment
        DB::table('qr_codes')->insert([
            'appointment_id' => $upcomingAppointmentId,
            'qr_token' => 'QR-' . uniqid(),
            'is_used' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 10. Queue
        DB::table('queues')->insert([
            'hospital_id' => $hospitalId,
            'doctor_id' => $doctorId,
            'appointment_id' => $appointmentId,
            'token_number' => 'TKN-1001',
            'queue_position' => 1,
            'status' => 'Waiting',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 11. Payments
        DB::table('payments')->insert([
            'appointment_id' => $appointmentId,
            'consultation_fee' => 500,
            'platform_fee' => 25,
            'payment_gateway_fee' => 10,
            'gst' => 6,
            'net_platform_income' => 9,
            'hospital_amount' => 500,
            'total_amount' => 525,
            'transaction_id' => 'TXN-0001',
            'payment_status' => 'Completed',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 12. Daily Reports
        DB::table('daily_reports')->insert([
            'hospital_id' => $hospitalId,
            'report_date' => now()->toDateString(),
            'appointments' => 1,
            'completed' => 0,
            'hospital_collection' => 500,
            'platform_collection' => 25,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
