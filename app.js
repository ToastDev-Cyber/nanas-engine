/* ==========================================================================
   🍍 NANAS ENGINE - CORE APPLICATION ARCHITECTURE (ALL TOOLS INTEGRATED)
   ========================================================================== */

// 🌐 Core Workspace Nodes
const canvas = document.getElementById('paintCanvas');
const ctx = canvas.getContext('2d');

const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');
const sizeVal = document.getElementById('sizeVal');
const clearBtn = document.getElementById('clearBtn');
const exportBtn = document.getElementById('exportBtn');
const exportFormat = document.getElementById('exportFormat');
const importBtn = document.getElementById('importBtn');
const imageImporter = document.getElementById('imageImporter');

// 🛠️ Tool Selection Nodes
const brushTool = document.getElementById('brushTool');
const pencilTool = document.getElementById('pencilTool');
const eraserTool = document.getElementById('eraserTool');
const eyedropperTool = document.getElementById('eyedropperTool');
const bucketTool = document.getElementById('bucketTool');
const lineTool = document.getElementById('lineTool');
const triangleTool = document.getElementById('triangleTool');
const squareTool = document.getElementById('squareTool');
const circleTool = document.getElementById('circleTool');
const textTool = document.getElementById('textTool');
const fontSelect = document.getElementById('fontSelect');
const fontSelectorGroup = document.getElementById('fontSelectorGroup');
const pencilGrade = document.getElementById('pencilGrade');
const pencilGradeGroup = document.getElementById('pencilGradeGroup');
const brushSizeGroup = document.getElementById('brushSizeGroup');

// 🔄 Engine States
let isDrawing = false;
let currentTool = 'brush'; // Options: 'brush', 'pencil', 'eraser', 'eyedropper', 'bucket', 'line', 'triangle', 'square', 'circle', 'text'
let startX, startY;        
let snapshot;              
let activeTextArea = null; 

// ✏️ Graphite Simulation Profiles (Maps hardness scale directly to stroke parameters)
const PENCIL_PROFILES = {
    '6H':  { opacity: 0.12, sizeMultiplier: 0.40 },
    '4H':  { opacity: 0.20, sizeMultiplier: 0.50 },
    '2H':  { opacity: 0.35, sizeMultiplier: 0.65 },
    'H':   { opacity: 0.50, sizeMultiplier: 0.80 },
    'HB':  { opacity: 0.65, sizeMultiplier: 1.00 },
    'B':   { opacity: 0.75, sizeMultiplier: 1.20 },
    '2B':  { opacity: 0.82, sizeMultiplier: 1.40 },
    '4B':  { opacity: 0.88, sizeMultiplier: 1.70 },
    '6B':  { opacity: 0.92, sizeMultiplier: 2.10 },
    '8B':  { opacity: 0.95, sizeMultiplier: 2.50 },
    '10B': { opacity: 0.98, sizeMultiplier: 3.00 },
    '12B': { opacity: 1.00, sizeMultiplier: 3.50 }
};

// ==========================================================================
// 🔤 TYPOGRAPHY RUNTIME MANAGEMENT SYSTEM
// ==========================================================================
const REPO_FONTS = {
    "edosz.ttf": "Edo SZ"
};

const loadedFontsMap = new Map();

function loadRepositoryFonts() {
    Object.entries(REPO_FONTS).forEach(([fontFile, displayName]) => {
        const fontID = fontFile.split('.')[0]; 
        
        const customFont = new FontFace(fontID, `url(${fontFile})`);
        customFont.load().then((loadedFont) => {
            document.fonts.add(loadedFont);
            loadedFontsMap.set(fontID, true);
            
            const option = document.createElement('option');
            option.value = fontID;
            option.textContent = displayName;
            fontSelect.appendChild(option);
            
            console.log(`🍍 Nanas Engine: Loaded layout file [${fontFile}] successfully.`);
        }).catch((err) => {
            console.log(`⚠️ Nanas Engine: Dynamic file target missing [${fontFile}]. Skipping injection loop.`);
        });
    });
}
loadRepositoryFonts();

// ==========================================================================
// 🗺️ VIEWPORT BOUNDS HANDLING ENGINE
// ==========================================================================
function clearToWhite() {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function resizeCanvas() {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, 0, 0);

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    clearToWhite();
    ctx.drawImage(tempCanvas, 0, 0);
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
}

window.addEventListener('resize', resizeCanvas);
setTimeout(resizeCanvas, 1); 

// ==========================================================================
// 🎯 DATA PARSER MATH COMPILER METHODS
// ==========================================================================
function getCoordinates(e) {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const rect = canvas.getBoundingClientRect();
    return {
        x: Math.floor(clientX - rect.left),
        y: Math.floor(clientY - rect.top)
    };
}

function hexToRgba(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b, a: 255 };
}

// Helper to convert hex strings and apply alpha opacity layers cleanly
function hexToRgbaString(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// 🪣 High-Performance Non-Recursive Stack-Based Flood Fill
function floodFill(startX, startY, fillColor) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    const targetIdx = (startY * width + startX) * 4;
    const targetR = data[targetIdx];
    const targetG = data[targetIdx + 1];
    const targetB = data[targetIdx + 2];
    const targetA = data[targetIdx + 3];

    if (
        targetR === fillColor.r &&
        targetG === fillColor.g &&
        targetB === fillColor.b &&
        targetA === fillColor.a
    ) {
        return;
    }

    const queue = [[startX, startY]];

    while (queue.length > 0) {
        const [cx, cy] = queue.shift();
        const idx = (cy * width + cx) * 4;

        if (
            data[idx] === targetR &&
            data[idx + 1] === targetG &&
            data[idx + 2] === targetB &&
            data[idx + 3] === targetA
        ) {
            data[idx] = fillColor.r;
            data[idx + 1] = fillColor.g;
            data[idx + 2] = fillColor.b;
            data[idx + 3] = fillColor.a;

            if (cx > 0) queue.push([cx - 1, cy]);
            if (cx < width - 1) queue.push([cx + 1, cy]);
            if (cy > 0) queue.push([cx, cy - 1]);
            if (cy < height - 1) queue.push([cx, cy + 1]);
        }
    }
    ctx.putImageData(imageData, 0, 0);
}

// ==========================================================================
// 🛠️ CONFIGURATION HELPER FOR ENGINES
// ==========================================================================
function configureBrushStyle() {
    if (currentTool === 'eraser') {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = brushSize.value;
    } else if (currentTool === 'pencil') {
        const grade = pencilGrade.value;
        const profile = PENCIL_PROFILES[grade];
        // Merge opacity modifiers onto our target core drawing canvas stroke
        ctx.strokeStyle = hexToRgbaString(colorPicker.value, profile.opacity);
        // Base brush sizing matrix scaled against real lead tip properties
        ctx.lineWidth = Math.max(0.5, brushSize.value * profile.sizeMultiplier);
    } else {
        ctx.strokeStyle = colorPicker.value;
        ctx.lineWidth = brushSize.value;
    }
}

// ==========================================================================
// 🖌️ CORE DRAWING INPUT EXECUTION PIPELINE
// ==========================================================================
function startDrawing(e) {
    if (activeTextArea) {
        finalizeText();
        return;
    }

    const coords = getCoordinates(e);
    startX = coords.x;
    startY = coords.y;

    if (currentTool === 'eyedropper') {
        const fillColor = ctx.getImageData(startX, startY, 1, 1).data;
        const r = fillColor[0].toString(16).padStart(2, '0');
        const g = fillColor[1].toString(16).padStart(2, '0');
        const b = fillColor[2].toString(16).padStart(2, '0');
        colorPicker.value = `#${r}${g}${b}`;
        return;
    }

    if (currentTool === 'text') {
        createTextbox(startX, startY);
        return;
    }

    if (currentTool === 'bucket') {
        const fillColor = hexToRgba(colorPicker.value);
        floodFill(startX, startY, fillColor);
        return;
    }

    isDrawing = true;
    configureBrushStyle();
    snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (currentTool === 'brush' || currentTool === 'pencil' || currentTool === 'eraser') {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX, startY);
        ctx.stroke();
    }
}

function stopDrawing() {
    if (currentTool === 'text' || currentTool === 'bucket' || currentTool === 'eyedropper') return;
    isDrawing = false;
    ctx.beginPath();
}

function draw(e) {
    if (!isDrawing || currentTool === 'text' || currentTool === 'bucket' || currentTool === 'eyedropper') return;

    const coords = getCoordinates(e);
    const currentX = coords.x;
    const currentY = coords.y;
    const isAltPressed = e.altKey; 

    configureBrushStyle();

    if (currentTool === 'brush' || currentTool === 'pencil' || currentTool === 'eraser') {
        ctx.lineTo(currentX, currentY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(currentX, currentY);
    } else if (currentTool === 'line') {
        ctx.putImageData(snapshot, 0, 0);
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();
    } else if (currentTool === 'triangle') {
        ctx.putImageData(snapshot, 0, 0);
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(currentX, currentY);
        const baseWidthOffset = currentX - startX;
        ctx.lineTo(startX - baseWidthOffset, currentY);
        ctx.closePath();
        ctx.stroke();
    } else if (currentTool === 'square') {
        ctx.putImageData(snapshot, 0, 0);
        ctx.beginPath();
        let width = currentX - startX;
        let height = currentY - startY;

        if (isAltPressed) {
            const sideLength = Math.max(Math.abs(width), Math.abs(height));
            width = width < 0 ? -sideLength : sideLength;
            height = height < 0 ? -sideLength : sideLength;
        }
        ctx.strokeRect(startX, startY, width, height);
    } else if (currentTool === 'circle') {
        ctx.putImageData(snapshot, 0, 0);
        ctx.beginPath();
        if (isAltPressed) {
            const radius = Math.sqrt(Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2));
            ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
        } else {
            const radiusX = Math.abs(currentX - startX);
            const radiusY = Math.abs(currentY - startY);
            ctx.ellipse(startX, startY, radiusX, radiusY, 0, 0, 2 * Math.PI);
        }
        ctx.stroke();
    }
}

// ==========================================================================
// 🔤 OVERLAY TEXT ENGINE SUBSYSTEM
// ==========================================================================
function createTextbox(x, y) {
    const container = document.getElementById('canvasContainer');
    const textarea = document.createElement('textarea');
    
    textarea.className = 'canvas-textarea';
    textarea.style.left = `${x}px`;
    textarea.style.top = `${y}px`;
    textarea.style.color = colorPicker.value;
    textarea.style.fontSize = `${brushSize.value}px`;
    
    const selectedFont = fontSelect.value;
    textarea.style.fontFamily = selectedFont === 'sans-serif' ? 'sans-serif' : `"${selectedFont}"`;

    textarea.style.width = '200px';
    textarea.style.height = `${parseInt(brushSize.value) + 10}px`;

    textarea.addEventListener('input', () => {
        textarea.style.width = 'auto';
        textarea.style.width = `${textarea.scrollWidth + 20}px`;
        textarea.style.height = `${textarea.scrollHeight}px`;
    });

    container.appendChild(textarea);
    setTimeout(() => { textarea.focus(); }, 50);
    activeTextArea = textarea;
}

function finalizeText() {
    if (!activeTextArea) return;

    const text = activeTextArea.value;
    const x = parseInt(activeTextArea.style.left, 10);
    const y = parseInt(activeTextArea.style.top, 10) + parseInt(brushSize.value, 10) * 0.82;

    if (text.trim() !== "") {
        ctx.fillStyle = colorPicker.value;
        
        const selectedFont = fontSelect.value;
        if (selectedFont !== 'sans-serif' && loadedFontsMap.has(selectedFont)) {
            ctx.font = `${brushSize.value}px "${selectedFont}"`;
        } else {
            ctx.font = `${brushSize.value}px sans-serif`;
        }
        
        const lines = text.split('\n');
        let currentY = y;
        lines.forEach(line => {
            ctx.fillText(line, x, currentY);
            currentY += parseInt(brushSize.value, 10) * 1.05; 
        });
    }

    activeTextArea.remove();
    activeTextArea = null;
}

function updateContextSelectorsVisibility() {
    fontSelectorGroup.style.display = (currentTool === 'text') ? 'flex' : 'none';
    pencilGradeGroup.style.display = (currentTool === 'pencil') ? 'flex' : 'none';
}

// ==========================================
// 📡 ROUTING INPUT EVENT LISTENERS
// ==========================================
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseleave', stopDrawing);

canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startDrawing(e); }, { passive: false });
canvas.addEventListener('touchend', stopDrawing);
canvas.addEventListener('touchmove', (e) => { e.preventDefault(); draw(e); }, { passive: false });

function setActiveTool(tool, clickedButton) {
    if (activeTextArea) finalizeText();
    currentTool = tool;
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    clickedButton.classList.add('active');
    updateContextSelectorsVisibility();
}

brushTool.addEventListener('click', () => setActiveTool('brush', brushTool));
pencilTool.addEventListener('click', () => setActiveTool('pencil', pencilTool));
eraserTool.addEventListener('click', () => setActiveTool('eraser', eraserTool));
eyedropperTool.addEventListener('click', () => setActiveTool('eyedropper', eyedropperTool));
bucketTool.addEventListener('click', () => setActiveTool('bucket', bucketTool));
lineTool.addEventListener('click', () => setActiveTool('line', lineTool));
triangleTool.addEventListener('click', () => setActiveTool('triangle', triangleTool));
squareTool.addEventListener('click', () => setActiveTool('square', squareTool));
circleTool.addEventListener('click', () => setActiveTool('circle', circleTool));
textTool.addEventListener('click', () => setActiveTool('text', textTool));

fontSelect.addEventListener('change', () => {
    if (activeTextArea) {
        const selectedFont = fontSelect.value;
        activeTextArea.style.fontFamily = selectedFont === 'sans-serif' ? 'sans-serif' : `"${selectedFont}"`;
    }
});

brushSize.addEventListener('input', () => {
    sizeVal.textContent = `${brushSize.value}px`;
});

clearBtn.addEventListener('click', () => {
    if (activeTextArea) {
        activeTextArea.remove();
        activeTextArea = null;
    }
    clearToWhite();
});

// ==========================================
// 📂 FILE MANAGEMENT INTEGRATION CORE
// ==========================================
importBtn.addEventListener('click', () => {
    imageImporter.click();
});

imageImporter.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            if (activeTextArea) finalizeText();
            const xOffset = (canvas.width - img.width) / 2;
            const yOffset = (canvas.height - img.height) / 2;
            ctx.drawImage(img, xOffset, yOffset);
            imageImporter.value = ''; 
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

exportBtn.addEventListener('click', () => {
    if (activeTextArea) finalizeText();

    const mimeType = exportFormat.value; 
    let extension = '.png';
    if (mimeType === 'image/jpeg') extension = '.jpg';
    if (mimeType === 'image/webp') extension = '.webp';

    const imageURI = canvas.toDataURL(mimeType, 1.0);

    const virtualLink = document.createElement('a');
    virtualLink.download = `nanas-artwork${extension}`; 
    virtualLink.href = imageURI;

    document.body.appendChild(virtualLink);
    virtualLink.click();
    document.body.removeChild(virtualLink);
});
