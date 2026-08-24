<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WhatsappSession extends Model
{
    protected $fillable = [
        'phone_number',
        'current_step',
        'current_node_id',
        'selected_district',
        'selected_place',
        'selected_hospital',
        'selected_department',
        'selected_doctor',
        'appointment_id',
        'invalid_attempts',
        'needs_human',
        'last_activity'
    ];

    protected $casts = [
        'last_activity' => 'datetime'
    ];
}
