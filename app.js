const canvas = document.getElementById('paintCanvas');
const ctx = canvas.getContext('2d');

const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');
const sizeVal = document.getElementById('sizeVal');
const clearBtn = document.getElementById('clearBtn');

// Tool buttons
const brushTool = document.getElementById('brushTool');
const squareTool = document.getElementById('squareTool');
const circleTool = document.getElementById('circleTool');

let isDrawing = false;
let currentTool = 'brush'; // Options: 'brush', 'square', 'circle'
let startX, startY;        // Holds initial click coordinates
let snapshot;              // Holds image data to prevent shape tearing

function resizeCanvas() {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, 0, 0);

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - document.getElementById('toolbar').offsetHeight;

    ctx.drawImage(tempCanvas, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
}

window.addEventListener('resize', resizeCanvas);
setTimeout(resizeCanvas, 1);

// Helper to get clean coordinates for both Mouse and Touch
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
    isDrawing = true;
    const coords = getCoordinates(e);
    startX = coords.x;
    startY = coords.y;

    // Set styling parameters
    ctx.strokeStyle = colorPicker.value;
    ctx.lineWidth = brushSize.value;
    
    // Save the canvas state exactly as it is right now
    snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (currentTool === 'brush') {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX, startY);
        ctx.stroke();
    }
}

function stopDrawing() {
    isDrawing = false;
    ctx.beginPath();
}

function draw(e) {
    if (!isDrawing) return;

    const coords = getCoordinates(e);
    const currentX = coords.x;
    const currentY = coords.y;

    // Restore the canvas snapshot to wipe out the previous preview frame
    ctx.putImageData(snapshot, 0, 0);

    if (currentTool === 'brush') {
        ctx.lineTo(currentX, currentY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(currentX, currentY);
    } else if (currentTool === 'square') {
        ctx.beginPath();
        const width = currentX - startX;
        const height = currentY - startY;
        ctx.strokeRect(startX, startY, width, height);
    } else if (currentTool === 'circle') {
        ctx.beginPath();
        // Determine radius using geometry distance formula
        const radius = Math.sqrt(Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2));
        ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
        ctx.stroke();
    }
}

// Event Listeners for UI interaction
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseleave', stopDrawing);

canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startDrawing(e); }, { passive: false });
canvas.addEventListener('touchend', stopDrawing);
canvas.addEventListener('touchmove', (e) => { e.preventDefault(); draw(e); }, { passive: false });

// Manage Active Button States
function setActiveTool(tool, clickedButton) {
    currentTool = tool;
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    clickedButton.classList.add('active');
}

brushTool.addEventListener('click', () => setActiveTool('brush', brushTool));
squareTool.addEventListener('click', () => setActiveTool('square', squareTool));
circleTool.addEventListener('click', () => setActiveTool('circle', circleTool));

brushSize.addEventListener('input', () => {
    sizeVal.textContent = `${brushSize.value}px`;
});

clearBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});
