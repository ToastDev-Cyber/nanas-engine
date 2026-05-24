/**
 * Nanas Engine - Application Logic Core
 * Handles drawing, canvas calculations, tools, and dynamic file assets.
 */

// Initialize HTML canvas properties and set pixel context safety
const canvas = document.getElementById('paintCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

// Application State Parameters
let currentTool = 'brush';
let isDrawing = false;
let startX = 0;
let startY = 0;
let snapshot = null; // Holds temporary pixel arrays for live shape preview boundaries
let isAltPressed = false;
let activeFont = 'Arial';

// Pencil grading profile array mapping opacity values and line sizes
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

// DOM References
const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');
const pencilGradeSelect = document.getElementById('pencilGrade');
const fontUpload = document.getElementById('fontUpload');

/* ==========================================================================
   1. MAIN ENGINE OPERATIONS & UTILITIES
   ========================================================================== */

/**
 * Updates UI configurations and shifts application runtime state to specific tool profiles.
 * @param {string} toolName - Selected application tool label.
 */
function setTool(toolName) {
    currentTool = toolName;
    
    // Manage CSS active design flags across control elements
    document.querySelectorAll('#sidebar button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tool-${toolName}`).classList.add('active');

    // Toggle tool panels
    document.getElementById('pencil-grade-container').style.display = (toolName === 'pencil') ? 'flex' : 'none';
    document.getElementById('font-container').style.display = (toolName === 'text') ? 'flex' : 'none';
}

/**
 * Decodes hexadecimal colors into separate RGB data segments.
 * @param {string} hex - Hexadecimal color notation (#ffffff).
 */
function hexToRgb(hex) {
    const parsed = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return parsed ? {
        r: parseInt(parsed[1], 16),
        g: parseInt(parsed[2], 16),
        b: parseInt(parsed[3], 16)
    } : null;
}

// System keyboard listener bindings for standard shape locks
window.addEventListener('keydown', (e) => { if (e.key === 'Alt') isAltPressed = true; });
window.addEventListener('keyup', (e) => { if (e.key === 'Alt') isAltPressed = false; });

/* ==========================================================================
   2. FLOOD FILL ENGINE (BUCKET TOOL)
   ========================================================================== */

/**
 * Executes a 4-way queue-based flood fill algorithm over the canvas array context.
 */
function floodFill(xPosition, yPosition, fillColorHex) {
    const initialPixel = ctx.getImageData(xPosition, yPosition, 1, 1).data;
    const targetColor = hexToRgb(fillColorHex);
    
    if (!targetColor) return;

    // Boundary check: Skip filling if target and initial base matching values overlap
    if (initialPixel[0] === targetColor.r && 
        initialPixel[1] === targetColor.g && 
        initialPixel[2] === targetColor.b && 
        initialPixel[3] === 255) return;

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const dataStream = imgData.data;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    const coordinatesQueue = [[xPosition, yPosition]];
    const baseR = initialPixel[0];
    const baseG = initialPixel[1];
    const baseB = initialPixel[2];
    const baseA = initialPixel[3];

    while (coordinatesQueue.length > 0) {
        const [currentX, currentY] = coordinatesQueue.shift();
        if (currentX < 0 || currentX >= canvasWidth || currentY < 0 || currentY >= canvasHeight) continue;

        const byteIndex = (currentY * canvasWidth + currentX) * 4;

        if (dataStream[byteIndex] === baseR && 
            dataStream[byteIndex + 1] === baseG && 
            dataStream[byteIndex + 2] === baseB && 
            dataStream[byteIndex + 3] === baseA) {
            
            // Rewrite standard pixel addresses with fill color configurations
            dataStream[byteIndex] = targetColor.r;
            dataStream[byteIndex + 1] = targetColor.g;
            dataStream[byteIndex + 2] = targetColor.b;
            dataStream[byteIndex + 3] = 255;

            // Push neighboring node targets into algorithm check stream loops
            coordinatesQueue.push([currentX + 1, currentY]);
            coordinatesQueue.push([currentX - 1, currentY]);
            coordinatesQueue.push([currentX, currentY + 1]);
            coordinatesQueue.push([currentX, currentY - 1]);
        }
    }
    ctx.putImageData(imgData, 0, 0);
}

/* ==========================================================================
   3. MOUSE EVENT HANDLERS & GRAPHICS PROCESSING
   ========================================================================== */

canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    startX = Math.floor(e.clientX - rect.left);
    startY = Math.floor(e.clientY - rect.top);
    
    // Capture snapshot array map state prior to layout alterations
    snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.strokeStyle = colorPicker.value;
    ctx.fillStyle = colorPicker.value;
    ctx.lineWidth = brushSize.value;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (currentTool === 'brush' || currentTool === 'eraser') {
        if (currentTool === 'eraser') ctx.strokeStyle = '#ffffff';
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX, startY);
        ctx.stroke();
    } else if (currentTool === 'pencil') {
        const grade = pencilGrades[pencilGradeSelect.value];
        const rgb = hexToRgb(colorPicker.value);
        ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${grade.opacity})`;
        ctx.lineWidth = Math.max(0.5, brushSize.value * grade.sizeMultiplier * 0.15);
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX, startY);
        ctx.stroke();
    } else if (currentTool === 'eyedropper') {
        isDrawing = false;
        const targetPixel = ctx.getImageData(startX, startY, 1, 1).data;
        if (targetPixel[3] !== 0) { // Fall back onto pure white if node target matches clear transparency layers
            colorPicker.value = "#" + ("000000" + ((targetPixel[0] << 16) | (targetPixel[1] << 8) | targetPixel[2]).toString(16)).slice(-6);
        } else {
            colorPicker.value = "#ffffff";
        }
    } else if (currentTool === 'bucket') {
        isDrawing = false;
        floodFill(startX, startY, colorPicker.value);
    } else if (currentTool === 'text') {
        isDrawing = false;
        const inputString = prompt("Enter text overlay to append into your workspace context layer:");
        if (inputString) {
            ctx.font = `${brushSize.value * 2}px ${activeFont}`;
            ctx.fillText(inputString, startX, startY);
        }
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
    const rect = canvas.getBoundingClientRect();
    const currentX = Math.floor(e.clientX - rect.left);
    const currentY = Math.floor(e.clientY - rect.top);

    if (currentTool === 'brush' || currentTool === 'eraser' || currentTool === 'pencil') {
        ctx.lineTo(currentX, currentY);
        ctx.stroke();
    } else {
        // Redraw baseline context canvas from pixel array matrix to prevent graphic ghost trails
        ctx.putImageData(snapshot, 0, 0);
        
        let deltaWidth = currentX - startX;
        let deltaHeight = currentY - startY;

        // Apply geometric locking configurations when 'Alt' is held down
        if (isAltPressed) {
            const edgeValue = Math.max(Math.abs(deltaWidth), Math.abs(deltaHeight));
            deltaWidth = deltaWidth < 0 ? -edgeValue : edgeValue;
            deltaHeight = deltaHeight < 0 ? -edgeValue : edgeValue;
        }

        ctx.beginPath();
        if (currentTool === 'square') {
            ctx.strokeRect(startX, startY, deltaWidth, deltaHeight);
        } else if (currentTool === 'circle') {
            const circleRadius = Math.sqrt(deltaWidth * deltaWidth + deltaHeight * deltaHeight);
            ctx.arc(startX, startY, circleRadius, 0, 2 * Math.PI);
            ctx.stroke();
        } else if (currentTool === 'triangle') {
            ctx.moveTo(startX + deltaWidth / 2, startY);
            ctx.lineTo(startX, startY + deltaHeight);
            ctx.lineTo(startX + deltaWidth, startY + deltaHeight);
            ctx.closePath();
            ctx.stroke();
        }
    }
});

canvas.addEventListener('mouseup', () => isDrawing = false);
canvas.addEventListener('mouseleave', () => isDrawing = false);

/* ==========================================================================
   4. FILE SYSTEM UTILITY ARCHITECTURE (IMPORT, EXPORT & FONTS)
   ========================================================================== */

// Custom Font parser engine hook via inline dynamic context compilation
fontUpload.addEventListener('change', (e) => {
    const targetFile = e.target.files[0];
    if (targetFile) {
        const fileReader = new FileReader();
        fileReader.onload = function(event) {
            const temporaryFontName = 'DynamicUploadedFont';
            const convertedFontFace = new FontFace(temporaryFontName, event.target.result);
            
            convertedFontFace.load().then((loadedFont) => {
                document.fonts.add(loadedFont);
                activeFont = temporaryFontName;
                alert("Font configuration accepted and linked directly with the Text tool.");
            }).catch(() => alert("Font array compilation failure. Please check your source file extensions (.ttf/.otf)."));
        };
        fileReader.readAsArrayBuffer(targetFile);
    }
});

// Clear canvas system check loop
document.getElementById('clearBtn').addEventListener('click', () => {
    if (confirm("Reset current canvas viewport layers? All unstored modifications will be dropped.")) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
});

// Canvas image export workflow stream setup
document.getElementById('exportBtn').addEventListener('click', () => {
    const fileAnchorElement = document.createElement('a');
    fileAnchorElement.download = 'nanas-engine-canvas-output.png';
    fileAnchorElement.href = canvas.toDataURL();
    fileAnchorElement.click();
});

// Structural workflow import mapping system configurations
document.getElementById('importBtn').addEventListener('change', (e) => {
    const importedImageFile = e.target.files[0];
    if (importedImageFile) {
        const readerInstance = new FileReader();
        readerInstance.onload = function(event) {
            const runtimeImageContainer = new Image();
            runtimeImageContainer.onload = function() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(runtimeImageContainer, 0, 0, canvas.width, canvas.height);
            };
            runtimeImageContainer.src = event.target.result;
        };
        readerInstance.readAsDataURL(importedImageFile);
    }
});
