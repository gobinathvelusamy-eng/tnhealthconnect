<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(Illuminate\Http\Request::capture());

$engine = app(\App\Services\WhatsApp\ConversationEngine::class);
$payload = [
    'entry' => [
        [
            'changes' => [
                [
                    'value' => [
                        'messages' => [
                            [
                                'from' => '1234567890',
                                'type' => 'text',
                                'text' => ['body' => '/start']
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]
];
$engine->process($payload);
echo "Process completed.\n";
