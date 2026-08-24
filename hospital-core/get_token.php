<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
$token = \Illuminate\Support\Facades\DB::table('platform_settings')->where('setting_key', 'whatsapp_webhook_verify_token')->value('setting_value');
echo "TOKEN IS: " . ($token ?? 'NOT FOUND');
