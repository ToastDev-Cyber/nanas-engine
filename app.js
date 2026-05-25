const canvas = document.getElementById('paintCanvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const lineWidth = document.getElementById('lineWidth');
let painting = false;
let activeTool = 'brush';

function setTool(tool) { activeTool = tool; }

function startPosition(e) {
    painting = true;
    ctx.beginPath(); // Start a new path
    draw(e);
}

function finishedPosition() {
    painting = false;
    ctx.beginPath(); // Reset path to prevent connecting strokes
}

function draw(e) {
    if (!painting) return;

    // Set configuration
    ctx.lineWidth = lineWidth.value;
    ctx.lineCap = 'round';

    if (activeTool === 'erase') {
        ctx.globalCompositeOperation = 'destination-out';
    } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = colorPicker.value;
    }

    // Get position relative to canvas
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.moveTo(x, y); // Move pointer to end of stroke
}

function invertColors() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];     // Red
        data[i+1] = 255 - data[i+1]; // Green
        data[i+2] = 255 - data[i+2]; // Blue
        // Alpha (data[i+3]) is left untouched
    }
    ctx.putImageData(imageData, 0, 0);
}

// Event Listeners
canvas.addEventListener('mousedown', startPosition);
canvas.addEventListener('mouseup', finishedPosition);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseleave', finishedPosition); // Stop drawing if mouse leaves canvas

document.getElementById('clearBtn').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

document.getElementById('saveBtn').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'nanas-engine-art.png';
    link.href = canvas.toDataURL();
    link.click();
});
