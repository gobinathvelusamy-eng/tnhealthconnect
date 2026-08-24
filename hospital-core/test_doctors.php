<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$request = Illuminate\Http\Request::create('/api/doctors', 'GET');
$controller = new App\Http\Controllers\Api\PlatformIntegrationController();
$response = $controller->getDoctors($request);
echo $response->getContent();
