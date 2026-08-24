<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppointmentHistory extends Model
{
    protected $table = 'appointment_history';
    protected $fillable = [
        'appointment_id',
        'status',
        'remarks',
        'changed_by'
    ];
}
