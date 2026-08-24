<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RescheduleToken extends Model
{
    protected $fillable = [
        'appointment_id',
        'token',
        'is_used',
        'expires_at'
    ];

    protected $casts = [
        'is_used' => 'boolean',
        'expires_at' => 'datetime'
    ];
}
