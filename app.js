<script>
    const canvas = document.getElementById('paintCanvas');
    const ctx = canvas.getContext('2d');
    let layers = [];
    let activeLayer = null;

    // --- CORE LAYER SYSTEM ---
    function createLayer(name = "New Layer") {
        const c = document.createElement('canvas');
        c.width = canvas.width;
        c.height = canvas.height;
        const newLayer = { 
            id: 'layer_' + Date.now(), 
            name: name, 
            canvas: c, 
            ctx: c.getContext('2d'), 
            visible: true 
        };
        layers.push(newLayer);
        activeLayer = newLayer;
        updateUI();
        draw();
    }

    function requestNewLayerCreation() {
        const name = prompt("Enter Name for Layer:");
        if (name) createLayer(name);
    }

    function renameLayer(id) {
        const layer = layers.find(l => l.id === id);
        const newName = prompt("Rename layer:", layer.name);
        if (newName) {
            layer.name = newName;
            updateUI();
        }
    }

    function updateUI() {
        const container = document.getElementById('layersContainer');
        container.innerHTML = '';
        [...layers].reverse().forEach(l => {
            const div = document.createElement('div');
            div.className = `layer-item ${activeLayer.id === l.id ? 'active' : ''}`;
            div.innerHTML = `
                <span onclick="activeLayer = layers.find(x => x.id === '${l.id}'); updateUI();">${l.name}</span>
                <button onclick="renameLayer('${l.id}')">✏️</button>
            `;
            container.appendChild(div);
        });
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        layers.forEach(l => { if (l.visible) ctx.drawImage(l.canvas, 0, 0); });
    }

    // --- NNS FILE PROTOCOL ---
    function saveProject() {
        const projectData = {
            signature: "NANAS_ENGINE_V3",
            timestamp: Date.now(),
            layers: layers.map(l => ({
                name: l.name,
                data: l.canvas.toDataURL() // Encodes layer pixel data
            }))
        };
        const blob = new Blob([JSON.stringify(projectData)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "workspace.nns";
        a.click();
    }

    async function loadProject(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            const json = JSON.parse(e.target.result);
            if (json.signature !== "NANAS_ENGINE_V3") {
                alert("File format incompatible.");
                return;
            }
            layers = [];
            for (const l of json.layers) {
                const img = new Image();
                img.src = l.data;
                await img.decode();
                createLayer(l.name);
                activeLayer.ctx.drawImage(img, 0, 0);
            }
            draw();
        };
        reader.readAsText(file);
    }

    // Initialize
    createLayer("Background");
</script>
