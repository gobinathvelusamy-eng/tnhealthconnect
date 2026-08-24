"use client";

import React, { useState, useCallback, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  addEdge, 
  applyNodeChanges, 
  applyEdgeChanges, 
  Node, 
  Edge, 
  OnNodesChange, 
  OnEdgesChange, 
  OnConnect,
  ReactFlowProvider,
  useReactFlow,
  Connection
} from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes: Node[] = [
  { id: '1', type: 'input', data: { label: 'Start (Incoming Message)' }, position: { x: 250, y: 50 } },
];

let id = 0;
const getId = () => 'dndnode_' + id++;

function FlowBuilder() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const existingFlowId = searchParams.get('id');

  const [flowId, setFlowId] = useState<string | null>(existingFlowId);
  const [flowName, setFlowName] = useState<string>('Untitled Flow');
  
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>([]);
  const { screenToFlowPosition } = useReactFlow();
  
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
      if (existingFlowId) {
          fetch('http://localhost:4000/api/flows/' + existingFlowId)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setFlowName(data.data.name);
                    setNodes(data.data.nodes || initialNodes);
                    setEdges(data.data.edges || []);
                }
            });
      }
  }, [existingFlowId]);

  useEffect(() => {
      if (!selectedNode) {
          setPreviewData([]);
          return;
      }
      
      const fetchLiveData = async (endpoint: string) => {
          setPreviewLoading(true);
          try {
              const res = await fetch('http://localhost:8000/api/' + endpoint);
              if (res.ok) {
                  const data = await res.json();
                  setPreviewData(data);
              } else {
                  setPreviewData([]);
              }
          } catch (e) {
              setPreviewData([]);
          }
          setPreviewLoading(false);
      };

      if (selectedNode.data.label === 'District Selector') fetchLiveData('districts');
      else if (selectedNode.data.label === 'Place Selector') fetchLiveData('places');
      else if (selectedNode.data.label === 'Hospital Selector') fetchLiveData('hospitals');
      else if (selectedNode.data.label === 'Doctor Selector') fetchLiveData('doctors');
      else if (selectedNode.data.label === 'Health Issue Selector') fetchLiveData('specialities');
      else setPreviewData([]);

  }, [selectedNode]);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );
  
  const onConnect: OnConnect = useCallback(
    (connection: Connection) => setEdges((eds) => {
        const filteredEdges = eds.filter(e => e.source !== connection.source);
        return addEdge(connection, filteredEdges);
    }),
    []
  );

  const onDragStart = (event: React.DragEvent, nodeType: string, nodeLabel: string) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ type: nodeType, label: nodeLabel }));
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const typeData = event.dataTransfer.getData('application/reactflow');
      if (!typeData) return;

      const { type, label } = JSON.parse(typeData);
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });

      const newNode = {
        id: getId(),
        type,
        position,
        data: { label },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition]
  );
  
  const onNodeClick = (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node);
  };

  const saveDraft = async () => { 
      setIsSaving(true);
      try {
          const res = await fetch('http://localhost:4000/api/flows/draft', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  id: flowId,
                  name: flowName,
                  nodes,
                  edges
              })
          });
          const data = await res.json();
          if (data.success) {
              setFlowId(data.flowId);
              if (!existingFlowId) {
                  window.history.replaceState(null, '', '?id=' + data.flowId);
              }
              alert('Draft saved successfully!');
          }
      } catch (e) {
          alert('Failed to save');
      }
      setIsSaving(false);
  };
  
    const publishFlow = async () => { 
        let currentFlowId = flowId;

        // Meta Character Limit Pre-check
        const overLimitNodes = nodes.filter(n => (n.data?.label || '').length > 24 && n.type !== 'input');
        if (overLimitNodes.length > 0) {
            const names = overLimitNodes.map(n => `• "${n.data.label}" (${n.data.label.length} chars)`).join('\n');
            return alert(`⚠️ Meta WhatsApp Character Limit Warning:\n\nMeta strictly limits button & section titles to 24 characters or less. The following node(s) exceed this limit:\n\n${names}\n\nPlease shorten the name of these nodes before publishing.`);
        }
        
        // Always save draft first with latest nodes/edges
        try {
            const res = await fetch('http://localhost:4000/api/flows/draft', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    flowId: currentFlowId,
                    name: flowName || 'Flow', 
                    nodes, 
                    edges 
                })
            });
            const data = await res.json();
            if (data.success) {
                currentFlowId = data.flowId;
                setFlowId(currentFlowId);
                if (!existingFlowId) {
                    window.history.replaceState(null, '', '?id=' + currentFlowId);
                }
            } else {
                return alert('Failed to auto-save draft before publishing.');
            }
        } catch (e) {
            return alert('Failed to connect to backend for auto-saving.');
        }
        
        // Now publish
        try {
            const res = await fetch(`http://localhost:4000/api/flows/${currentFlowId}/publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data.success) alert(`✅ Flow "${flowName}" published successfully!`);
            else alert('Failed to publish: ' + data.error);
        } catch (e) {
            alert('Failed to publish');
        }
    };

  const renderWhatsAppPreview = () => {
      if (!selectedNode) return <div className="text-center text-gray-500 text-xs italic pb-4">Click a node to preview</div>;
      
      const label = selectedNode.data.label;

      if (label === 'Start (Incoming Message)') {
          return (
              <div className="flex justify-start mb-2 mt-8 overflow-y-auto w-full">
                  <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm max-w-[90%] text-sm text-gray-800">
                      Welcome to TN Health Connect! ðŸ‘‹<br/><br/>Please type 'hi' to book an appointment or explore our services.
                  </div>
              </div>
          );
      }

      if (label.includes('Ask')) {
          return (
              <div className="flex justify-start mb-2 mt-8 overflow-y-auto">
                  <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm max-w-[90%] text-sm text-gray-800">
                      Please provide your {label.replace('Ask ', '')}:
                  </div>
              </div>
          );
      }

      if (label === 'Terms & Conditions') {
          const termsUrl = selectedNode?.data?.termsUrl || 'https://salemhealthconnect.com/terms';
          return (
              <div className="flex flex-col mb-2 mt-8 overflow-y-auto items-start w-full">
                  <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm max-w-[90%] text-sm text-gray-800 mb-2">
                      📜 <b>Terms & Conditions</b><br/><br/>
                      Please review and accept our platform terms before booking:<br/>
                      <a href={termsUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline break-all text-xs mt-1 block">
                          🔗 {termsUrl}
                      </a>
                  </div>
                  <div className="flex flex-col space-y-1.5 w-full max-w-[90%]">
                      <button className="bg-emerald-600 text-white text-xs font-bold py-2 px-3 rounded-lg shadow-sm w-full">✅ Agree & Continue</button>
                      <button className="bg-gray-100 text-red-600 text-xs font-bold py-1.5 px-3 rounded-lg shadow-sm w-full border border-gray-200">❌ Decline & Cancel</button>
                  </div>
              </div>
          );
      }

      if (label === 'Collect Payment' || label === 'Razorpay Payment') {
          return (
              <div className="flex flex-col mb-2 mt-8 overflow-y-auto items-start w-full">
                  <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm max-w-[90%] text-sm text-gray-800 mb-2">
                      💳 <b>Consultation Fee Required</b><br/><br/>
                      Amount: <b>₹350</b><br/>
                      Patient: John Doe<br/>
                      Date: Tomorrow at 10:00 AM<br/><br/>
                      👉 <span className="text-blue-600 underline">https://rzp.io/rzp/pay_demo</span><br/><br/>
                      <i>Please complete payment to generate your appointment QR Code.</i>
                  </div>
                  <div className="flex space-x-2 w-full max-w-[90%]">
                      <button className="bg-emerald-600 text-white text-xs font-bold py-2 px-3 rounded-lg shadow-sm w-full">✅ I Have Paid</button>
                  </div>
              </div>
          );
      }

      if (label === 'Create Appointment') {
          return (
              <div className="flex flex-col mb-2 mt-8 overflow-y-auto items-start w-full">
                  <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm max-w-[90%] text-sm text-gray-800">
                      <div className="w-24 h-24 bg-gray-200 border-2 border-gray-400 flex items-center justify-center text-xs font-bold mb-2">
                          [QR CODE]
                      </div>
                      ✅ <b>Appointment Confirmed!</b><br/><br/>
                      Booking ID: TNHC-9921<br/>
                      Show this QR at reception.
                  </div>
              </div>
          );
      }

      if (label.includes('Selector')) {
          const isRecommendedDoctor = label === 'Doctor Selector' && selectedNode?.data?.recommendedMode;
          const title = isRecommendedDoctor ? 'Recommended Doctor:' : 'Please select a ' + label.replace(' Selector', '') + ':';
          
          if (isRecommendedDoctor) {
              return (
                  <div className="flex flex-col mb-2 mt-8 overflow-y-auto items-start w-full">
                      <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm max-w-[90%] text-sm text-gray-800 mb-2">
                          Based on your health issue, we recommend:
                      </div>
                      <div className="flex flex-col space-y-1 w-full max-w-[90%]">
                          <button className="bg-white text-blue-500 text-sm font-bold py-2 px-4 rounded-lg shadow-sm border border-gray-100 text-center">
                              Dr. Specialist
                          </button>
                      </div>
                  </div>
              );
          }

          if (previewLoading) return <div className="text-sm text-gray-500 text-center pb-4">Connecting to Laravel API...</div>;
          
          if (previewData.length === 0) {
              return (
                  <div className="flex flex-col mb-2 mt-8 overflow-y-auto items-start w-full">
                      <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm max-w-[90%] text-sm text-gray-800 mb-2">
                          {title}
                      </div>
                      <div className="bg-yellow-50 text-yellow-800 text-xs p-2 rounded w-[90%] border border-yellow-200 mt-1">
                          No {label.replace(' Selector', '')} data found in your software. Add a {label.replace(' Selector', '')} to see buttons here.
                      </div>
                  </div>
              );
          } else if (previewData.length > 0 && previewData.length <= 3) {
              return (
                  <div className="flex flex-col mb-2 mt-8 overflow-y-auto items-start w-full">
                      <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm max-w-[90%] text-sm text-gray-800 mb-2">
                          {title}
                      </div>
                      <div className="flex flex-col space-y-1 w-full max-w-[90%]">
                          {previewData.map((item, idx) => (
                              <button key={idx} className="bg-white text-blue-500 text-sm font-bold py-2 px-4 rounded-lg shadow-sm border border-gray-100 text-center">
                                  {item.name || item.title || 'Option ' + (idx+1)}
                              </button>
                          ))}
                      </div>
                  </div>
              );
          } else if (previewData.length > 3) {
              return (
                  <div className="flex flex-col mb-2 mt-8 overflow-y-auto items-start w-full">
                      <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm max-w-[90%] text-sm text-gray-800 mb-2">
                          {title}
                      </div>
                      <button className="bg-white text-blue-500 text-sm font-bold py-2 px-4 rounded-lg shadow-sm border border-gray-100 w-[90%] flex justify-between items-center">
                          <span>â‰¡ View Menu ({previewData.length} options)</span>
                      </button>
                  </div>
              );
          }
      }

      return (
         <div className="flex justify-start mb-2 mt-8 overflow-y-auto">
            <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm max-w-[90%] text-sm text-gray-800">
                [System executes {label}]
            </div>
         </div>
      );
  };

  return (
    <div className="flex h-screen bg-gray-50 flex-col">
      <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-800">Flow Builder</h1>
            <input type="text" value={flowName} onChange={(e) => setFlowName(e.target.value)} className="border-b border-gray-300 bg-transparent px-2 py-1 focus:outline-none focus:border-blue-500 font-semibold text-gray-700" />
        </div>
        <div className="space-x-3">
          <button onClick={saveDraft} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50">{isSaving ? 'Saving...' : 'Save Draft'}</button>
          <button onClick={publishFlow} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700">Publish Flow</button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col overflow-y-auto shrink-0">
          <h2 className="text-xs font-bold text-gray-500 uppercase mb-3">Patient Data</h2>
          <div draggable onDragStart={(e) => onDragStart(e, 'default', 'Ask Name')} className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-2 rounded mb-2 cursor-grab text-sm font-medium">Ask Name</div>
          <div draggable onDragStart={(e) => onDragStart(e, 'default', 'Ask Age')} className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-2 rounded mb-2 cursor-grab text-sm font-medium">Ask Age</div>
          <div draggable onDragStart={(e) => onDragStart(e, 'default', 'Ask Gender')} className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-2 rounded mb-2 cursor-grab text-sm font-medium">Ask Gender</div>
          <div draggable onDragStart={(e) => onDragStart(e, 'default', 'Terms & Conditions')} className="bg-purple-50 border border-purple-200 text-purple-800 p-2 rounded mb-2 cursor-grab text-sm font-medium flex items-center gap-1.5">
            <span>📜</span> Terms & Conditions
          </div>
          
        
          <h2 className="text-xs font-bold text-gray-500 uppercase mb-3">TN Health Connect</h2>
          <div draggable onDragStart={(e) => onDragStart(e, 'default', 'Health Issue Selector')} className="bg-indigo-50 border border-indigo-200 text-indigo-800 p-2 rounded mb-2 cursor-grab text-sm font-medium">Health Issue Selector</div>
          <div draggable onDragStart={(e) => onDragStart(e, 'default', 'District Selector')} className="bg-indigo-50 border border-indigo-200 text-indigo-800 p-2 rounded mb-2 cursor-grab text-sm font-medium">District Selector</div>
          <div draggable onDragStart={(e) => onDragStart(e, 'default', 'Place Selector')} className="bg-indigo-50 border border-indigo-200 text-indigo-800 p-2 rounded mb-2 cursor-grab text-sm font-medium">Place Selector</div>
          <div draggable onDragStart={(e) => onDragStart(e, 'default', 'Hospital Selector')} className="bg-indigo-50 border border-indigo-200 text-indigo-800 p-2 rounded mb-2 cursor-grab text-sm font-medium">Hospital Selector</div>
          <div draggable onDragStart={(e) => onDragStart(e, 'default', 'Doctor Selector')} className="bg-indigo-50 border border-indigo-200 text-indigo-800 p-2 rounded mb-2 cursor-grab text-sm font-medium">Doctor Selector</div>
          <div draggable onDragStart={(e) => onDragStart(e, 'default', 'Available Dates')} className="bg-indigo-50 border border-indigo-200 text-indigo-800 p-2 rounded mb-2 cursor-grab text-sm font-medium">Available Dates</div>
          <div draggable onDragStart={(e) => onDragStart(e, 'default', 'Available Slots')} className="bg-indigo-50 border border-indigo-200 text-indigo-800 p-2 rounded mb-4 cursor-grab text-sm font-medium">Available Slots</div>

          <h2 className="text-xs font-bold text-gray-500 uppercase mb-3">Payments & Confirmation</h2>
          <div draggable onDragStart={(e) => onDragStart(e, 'default', 'Collect Payment')} className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-2 rounded mb-2 cursor-grab text-sm font-medium flex items-center gap-1.5">
            <span>💳</span> Collect Payment
          </div>
          <div draggable onDragStart={(e) => onDragStart(e, 'default', 'Create Appointment')} className="bg-indigo-50 border border-indigo-200 text-indigo-800 p-2 rounded mb-6 cursor-grab text-sm font-medium">Create Appointment</div>
        </div>

        <div className="flex-1 h-full" ref={reactFlowWrapper}>
          <ReactFlow 
            nodes={nodes} 
            edges={edges} 
            onNodesChange={onNodesChange} 
            onEdgesChange={onEdgesChange} 
            onConnect={onConnect} 
            onDrop={onDrop} 
            onDragOver={onDragOver} 
            onNodeClick={onNodeClick} 
            onEdgeClick={(_, edge) => setEdges(eds => eds.filter(e => e.id !== edge.id))}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>

        <div className="w-80 bg-gray-100 border-l border-gray-200 flex flex-col shrink-0">
          <div className="p-6 bg-white border-b border-gray-200 flex-1 overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-800 mb-6">Configuration</h2>
            {!selectedNode ? (
                <div className="text-sm text-gray-500">Select a node on the canvas to configure it.</div>
            ) : (
                <div>
                    <h3 className="font-semibold text-gray-800 mb-4">{selectedNode.data.label}</h3>
                    
                    {selectedNode.data.label === 'Start (Incoming Message)' ? (
                        <>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Keyword</label>
                            <input type="text" defaultValue="hi" className="w-full bg-white border-gray-300 rounded-md shadow-sm mb-4 p-2 border text-gray-900 text-sm" />
                            <label className="block text-sm font-medium text-gray-700 mb-1">Welcome Message</label>
                            <textarea defaultValue="Welcome to TN Health Connect! ðŸ‘‹&#10;&#10;Please type 'hi' to book an appointment or explore our services." className="w-full bg-white border-gray-300 rounded-md shadow-sm mb-4 p-2 border text-gray-900 text-sm" rows={4} />
                        </>
                    ) : (
                        <>
                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium text-gray-700">Node Title / WhatsApp Label</label>
                                    <span className={`text-xs font-mono font-bold ${
                                        (selectedNode.data.label || '').length > 24 ? 'text-red-600' : 'text-gray-400'
                                    }`}>
                                        {(selectedNode.data.label || '').length} / 24 chars
                                    </span>
                                </div>
                                <input 
                                    type="text" 
                                    value={selectedNode.data.label || ''} 
                                    onChange={(e) => {
                                        const newLabel = e.target.value;
                                        setNodes(nds => nds.map(n => 
                                            n.id === selectedNode.id ? { ...n, data: { ...n.data, label: newLabel } } : n
                                        ));
                                        setSelectedNode(prev => prev ? { ...prev, data: { ...prev.data, label: newLabel } } : null);
                                    }}
                                    className={`w-full bg-white rounded-md shadow-sm p-2 border text-gray-900 text-sm ${
                                        (selectedNode.data.label || '').length > 24 ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50/50' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                    }`} 
                                />
                                {(selectedNode.data.label || '').length > 24 && (
                                    <p className="text-xs text-red-600 font-medium mt-1">
                                        ⚠️ Meta WhatsApp limit: Name is {(selectedNode.data.label || '').length} characters. Meta requires button/section titles to be ≤ 24 characters. Please shorten this name.
                                    </p>
                                )}
                            </div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Variable Save Key</label>
                            <input type="text" value={`{{${(selectedNode.data.label || '').toLowerCase().replace(/ /g, '_')}}}`} readOnly className="w-full bg-gray-100 border-gray-300 rounded-md shadow-sm p-2 border text-gray-500 font-mono text-xs mb-4" />
                            
                            {selectedNode.data.label === 'Terms & Conditions' && (
                                <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                                    <label className="block text-xs font-bold text-purple-900 mb-1 uppercase tracking-wide">
                                        🔗 Terms & Conditions Web Link
                                    </label>
                                    <input 
                                        type="url" 
                                        placeholder="https://salemhealthconnect.com/terms"
                                        value={selectedNode.data.termsUrl || ''} 
                                        onChange={(e) => {
                                            const url = e.target.value;
                                            setNodes(nds => nds.map(n => 
                                                n.id === selectedNode.id ? { ...n, data: { ...n.data, termsUrl: url } } : n
                                            ));
                                            setSelectedNode(prev => prev ? { ...prev, data: { ...prev.data, termsUrl: url } } : null);
                                        }}
                                        className="w-full bg-white rounded-md shadow-sm p-2 border border-purple-300 text-purple-900 text-xs focus:ring-purple-500 focus:border-purple-500" 
                                    />
                                    <p className="text-[11px] text-purple-700 mt-1">
                                        Patients will see this link and choose <b>[✅ Agree & Continue]</b> or <b>[❌ Decline]</b>.
                                    </p>
                                </div>
                            )}

                            {selectedNode.data.label === 'Doctor Selector' && (
                                <div className="flex items-center space-x-2 mt-4 p-3 bg-indigo-50 rounded border border-indigo-100">
                                    <input 
                                        type="checkbox" 
                                        id="rec_doc" 
                                        className="rounded text-indigo-600" 
                                        checked={selectedNode.data.recommendedMode || false}
                                        onChange={(e) => {
                                            const isChecked = e.target.checked;
                                            setNodes(nds => nds.map(n => 
                                                n.id === selectedNode.id ? { ...n, data: { ...n.data, recommendedMode: isChecked } } : n
                                            ));
                                            setSelectedNode(prev => prev ? { ...prev, data: { ...prev.data, recommendedMode: isChecked } } : null);
                                        }}
                                    />
                                    <label htmlFor="rec_doc" className="text-sm font-medium text-indigo-900">Enable "Recommended Doctor" mode</label>
                                </div>
                            )}
                            
                            <button 
                                onClick={() => {
                                    setNodes(nds => nds.filter(n => n.id !== selectedNode.id));
                                    setEdges(eds => eds.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id));
                                    setSelectedNode(null);
                                }}
                                className="w-full mt-6 bg-red-50 text-red-600 border border-red-200 py-2 rounded text-sm font-bold hover:bg-red-100"
                            >
                                Delete Node
                            </button>
                        </>
                    )}
                </div>
            )}
          </div>

          <div className="h-64 bg-[#e5ddd5] p-4 flex flex-col justify-end border-t border-gray-300 relative shadow-inner">
             <div className="absolute top-0 left-0 w-full bg-[#075e54] text-white text-xs font-bold p-2 flex justify-between shadow-md z-10">
                 <span>WhatsApp Preview</span>
                 <span className="flex items-center"><div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></div> Connected to Laravel</span>
             </div>
             {renderWhatsAppPreview()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FlowBuilderPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ReactFlowProvider>
                <FlowBuilder />
            </ReactFlowProvider>
        </Suspense>
    );
}

