<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Hospital extends Model
{
    protected $guarded = [];

    public function district(): BelongsTo
    {
        return $this->belongsTo(District::class);
    }

    public function departments(): HasMany
    {
        return $this->hasMany(Department::class);
    }

    public function doctors(): HasMany
    {
        return $this->hasMany(Doctor::class);
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    public function modules(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Module::class, 'hospital_modules')
                    ->withPivot('enabled')
                    ->withTimestamps();
    }

    public function queues(): HasMany
    {
        return $this->hasMany(Queue::class);
    }
}
