<x-app-layout>
    <x-slot name="header">
        <div class="flex justify-between items-center">
            <h2 class="font-semibold text-xl text-gray-800 leading-tight">
                {{ __('Visual Bot Builder') }}
            </h2>
            <button onclick="saveFlow()" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded shadow-lg transition-transform transform hover:scale-105">
                <i class="fas fa-save mr-2"></i> Save Flow
            </button>
        </div>
    </x-slot>

    <!-- Drawflow Assets -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/jerosoler/Drawflow/dist/drawflow.min.css">
    <script src="https://cdn.jsdelivr.net/gh/jerosoler/Drawflow/dist/drawflow.min.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

    <style>
        :root {
            --dfBackgroundColor: #f3f4f6;
            --dfBackgroundSize: 20px;
            --dfBackgroundImage: linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px);
        }
        #drawflow {
            width: 100%;
            height: calc(100vh - 140px);
            background-color: var(--dfBackgroundColor);
            background-image: var(--dfBackgroundImage);
            background-size: var(--dfBackgroundSize) var(--dfBackgroundSize);
        }
        .drawflow .drawflow-node {
            background: white;
            border-radius: 8px;
            border: 2px solid #cbd5e1;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            width: 320px;
            padding: 0;
            z-index: 10;
        }
        .drawflow .drawflow-node.selected {
            border-color: #4f46e5;
        }
        .drawflow .drawflow-node .title-box {
            background: #f1f5f9;
            padding: 10px 15px;
            border-radius: 6px 6px 0 0;
            border-bottom: 1px solid #e2e8f0;
            font-weight: bold;
            color: #334155;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .drawflow .drawflow-node .box {
            padding: 15px;
        }
        .drawflow .drawflow-node input, .drawflow .drawflow-node textarea {
            border: 1px solid #d1d5db;
            border-radius: 4px;
            padding: 8px;
            margin-top: 4px;
            margin-bottom: 12px;
            width: 100%;
            font-size: 13px;
        }
        .drawflow .connection .main-path {
            stroke: #64748b;
            stroke-width: 3px;
        }
        .drag-item {
            cursor: grab;
            padding: 10px;
            margin-bottom: 10px;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 500;
            color: #1e293b;
            transition: all 0.2s;
        }
        .drag-item:hover {
            border-color: #4f46e5;
            color: #4f46e5;
            transform: translateY(-1px);
        }
        
        /* Node visual hints styling */
        .node-hint {
            font-size: 11px;
            color: #64748b;
            background: #f8fafc;
            padding: 6px;
            border-radius: 4px;
            border: 1px dashed #cbd5e1;
            margin-bottom: 10px;
        }
        .node-hint span {
            font-weight: bold;
            color: #334155;
        }
    </style>

    <div class="flex h-full" style="height: calc(100vh - 140px);">
        <!-- Sidebar -->
        <div class="w-80 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
            <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Messages & Branching</h3>
            
            <div class="drag-item" draggable="true" ondragstart="drag(event)" data-node="Welcome_Message">
                <i class="fas fa-flag text-green-500"></i> Welcome Message
            </div>
            
            <div class="drag-item" draggable="true" ondragstart="drag(event)" data-node="Choice_Node">
                <i class="fas fa-code-branch text-purple-500"></i> Choice (2 Options)
            </div>

            <div class="drag-item" draggable="true" ondragstart="drag(event)" data-node="Send_Text">
                <i class="fas fa-comment-alt text-gray-500"></i> Send Text
            </div>

            <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mt-6 mb-4">Data Capture</h3>
            
            <div class="drag-item" draggable="true" ondragstart="drag(event)" data-node="Capture_Name">
                <i class="fas fa-user text-blue-500"></i> Capture Name
            </div>
            <div class="drag-item" draggable="true" ondragstart="drag(event)" data-node="Capture_Gender">
                <i class="fas fa-venus-mars text-pink-500"></i> Capture Gender
            </div>
            <div class="drag-item" draggable="true" ondragstart="drag(event)" data-node="Capture_Age">
                <i class="fas fa-birthday-cake text-yellow-500"></i> Capture Age
            </div>

            <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mt-6 mb-4">Database Selection</h3>

            <div class="drag-item" draggable="true" ondragstart="drag(event)" data-node="List_Districts">
                <i class="fas fa-database text-indigo-500"></i> Select District
            </div>
            <div class="drag-item" draggable="true" ondragstart="drag(event)" data-node="List_Places">
                <i class="fas fa-database text-indigo-500"></i> Select Place
            </div>
            <div class="drag-item" draggable="true" ondragstart="drag(event)" data-node="List_Hospitals">
                <i class="fas fa-database text-indigo-500"></i> Select Hospital
            </div>
            <div class="drag-item" draggable="true" ondragstart="drag(event)" data-node="List_Departments">
                <i class="fas fa-database text-indigo-500"></i> Select Department
            </div>
            <div class="drag-item" draggable="true" ondragstart="drag(event)" data-node="List_Doctors">
                <i class="fas fa-database text-indigo-500"></i> Select Doctor
            </div>

            <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mt-6 mb-4">Final Actions</h3>

            <div class="drag-item" draggable="true" ondragstart="drag(event)" data-node="Finalize_Booking">
                <i class="fas fa-check-circle text-green-600"></i> Finalize Booking
            </div>
            <div class="drag-item" draggable="true" ondragstart="drag(event)" data-node="Process_Refund">
                <i class="fas fa-undo text-red-500"></i> Process Refund
            </div>
        </div>

        <!-- Canvas -->
        <div class="flex-1 relative">
            <div id="drawflow" ondrop="drop(event)" ondragover="allowDrop(event)"></div>
        </div>
    </div>

    <!-- Alert Modal -->
    <div id="saveAlert" class="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-xl transform transition-transform translate-y-20 opacity-0 flex items-center gap-3">
        <i class="fas fa-check-circle"></i>
        <span class="font-semibold">Flow saved successfully!</span>
    </div>

    <script>
        var id = document.getElementById("drawflow");
        const editor = new Drawflow(id);
        editor.reroute = true;
        editor.start();

        const savedData = {!! $drawflowJson ? $drawflowJson : 'null' !!};
        if (savedData) {
            editor.import(savedData);
        }

        // Node Definitions (Templates)
        const nodeTemplates = {
            'Welcome_Message': { icon: 'fa-flag text-green-500', title: 'Welcome Message', action: '', configType: 'message' },
            'Choice_Node': { icon: 'fa-code-branch text-purple-500', title: 'Choice / Button', action: 'choice_node', configType: 'choice' },
            'Send_Text': { icon: 'fa-comment-alt text-gray-500', title: 'Send Text', action: '', configType: 'message' },
            'Capture_Name': { icon: 'fa-user text-blue-500', title: 'Capture Name', action: 'capture_patient_name', configType: 'text_input' },
            'Capture_Gender': { icon: 'fa-venus-mars text-pink-500', title: 'Capture Gender', action: 'capture_patient_gender', configType: 'gender_input' },
            'Capture_Age': { icon: 'fa-birthday-cake text-yellow-500', title: 'Capture Age', action: 'capture_patient_age', configType: 'number_input' },
            'List_Districts': { icon: 'fa-database text-indigo-500', title: 'Select District', action: 'district_selection', configType: 'db_select', table: 'districts', depends: 'None' },
            'List_Places': { icon: 'fa-database text-indigo-500', title: 'Select Place', action: 'place_selection', configType: 'db_select', table: 'hospitals', depends: 'district_id' },
            'List_Hospitals': { icon: 'fa-database text-indigo-500', title: 'Select Hospital', action: 'hospital_selection', configType: 'db_select', table: 'hospitals', depends: 'place_id' },
            'List_Departments': { icon: 'fa-database text-indigo-500', title: 'Select Department', action: 'department_selection', configType: 'db_select', table: 'departments', depends: 'hospital_id' },
            'List_Doctors': { icon: 'fa-database text-indigo-500', title: 'Select Doctor', action: 'doctor_selection', configType: 'db_select', table: 'doctors', depends: 'hospital_id, department_id' },
            'Finalize_Booking': { icon: 'fa-check-circle text-green-600', title: 'Finalize Booking', action: 'finalize_booking', configType: 'final' },
            'Process_Refund': { icon: 'fa-undo text-red-500', title: 'Process Refund', action: 'refund_request', configType: 'final' },
        };

        function getHtmlForNode(nodeType) {
            let tpl = nodeTemplates[nodeType];
            
            let inputs = nodeType === 'Welcome_Message' ? 0 : 1;
            let outputs = tpl.configType === 'choice' ? 2 : 1;

            let configHtml = '';

            if (tpl.configType === 'db_select') {
                configHtml = `
                    <div class="node-hint">
                        <div>Type: <span>Database Select</span></div>
                        <div>Table: <span>${tpl.table}</span></div>
                        <div>Depends On: <span>${tpl.depends}</span></div>
                    </div>
                `;
            } else if (tpl.configType === 'text_input') {
                configHtml = `<div class="node-hint">Type: <span>Text Input</span></div>`;
            } else if (tpl.configType === 'number_input') {
                configHtml = `<div class="node-hint">Type: <span>Number Input</span></div>`;
            } else if (tpl.configType === 'gender_input') {
                configHtml = `<div class="node-hint">Type: <span>Choice (Male/Female/Other)</span></div>`;
            }

            let choiceHtml = '';
            if (tpl.configType === 'choice') {
                choiceHtml = `
                    <label class="text-xs font-semibold text-gray-500">Option 1 (Top Output):</label>
                    <input type="text" df-option_1 placeholder="e.g. Yes">
                    <label class="text-xs font-semibold text-gray-500">Option 2 (Bottom Output):</label>
                    <input type="text" df-option_2 placeholder="e.g. No">
                `;
            }

            let html = `
                <div>
                    <div class="title-box"><i class="fas ${tpl.icon}"></i> ${tpl.title}</div>
                    <div class="box">
                        ${configHtml}
                        <label class="text-xs font-semibold text-gray-500">Bot Message:</label>
                        <textarea df-message_text rows="2" placeholder="Type the message here..."></textarea>
                        ${choiceHtml}
                        <input type="hidden" df-system_action value="${tpl.action}">
                    </div>
                </div>
            `;
            return { html, inputs, outputs };
        }

        /* Drag and Drop Events */
        var dragData = null;

        function drag(ev) {
            dragData = ev.target.getAttribute('data-node');
        }

        function allowDrop(ev) {
            ev.preventDefault();
        }

        function drop(ev) {
            ev.preventDefault();
            if (!dragData) return;

            // Calculate canvas coordinates based on zoom and pan
            var pos_x = ev.clientX * (editor.precanvas.clientWidth / (editor.precanvas.clientWidth * editor.zoom)) - (editor.precanvas.getBoundingClientRect().x * (editor.precanvas.clientWidth / (editor.precanvas.clientWidth * editor.zoom)));
            var pos_y = ev.clientY * (editor.precanvas.clientHeight / (editor.precanvas.clientHeight * editor.zoom)) - (editor.precanvas.getBoundingClientRect().y * (editor.precanvas.clientHeight / (editor.precanvas.clientHeight * editor.zoom)));

            let tpl = getHtmlForNode(dragData);
            
            editor.addNode(
                dragData, 
                tpl.inputs, 
                tpl.outputs, 
                pos_x, 
                pos_y, 
                'node-class', 
                { system_action: nodeTemplates[dragData].action, message_text: '', option_1: '', option_2: '' }, 
                tpl.html
            );
        }

        /* Save Function */
        async function saveFlow() {
            let exportData = editor.export();
            
            try {
                let response = await fetch('{{ route('bot-builder.save-flow') }}', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': '{{ csrf_token() }}'
                    },
                    body: JSON.stringify(exportData)
                });

                let result = await response.json();
                
                if (result.success) {
                    showSuccessAlert();
                } else {
                    alert('Error saving flow: ' + result.message);
                }
            } catch (err) {
                alert('Server error while saving.');
            }
        }

        function showSuccessAlert() {
            const alertBox = document.getElementById('saveAlert');
            alertBox.classList.remove('translate-y-20', 'opacity-0');
            setTimeout(() => {
                alertBox.classList.add('translate-y-20', 'opacity-0');
            }, 3000);
        }
    </script>
</x-app-layout>
