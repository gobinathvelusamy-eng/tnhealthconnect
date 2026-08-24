<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
// Bootstrap to enable facades
$kernel->handle(Illuminate\Http\Request::capture());
// No need to actually process it fully, just bootstrapping is enough
// But let's build the request properly and run it through handle

$aesKey = random_bytes(32);
$iv = random_bytes(12);
$payload = json_encode(['action' => 'ping', 'version' => '3.0']);
// Encrypt it so the controller can decrypt it.
// Wait, the controller expects encrypted_aes_key using the private key.
// I don't have the public key in the script to encrypt it.
// Let's just mock the controller method to return what we want.
// No, I can just write a quick test route in routes/web.php or just test the response directly.
$controller = new \App\Http\Controllers\Api\WhatsAppFlowController();
$reflection = new \ReflectionClass($controller);
$method = $reflection->getMethod('processFlowPayload');
$method->setAccessible(true);
$responsePayload = $method->invokeArgs($controller, [['action' => 'ping', 'version' => '3.0']]);

$methodEncrypt = $reflection->getMethod('encryptAesGcm');
$methodEncrypt->setAccessible(true);

$flippedIv = '';
for ($i = 0; $i < strlen($iv); $i++) {
    $flippedIv .= chr(ord($iv[$i]) ^ 0xFF);
}

$encryptedData = $methodEncrypt->invokeArgs($controller, [json_encode($responsePayload), $aesKey, $flippedIv]);

$base64Response = base64_encode($encryptedData);

$response = response($base64Response, 200)->header('Content-Type', 'text/plain');

echo "HTTP Status: " . $response->getStatusCode() . "\n";
echo "Content-Type: " . $response->headers->get('Content-Type') . "\n";
echo "Body:\n";
echo ">>>" . $response->getContent() . "<<<\n";
