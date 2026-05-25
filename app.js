// script.js

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const colorPicker = document.getElementById("colorPicker");
const brushSize = document.getElementById("brushSize");
const clearBtn = document.getElementById("clearBtn");
const saveBtn = document.getElementById("saveBtn");

resizeCanvas();

window.addEventListener("resize", resizeCanvas);

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight - 70;
}

let drawing = false;

canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mouseup", stopDraw);
canvas.addEventListener("mousemove", draw);

canvas.addEventListener("touchstart", startTouch);
canvas.addEventListener("touchend", stopDraw);
canvas.addEventListener("touchmove", touchDraw);

function startDraw(e) {
  drawing = true;
  draw(e);
}

function stopDraw() {
  drawing = false;
  ctx.beginPath();
}

function draw(e) {
  if (!drawing) return;

  ctx.lineWidth = brushSize.value;
  ctx.lineCap = "round";
  ctx.strokeStyle = colorPicker.value;

  ctx.lineTo(e.clientX, e.clientY - 70);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(e.clientX, e.clientY - 70);
}

function startTouch(e){
  drawing = true;
}

function touchDraw(e){
  e.preventDefault();

  if(!drawing) return;

  const touch = e.touches[0];

  ctx.lineWidth = brushSize.value;
  ctx.lineCap = "round";
  ctx.strokeStyle = colorPicker.value;

  ctx.lineTo(touch.clientX, touch.clientY - 70);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(touch.clientX, touch.clientY - 70);
}

clearBtn.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

saveBtn.addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "nanas-engine-art.png";
  link.href = canvas.toDataURL();
  link.click();
});
