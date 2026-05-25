const canvas = document.getElementById('paintCanvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const lineWidth = document.getElementById('lineWidth');
let painting = false;
let activeTool = 'brush';

function startPosition(e) { painting = true; draw(e); }
function finishedPosition() { painting = false; ctx.beginPath(); }

function draw(e) {
    if (!painting) return;
    
    ctx.lineWidth = lineWidth.value;
    ctx.lineCap = 'round';

    if (activeTool === 'erase') {
        ctx.globalCompositeOperation = 'destination-out';
    } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = colorPicker.value;
    }

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
}

function invertColors() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];     // R
        data[i+1] = 255 - data[i+1]; // G
        data[i+2] = 255 - data[i+2]; // B
    }
    ctx.putImageData(imageData, 0, 0);
}

canvas.addEventListener('mousedown', startPosition);
canvas.addEventListener('mouseup', finishedPosition);
canvas.addEventListener('mousemove', draw);

document.getElementById('clearBtn').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

document.getElementById('saveBtn').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'nanas-engine-art.png';
    link.href = canvas.toDataURL();
    link.click();
});
