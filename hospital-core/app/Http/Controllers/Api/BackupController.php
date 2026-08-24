<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;

class BackupController extends Controller
{
    /**
     * Get a list of all backup files
     */
    public function index()
    {
        $disk = Storage::disk('local');
        $appName = env('APP_NAME', 'Laravel');
        
        // Spatie backup defaults to storing backups in a folder named after the APP_NAME
        $directory = $appName;
        
        if (!$disk->exists($directory)) {
            // Also check the default 'laravel-backup' folder or root
            if ($disk->exists('laravel-backup')) {
                $directory = 'laravel-backup';
            } else if ($disk->exists('Laravel')) {
                $directory = 'Laravel';
            } else {
                return response()->json([]);
            }
        }

        $files = $disk->files($directory);
        $backups = [];

        foreach ($files as $file) {
            if (pathinfo($file, PATHINFO_EXTENSION) === 'zip') {
                $backups[] = [
                    'file_name' => basename($file),
                    'file_path' => $file,
                    'file_size' => $this->humanFilesize($disk->size($file)),
                    'created_at' => date('Y-m-d H:i:s', $disk->lastModified($file)),
                    'timestamp' => $disk->lastModified($file)
                ];
            }
        }

        // Sort backups by newest first
        usort($backups, function ($a, $b) {
            return $b['timestamp'] - $a['timestamp'];
        });

        return response()->json($backups);
    }

    /**
     * Trigger a new manual backup
     */
    public function store()
    {
        try {
            // Run the backup command in the background (or synchronously)
            // --only-db ensures we only backup the database, not files
            Artisan::call('backup:run', ['--only-db' => true]);
            
            return response()->json([
                'status' => 'success',
                'message' => 'Database backup completed successfully.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create backup: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download a specific backup file
     */
    public function download($fileName)
    {
        $disk = Storage::disk('local');
        $appName = env('APP_NAME', 'Laravel');
        
        $directory = $appName;
        if (!$disk->exists($directory)) {
            if ($disk->exists('laravel-backup')) {
                $directory = 'laravel-backup';
            } else if ($disk->exists('Laravel')) {
                $directory = 'Laravel';
            }
        }
        
        $filePath = $directory . '/' . $fileName;

        if ($disk->exists($filePath)) {
            return Storage::disk('local')->download($filePath);
        }

        return response()->json([
            'status' => 'error',
            'message' => 'Backup file not found.'
        ], 404);
    }

    /**
     * Format bytes to a human readable string
     */
    private function humanFilesize($bytes, $decimals = 2) {
        $size = array('B','kB','MB','GB','TB','PB','EB','ZB','YB');
        $factor = floor((strlen($bytes) - 1) / 3);
        return sprintf("%.{$decimals}f", $bytes / pow(1024, $factor)) . @$size[$factor];
    }
}
