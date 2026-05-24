const canvas = document.getElementById('paintCanvas');
const ctx = canvas.getContext('2d');

// Grab our toolbar control elements
const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');
const sizeVal = document.getElementById('sizeVal');
const clearBtn = document.getElementById('clearBtn');

let isDrawing = false;

// Handle canvas sizing dynamically without erasing current artwork
function resizeCanvas() {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, 0, 0);

    // Subtract toolbar height to ensure canvas fits perfectly on screen
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - document.getElementById('toolbar').offsetHeight;

    ctx.drawImage(tempCanvas, 0, 0);
    
    // Set smooth line configurations
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
}

window.addEventListener('resize', resizeCanvas);
setTimeout(resizeCanvas, 1);

// Drawing Mechanics
function startDrawing(e) {
    isDrawing = true;
    draw(e); // Tracks tap or click immediately to draw a single point
}

function stopDrawing() {
    isDrawing = false;
    ctx.beginPath(); // Breaks the current line sequence so marks don't stretch
}

function draw(e) {
    if (!isDrawing) return;

    // Pull current customization inputs from user
    ctx.strokeStyle = colorPicker.value;
    ctx.lineWidth = brushSize.value;

    // Detect if input is mobile touch screen or standard mouse
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

// Mouse Listeners
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseleave', stopDrawing);

// Touch Listeners (Crucial for mobile support)
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startDrawing(e); }, { passive: false });
canvas.addEventListener('touchend', stopDrawing);
canvas.addEventListener('touchmove', (e) => { e.preventDefault(); draw(e); }, { passive: false });

// Update UI Brush Size Text Feedback
brushSize.addEventListener('input', () => {
    sizeVal.textContent = `${brushSize.value}px`;
});

// Clear Canvas Handler
clearBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});
