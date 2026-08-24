<?php
$f = 'app/Http/Controllers/Api/WhatsAppFlowController.php';
$c = file_get_contents($f);
if (substr($c, 0, 3) == "\xEF\xBB\xBF") {
    file_put_contents($f, substr($c, 3));
    echo "BOM removed\n";
} else {
    echo "No BOM\n";
}
// Validate syntax
exec("php -l " . escapeshellarg($f), $output, $return_var);
echo implode("\n", $output) . "\n";
exit($return_var);
