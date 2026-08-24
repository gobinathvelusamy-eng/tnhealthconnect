$response = Invoke-WebRequest -Uri "https://mediumseagreen-gnu-652009.hostingersite.com/api/whatsapp/flows" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"encrypted_flow_data":"dummy","encrypted_aes_key":"dummy","initial_vector":"dummy"}' -SkipHttpErrorCheck
[System.IO.File]::WriteAllBytes("live_response.bin", $response.Content)
