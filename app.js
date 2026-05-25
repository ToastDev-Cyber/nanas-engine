const canvas = document.getElementById('paintCanvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const lineWidth = document.getElementById('lineWidth');
const clearBtn = document.getElementById('clearBtn');
const saveBtn = document.getElementById('saveBtn');

let painting = false;

function startPosition(e) { painting = true; draw(e); }
function finishedPosition() { painting = false; ctx.beginPath(); }

function draw(e) {
    if (!painting) return;
    ctx.lineWidth = lineWidth.value;
    ctx.lineCap = 'round';
    ctx.strokeStyle = colorPicker.value;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
}

canvas.addEventListener('mousedown', startPosition);
canvas.addEventListener('mouseup', finishedPosition);
canvas.addEventListener('mousemove', draw);

clearBtn.addEventListener('click', () => ctx.clearRect(0, 0, canvas.width, canvas.height));

saveBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'nanas-art.png';
    link.href = canvas.toDataURL();
    link.click();
});
