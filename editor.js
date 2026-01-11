
console.log('editor.js loading...');

class MapEditor {
    constructor() {
        this.canvas = document.getElementById('editorCanvas');
        this.miniMapCanvas = document.getElementById('miniMapCanvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.miniCtx = this.miniMapCanvas ? this.miniMapCanvas.getContext('2d') : null;

        this.worldWidth = 8000;
        this.worldHeight = 4800;
        this.gridSize = 16;
        this.tileSize = 16;
        this.loadedLevelName = null; // Track if we are editing an existing level

        this.camera = {
            x: 4000,
            y: 4500,
            zoom: 0.5,
            minZoom: 0.05,
            maxZoom: 3.0
        };

        this.elements = this.getEmptyLevel();

        this.currentTool = 'platform';
        this.selectedElement = null;
        this.interaction = {
            type: 'none',
            startX: 0,
            startY: 0,
            origX: 0,
            origY: 0,
            origW: 0,
            origH: 0,
            resizeDir: ''
        };

        this.panState = null;
        this.miniMapPanning = false;
        this.mousePos = { x: 0, y: 0, worldX: 0, worldY: 0 };

        this.platformTiles = [0, 2, 4, 6, 7];
        this.selectedTileIndex = 0;

        this.setupEventListeners();
        this.resize();
        this.render();
    }

    getEmptyLevel() {
        return {
            platforms: [],
            bouncePads: [],
            teleports: [],
            boostTiles: [],
            spawnPoints: [
                { x: 4000, y: 4700 },
                { x: 4100, y: 4700 },
                { x: 3900, y: 4700 },
                { x: 4050, y: 4700 }
            ]
        };
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.resize());

        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // Tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentTool = btn.dataset.tool;
                this.selectedElement = null;
                this.updateProps();
            });
        });

        // Action buttons
        document.getElementById('editor-save-btn').addEventListener('click', () => this.saveLevel());
        document.getElementById('editor-load-btn').addEventListener('click', () => this.showLevelLoader('load'));
        document.getElementById('editor-clear-btn').addEventListener('click', () => this.clearLevel());
        document.getElementById('editor-back-btn').addEventListener('click', () => this.exitEditor());
        document.getElementById('delete-element-btn').addEventListener('click', () => this.deleteSelected());

        // Test button
        const testBtn = document.getElementById('editor-test-btn');
        if (testBtn) testBtn.addEventListener('click', () => this.testGame());

        // Zoom buttons
        document.getElementById('editor-zoom-in').addEventListener('click', () => this.zoom(1.2));
        document.getElementById('editor-zoom-out').addEventListener('click', () => this.zoom(1 / 1.2));

        // Map size inputs
        const widthInput = document.getElementById('map-width-input');
        const heightInput = document.getElementById('map-height-input');
        widthInput.addEventListener('change', (e) => {
            this.worldWidth = parseInt(e.target.value) || 8000;
        });
        heightInput.addEventListener('change', (e) => {
            this.worldHeight = parseInt(e.target.value) || 4800;
        });

        document.getElementById('map-editor-btn').addEventListener('click', () => this.showLevelLoader('editorEntry'));
        document.getElementById('load-custom-level-btn').addEventListener('click', () => this.showLevelLoader('play'));
        document.getElementById('close-level-loader').addEventListener('click', () => {
            document.getElementById('level-loader-modal').classList.remove('active');
        });

        if (this.miniMapCanvas) {
            this.miniMapCanvas.style.pointerEvents = 'auto';
            this.miniMapCanvas.addEventListener('mousedown', (e) => this.handleMiniMapDown(e));
            window.addEventListener('mousemove', (e) => this.handleMiniMapMove(e));
            window.addEventListener('mouseup', () => this.miniMapPanning = false);
        }

        // Save modal listeners
        document.getElementById('close-save-modal').addEventListener('click', () => {
            document.getElementById('save-level-modal').classList.remove('active');
        });
        document.getElementById('confirm-save-btn').addEventListener('click', () => this.confirmSaveLevel());
    }

    enterEditor(data = null, name = null) {
        console.log('Entering Editor...');
        document.getElementById('menu-screen').classList.remove('active');
        const editorScreen = document.getElementById('editor-screen');
        editorScreen.classList.add('active');
        editorScreen.style.display = 'flex';

        if (data) {
            this.loadLevelData(data, false);
            this.loadedLevelName = name;
        } else {
            this.clearLevel(true);
            this.loadedLevelName = null;
        }

        this.selectedElement = null;
        this.updateProps();
        this.resize();
    }

    exitEditor() {
        document.getElementById('editor-screen').classList.remove('active');
        document.getElementById('editor-screen').style.display = 'none';
        document.getElementById('menu-screen').classList.add('active');
    }

    testGame() {
        const tempLevel = {
            name: 'Test Level',
            elements: JSON.parse(JSON.stringify(this.elements)),
            worldWidth: this.worldWidth,
            worldHeight: this.worldHeight
        };

        gameState.selectedCustomLevel = tempLevel;
        if (window.startGame) {
            window.startGame();
        }
    }

    resize() {
        if (!this.canvas) return;
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;

        if (this.miniMapCanvas) {
            this.miniMapCanvas.width = this.miniMapCanvas.clientWidth || 220;
            this.miniMapCanvas.height = this.miniMapCanvas.clientHeight || 120;
        }
    }

    handleMiniMapDown(e) {
        this.miniMapPanning = true;
        this.handleMiniMapMove(e);
    }

    handleMiniMapMove(e) {
        if (!this.miniMapPanning || !this.miniMapCanvas) return;

        const rect = this.miniMapCanvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        const scale = Math.min(this.miniMapCanvas.width / this.worldWidth, this.miniMapCanvas.height / this.worldHeight);
        const offsetX = (this.miniMapCanvas.width - this.worldWidth * scale) / 2;
        const offsetY = (this.miniMapCanvas.height - this.worldHeight * scale) / 2;

        const worldX = (mx - offsetX) / scale;
        const worldY = (my - offsetY) / scale;

        this.camera.x = Math.max(0, Math.min(this.worldWidth, worldX));
        this.camera.y = Math.max(0, Math.min(this.worldHeight, worldY));
    }

    screenToWorld(x, y) {
        return {
            x: (x - this.canvas.width / 2) / this.camera.zoom + this.camera.x,
            y: (y - this.canvas.height / 2) / this.camera.zoom + this.camera.y
        };
    }

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const worldPos = this.screenToWorld(mouseX, mouseY);

        if (e.button === 2) { // Right click - Pan
            this.panState = { x: e.clientX, y: e.clientY, camX: this.camera.x, camY: this.camera.y };
            this.canvas.style.cursor = 'grabbing';
            return;
        }

        const snappedX = Math.round(worldPos.x / this.gridSize) * this.gridSize;
        const snappedY = Math.round(worldPos.y / this.gridSize) * this.gridSize;

        const found = this.findElementAt(worldPos.x, worldPos.y);

        if (found) {
            this.selectedElement = found;
            this.updateProps();

            const side = this.getResizeSide(found.element, worldPos.x, worldPos.y);
            if (side && (found.type === 'platforms' || found.type === 'bouncePads')) {
                this.interaction = {
                    type: 'resizing',
                    resizeDir: side,
                    element: found.element,
                    startX: worldPos.x,
                    startY: worldPos.y,
                    origX: found.element.x,
                    origY: found.element.y,
                    origW: found.element.width,
                    origH: found.element.height
                };
            } else {
                this.interaction = {
                    type: 'moving',
                    element: found.element,
                    startX: worldPos.x,
                    startY: worldPos.y,
                    origX: found.element.x,
                    origY: found.element.y
                };
            }
        } else {
            this.selectedElement = null;
            this.updateProps();

            if (this.currentTool === 'platform' || this.currentTool === 'bounce') {
                const newEl = {
                    x: snappedX,
                    y: snappedY,
                    width: this.gridSize,
                    height: this.gridSize,
                    tileIndex: this.selectedTileIndex
                };
                const cat = this.currentTool === 'platform' ? 'platforms' : 'bouncePads';
                this.elements[cat].push(newEl);
                this.selectedElement = { type: cat, element: newEl, index: this.elements[cat].length - 1 };

                this.interaction = {
                    type: 'creating',
                    element: newEl,
                    startX: snappedX,
                    startY: snappedY
                };
            } else {
                this.placeElement(snappedX, snappedY);
            }
        }
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const worldPos = this.screenToWorld(mouseX, mouseY);

        this.mousePos = { x: mouseX, y: mouseY, worldX: worldPos.x, worldY: worldPos.y };
        const coordInfo = document.getElementById('coord-info');
        if (coordInfo) coordInfo.textContent = `${Math.floor(worldPos.x)}, ${Math.floor(worldPos.y)}`;

        if (this.panState) {
            const dx = (e.clientX - this.panState.x) / this.camera.zoom;
            const dy = (e.clientY - this.panState.y) / this.camera.zoom;
            this.camera.x = this.panState.camX - dx;
            this.camera.y = this.panState.camY - dy;
            this.canvas.style.cursor = 'grabbing';
            return;
        }

        const snappedX = Math.round(worldPos.x / this.gridSize) * this.gridSize;
        const snappedY = Math.round(worldPos.y / this.gridSize) * this.gridSize;

        if (this.interaction.type === 'creating') {
            const el = this.interaction.element;
            const x1 = Math.min(this.interaction.startX, snappedX);
            const y1 = Math.min(this.interaction.startY, snappedY);
            const x2 = Math.max(this.interaction.startX, snappedX);
            const y2 = Math.max(this.interaction.startY, snappedY);
            el.x = x1;
            el.y = y1;
            el.width = Math.max(this.gridSize, x2 - x1);
            el.height = Math.max(this.gridSize, y2 - y1);
        } else if (this.interaction.type === 'moving') {
            const el = this.interaction.element;
            const dx = worldPos.x - this.interaction.startX;
            const dy = worldPos.y - this.interaction.startY;
            el.x = Math.round((this.interaction.origX + dx) / this.gridSize) * this.gridSize;
            el.y = Math.round((this.interaction.origY + dy) / this.gridSize) * this.gridSize;
            this.updateProps();
        } else if (this.interaction.type === 'resizing') {
            const el = this.interaction.element;
            const dir = this.interaction.resizeDir;
            const dx = worldPos.x - this.interaction.startX;
            const dy = worldPos.y - this.interaction.startY;

            if (dir.includes('e')) {
                el.width = Math.max(this.gridSize, Math.round((this.interaction.origW + dx) / this.gridSize) * this.gridSize);
            }
            if (dir.includes('w')) {
                const newW = Math.max(this.gridSize, Math.round((this.interaction.origW - dx) / this.gridSize) * this.gridSize);
                const actualDx = this.interaction.origW - newW;
                el.x = this.interaction.origX + actualDx;
                el.width = newW;
            }
            if (dir.includes('s')) {
                el.height = Math.max(this.gridSize, Math.round((this.interaction.origH + dy) / this.gridSize) * this.gridSize);
            }
            if (dir.includes('n')) {
                const newH = Math.max(this.gridSize, Math.round((this.interaction.origH - dy) / this.gridSize) * this.gridSize);
                const actualDy = this.interaction.origH - newH;
                el.y = this.interaction.origY + actualDy;
                el.height = newH;
            }
            this.updateProps();
        } else {
            const found = this.findElementAt(worldPos.x, worldPos.y);
            if (found) {
                const side = this.getResizeSide(found.element, worldPos.x, worldPos.y);
                if (side && (found.type === 'platforms' || found.type === 'bouncePads')) {
                    this.canvas.style.cursor = side + '-resize';
                } else {
                    this.canvas.style.cursor = 'move';
                }
            } else {
                this.canvas.style.cursor = 'crosshair';
            }
        }
    }

    handleMouseUp() {
        if (this.panState) {
            this.canvas.style.cursor = 'crosshair';
        }
        this.panState = null;
        this.interaction.type = 'none';
        this.updateProps();
    }

    handleWheel(e) {
        if (e.ctrlKey) {
            e.preventDefault();
        }
        const zoomAmount = e.deltaY > 0 ? 0.9 : 1.1;
        this.zoom(zoomAmount);
    }

    zoom(amount) {
        this.camera.zoom *= amount;
        this.camera.zoom = Math.max(this.camera.minZoom, Math.min(this.camera.maxZoom, this.camera.zoom));
        const zoomInfo = document.getElementById('zoom-info');
        if (zoomInfo) zoomInfo.textContent = `${Math.round(this.camera.zoom * 100)}%`;
    }

    getResizeSide(el, mouseX, mouseY) {
        const threshold = 10 / this.camera.zoom;
        let side = '';
        if (Math.abs(mouseY - el.y) < threshold) side += 'n';
        if (Math.abs(mouseY - (el.y + el.height)) < threshold) side += 's';
        if (Math.abs(mouseX - el.x) < threshold) side += 'w';
        if (Math.abs(mouseX - (el.x + el.width)) < threshold) side += 'e';
        return side;
    }

    findElementAt(x, y) {
        for (let i = 0; i < this.elements.spawnPoints.length; i++) {
            const p = this.elements.spawnPoints[i];
            if (x >= p.x - 20 && x <= p.x + 20 && y >= p.y - 20 && y <= p.y + 20) {
                return { type: 'spawnPoints', element: p, index: i };
            }
        }

        const categories = ['boostTiles', 'teleports', 'bouncePads', 'platforms'];
        for (const cat of categories) {
            for (let i = this.elements[cat].length - 1; i >= 0; i--) {
                const el = this.elements[cat][i];
                if (x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height) {
                    return { type: cat, element: el, index: i };
                }
            }
        }
        return null;
    }

    placeElement(x, y) {
        switch (this.currentTool) {
            case 'teleport':
                this.elements.teleports.push({ x, y, width: 40, height: 40, targetX: x + 200, targetY: y - 200 });
                break;
            case 'boost':
                this.elements.boostTiles.push({ x, y, width: 16, height: 16 });
                break;
            case 'spawn':
                this.elements.spawnPoints.push({ x, y });
                if (this.elements.spawnPoints.length > 4) this.elements.spawnPoints.shift();
                break;
        }
        this.updateProps();
    }

    deleteSelected() {
        if (!this.selectedElement) return;
        const { type, index } = this.selectedElement;
        this.elements[type].splice(index, 1);
        this.selectedElement = null;
        this.updateProps();
    }

    updateProps() {
        const container = document.getElementById('prop-controls');
        if (!container) return;
        container.innerHTML = '';

        if (!this.selectedElement) return;

        const el = this.selectedElement.element;
        const type = this.selectedElement.type;

        this.createPropInput(container, 'X', el.x, (val) => el.x = parseInt(val));
        this.createPropInput(container, 'Y', el.y, (val) => el.y = parseInt(val));

        if (type === 'platforms' || type === 'bouncePads') {
            this.createPropInput(container, 'Bredde', el.width, (val) => el.width = parseInt(val));
            this.createPropInput(container, 'Høyde', el.height, (val) => el.height = parseInt(val));
        }

        if (type === 'platforms') {
            const label = document.createElement('label');
            label.textContent = 'Baneutseende:';
            container.appendChild(label);

            const selector = document.createElement('div');
            selector.className = 'tile-selector';

            this.platformTiles.forEach(idx => {
                const opt = document.createElement('div');
                opt.className = 'tile-option' + (el.tileIndex === idx ? ' selected' : '');

                if (typeof worldTileset !== 'undefined' && worldTileset.complete) {
                    const ts = typeof TILE_SIZE !== 'undefined' ? TILE_SIZE : 16;
                    const tilesPerRow = Math.floor(worldTileset.width / ts);
                    const row = Math.floor(idx / tilesPerRow);
                    const col = idx % tilesPerRow;
                    opt.style.backgroundImage = `url("world_tileset.png")`;
                    opt.style.backgroundPosition = `-${col * ts * 2}px -${row * ts * 2}px`;
                    opt.style.backgroundSize = `${worldTileset.width * 2}px ${worldTileset.height * 2}px`;
                    opt.style.imageRendering = 'pixelated';
                } else {
                    opt.style.backgroundColor = '#8B4513';
                }

                opt.onclick = () => {
                    el.tileIndex = idx;
                    this.selectedTileIndex = idx;
                    this.updateProps();
                };
                selector.appendChild(opt);
            });
            container.appendChild(selector);
        }

        if (type === 'teleports') {
            this.createPropInput(container, 'Mål X', el.targetX, (val) => el.targetX = parseInt(val));
            this.createPropInput(container, 'Mål Y', el.targetY, (val) => el.targetY = parseInt(val));
        }
    }

    createPropInput(container, label, value, onChange) {
        const div = document.createElement('div');
        div.className = 'prop-field';
        div.innerHTML = `<label>${label}</label><input type="number" value="${value}">`;
        const input = div.querySelector('input');
        input.addEventListener('change', (e) => {
            onChange(e.target.value);
        });
        container.appendChild(div);
    }

    generatePreview() {
        const previewCanvas = document.createElement('canvas');
        previewCanvas.width = 320;
        previewCanvas.height = 200;
        const pCtx = previewCanvas.getContext('2d');

        pCtx.fillStyle = '#111';
        pCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);

        const scale = Math.min(previewCanvas.width / this.worldWidth, previewCanvas.height / this.worldHeight);
        const offsetX = (previewCanvas.width - this.worldWidth * scale) / 2;
        const offsetY = (previewCanvas.height - this.worldHeight * scale) / 2;

        pCtx.save();
        pCtx.translate(offsetX, offsetY);
        pCtx.scale(scale, scale);

        this.renderElements(pCtx, true);

        pCtx.restore();
        return previewCanvas.toDataURL('image/png');
    }

    saveLevel() {
        if (this.loadedLevelName) {
            // Overwrite existing
            this.confirmSaveLevel(this.loadedLevelName);
        } else {
            // New save
            const modal = document.getElementById('save-level-modal');
            const input = document.getElementById('level-name-input');
            input.value = 'Min bane ' + (Object.keys(JSON.parse(localStorage.getItem('boinkytag_levels') || '{}')).length + 1);
            modal.classList.add('active');
            input.focus();
        }
    }

    confirmSaveLevel(overrideName = null) {
        const nameInput = document.getElementById('level-name-input');
        const name = overrideName || nameInput.value.trim();

        if (!name) {
            alert('Du må gi banen et navn!');
            return;
        }

        const previewData = this.generatePreview();
        const levels = JSON.parse(localStorage.getItem('boinkytag_levels') || '{}');
        levels[name] = {
            name: name,
            elements: JSON.parse(JSON.stringify(this.elements)),
            worldWidth: this.worldWidth,
            worldHeight: this.worldHeight,
            lastModified: Date.now(),
            thumbnail: previewData
        };
        localStorage.setItem('boinkytag_levels', JSON.stringify(levels));
        this.loadedLevelName = name;

        document.getElementById('save-level-modal').classList.remove('active');

        // Visual feedback
        const saveBtn = document.getElementById('editor-save-btn');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = 'Saved!';
        saveBtn.style.background = '#4CAF50';
        setTimeout(() => {
            saveBtn.textContent = originalText;
            saveBtn.style.background = '';
        }, 1500);
    }

    showLevelLoader(mode = 'play') { // 'play', 'load', 'editorEntry'
        const modal = document.getElementById('level-loader-modal');
        const list = document.getElementById('level-list');
        const header = modal.querySelector('h2');

        if (mode === 'editorEntry') header.textContent = 'Mine Baner';
        else if (mode === 'play') header.textContent = 'Velg bane å spille';
        else header.textContent = 'Last inn bane';

        list.innerHTML = '';

        // Add "Create New" button for editor entry
        if (mode === 'editorEntry') {
            const createBtn = document.createElement('button');
            createBtn.className = 'create-new-btn';
            createBtn.innerHTML = '＋ LAG NY BANE';
            createBtn.onclick = () => {
                this.enterEditor();
                modal.classList.remove('active');
            };
            list.appendChild(createBtn);
        }

        const levels = JSON.parse(localStorage.getItem('boinkytag_levels') || '{}');
        const levelNames = Object.keys(levels).sort((a, b) => levels[b].lastModified - levels[a].lastModified);

        if (levelNames.length === 0) {
            const p = document.createElement('p');
            p.style.cssText = 'grid-column: 1/-1; text-align: center; color: #666; margin-top: 20px;';
            p.textContent = mode === 'play' ? 'Ingen baner funnet. Lag en i mapt editor først!' : 'Ingen lagrede baner funnet.';
            list.appendChild(p);
        }

        levelNames.forEach(name => {
            const data = levels[name];
            const item = document.createElement('div');
            item.className = 'level-item';

            const thumb = data.thumbnail || '';

            item.innerHTML = `
                <div class="level-preview" style="background-image: url(${thumb}); background-size: cover;"></div>
                <h4>${name}</h4>
                <div style="display:flex; justify-content: space-between; align-items: center; margin-top: auto;">
                    <span style="font-size: 8px; color: #666;">${new Date(data.lastModified).toLocaleDateString()}</span>
                    <button class="delete-level-btn">X</button>
                </div>
            `;

            item.onclick = (e) => {
                if (e.target.classList.contains('delete-level-btn')) return;

                modal.classList.remove('active');
                if (mode === 'play') {
                    this.loadLevelData(data, true);
                    if (window.startGame) window.startGame();
                } else {
                    this.enterEditor(data, name);
                }
            };

            const delBtn = item.querySelector('.delete-level-btn');
            delBtn.onclick = (e) => {
                e.stopPropagation();
                if (confirm(`Slett "${name}"?`)) {
                    delete levels[name];
                    localStorage.setItem('boinkytag_levels', JSON.stringify(levels));
                    this.showLevelLoader(mode);
                }
            };

            list.appendChild(item);
        });

        modal.classList.add('active');
    }

    loadLevelData(data, isPlayMode) {
        if (isPlayMode) {
            gameState.selectedCustomLevel = JSON.parse(JSON.stringify(data));
            document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('selected'));
            const customBtn = document.getElementById('load-custom-level-btn');
            if (customBtn) customBtn.classList.add('selected');
        } else {
            this.elements = JSON.parse(JSON.stringify(data.elements));
            this.worldWidth = data.worldWidth || 8000;
            this.worldHeight = data.worldHeight || 4800;
            const wIn = document.getElementById('map-width-input');
            const hIn = document.getElementById('map-height-input');
            if (wIn) wIn.value = this.worldWidth;
            if (hIn) hIn.value = this.worldHeight;
            this.selectedElement = null;
            this.updateProps();
        }
    }

    clearLevel(noConfirm = false) {
        if (noConfirm || confirm('Slett alt i denne banen?')) {
            this.elements = this.getEmptyLevel();
            this.loadedLevelName = null;
            this.selectedElement = null;
            this.updateProps();
        }
    }

    render() {
        if (!this.canvas || !this.ctx || !document.getElementById('editor-screen').classList.contains('active')) {
            requestAnimationFrame(() => this.render());
            return;
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
        this.ctx.translate(-this.camera.x, -this.camera.y);

        this.ctx.fillStyle = '#050505';
        this.ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);
        this.ctx.strokeStyle = '#444';
        this.ctx.lineWidth = 4 / this.camera.zoom;
        this.ctx.strokeRect(0, 0, this.worldWidth, this.worldHeight);

        this.ctx.beginPath();
        this.ctx.strokeStyle = '#1a1a1a';
        this.ctx.lineWidth = 1 / this.camera.zoom;
        for (let x = 0; x <= this.worldWidth; x += 100) {
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.worldHeight);
        }
        for (let y = 0; y <= this.worldHeight; y += 100) {
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.worldWidth, y);
        }
        this.ctx.stroke();

        this.renderElements(this.ctx, false);
        this.ctx.restore();

        this.renderMiniMap();
        requestAnimationFrame(() => this.render());
    }

    renderElements(targetCtx, isMiniMap) {
        const hasTileset = typeof worldTileset !== 'undefined' && worldTileset.complete;
        const ts = typeof TILE_SIZE !== 'undefined' ? TILE_SIZE : 16;
        const tilesPerRow = hasTileset ? Math.floor(worldTileset.width / ts) : 1;

        this.elements.platforms.forEach(p => {
            if (!isMiniMap && hasTileset) {
                const row = Math.floor(p.tileIndex / tilesPerRow);
                const col = p.tileIndex % tilesPerRow;
                for (let tx = 0; tx < p.width; tx += ts) {
                    for (let ty = 0; ty < p.height; ty += ts) {
                        const drawW = Math.min(ts, p.width - tx);
                        const drawH = Math.min(ts, p.height - ty);
                        targetCtx.drawImage(worldTileset, col * ts, row * ts, drawW, drawH, p.x + tx, p.y + ty, drawW, drawH);
                    }
                }
            } else {
                targetCtx.fillStyle = '#8B4513';
                targetCtx.fillRect(p.x, p.y, p.width, p.height);
            }
            if (!isMiniMap && p === this.selectedElement?.element) {
                targetCtx.strokeStyle = '#fff';
                targetCtx.lineWidth = 2 / this.camera.zoom;
                targetCtx.strokeRect(p.x, p.y, p.width, p.height);
            }
        });

        this.elements.bouncePads.forEach(p => {
            if (!isMiniMap && hasTileset) {
                const bounceIdx = 133;
                const row = Math.floor(bounceIdx / tilesPerRow);
                const col = bounceIdx % tilesPerRow;
                for (let tx = 0; tx < p.width; tx += ts) {
                    targetCtx.drawImage(worldTileset, col * ts, row * ts, ts, ts, p.x + tx, p.y, ts, p.height);
                }
            } else {
                targetCtx.fillStyle = '#0f0';
                targetCtx.fillRect(p.x, p.y, p.width, p.height);
            }
            if (!isMiniMap && p === this.selectedElement?.element) {
                targetCtx.strokeStyle = '#fff';
                targetCtx.strokeRect(p.x, p.y, p.width, p.height);
            }
        });

        this.elements.boostTiles.forEach(p => {
            if (!isMiniMap && hasTileset) {
                const boostIdx = 87;
                const row = Math.floor(boostIdx / tilesPerRow);
                const col = boostIdx % tilesPerRow;
                targetCtx.drawImage(worldTileset, col * ts, row * ts, ts, ts, p.x, p.y, p.width, p.height);
            } else {
                targetCtx.fillStyle = '#ff0';
                targetCtx.fillRect(p.x, p.y, p.width, p.height);
            }
            if (!isMiniMap && p === this.selectedElement?.element) {
                targetCtx.strokeStyle = '#fff';
                targetCtx.strokeRect(p.x, p.y, p.width, p.height);
            }
        });

        this.elements.teleports.forEach(p => {
            targetCtx.fillStyle = '#f0f';
            targetCtx.globalAlpha = isMiniMap ? 1 : 0.6;
            targetCtx.fillRect(p.x, p.y, p.width, p.height);
            targetCtx.globalAlpha = 1;

            if (!isMiniMap) {
                targetCtx.beginPath();
                targetCtx.strokeStyle = 'rgba(255,0,255,0.3)';
                targetCtx.moveTo(p.x + p.width / 2, p.y + p.height / 2);
                targetCtx.lineTo(p.targetX, p.targetY);
                targetCtx.stroke();
                targetCtx.fillRect(p.targetX - 5, p.targetY - 5, 10, 10);

                targetCtx.fillStyle = '#fff';
                targetCtx.font = '20px Arial';
                targetCtx.textAlign = 'center';
                targetCtx.fillText('⚡', p.x + p.width / 2, p.y + p.height / 2 + 7);
            }

            if (!isMiniMap && p === this.selectedElement?.element) {
                targetCtx.strokeStyle = '#fff';
                targetCtx.strokeRect(p.x, p.y, p.width, p.height);
            }
        });

        this.elements.spawnPoints.forEach((p, i) => {
            const colors = ['#f44', '#44f', '#4f4', '#f4f'];
            if (isMiniMap) {
                targetCtx.fillStyle = colors[i % colors.length];
                targetCtx.fillRect(p.x - 50, p.y - 50, 100, 100);
            } else {
                let spriteD = null;
                if (i === 0 && typeof piggySprites !== 'undefined' && piggySprites.length > 0) spriteD = piggySprites[0];
                else if (i === 1 && typeof goldenPiggySprites !== 'undefined' && goldenPiggySprites.length > 0) spriteD = goldenPiggySprites[0];

                if (spriteD && spriteD.image && spriteD.image.complete) {
                    targetCtx.save();
                    const drawX = p.x - 20;
                    const drawY = p.y - 20;
                    targetCtx.drawImage(spriteD.image, drawX, drawY, 40, 40);
                    if (p === this.selectedElement?.element) {
                        targetCtx.strokeStyle = '#fff';
                        targetCtx.lineWidth = 2;
                        targetCtx.strokeRect(drawX, drawY, 40, 40);
                    }
                    targetCtx.restore();
                } else {
                    targetCtx.beginPath();
                    targetCtx.arc(p.x, p.y, 20, 0, Math.PI * 2);
                    targetCtx.fillStyle = colors[i % colors.length];
                    targetCtx.fill();
                    targetCtx.strokeStyle = p === this.selectedElement?.element ? '#fff' : '#000';
                    targetCtx.lineWidth = 2;
                    targetCtx.stroke();
                }

                targetCtx.fillStyle = '#fff';
                targetCtx.font = 'bold 15px Arial';
                targetCtx.textAlign = 'center';
                targetCtx.shadowColor = 'black';
                targetCtx.shadowBlur = 4;
                targetCtx.fillText(`P${i + 1}`, p.x, p.y - 25);
                targetCtx.shadowBlur = 0;
            }
        });
    }

    renderMiniMap() {
        if (!this.miniCtx) return;
        const mc = this.miniMapCanvas;
        this.miniCtx.clearRect(0, 0, mc.width, mc.height);

        const scale = Math.min(mc.width / this.worldWidth, mc.height / this.worldHeight);
        const offsetX = (mc.width - this.worldWidth * scale) / 2;
        const offsetY = (mc.height - this.worldHeight * scale) / 2;

        this.miniCtx.save();
        this.miniCtx.translate(offsetX, offsetY);
        this.miniCtx.scale(scale, scale);

        this.miniCtx.fillStyle = '#111';
        this.miniCtx.fillRect(0, 0, this.worldWidth, this.worldHeight);

        this.renderElements(this.miniCtx, true);

        const viewW = this.canvas.width / this.camera.zoom;
        const viewH = this.canvas.height / this.camera.zoom;
        const viewX = this.camera.x - viewW / 2;
        const viewY = this.camera.y - viewH / 2;

        this.miniCtx.strokeStyle = '#fff';
        this.miniCtx.lineWidth = 2 / scale;
        this.miniCtx.globalAlpha = 0.8;
        this.miniCtx.strokeRect(viewX, viewY, viewW, viewH);

        this.miniCtx.restore();
    }
}

window.editor = new MapEditor();
