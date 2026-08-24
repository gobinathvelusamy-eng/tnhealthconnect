<?php
$f = 'routes/api.php';
$c = file_get_contents($f);
if (substr($c, 0, 3) == "\xEF\xBB\xBF") {
    file_put_contents($f, substr($c, 3));
    echo "BOM removed from api.php\n";
} else {
    echo "No BOM\n";
}
