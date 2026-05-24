<script>
    const canvas = document.getElementById('paintCanvas');
    const ctx = canvas.getContext('2d');
    
    // Engine State
    let layers = [];
    let activeLayer = null;
    let currentTool = 'brush';
    let isDrawing = false;

    // --- Core Canvas Logic ---
    canvas.addEventListener('mousedown', e => { isDrawing = true; draw(e); });
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', () => { isDrawing = false; activeLayer.ctx.beginPath(); });

    function draw(e) {
        if (!isDrawing || !activeLayer) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const c = activeLayer.ctx;
        c.lineWidth = 5;
        c.lineCap = 'round';
        c.strokeStyle = (currentTool === 'eraser') ? '#ffffff' : '#000000';
        
        c.lineTo(x, y);
        c.stroke();
        c.beginPath();
        c.moveTo(x, y);
        render(); // Always update master viewport
    }

    // --- Layer Management ---
    function createLayer(name = "Layer") {
        const c = document.createElement('canvas');
        c.width = canvas.width;
        c.height = canvas.height;
        const layer = { 
            id: Date.now(), 
            name, 
            canvas: c, 
            ctx: c.getContext('2d'), 
            visible: true 
        };
        layers.push(layer);
        activeLayer = layer;
        updateUI();
        render();
    }

    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        layers.forEach(l => { if (l.visible) ctx.drawImage(l.canvas, 0, 0); });
    }

    function updateUI() {
        const container = document.getElementById('layersContainer');
        container.innerHTML = '';
        [...layers].reverse().forEach(l => {
            const div = document.createElement('div');
            div.className = `layer-item ${activeLayer.id === l.id ? 'active' : ''}`;
            div.innerHTML = `
                <span onclick="activeLayer = layers.find(x => x.id === ${l.id}); updateUI();">${l.name}</span>
                <button onclick="renameLayer(${l.id})">✏️</button>
            `;
            container.appendChild(div);
        });
    }

    function renameLayer(id) {
        const layer = layers.find(l => l.id === id);
        const newName = prompt("Rename layer:", layer.name);
        if (newName) { layer.name = newName; updateUI(); }
    }

    // --- NNS File Protocol ---
    function saveProject() {
        const data = {
            signature: "NANAS_V3",
            layers: layers.map(l => ({ name: l.name, data: l.canvas.toDataURL() }))
        };
        const blob = new Blob([JSON.stringify(data)], {type: 'application/json'});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = "project.nns";
        a.click();
    }

    async function loadProject(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
            const json = JSON.parse(ev.target.result);
            layers = [];
            for (const l of json.layers) {
                const img = new Image();
                img.src = l.data;
                await img.decode();
                createLayer(l.name);
                activeLayer.ctx.drawImage(img, 0, 0);
            }
            render();
        };
        reader.readAsText(file);
    }

    // Init
    createLayer("Background");
</script>
