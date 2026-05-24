/* ==========================================================================
   🍍 NANAS ENGINE - CORE APPLICATION ARCHITECTURE
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
const bucketTool = document.getElementById('bucketTool');
const squareTool = document.getElementById('squareTool');
const circleTool = document.getElementById('circleTool');
const textTool = document.getElementById('textTool');
const fontSelect = document.getElementById('fontSelect');
const fontSelectorGroup = document.getElementById('fontSelectorGroup');

// 🔄 Engine Engine States
let isDrawing = false;
let currentTool = 'brush'; // Setup options: 'brush', 'bucket', 'square', 'circle', 'text'
let startX, startY;        
let snapshot;              
let activeTextArea = null; 

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
        
        // Use browser runtime api to hook file asset paths dynamically
        const customFont = new FontFace(fontID, `url(${fontFile})`);
        customFont.load().then((loadedFont) => {
            document.fonts.add(loadedFont);
            loadedFontsMap.set(fontID, true);
            
            // Inject structural drop-down option into index DOM hook
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
    // Preserve old rendering frame matrix data state before adjusting aspect layout links
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, 0, 0);

    // Refresh canvas node sizing metrics based on modern browser viewport states
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Stamp baseline layer flat white so pixel data transfers never export transparent checkered boxes
    clearToWhite();
    ctx.drawImage(tempCanvas, 0, 0);
    
    // Core drawing smooth physics configurations
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
}

window.addEventListener('resize', resizeCanvas);
setTimeout(resizeCanvas, 1); // Trigger instant scale adjustment loop context at runtime load

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

    // Prevent endless recursion loops if fill targeting destination holds matching data structures
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
    ctx.strokeStyle = colorPicker.value;
    ctx.lineWidth = brushSize.value;
    snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (currentTool === 'brush') {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX, startY);
        ctx.stroke();
    }
}

function stopDrawing() {
    if (currentTool === 'text' || currentTool === 'bucket') return;
    isDrawing = false;
    ctx.beginPath();
}

function draw(e) {
    if (!isDrawing || currentTool === 'text' || currentTool === 'bucket') return;

    const coords = getCoordinates(e);
    const currentX = coords.x;
    const currentY = coords.y;
    const isAltPressed = e.altKey; // Modifier shortcut hook for symmetry constraints

    if (currentTool === 'brush') {
        ctx.lineTo(currentX, currentY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(currentX, currentY);
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

    // Handle auto-expansion parameters dynamically during structural text typing frames
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
            currentY += parseInt(brushSize.value, 10) * 1.05; // Line-height spacing buffer constant
        });
    }

    activeTextArea.remove();
    activeTextArea = null;
}

function updateFontSelectorVisibility() {
    fontSelectorGroup.style.display = (currentTool === 'text') ? 'flex' : 'none';
}

// ==========================================
// 📡 ROUTING INPUT EVENT LISTENERS
// ==========================================
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseleave', stopDrawing);

// Full Mobile/Touch Interaction Interfaces
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startDrawing(e); }, { passive: false });
canvas.addEventListener('touchend', stopDrawing);
canvas.addEventListener('touchmove', (e) => { e.preventDefault(); draw(e); }, { passive: false });

function setActiveTool(tool, clickedButton) {
    if (activeTextArea) finalizeText();
    currentTool = tool;
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    clickedButton.classList.add('active');
    updateFontSelectorVisibility();
}

brushTool.addEventListener('click', () => setActiveTool('brush', brushTool));
bucketTool.addEventListener('click', () => setActiveTool('bucket', bucketTool));
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

// 📂 Bitmap Input Loading Stream
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
            
            // Calculate dynamic offsets to center incoming images perfectly onto canvas coordinates
            const xOffset = (canvas.width - img.width) / 2;
            const yOffset = (canvas.height - img.height) / 2;
            
            ctx.drawImage(img, xOffset, yOffset);
            imageImporter.value = ''; // Reset input log target buffer link
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

// 💾 Multi-Format Core Bitmap Exporter
exportBtn.addEventListener('click', () => {
    if (activeTextArea) finalizeText();

    // 1. Identify current target mime type selection
    const mimeType = exportFormat.value; 
    
    // 2. Map file structure types out to string attachments
    let extension = '.png';
    if (mimeType === 'image/jpeg') extension = '.jpg';
    if (mimeType === 'image/webp') extension = '.webp';

    // 3. Convert rendering matrix coordinates down to raw target context string links
    const imageURI = canvas.toDataURL(mimeType, 1.0);

    // 4. Fire clean virtual link node execution sequences down onto the local machine system
    const virtualLink = document.createElement('a');
    virtualLink.download = `nanas-artwork${extension}`; 
    virtualLink.href = imageURI;

    document.body.appendChild(virtualLink);
    virtualLink.click();
    document.body.removeChild(virtualLink);
});
