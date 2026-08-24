<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$request = Illuminate\Http\Request::create('/webhook?hub.mode=subscribe&hub.verify_token=token&hub.challenge=challenge');
echo "hub.mode = " . $request->query('hub.mode') . "\n";
echo "hub_mode = " . $request->query('hub_mode') . "\n";
