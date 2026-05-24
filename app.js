/**
 * Nanas Engine - Application Logic Core (v3.0 Layer Matrix Edition)
 * Handles full layer management pipelines, history tracking, and composite .nns file configurations.
 */

// Initialize primary HTML viewport canvas properties
const mainCanvas = document.getElementById('paintCanvas');
const mainCtx = mainCanvas.getContext('2d');

// Application Core State
let currentTool = 'brush';
let isDrawing = false;
let startX = 0;
let startY = 0;
let isAltPressed = false;
let activeFont = 'Arial';

// --- LAYER & HISTORY PIPELINE DATA MATRIX ---
let layers = [];         // Array of Layer Objects: { id, name, visible, opacity, canvas, ctx }
let activeLayer = null;  // Reference pointing directly to the currently selected active Layer Object
let actionHistory = [];  // Global tracking script for absolute file rebuild streams
let currentStrokePoints = []; 

// Pencil grading profiles
const pencilGrades = {
    '10H': { opacity: 0.05, sizeMultiplier: 0.6 }, '9H': { opacity: 0.08, sizeMultiplier: 0.6 },
    '8H': { opacity: 0.12, sizeMultiplier: 0.7 }, '7H': { opacity: 0.15, sizeMultiplier: 0.7 },
    '6H': { opacity: 0.18, sizeMultiplier: 0.8 }, '5H': { opacity: 0.22, sizeMultiplier: 0.8 },
    '4H': { opacity: 0.25, sizeMultiplier: 0.9 }, '3H': { opacity: 0.30, sizeMultiplier: 0.9 },
    '2H': { opacity: 0.35, sizeMultiplier: 1.0 }, 'H':  { opacity: 0.40, sizeMultiplier: 1.0 },
    'F':  { opacity: 0.45, sizeMultiplier: 1.0 }, 'HB': { opacity: 0.50, sizeMultiplier: 1.1 },
    'B':  { opacity: 0.58, sizeMultiplier: 1.1 }, '2B': { opacity: 0.64, sizeMultiplier: 1.2 },
    '3B': { opacity: 0.70, sizeMultiplier: 1.2 }, '4B': { opacity: 0.76, sizeMultiplier: 1.3 },
    '5B': { opacity: 0.82, sizeMultiplier: 1.3 }, '6B': { opacity: 0.86, sizeMultiplier: 1.4 },
    '7B': { opacity: 0.90, sizeMultiplier: 1.4 }, '8B': { opacity: 0.93, sizeMultiplier: 1.5 },
    '9B': { opacity: 0.95, sizeMultiplier: 1.5 }, '10B':{ opacity: 0.97, sizeMultiplier: 1.6 },
    '11B':{ opacity: 0.99, sizeMultiplier: 1.6 }, '12B':{ opacity: 1.00, sizeMultiplier: 1.8 }
};

// DOM Control References
const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');
const globalOpacity = document.getElementById('globalOpacity');
const pencilGradeSelect = document.getElementById('pencilGrade');
const fontUpload = document.getElementById('fontUpload');
const layersContainer = document.getElementById('layersContainer'); // Target container block for Layer list UI

/* ==========================================================================
   1. LAYER MANAGEMENT ENGINE CORE
   ========================================================================== */

/**
 * Creates an independent offscreen canvas plane and pushes it to the layers directory.
 */
function createLayer(name = `Layer ${layers.length + 1}`, visible = true, opacity = 1.0) {
    const layerCanvas = document.createElement('canvas');
    layerCanvas.width = mainCanvas.width;
    layerCanvas.height = mainCanvas.height;
    
    const layerCtx = layerCanvas.getContext('2d', { willReadFrequently: true });
    
    const targetLayer = {
        id: 'layer_' + Math.random().toString(36).substr(2, 9),
        name: name,
        visible: visible,
        opacity: opacity,
        canvas: layerCanvas,
        ctx: layerCtx
    };
    
    layers.push(targetLayer);
    selectLayer(targetLayer.id);
    updateLayersUI();
    return targetLayer;
}

/**
 * Changes active structural drawing context paths over to the designated layer.
 */
function selectLayer(id) {
    const target = layers.find(l => l.id === id);
    if (target) {
        activeLayer = target;
        updateLayersUI();
    }
}

/**
 * Destroys a layer element and updates workspace parameters.
 */
function deleteLayer(id) {
    if (layers.length <= 1) {
        alert("Cannot delete the final workspace layer structure.");
        return;
    }
    const targetIndex = layers.findIndex(l => l.id === id);
    if (targetIndex !== -1) {
        layers.splice(targetIndex, 1);
        // Shift context over to safety boundary array steps
        if (activeLayer.id === id) {
            activeLayer = layers[Math.max(0, targetIndex - 1)];
        }
        
        // Log operation history track for .nns file sync
        actionHistory.push({ tool: 'system_delete_layer', layerId: id });
        
        updateLayersUI();
        composeLayersToViewport();
    }
}

/**
 * Composites and flattens all visible active layer configurations onto the viewport.
 */
function composeLayersToViewport() {
    mainCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
    
    // Draw canvas nodes sequentially from bottom (Index 0) to top layer
    layers.forEach(layer => {
        if (layer.visible) {
            mainCtx.globalAlpha = layer.opacity;
            mainCtx.drawImage(layer.canvas, 0, 0);
        }
    });
    mainCtx.globalAlpha = 1.0; // Restore global baseline values
}

/**
 * Synchronizes layout data to update the sidebar layer manager list UI elements dynamically.
 */
function updateLayersUI() {
    if (!layersContainer) return;
    layersContainer.innerHTML = '';

    // Render layers backwards so top layer physically shows on top of the list stack
    [...layers].reverse().forEach(layer => {
        const item = document.createElement('div');
        item.className = `layer-item ${activeLayer.id === layer.id ? 'active' : ''}`;
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.justifyContent = 'space-between';
        item.style.margin = '4px 0';
        item.style.padding = '6px';
        item.style.border = '1px solid #ccc';
        item.style.background = activeLayer.id === layer.id ? '#ddd' : '#fff';

        item.innerHTML = `
            <span class="layer-name" style="cursor:pointer; font-weight:${activeLayer.id === layer.id ? 'bold' : 'normal'}">${layer.name}</span>
            <div>
                <button class="layer-toggle-vis" title="Toggle Visibility">${layer.visible ? '👁️' : '❌'}</button>
                <button class="layer-delete-btn" title="Delete Layer">🗑️</button>
            </div>
        `;

        // Interactive bindings tracking UI interaction
        item.querySelector('.layer-name').addEventListener('click', () => selectLayer(layer.id));
        
        item.querySelector('.layer-toggle-vis').addEventListener('click', (e) => {
            e.stopPropagation();
            layer.visible = !layer.visible;
            actionHistory.push({ tool: 'system_toggle_layer', layerId: layer.id, visible: layer.visible });
            updateLayersUI();
            composeLayersToViewport();
        });

        item.querySelector('.layer-delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteLayer(layer.id);
        });

        layersContainer.appendChild(item);
    });
}

/* ==========================================================================
   2. UTILITIES & FLOOD FILL INTERACTION
   ========================================================================== */

function setTool(toolName) {
    currentTool = toolName;
    document.querySelectorAll('#sidebar button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tool-${toolName}`).classList.add('active');
    document.getElementById('pencil-grade-container').style.display = (toolName === 'pencil') ? 'flex' : 'none';
    document.getElementById('font-container').style.display = (toolName === 'text') ? 'flex' : 'none';
    document.getElementById('opacity-container').style.display = (toolName === 'pencil' || toolName === 'eraser' || toolName === 'eyedropper' || toolName === 'bucket') ? 'none' : 'flex';
}

function hexToRgb(hex) {
    const parsed = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return parsed ? { r: parseInt(parsed[1], 16), g: parseInt(parsed[2], 16), b: parseInt(parsed[3], 16) } : null;
}

function hexToRgbaStr(hex, opacityAlpha) {
    const rgb = hexToRgb(hex);
    return rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacityAlpha})` : hex;
}

window.addEventListener('keydown', (e) => { if (e.key === 'Alt') isAltPressed = true; });
window.addEventListener('keyup', (e) => { if (e.key === 'Alt') isAltPressed = false; });

/**
 * Runs 4-way queue fill algorithm targeting specific offscreen context layers.
 */
function floodFill(targetCtx, targetCanvas, xPosition, yPosition, fillColorHex, recordAction = true, targetLayerId = null) {
    const initialPixel = targetCtx.getImageData(xPosition, yPosition, 1, 1).data;
    const targetColor = hexToRgb(fillColorHex);
    if (!targetColor) return;

    if (initialPixel[0] === targetColor.r && initialPixel[1] === targetColor.g && 
        initialPixel[2] === targetColor.b && initialPixel[3] === 255) return;

    const imgData = targetCtx.getImageData(0, 0, targetCanvas.width, targetCanvas.height);
    const dataStream = imgData.data;
    const canvasWidth = targetCanvas.width;
    const canvasHeight = targetCanvas.height;

    const coordinatesQueue = [[xPosition, yPosition]];
    const baseR = initialPixel[0];
    const baseG = initialPixel[1];
    const baseB = initialPixel[2];
    const baseA = initialPixel[3];

    while (coordinatesQueue.length > 0) {
        const [currentX, currentY] = coordinatesQueue.shift();
        if (currentX < 0 || currentX >= canvasWidth || currentY < 0 || currentY >= canvasHeight) continue;

        const byteIndex = (currentY * canvasWidth + currentX) * 4;

        if (dataStream[byteIndex] === baseR && dataStream[byteIndex + 1] === baseG && 
            dataStream[byteIndex + 2] === baseB && dataStream[byteIndex + 3] === baseA) {
            
            dataStream[byteIndex] = targetColor.r;
            dataStream[byteIndex + 1] = targetColor.g;
            dataStream[byteIndex + 2] = targetColor.b;
            dataStream[byteIndex + 3] = 255;

            coordinatesQueue.push([currentX + 1, currentY]);
            coordinatesQueue.push([currentX - 1, currentY]);
            coordinatesQueue.push([currentX, currentY + 1]);
            coordinatesQueue.push([currentX, currentY - 1]);
        }
    }
    targetCtx.putImageData(imgData, 0, 0);

    if (recordAction) {
        actionHistory.push({
            tool: 'bucket',
            layerId: targetLayerId || activeLayer.id,
            x: xPosition,
            y: yPosition,
            color: fillColorHex
        });
    }
}

/* ==========================================================================
   3. WORKSPACE DRAWING INPUT MAPPING
   ========================================================================== */

mainCanvas.addEventListener('mousedown', (e) => {
    if (!activeLayer || !activeLayer.visible) return; // Prevent hidden layers from receiving inputs
    isDrawing = true;

    const rect = mainCanvas.getBoundingClientRect();
    startX = Math.floor(e.clientX - rect.left);
    startY = Math.floor(e.clientY - rect.top);
    
    // Capture state of the active offscreen workspace layer
    activeLayer.snapshot = activeLayer.ctx.getImageData(0, 0, mainCanvas.width, mainCanvas.height);
    const currentAlpha = globalOpacity.value / 100;

    const targetCtx = activeLayer.ctx;
    targetCtx.beginPath();
    targetCtx.strokeStyle = hexToRgbaStr(colorPicker.value, currentAlpha);
    targetCtx.fillStyle = hexToRgbaStr(colorPicker.value, currentAlpha);
    targetCtx.lineWidth = brushSize.value;
    targetCtx.lineCap = 'round';
    targetCtx.lineJoin = 'round';

    currentStrokePoints = [{ x: startX, y: startY }];

    if (currentTool === 'brush' || currentTool === 'eraser' || currentTool === 'pencil') {
        if (currentTool === 'pencil') {
            const grade = pencilGrades[pencilGradeSelect.value];
            const rgb = hexToRgb(colorPicker.value);
            targetCtx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${grade.opacity})`;
            targetCtx.lineWidth = Math.max(0.5, brushSize.value * grade.sizeMultiplier * 0.15);
        } else if (currentTool === 'eraser') {
            targetCtx.strokeStyle = '#ffffff';
        }
        targetCtx.moveTo(startX, startY);
        targetCtx.lineTo(startX, startY);
        targetCtx.stroke();
        composeLayersToViewport();
    } else if (currentTool === 'eyedropper') {
        isDrawing = false;
        // Sample color from global flattened view instead of isolated single layer
        const targetPixel = mainCtx.getImageData(startX, startY, 1, 1).data;
        if (targetPixel[3] !== 0) {
            colorPicker.value = "#" + ("000000" + ((targetPixel[0] << 16) | (targetPixel[1] << 8) | targetPixel[2]).toString(16)).slice(-6);
        } else {
            colorPicker.value = "#ffffff";
        }
    } else if (currentTool === 'bucket') {
        isDrawing = false;
        floodFill(activeLayer.ctx, activeLayer.canvas, startX, startY, colorPicker.value, true, activeLayer.id);
        composeLayersToViewport();
    } else if (currentTool === 'text') {
        isDrawing = false;
        const inputString = prompt("Enter text overlay:");
        if (inputString) {
            targetCtx.font = `${brushSize.value * 2}px ${activeFont}`;
            targetCtx.fillText(inputString, startX, startY);
            
            actionHistory.push({
                tool: 'text',
                layerId: activeLayer.id,
                text: inputString,
                x: startX,
                y: startY,
                font: activeFont,
                size: brushSize.value * 2,
                color: colorPicker.value,
                opacity: currentAlpha
            });
            composeLayersToViewport();
        }
    }
});

mainCanvas.addEventListener('mousemove', (e) => {
    if (!isDrawing || !activeLayer) return;
    const rect = mainCanvas.getBoundingClientRect();
    const currentX = Math.floor(e.clientX - rect.left);
    const currentY = Math.floor(e.clientY - rect.top);

    const targetCtx = activeLayer.ctx;

    if (currentTool === 'brush' || currentTool === 'eraser' || currentTool === 'pencil') {
        targetCtx.lineTo(currentX, currentY);
        targetCtx.stroke();
        currentStrokePoints.push({ x: currentX, y: currentY });
        composeLayersToViewport();
    } else {
        // Redraw only the single active layer from its snapshot to avoid cross-layer blending artifacts
        targetCtx.putImageData(activeLayer.snapshot, 0, 0);
        
        let deltaWidth = currentX - startX;
        let deltaHeight = currentY - startY;

        if (isAltPressed) {
            const edgeValue = Math.max(Math.abs(deltaWidth), Math.abs(deltaHeight));
            deltaWidth = deltaWidth < 0 ? -edgeValue : edgeValue;
            deltaHeight = deltaHeight < 0 ? -edgeValue : edgeValue;
        }

        targetCtx.beginPath();
        if (currentTool === 'square') {
            targetCtx.strokeRect(startX, startY, deltaWidth, deltaHeight);
        } else if (currentTool === 'circle') {
            const circleRadius = Math.sqrt(deltaWidth * deltaWidth + deltaHeight * deltaHeight);
            targetCtx.arc(startX, startY, circleRadius, 0, 2 * Math.PI);
            targetCtx.stroke();
        } else if (currentTool === 'triangle') {
            targetCtx.moveTo(startX + deltaWidth / 2, startY);
            targetCtx.lineTo(startX, startY + deltaHeight);
            targetCtx.lineTo(startX + deltaWidth, startY + deltaHeight);
            targetCtx.closePath();
            targetCtx.stroke();
        }
        composeLayersToViewport();
    }
});

mainCanvas.addEventListener('mouseup', (e) => {
    if (!isDrawing || !activeLayer) return;
    isDrawing = false;

    const rect = mainCanvas.getBoundingClientRect();
    const endX = Math.floor(e.clientX - rect.left);
    const endY = Math.floor(e.clientY - rect.top);
    const currentAlpha = globalOpacity.value / 100;

    if (currentTool === 'brush' || currentTool === 'eraser' || currentTool === 'pencil') {
        actionHistory.push({
            tool: currentTool,
            layerId: activeLayer.id,
            points: currentStrokePoints,
            color: colorPicker.value,
            size: brushSize.value,
            opacity: currentAlpha,
            pencilGrade: currentTool === 'pencil' ? pencilGradeSelect.value : null
        });
    } else if (['square', 'circle', 'triangle'].includes(currentTool)) {
        let deltaWidth = endX - startX;
        let deltaHeight = endY - startY;
        if (isAltPressed) {
            const edgeValue = Math.max(Math.abs(deltaWidth), Math.abs(deltaHeight));
            deltaWidth = deltaWidth < 0 ? -edgeValue : edgeValue;
            deltaHeight = deltaHeight < 0 ? -edgeValue : edgeValue;
        }
        actionHistory.push({
            tool: currentTool,
            layerId: activeLayer.id,
            startX: startX,
            startY: startY,
            deltaWidth: deltaWidth,
            deltaHeight: deltaHeight,
            color: colorPicker.value,
            size: brushSize.value,
            opacity: currentAlpha
        });
    }
});

mainCanvas.addEventListener('mouseleave', () => isDrawing = false);

/* ==========================================================================
   4. ADVANCED .NNS PROTOCOL ENCODER / DECODER
   ========================================================================== */

/**
 * Parses structural layer setup instructions and reruns vector calculations.
 */
function rebuildWorkspaceFromNns(nnsProjectData) {
    // Clear structural states entirely
    layers = [];
    actionHistory = [];
    
    // 1. Rebuild the layered workspace architecture map
    nnsProjectData.layersStructure.forEach(layerMeta => {
        createLayer(layerMeta.name, layerMeta.visible, layerMeta.opacity);
        // Retain matching reference identities across vectors
        layers[layers.length - 1].id = layerMeta.id; 
    });

    // 2. Map and bind history array operations onto targets
    nnsProjectData.history.forEach(action => {
        // Intercept structural layer updates
        if (action.tool === 'system_toggle_layer') {
            const match = layers.find(l => l.id === action.layerId);
            if (match) match.visible = action.visible;
            actionHistory.push(action);
            return;
        }
        if (action.tool === 'system_delete_layer') {
            const targetIdx = layers.findIndex(l => l.id === action.layerId);
            if (targetIdx !== -1) layers.splice(targetIdx, 1);
            actionHistory.push(action);
            return;
        }

        // Trace and assign targeting layer boundaries
        const activeLayerRef = layers.find(l => l.id === action.layerId);
        if (!activeLayerRef) return; 

        const targetCtx = activeLayerRef.ctx;
        targetCtx.beginPath();
        targetCtx.lineCap = 'round';
        targetCtx.lineJoin = 'round';

        if (['brush', 'eraser', 'pencil'].includes(action.tool)) {
            if (action.tool === 'pencil') {
                const grade = pencilGrades[action.pencilGrade || 'HB'];
                const rgb = hexToRgb(action.color);
                targetCtx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${grade.opacity})`;
                targetCtx.lineWidth = Math.max(0.5, action.size * grade.sizeMultiplier * 0.15);
            } else {
                targetCtx.strokeStyle = action.tool === 'eraser' ? '#ffffff' : hexToRgbaStr(action.color, action.opacity);
                targetCtx.lineWidth = action.size;
            }

            if (action.points && action.points.length > 0) {
                targetCtx.moveTo(action.points[0].x, action.points[0].y);
                action.points.forEach(pt => targetCtx.lineTo(pt.x, pt.y));
                targetCtx.stroke();
            }
        } else if (action.tool === 'square') {
            targetCtx.strokeStyle = hexToRgbaStr(action.color, action.opacity);
            targetCtx.lineWidth = action.size;
            targetCtx.strokeRect(action.startX, action.startY, action.deltaWidth, action.deltaHeight);
        } else if (action.tool === 'circle') {
            targetCtx.strokeStyle = hexToRgbaStr(action.color, action.opacity);
            targetCtx.lineWidth = action.size;
            const radius = Math.sqrt(action.deltaWidth * action.deltaWidth + action.deltaHeight * action.deltaHeight);
            targetCtx.arc(action.startX, action.startY, radius, 0, 2 * Math.PI);
            targetCtx.stroke();
        } else if (action.tool === 'triangle') {
            targetCtx.strokeStyle = hexToRgbaStr(action.color, action.opacity);
            targetCtx.lineWidth = action.size;
            targetCtx.moveTo(action.startX + action.deltaWidth / 2, action.startY);
            targetCtx.lineTo(action.startX, action.startY + action.deltaHeight);
            targetCtx.lineTo(action.startX + action.deltaWidth, action.startY + action.deltaHeight);
            targetCtx.closePath();
            targetCtx.stroke();
        } else if (action.tool === 'bucket') {
            floodFill(activeLayerRef.ctx, activeLayerRef.canvas, action.x, action.y, action.color, false, activeLayerRef.id);
        } else if (action.tool === 'text') {
            targetCtx.fillStyle = hexToRgbaStr(action.color, action.opacity);
            targetCtx.font = `${action.size}px ${action.font}`;
            targetCtx.fillText(action.text, action.x, action.y);
        }
        
        actionHistory.push(action);
    });

    // Enforce matching layer context selection on the interface layout viewports
    if (layers.length > 0) selectLayer(layers[layers.length - 1].id);
    updateLayersUI();
    composeLayersToViewport();
}

// Custom Nanas Engine Export Logic Layer Sync (.nns)
document.getElementById('exportNnsBtn')?.addEventListener('click', () => {
    // Structural compression profile capturing layer layout arrangements
    const packedLayersMeta = layers.map(l => ({
        id: l.id,
        name: l.name,
        visible: l.visible,
        opacity: l.opacity
    }));

    const packageMetaData = {
        engineSignature: "NANAS_ENGINE_MULTI_LAYER_DATA",
        canvasWidth: mainCanvas.width,
        canvasHeight: mainCanvas.height,
        savedAt: new Date().toISOString(),
        layersStructure: packedLayersMeta,
        history: actionHistory
    };

    const dataBlob = new Blob([JSON.stringify(packageMetaData, null, 2)], { type: "application/json" });
    const fileAnchorElement = document.createElement('a');
    fileAnchorElement.download = 'layered-workspace-project.nns';
    fileAnchorElement.href = URL.createObjectURL(dataBlob);
    fileAnchorElement.click();
});

// Import Processing Pipeline (Handles .nns Layers + Normal Flat Images fallback)
document.getElementById('importBtn').addEventListener('change', (e) => {
    const importedFile = e.target.files[0];
    if (!importedFile) return;

    const fileExtension = importedFile.name.split('.').pop().toLowerCase();

    if (fileExtension === 'nns') {
        const fileReader = new FileReader();
        fileReader.onload = function(event) {
            try {
                const parsedProject = JSON.parse(event.target.result);
                if (parsedProject.engineSignature === "NANAS_ENGINE_MULTI_LAYER_DATA") {
                    rebuildWorkspaceFromNns(parsedProject);
                    alert("Layered project workspace setup complete!");
                } else if (parsedProject.engineSignature === "NANAS_ENGINE_VECTOR_DATA") {
                    // Legacy non-layer support upgrade wrapper tracking
                    alert("Legacy single-layer workspace profile detected. Converting project configuration format...");
                    const updatedWrapper = {
                        layersStructure: [{ id: 'layer_default', name: 'Layer 1', visible: true, opacity: 1.0 }],
                        history: parsedProject.history.map(act => { act.layerId = 'layer_default'; return act; })
                    };
                    rebuildWorkspaceFromNns(updatedWrapper);
                } else {
                    alert("Invalid signature mapping context. File structural validation failure.");
                }
            } catch (err) {
                alert("Error unpacking vector file array layers.");
            }
        };
        fileReader.readAsText(importedFile);
    } else {
        // Flat traditional structural fallback layout configurations
        const readerInstance = new FileReader();
        readerInstance.onload = function(event) {
            const runtimeImageContainer = new Image();
            runtimeImageContainer.onload = function() {
                layers = [];
                actionHistory = [];
                const importedLayer = createLayer("Imported Flat Layer");
                importedLayer.ctx.drawImage(runtimeImageContainer, 0, 0, mainCanvas.width, mainCanvas.height);
                composeLayersToViewport();
            };
            runtimeImageContainer.src = event.target.result;
        };
        readerInstance.readAsDataURL(importedFile);
    }
});

// Clear canvas initialization logic
document.getElementById('clearBtn').addEventListener('click', () => {
    if (confirm("Reset current canvas layers? All unstored modifications will be dropped.")) {
        layers = [];
        actionHistory = [];
        createLayer('Background Base');
        composeLayersToViewport();
    }
});

// Flattened Image Export Output (.png)
document.getElementById('exportBtn').addEventListener('click', () => {
    const fileAnchorElement = document.createElement('a');
    fileAnchorElement.download = 'nanas-engine-flattened-output.png';
    fileAnchorElement.href = mainCanvas.toDataURL();
    fileAnchorElement.click();
});

// Engine Boot Trigger Configuration Initialization
document.addEventListener("DOMContentLoaded", () => {
    // Generate base workspace fallback block layer array setup 
    createLayer('Background Base');
});
