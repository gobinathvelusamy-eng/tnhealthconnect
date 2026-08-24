<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Hardcoded correct Phone Number ID for the Flow
    $id = '1269556026246628';
    $token = trim($_POST['token']);
    $public_key = "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA106t7jDjL8oGutsVzkd+\n20CUxTy4mn/17NMc6ta4FG22/nORmA5WHr0qNJrYpH7xuaDnjP2kyaw4IjJPxNLM\n5pFEpE4uhT/w48oe5BlmPqP+3TrcajObcDHlfW16SAcksA3ycYn6wLXiXvqRAHPD\nSfKZZvUC23aVwx+TBnX3gc7uekuPlrnl0aoxS53qpzo/WfuEa4GZ9JTrvt8AzClt\nLPenqOJ7lykhNnCpq9eiXXSMBpv3ZmmmRbiVI5lZeiYChq+iKzvqS2XBgODrD9xx\n67rfzkMMQs/tLShbzmpd06xOQ8MYdzvQnQCHi8eG08uL6UIJwq8nZ4M8iNC5iIlo\nQwIDAQAB\n-----END PUBLIC KEY-----";

    $url = "https://graph.facebook.com/v19.0/{$id}/whatsapp_business_encryption";
    
    // Register the key
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
        'business_public_key' => $public_key
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer {$token}",
        "Content-Type: application/x-www-form-urlencoded"
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    // Verify it was set (GET request)
    $chVerify = curl_init($url);
    curl_setopt($chVerify, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($chVerify, CURLOPT_HTTPHEADER, ["Authorization: Bearer {$token}"]);
    $verifyResponse = curl_exec($chVerify);
    curl_close($chVerify);

    echo "<div style='font-family: sans-serif; padding: 20px;'>";
    echo "<h3>Registration Attempt</h3>";
    echo "<p>Target ID Used: <b>" . htmlspecialchars($id) . "</b></p>";
    echo "<p>POST Response: <pre>" . htmlspecialchars($response) . "</pre></p>";
    
    echo "<h3>Verification (GET) Response from Meta:</h3>";
    echo "<p>This confirms what Meta currently holds for this correct Phone Number ID:</p>";
    echo "<pre>" . htmlspecialchars($verifyResponse) . "</pre>";
    
    echo "<p>If you see your Phone Number ID here and success is true, please refresh the WhatsApp Manager!</p>";
    echo "<br><a href='register_key.php' style='padding: 10px 20px; background: #007bff; color: white; text-decoration: none;'>Go Back</a>";
    echo "</div>";
    exit;
}
?>
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; padding: 20px;">
    <h2>WhatsApp Flow - Meta Public Key Diagnostics & Registration</h2>
    <form method="POST">
        <p><b>Target Phone Number ID is hardcoded to: 1269556026246628</b></p>
        
        <label><b>Permanent Access Token:</b></label><br>
        <input type="password" name="token" required style="width: 500px; padding: 5px;"><br><br>
        
        <button type="submit" style="padding: 10px 20px; background: #25D366; color: white; border: none; cursor: pointer;">Register Public Key with Meta</button>
    </form>
</body>
</html>
