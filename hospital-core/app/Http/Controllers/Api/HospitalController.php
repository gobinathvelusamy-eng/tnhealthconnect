<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class HospitalController extends Controller
{
    public function index()
    {
        $hospitals = DB::table('hospitals')
            ->leftJoin('districts', 'hospitals.district_id', '=', 'districts.id')
            ->select('hospitals.*', 'districts.name as district_name')
            ->get();

        $formatted = $hospitals->map(function ($h) {
            $doctors = DB::table('doctors')
                ->join('users', 'doctors.user_id', '=', 'users.id')
                ->join('departments', 'doctors.department_id', '=', 'departments.id')
                ->where('doctors.hospital_id', $h->id)
                ->select('users.name', 'departments.name as department')
                ->get();

            return [
                'id' => (string)$h->id,
                'name' => $h->name,
                'district' => $h->district_name,
                'place' => $h->city,
                'status' => $h->is_active ? 'Enabled' : 'Disabled',
                'doctors' => $doctors
            ];
        });

        return response()->json($formatted);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string',
            'district' => 'required|string',
            'place' => 'required|string',
            'doctors' => 'nullable|array'
        ]);

        DB::beginTransaction();
        try {
            $districtId = DB::table('districts')->where('name', $data['district'])->value('id');
            if (!$districtId) {
                $districtId = DB::table('districts')->insertGetId([
                    'name' => $data['district'],
                    'is_active' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            $hospitalId = DB::table('hospitals')->insertGetId([
                'name' => $data['name'],
                'district_id' => $districtId,
                'city' => $data['place'],
                'is_active' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            if (!empty($data['doctors'])) {
                foreach ($data['doctors'] as $doc) {
                    $deptName = $doc['department'];
                    $docName = $doc['name'];

                    $deptId = DB::table('departments')
                        ->where('hospital_id', $hospitalId)
                        ->where('name', $deptName)
                        ->value('id');

                    if (!$deptId) {
                        $deptId = DB::table('departments')->insertGetId([
                            'hospital_id' => $hospitalId,
                            'name' => $deptName,
                            'consultation_fee' => isset($doc['fee']) ? floatval($doc['fee']) : 0,
                            'is_active' => 1,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    } else {
                        // Update fee if department already exists (e.g. from another doctor in same dept)
                        if (isset($doc['fee']) && floatval($doc['fee']) > 0) {
                            DB::table('departments')->where('id', $deptId)->update([
                                'consultation_fee' => floatval($doc['fee']),
                                'updated_at' => now()
                            ]);
                        }
                    }

                    $userId = DB::table('users')->insertGetId([
                        'name' => $docName,
                        'email' => 'doc_' . Str::random(6) . '@hospital.com',
                        'password' => Hash::make('password'),
                        'role' => 'Doctor',
                        'hospital_id' => $hospitalId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    DB::table('doctors')->insert([
                        'user_id' => $userId,
                        'hospital_id' => $hospitalId,
                        'department_id' => $deptId,
                        'is_active' => 1,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            DB::commit();
            return response()->json(['success' => true, 'id' => (string)$hospitalId]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'name' => 'sometimes|required|string',
            'place' => 'sometimes|required|string',
            'status' => 'sometimes|required|string',
        ]);

        $update = [];
        if (isset($data['name'])) $update['name'] = $data['name'];
        if (isset($data['place'])) $update['city'] = $data['place'];
        if (isset($data['status'])) $update['is_active'] = ($data['status'] === 'Enabled' ? 1 : 0);

        if (!empty($update)) {
            $update['updated_at'] = now();
            DB::table('hospitals')->where('id', $id)->update($update);
        }

        return response()->json(['success' => true]);
    }

    public function destroy($id)
    {
        // For cascade deletes to work correctly via DB facade without Eloquent models,
        // we manually delete doctors, users, departments since the migration 
        // doesn't have onDelete('cascade') for users or it might fail foreign key checks.
        // Actually the migration has cascadeOnDelete for hospitals -> departments, etc.
        // But let's just delete the hospital and rely on DB cascades if they exist.
        // Or better yet, we can use the eloquent model Hospital if it exists.
        
        $hospital = \App\Models\Hospital::find($id);
        if ($hospital) {
            // Delete associated doctor user accounts
            $doctorUserIds = DB::table('doctors')->where('hospital_id', $id)->pluck('user_id');
            if ($doctorUserIds->isNotEmpty()) {
                DB::table('users')->whereIn('id', $doctorUserIds)->delete();
            }
            $hospital->delete();
            return response()->json(['success' => true]);
        }
        
        return response()->json(['success' => false, 'error' => 'Not found'], 404);
    }
}
