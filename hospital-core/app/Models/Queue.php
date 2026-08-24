<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Queue extends Model
{
    protected $fillable = [
        'hospital_id',
        'doctor_id',
        'appointment_id',
        'token_number',
        'queue_position',
        'queue_type',
        'status',
        'called_at',
        'completed_at'
    ];

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }
}
