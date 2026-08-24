<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\WhatsAppWebhookController;
use App\Http\Controllers\Api\WhatsAppFlowController;
use App\Http\Controllers\Api\ReceptionController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

use App\Http\Controllers\Api\RazorpayWebhookController;

// WhatsApp Webhook (Public, secured via Meta token/signature)
Route::get('/webhook/whatsapp', [WhatsAppWebhookController::class, 'verify']);
Route::post('/webhook/whatsapp', [WhatsAppWebhookController::class, 'handle']);
Route::post('/whatsapp/flows', [WhatsAppFlowController::class, 'handle']);

use App\Http\Controllers\Api\PlatformIntegrationController;

// External Automation Platform APIs
Route::get('/districts', [PlatformIntegrationController::class, 'getDistricts']);
Route::get('/districts/all', [PlatformIntegrationController::class, 'getAllDistricts']);
Route::get('/places', [PlatformIntegrationController::class, 'getPlaces']);
Route::get('/hospitals', [PlatformIntegrationController::class, 'getHospitals']);
Route::get('/specialities', [PlatformIntegrationController::class, 'getSpecialities']);
Route::get('/doctors', [PlatformIntegrationController::class, 'getDoctors']);
Route::get('/doctors/{doctorId}/dates', [PlatformIntegrationController::class, 'getAvailableDates']);
Route::get('/doctors/{doctorId}/slots', [PlatformIntegrationController::class, 'getAvailableSlots']);
Route::get('/appointments', [PlatformIntegrationController::class, 'getAppointments']);
Route::post('/appointments', [PlatformIntegrationController::class, 'createAppointment']);

// Razorpay Webhook
Route::post('/webhook/razorpay', [RazorpayWebhookController::class, 'handleWebhook']);

// Dashboard APIs (Secured via Sanctum)
Route::middleware(['auth:sanctum'])->group(function () {
    // Additional routes for Super Admin, Hospital Admin, and Doctor go here...
});

// Reception Routes (Unprotected for rapid prototyping)
Route::post('/hospital/appointments/scan-qr', [ReceptionController::class, 'scanQr']);
Route::post('/hospital/appointments/check-in', [ReceptionController::class, 'checkIn']);

use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\HospitalController;

Route::get("/dashboard/summary", [DashboardController::class, "summary"]);
Route::get("/dashboard/queue", [DashboardController::class, "liveQueue"]);

Route::get("/settings", [SettingsController::class, "index"]);
Route::post("/settings", [SettingsController::class, "update"]);

Route::apiResource("/hospitals", HospitalController::class);

Route::post('/appointments/{id}/reschedule-notice', [ReceptionController::class, 'sendRescheduleNotice']);

use App\Http\Controllers\Api\BackupController;
Route::get('/backups', [BackupController::class, 'index']);
Route::post('/backups', [BackupController::class, 'store']);
Route::get('/backups/download/{fileName}', [BackupController::class, 'download']);



