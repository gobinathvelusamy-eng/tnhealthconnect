<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Appointment extends Model
{
    protected $guarded = [];

    protected $casts = [
        'appointment_date' => 'date',
        'appointment_time' => 'datetime',
    ];

    public function hospital(): BelongsTo
    {
        return $this->belongsTo(Hospital::class);
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }

    public function qrCode(): HasOne
    {
        return $this->hasOne(QrCode::class);
    }

    public function history(): HasMany
    {
        return $this->hasMany(AppointmentHistory::class);
    }

    public function queue(): HasOne
    {
        return $this->hasOne(Queue::class);
    }

    /**
     * Helper to log status changes.
     */
    public function updateStatus(string $newStatus, ?string $remarks = null, ?int $userId = null)
    {
        $this->update(['status' => $newStatus]);
        
        $this->history()->create([
            'status' => $newStatus,
            'remarks' => $remarks,
            'changed_by' => $userId,
        ]);
    }
}
