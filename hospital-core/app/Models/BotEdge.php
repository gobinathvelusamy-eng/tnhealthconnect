<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BotEdge extends Model
{
    protected $fillable = [
        'from_node_id',
        'to_node_id',
        'condition_type',
        'condition_value'
    ];

    public function fromNode()
    {
        return $this->belongsTo(BotNode::class, 'from_node_id');
    }

    public function toNode()
    {
        return $this->belongsTo(BotNode::class, 'to_node_id');
    }
}
