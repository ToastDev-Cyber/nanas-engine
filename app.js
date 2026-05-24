const canvas = document.getElementById('paintCanvas');
const ctx = canvas.getContext('2d');

const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');
const sizeVal = document.getElementById('sizeVal');
const clearBtn = document.getElementById('clearBtn');

// Tool buttons and font dropdown
const brushTool = document.getElementById('brushTool');
const squareTool = document.getElementById('squareTool');
const circleTool = document.getElementById('circleTool');
const textTool = document.getElementById('textTool');
const fontSelect = document.getElementById('fontSelect');
const fontSelectorGroup = document.getElementById('fontSelectorGroup');

let isDrawing = false;
let currentTool = 'brush'; // Options: 'brush', 'square', 'circle', 'text'
let startX, startY;        // Holds initial click coordinates
let snapshot;              // Holds image data to prevent shape tearing
let activeTextArea = null; // Tracks current live typing element

// ==========================================
// 🍍 REPOSITORY FONT FILE TRACKER
// ==========================================
const REPO_FONTS = {
    "edosz.ttf": "Edo SZ"
};

// Track loaded font families internally
const loadedFontsMap = new Map();

// Loads edosz.ttf from the main folder and sets up the dropdown selector
function loadRepositoryFonts() {
    Object.entries(REPO_FONTS).forEach(([fontFile, displayName]) => {
        const fontID = fontFile.split('.')[0]; 
        
        const customFont = new FontFace(fontID, `url(${fontFile})`);
        customFont.load().then((loadedFont) => {
            document.fonts.add(loadedFont);
            loadedFontsMap.set(fontID, true);
            
            // Inject into the selector list
            const option = document.createElement('option');
            option.value = fontID;
            option.textContent = displayName;
            fontSelect.appendChild(option);
            
            console.log(`🍍 Nanas Engine: Loaded [${fontFile}] as "${displayName}" successfully!`);
        }).catch((err) => {
            console.log(`⚠️ Nanas Engine: Could not load asset file [${fontFile}]. Skipping.`);
        });
    });
}
loadRepositoryFonts();

function resizeCanvas() {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, 0, 0);

    const toolbarOffset = document.getElementById('toolbar').offsetHeight;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - toolbarOffset;

    ctx.drawImage(tempCanvas, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
}

window.addEventListener('resize', resizeCanvas);
setTimeout(resizeCanvas, 1);

function getCoordinates(e) {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const rect = canvas.getBoundingClientRect();
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
}

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
    if (currentTool === 'text') return;
    isDrawing = false;
    ctx.beginPath();
}

function draw(e) {
    if (!isDrawing || currentTool === 'text') return;

    const coords = getCoordinates(e);
    const currentX = coords.x;
    const currentY = coords.y;
    const isAltPressed = e.altKey;

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

function createTextbox(x, y) {
    const container = document.getElementById('canvasContainer');
    const textarea = document.createElement('textarea');
    
    textarea.className = 'canvas-textarea';
    textarea.style.left = `${x}px`;
    textarea.style.top = `${y}px`;
    textarea.style.color = colorPicker.value;
    textarea.style.fontSize = `${brushSize.value}px`;
    
    // Preview the font selection style directly inside the input box
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
    textarea.focus();
    activeTextArea = textarea;
}

function finalizeText() {
    if (!activeTextArea) return;

    const text = activeTextArea.value;
    const x = parseInt(activeTextArea.style.left, 10);
    const y = parseInt(activeTextArea.style.top, 10) + parseInt(brushSize.value, 10) * 0.85;

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
            currentY += parseInt(brushSize.value, 10);
        });
    }

    activeTextArea.remove();
    activeTextArea = null;
}

function updateFontSelectorVisibility() {
    if (currentTool === 'text') {
        fontSelectorGroup.style.display = 'flex';
    } else {
        fontSelectorGroup.style.display = 'none';
    }
}

// Click Listeners
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseleave', stopDrawing);

// Touch Support
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});
