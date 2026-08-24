<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\BotNode;
use App\Models\BotEdge;
use Illuminate\Support\Facades\DB;

class BotBuilderController extends Controller
{
    public function index()
    {
        $drawflowJson = DB::table('platform_settings')->where('setting_key', 'bot_drawflow_json')->value('setting_value');
        return view('bot-builder.index', compact('drawflowJson'));
    }

    public function saveFlow(Request $request)
    {
        try {
            DB::beginTransaction();

            // Save visual layout to platform_settings
            DB::table('platform_settings')->updateOrInsert(
                ['setting_key' => 'bot_drawflow_json'],
                ['setting_value' => $request->getContent()]
            );

            // Clear session pointers to avoid FK constraints
            DB::table('whatsapp_sessions')->update(['current_node_id' => null]);
            
            BotEdge::query()->delete();
            BotNode::query()->delete();
            
            $drawflowData = json_decode($request->getContent(), true);
            if (!$drawflowData || !isset($drawflowData['drawflow']['Home']['data'])) {
                return response()->json(['success' => false, 'message' => 'Invalid data structure']);
            }

            $nodesData = $drawflowData['drawflow']['Home']['data'];
            $idMap = [];

            // 1. Create Nodes
            foreach ($nodesData as $dfId => $dfNode) {
                $data = $dfNode['data'];
                
                $dbNode = BotNode::create([
                    'name' => $dfNode['name'],
                    'message_text' => $data['message_text'] ?? 'Default message',
                    'node_type' => 'text',
                    'is_starting_node' => ($dfNode['name'] === 'Welcome_Message') ? true : false,
                    'system_action' => $data['system_action'] ?? null,
                ]);
                
                $idMap[$dfId] = $dbNode->id;
            }

            // 2. Create Edges
            foreach ($nodesData as $dfId => $dfNode) {
                $data = $dfNode['data'];
                if (isset($dfNode['outputs'])) {
                    foreach ($dfNode['outputs'] as $outputClass => $outputData) {
                        if (isset($outputData['connections'])) {
                            foreach ($outputData['connections'] as $conn) {
                                $targetDfId = $conn['node'];
                                
                                // By default, standard nodes just pass through with catch_all
                                $conditionType = 'catch_all';
                                $conditionValue = null;

                                // If this node is a Choice Node, the outputs represent exact match buttons
                                if ($dfNode['name'] === 'Choice_Node') {
                                    $conditionType = 'exact_match';
                                    if ($outputClass === 'output_1') {
                                        $conditionValue = $data['option_1'] ?? 'Yes';
                                    } elseif ($outputClass === 'output_2') {
                                        $conditionValue = $data['option_2'] ?? 'No';
                                    }
                                }

                                BotEdge::create([
                                    'from_node_id' => $idMap[$dfId],
                                    'to_node_id' => $idMap[$targetDfId],
                                    'condition_type' => $conditionType,
                                    'condition_value' => $conditionValue
                                ]);
                            }
                        }
                    }
                }
            }

            DB::commit();
            return response()->json(['success' => true]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()]);
        }
    }
}
