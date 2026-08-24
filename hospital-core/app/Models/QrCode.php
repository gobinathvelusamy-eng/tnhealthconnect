<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QrCode extends Model
{
    protected $fillable = [
        'appointment_id',
        'qr_token',
        'is_used',
        'scanned_at',
        'scanned_by',
        'expires_at'
    ];

    protected $casts = [
        'is_used' => 'boolean',
        'scanned_at' => 'datetime',
        'expires_at' => 'datetime'
    ];

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }
}
