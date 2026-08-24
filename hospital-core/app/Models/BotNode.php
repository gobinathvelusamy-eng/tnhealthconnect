<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BotNode extends Model
{
    protected $fillable = [
        'name',
        'message_text',
        'node_type',
        'is_starting_node',
        'interactive_options',
        'system_action'
    ];

    protected $casts = [
        'interactive_options' => 'array',
        'is_starting_node' => 'boolean',
    ];

    public function outboundEdges()
    {
        return $this->hasMany(BotEdge::class, 'from_node_id');
    }

    public function inboundEdges()
    {
        return $this->hasMany(BotEdge::class, 'to_node_id');
    }
}
