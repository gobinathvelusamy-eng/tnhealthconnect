<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // 1. Districts
        Schema::create('districts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('state_id')->nullable();
            $table->string('name');
            $table->string('code')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 2. Hospitals
        Schema::create('hospitals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('district_id')->constrained();
            $table->foreignId('state_id')->nullable();
            $table->string('name');
            $table->string('taluk')->nullable();
            $table->string('city')->nullable();
            $table->text('address')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 3. Hospital Timings
        Schema::create('hospital_timings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hospital_id')->constrained()->cascadeOnDelete();
            $table->string('day'); // Monday, Tuesday, etc.
            $table->time('opening_time');
            $table->time('closing_time');
            $table->boolean('emergency_enabled')->default(false);
            $table->timestamps();
        });

        // 4. Modules
        Schema::create('modules', function (Blueprint $table) {
            $table->id();
            $table->string('module_name');
            $table->string('description')->nullable();
            $table->timestamps();
        });

        // 5. Hospital Modules
        Schema::create('hospital_modules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hospital_id')->constrained()->cascadeOnDelete();
            $table->foreignId('module_id')->constrained()->cascadeOnDelete();
            $table->boolean('enabled')->default(false);
            $table->timestamps();
            $table->unique(['hospital_id', 'module_id']);
        });

        // 6. Departments
        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hospital_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('icon')->nullable();
            $table->decimal('consultation_fee', 8, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 7. Treatments
        Schema::create('treatments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('department_id')->constrained()->cascadeOnDelete();
            $table->string('treatment_name');
            $table->text('description')->nullable();
            $table->string('keywords')->nullable(); // Comma separated for search
            $table->timestamps();
        });

        // 8. Users
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('role');
            $table->foreignId('hospital_id')->nullable()->constrained()->nullOnDelete();
            $table->rememberToken();
            $table->timestamps();
        });

        // 9. Patients
        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('whatsapp_number')->unique();
            $table->integer('age')->nullable();
            $table->string('gender')->nullable();
            $table->timestamps();
        });

        // 10. Patient Family Members
        Schema::create('patient_family_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('relation');
            $table->string('gender')->nullable();
            $table->integer('age')->nullable();
            $table->timestamps();
        });

        // 11. Doctors
        Schema::create('doctors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('hospital_id')->constrained()->cascadeOnDelete();
            $table->foreignId('department_id')->constrained()->cascadeOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 12. Doctor Schedules
        Schema::create('doctor_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctor_id')->constrained()->cascadeOnDelete();
            $table->string('day_of_week');
            $table->time('start_time');
            $table->time('end_time');
            $table->integer('slot_duration_mins')->default(15);
            $table->string('status')->default('Active'); // Active, Leave
            $table->timestamps();
        });

        // 13. Doctor Slots
        Schema::create('doctor_slots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctor_id')->constrained()->cascadeOnDelete();
            $table->date('appointment_date');
            $table->time('slot_time');
            $table->integer('slot_duration')->default(15);
            $table->string('status')->default('Available'); // Available, Booked, Blocked, Leave
            $table->timestamps();
        });

        // 14. Appointments
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->string('booking_id')->unique();
            $table->foreignId('hospital_id')->constrained();
            $table->foreignId('doctor_id')->constrained();
            $table->foreignId('patient_id')->constrained();
            $table->date('appointment_date');
            $table->time('appointment_time');
            $table->string('status')->default('Booked'); 
            $table->string('type')->default('Online');
            $table->timestamps();
        });

        // 15. Appointment History
        Schema::create('appointment_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->constrained()->cascadeOnDelete();
            $table->string('status');
            $table->text('remarks')->nullable();
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // 16. QR Codes
        Schema::create('qr_codes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->constrained()->cascadeOnDelete();
            $table->string('qr_token')->unique();
            $table->timestamp('expires_at')->nullable();
            $table->boolean('is_used')->default(false);
            $table->timestamp('scanned_at')->nullable();
            $table->foreignId('scanned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // 17. Queues
        Schema::create('queues', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hospital_id')->constrained()->cascadeOnDelete();
            $table->foreignId('doctor_id')->constrained()->cascadeOnDelete();
            $table->foreignId('appointment_id')->constrained()->cascadeOnDelete();
            $table->string('token_number');
            $table->integer('queue_position');
            $table->string('queue_type')->default('Online');
            $table->string('status')->default('Waiting');
            $table->timestamps();
        });

        // 18. Payments
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->constrained()->cascadeOnDelete();
            $table->decimal('consultation_fee', 8, 2)->default(0);
            $table->decimal('platform_fee', 8, 2)->default(0);
            $table->decimal('payment_gateway_fee', 8, 2)->default(0);
            $table->decimal('gst', 8, 2)->default(0);
            $table->decimal('net_platform_income', 8, 2)->default(0);
            $table->decimal('hospital_amount', 8, 2)->default(0);
            $table->decimal('total_amount', 8, 2)->default(0);
            $table->string('transaction_id')->nullable();
            $table->string('payment_method')->nullable();
            $table->string('payment_status')->default('Pending');
            $table->timestamps();
        });

        // 19. Platform Settings
        Schema::create('platform_settings', function (Blueprint $table) {
            $table->id();
            $table->string('setting_key')->unique();
            $table->text('setting_value')->nullable();
            $table->string('description')->nullable();
            $table->timestamps();
        });

        // 20. WhatsApp Sessions
        Schema::create('whatsapp_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('phone_number')->unique();
            $table->string('current_step')->nullable();
            $table->bigInteger('selected_district')->nullable();
            $table->bigInteger('selected_hospital')->nullable();
            $table->bigInteger('selected_department')->nullable();
            $table->bigInteger('selected_doctor')->nullable();
            $table->bigInteger('appointment_id')->nullable();
            $table->boolean('completed')->default(false);
            $table->timestamp('last_activity')->useCurrent();
            $table->timestamps();
        });

        // 21. Daily Reports
        Schema::create('daily_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hospital_id')->constrained()->cascadeOnDelete();
            $table->date('report_date');
            $table->integer('appointments')->default(0);
            $table->integer('completed')->default(0);
            $table->integer('cancelled')->default(0);
            $table->integer('no_show')->default(0);
            $table->decimal('hospital_collection', 10, 2)->default(0);
            $table->decimal('platform_collection', 10, 2)->default(0);
            $table->integer('average_waiting_time')->default(0); // in minutes
            $table->timestamps();
            
            $table->unique(['hospital_id', 'report_date']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('daily_reports');
        Schema::dropIfExists('whatsapp_sessions');
        Schema::dropIfExists('platform_settings');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('queues');
        Schema::dropIfExists('qr_codes');
        Schema::dropIfExists('appointment_history');
        Schema::dropIfExists('appointments');
        Schema::dropIfExists('doctor_slots');
        Schema::dropIfExists('doctor_schedules');
        Schema::dropIfExists('doctors');
        Schema::dropIfExists('patient_family_members');
        Schema::dropIfExists('patients');
        Schema::dropIfExists('users');
        Schema::dropIfExists('treatments');
        Schema::dropIfExists('departments');
        Schema::dropIfExists('hospital_modules');
        Schema::dropIfExists('modules');
        Schema::dropIfExists('hospital_timings');
        Schema::dropIfExists('hospitals');
        Schema::dropIfExists('districts');
    }
};
