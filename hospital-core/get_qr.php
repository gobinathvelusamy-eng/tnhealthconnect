<?php require 'vendor/autoload.php'; \ = require_once 'bootstrap/app.php'; \ = \->make(Illuminate\Contracts\Console\Kernel::class); \->bootstrap(); echo App\Models\QrCode::first()->qr_token;
