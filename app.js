/**
 * 🍍 Nanas Engine: Drawing Module & Procedural Core
 * 100% Self-Contained — Grainy brush shader.
 */

// --- 1. DOM Element References ---
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const clearBtn = document.getElementById('clearBtn');

// --- 2. State & Texture Variables ---
let isDrawing = false;
let lastX = 0;
let lastY = 0;

// Nanas Engine texture components
let texturePatternCanvas = document.createElement('canvas');
let texturePatternCtx = texturePatternCanvas.getContext('2d');
let activeNanasPattern = null;

// --- 3. The Nanas Texture Core ---
// Generates a deep, high-contrast grainy graphite texture automatically
function generateNanasGrain() {
    const w = 128;
    const h = 128;
    texturePatternCanvas.width = w;
    texturePatternCanvas.height = h;
    
    // Clear previous texture data
    texturePatternCtx.clearRect(0, 0, w, h);
    
    // Fill the texture tile with your selected brush color
    texturePatternCtx.fillStyle = colorPicker.value;
    texturePatternCtx.fillRect(0, 0, w, h);
    
    // Grab the pixel data to manipulate channels directly
    const imgData = texturePatternCtx.getImageData(0, 0, w, h);
    const data = imgData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        // Drop the lower bound to 140 for a much rougher, heavy grain texture
        const noise = 140 + Math.random() * 115; 
        
        // Multiply color channels by the rough noise ratio
        data[i]     = (data[i] * noise) / 255;     // Red
        data[i + 1] = (data[i + 1] * noise) / 255; // Green
        data[i + 2] = (data[i + 2] * noise) / 255; // Blue
    }
    
    // Push the highly textured pixels back to our pattern canvas
    texturePatternCtx.putImageData(imgData, 0, 0);
    
    // Save it as a repeating pattern for the main drawing context
    activeNanasPattern = ctx.createPattern(texturePatternCanvas, 'repeat');
}

// --- 4. Drawing Logic ---
function startDrawing(e) {
    isDrawing = true;
    [lastX, lastY] = [e.offsetX, e.offsetY];
}

function draw(e) {
    if (!isDrawing) return;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(e.offsetX, e.offsetY);

    // Apply the grainy Nanas brush pattern
    ctx.strokeStyle = activeNanasPattern; 
    ctx.lineWidth = 5; // Slightly wider brush to display the heavy grain beautifully
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.stroke();

    // Update coordinate positions
    [lastX, lastY] = [e.offsetX, e.offsetY];
}

function stopDrawing() {
    isDrawing = false;
}

// --- 5. Event Listeners ---

// Mouse Draw Events
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

// Automatically update the texture when the color wheel shifts
colorPicker.addEventListener('input', generateNanasGrain);

// Clear Canvas Action
clearBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// --- 6. Initialization ---
// Build the initial pattern right on startup
console.log("Nanas Engine: Core systems operational.");
generateNanasGrain();
