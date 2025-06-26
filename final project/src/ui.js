// ui.js 
// This class manages the UI components of the application, including panels, controls, and event handlers.
// It integrates controls of the scene, objects, lighting, camera status and virtual assistant
import { mat4 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/+esm';
import { ObjectFactory, loadTexture } from './objects.js';
import { CameraStatusIntegration } from './camera.js';
import { VirtualAssistant } from './virtual_assistant.js';

export class UIManager {
    // Constructor initializes the UI manager with the application instance
    constructor(app) {
        this.app = app; 
        this.container = document.getElementById('container');
        this.cameraStatusIntegration = new CameraStatusIntegration(app);
        this.assistant = new VirtualAssistant(app); // initialize virtual assistant AUDREY
    }

    // initialize UI panels, import system and virtual assistant
    async init() { 
        this._createPanels();
        this._initImportModal();
        this._bindEventHandlers
        this.cameraStatusIntegration.init();
        this.assistant.startProactiveTips();
    }

    // Method to export current scene as JSON file
    exportScene() {
        const sceneData = this.app.scene.export();
        const blob = new Blob([JSON.stringify(sceneData, null, 2)], { type: 'application/json' }); // BLOB = binary large object
        const url = URL.createObjectURL(blob); 

        const a = document.createElement('a');
        a.href = url;
        a.download = 'scene.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    // Add GUI panels and the relatives controls
    _createPanels() {
        const left = document.createElement('div');
        left.className = 'gui-panel left-panel';
        left.innerHTML = `
            <div class="gui-section">
                <h3>📏 Scene Settings</h3>
                <fieldset class="gui-subgroup">
                    <legend>Floor</legend>
                    <div class="gui-control">
                        <label for="floor-color">Color</label>
                        <input type="color" id="floor-color" value="#999999">
                    </div>
                    <div class="gui-control">
                        <label for="floor-texture">Texture</label>
                        <select id="floor-texture">
                            <option value="">None</option>
                            <option value="./textures/cermaic.jpg">Ceramic-Like</option>
                            <option value="./textures/concrete floor.jpg">Concrete</option>
                            <option value="./textures/marmo.jpg">Marble</option>
                            <option value="./textures/samless_parquet.jpg">Parquet</option>
                        </select>
                    </div>
                </fieldset>

                <fieldset class="gui-subgroup">
                    <legend>Walls</legend>
                    <div class="gui-control">
                        <label for="wall-color">Color</label>
                        <input type="color" id="wall-color" value="#cccccc">
                    </div>
                    <div class="gui-control">
                        <label for="wall-texture">Wallpaper</label>
                        <select id="wall-texture">
                            <option value="">None</option>
                            <option value="./textures/beige.jpg">Beige</option>
                            <option value="./textures/circles.jpg">Circles</option>
                            <option value="./textures/flowers.jpg">Flowers</option>
                            <option value="./textures/geometric.jpg">Geometric</option>
                        </select>
                    </div>
                </fieldset>

                <fieldset class="gui-subgroup">
                    <legend>Grid & Scene</legend>
                    
                    <div class="gui-control">
                        <label for="grid-toggle">Show Grid</label>
                        <input type="checkbox" id="grid-toggle" checked>
                    </div>
                    
                    <div class="gui-control horizontal">
                        <button class="gui-button small-button" id="btn-export-scene" style="flex: 1; padding: 4px 8px; font-size: 11px;">
                            Export Scene
                        </button>
                        <button class="gui-button small-button" id="btn-import-scene" style="flex: 1; padding: 4px 8px; font-size: 11px;">
                            Import Scene
                        </button>
                    </div>
                    <div class="gui-control horizontal">
                        <button class="gui-button small-button" id="btn-open-door" style="flex: 1; padding: 4px 8px; font-size: 11px;">
                            Open Door
                        </button>
                        <button class="gui-button small-button" id="btn-close-door" style="flex: 1; padding: 4px 8px; font-size: 11px;">
                            Close Door
                        </button>
                    </div>
                </fieldset>

            </div>
            <div class="gui-section">
                <h3>➕ Add Furniture</h3>
                <div class="furniture-grid">
                    <button class="gui-button" id="add-chair">Office Chair</button>
                    <button class="gui-button" id="add-table">Table</button>
                    <button class="gui-button" id="add-bed">Bed</button>
                    <button class="gui-button" id="add-sofa">Sofa</button>
                    <button class="gui-button" id="add-wardrobe">Wardrobe</button>
                    <button class="gui-button" id="add-decorations">Decorations</button>
                </div>
            </div>
        `;

        const right = document.createElement('div');
        right.className = 'gui-panel right-panel';
        right.innerHTML = `
            <div class="gui-section">
                <h3>💡 Lighting</h3>
                <div class="gui-control">
                    <label for="ambient-light">Ambient Intensity</label>
                    <input type="range" id="ambient-light" min="0" max="1" step="0.01" value="0.4">
                </div>
                <div class="gui-control">
                    <label for="shininess-slider">Shininess</label>
                    <input type="range" id="shininess-slider" min="1" max="128" value="32">
                </div>
                <div class="gui-control">
                    <label for="directional-toggle">Directional Light</label>
                    <input type="checkbox" id="directional-toggle" checked>
                </div>
                <div class="gui-control">
                    <label for="point-toggle">Point Light</label>
                    <input type="checkbox" id="point-toggle" checked>
                </div>
                <fieldset class="gui-subgroup">
                    <legend>Point Light Position</legend>
                    <div class="xyz-container">
                        <div class="gui-control">
                            <label for="light-pos-x">X</label>
                            <input type="range" id="light-pos-x" min="-10" max="10" step="0.1" value="2">
                        </div>
                        <div class="gui-control">
                            <label for="light-pos-y">Y</label>
                            <input type="range" id="light-pos-y" min="0" max="10" step="0.1" value="2">
                        </div>
                        <div class="gui-control">
                            <label for="light-pos-z">Z</label>
                            <input type="range" id="light-pos-z" min="-10" max="10" step="0.1" value="2">
                        </div>
                    </div>
                </fieldset>
                <div class="gui-control">
                    <label for="light-color">Point/Directional Light Color</label>
                    <input type="color" id="light-color" value="#ffffff">
                </div>
            </div>

            <div class="gui-section">
                <h3>🎨 Object Handling</h3>
                <div class="gui-control">
                    <label for="material-color">Choose Color</label>
                    <input type="color" id="material-color" value="#cccccc">
                </div>
                <div class="gui-control">
                    <label for="texture-select">Add Texture</label>
                    <select id="texture-select">
                        <option value="">None</option>
                        <option value="./textures/wood.jpeg">Wood</option>
                        <option value="./textures/metal.jpeg">Metal</option>
                        <option value="./textures/fabric.jpeg">Fabric</option>
                    </select>
                </div>
                <div class="transform-help">
                    <strong>Move</strong><br>
                    J/L: left/right (along X)<br>
                    U/O: up/down (along Y)<br>
                    I/K: forward/back (along Z)<br>
                    <br>
                    <strong>Rotate</strong><br>
                    Z/X: around X<br>
                    Q/E: around Y<br>
                    N/M: around Z
                </div>
                <div class="gui-control">
                    <button class="gui-button danger small-button" id="btn-remove-object" style="width:200px; height:30px; padding:4px 6px; font-size:14px; margin-top:20px;">
                        🗑️ Remove Object
                    </button>
                </div>
            </div>
        `;

        const bottom = document.createElement('div');
        bottom.className = 'gui-panel bottom-panel';
        bottom.innerHTML = `
            <div class="status-bar">
                <div class="status-item"><span class="status-dot"></span> Rendering</div>
                <div class="status-item" id="camera-status">Camera: Free Look</div>
                <div class="status-item" id="fps-counter">FPS: 0</div>
                <div class="status-item">
                    <button class="help-inline-button" title="Show controls help">❓</button>
                </div>
            </div>
        `;

        // append panels to the container in order to maintain the layout
        this.container.appendChild(left);
        this.container.appendChild(right);
        this.container.appendChild(bottom);

        // Add AUDREY button to the status bar in order to interact with the virtual asisstant
        const ariaBtn = document.createElement('button');
        ariaBtn.id = 'assistant-inline-button';
        ariaBtn.innerHTML = '🤖 Ask to Audrey';
        ariaBtn.style.marginLeft = '10px';
        ariaBtn.style.padding = '4px 10px';
        ariaBtn.style.fontSize = '12px';
        ariaBtn.style.backgroundColor = '#4a9eff';
        ariaBtn.style.color = 'white';
        ariaBtn.style.border = 'none';
        ariaBtn.style.borderRadius = '12px';
        ariaBtn.style.cursor = 'pointer';

        ariaBtn.onclick = () => {
            this.assistant.toggleAssistant(true);
        };

        const statusBar = bottom.querySelector('.status-bar');
        if (statusBar) statusBar.appendChild(ariaBtn);

        this._bindEventHandlers();
    }

    // Bind event handlers for UI controls 
    _bindEventHandlers() {

        // Import/Export handlers
        document.getElementById('btn-import-scene').onclick = () => {
            document.getElementById('import-modal').style.display = 'block';
        };

        document.getElementById('btn-export-scene').onclick = () => {
            this.exportScene();
        };

        document.querySelector('.help-inline-button')?.addEventListener('click', () => {
            document.getElementById('controls-help-modal').style.display = 'block';
        });

        // Close controls window via X or button
        document.getElementById('close-controls-help')?.addEventListener('click', () => {
            document.getElementById('controls-help-modal').style.display = 'none';
        });
        document.getElementById('btn-close-controls-help')?.addEventListener('click', () => {
            document.getElementById('controls-help-modal').style.display = 'none';
        });

        // button to open the door (in order to start the animation)
        document.getElementById('btn-open-door').onclick = () => {
            const door = this.app.scene.objects.find(o => o.name === 'door');
            if (door) {
                door.isOpening = true;
                door.isClosing = false;
                console.log('Door opening started');
            }
        };

        // button to close the door and end the animation
        document.getElementById('btn-close-door').onclick = () => {
            const door = this.app.scene.objects.find(o => o.name === 'door');
            if (door) {
                door.isClosing = true;
                door.isOpening = false;
                console.log('Door closing started');
            }
        };

        // Bind add furniture buttons
        const gl = this.app.gl;
        const scene = this.app.scene;
        
        import('./objects.js').then(module => {
            const factory = new module.ObjectFactory(gl);

            // Furniture creation handlers

            // adding chair 
            document.getElementById('add-chair').onclick = async () => {
                console.log("Adding chair: loading started");
                try {
                    const chair = await factory.loadObj(
                        './objects/office-chair/office_chair.obj',
                        [0, 1, 0],
                        1.5,
                        [1.0, 1.0, 1.0],
                        './objects/office-chair/chair_normal.png'
                    );
                    scene.objects.push(chair);
                    console.log("Chair loaded:", chair);
                } catch (err) {
                    console.error("Error loading chair:", err);
                }
            };
            
            // adding sofa
            document.getElementById('add-sofa').onclick = async () => {
                console.log("Adding sofa: loading started");
                try {
                    const sofa = await factory.loadObj(
                        './objects/sofa/S01 M02.obj',
                        [0, 1, 0],
                        2.5,
                        [1.0, 1.0, 1.0],
                        './objects/sofa/sofa.png.png'
                    );
                    scene.objects.push(sofa);
                    console.log("Sofa loaded:", sofa);
                } catch (err) {
                    console.error("Error loading sofa:", err);
                }
            };

            // adding table
            document.getElementById('add-table').onclick = async () => {
                console.log("Adding table: loading started");
                try {
                    const table = await factory.loadObj(
                        './objects/desk/Computer Desk.obj',
                        [0, 1, 0],
                        2.0,
                        [1.0, 1.0, 1.0]
                    );
                    scene.objects.push(table);
                    console.log("Table loaded:", table);
                } catch (err) {
                    console.error("Error loading table:", err);
                }
            };

            // adding bed
            document.getElementById('add-bed').onclick = async () => {
                console.log("Adding bed: loading started");
                try {
                    const bed = await factory.loadObj(
                        './objects/bed/Bed_01.obj',
                        [0, 1, 0],
                        3.0,
                        [1.0, 1.0, 1.0],
                        './objects/bed/Cube.005_Bake1_cyclesbake_COMBINED.png'
                    );
                    scene.objects.push(bed);
                    console.log("Bed loaded:", bed);
                } catch (err) {
                    console.error("Error loading bed:", err);
                }
            };

            // adding wardrobe
            document.getElementById('add-wardrobe').onclick = async () => {
                console.log("Adding wardrobe: loading started");
                try {
                    const wardrobe = await factory.loadObj(
                        './objects/wardrobe/Wardrobe.obj',
                        [0, 1, 0],
                        3.0,
                        [1.0, 1.0, 1.0]
                    );
                    scene.objects.push(wardrobe);
                    console.log("Wardrobe loaded:", wardrobe);
                } catch (err) {
                    console.error("Error loading wardrobe:", err);
                }
            };

            // adding decorations
            document.getElementById('add-decorations').onclick = async () => {
                console.log("Adding decorations: loading started");
                try {
                    const decoration = await factory.loadObj(
                        './objects/decorations/decorations.obj',
                        [0, 1, 0],
                        2.0,
                        [1.0, 1.0, 1.0],
                        './objects/decorations/decorations.png'
                    );
                    scene.objects.push(decoration);
                    console.log("Decoration loaded:", decoration);
                } catch (err) {
                    console.error("Error loading decoration:", err);
                }
            };

            // Material controls
            document.getElementById('material-color').oninput = (e) => {
                const hex = e.target.value;
                if (this.app.selectedObject) {
                    this.app.selectedObject.color = this.hexToRGBArray(hex);
                    this.app.requestRender?.();
                }
            };

            // texture handling
            document.getElementById('texture-select').onchange = (e) => {
                if (this.app.selectedObject) {
                    const path = e.target.value;
                    if (path) {
                        this.app.selectedObject.texture = loadTexture(this.app.gl, path);
                        this.app.selectedObject.useTexture = true;
                    } else {
                        this.app.selectedObject.useTexture = false;
                    }
                    this.app.requestRender?.();
                }
            };

            // remove object button -> it's possible to remove the selected object
            document.getElementById('btn-remove-object').onclick = () => {
                const selected = this.app.selectedObject;
                if (selected) {
                    const index = scene.objects.indexOf(selected);
                    if (index !== -1) {
                        scene.objects.splice(index, 1);
                        this.app.selectedObject = null;
                        console.log("Object removed");
                        this.app.requestRender?.();
                    }
                } else {
                    console.warn("No object selected to remove");
                }
            };

            // Lighting controls
            document.getElementById('ambient-light').oninput = (e) => {
                const val = parseFloat(e.target.value);
                this.app.scene.ambientLight = [val, val, val];
                this.app.requestRender?.();
            };

            const shininessSlider = document.getElementById('shininess-slider');

            // notice -> slider is disabled if directional and point lights are disabled
            const updateShininessAvailability = () => {
                const directional = document.getElementById('directional-toggle').checked;
                const point = document.getElementById('point-toggle').checked;
                shininessSlider.disabled = !(directional || point);
            };

            // toggle to enable/disable directional light
            document.getElementById('directional-toggle').onchange = (e) => {
                this.app.scene.useDirectional = e.target.checked;
                updateShininessAvailability();
                this.app.requestRender?.();
            };

            // toggle to enable/disable point light
            document.getElementById('point-toggle').onchange = (e) => {
                const enabled = e.target.checked;
                ["x", "y", "z"].forEach(axis => {
                    document.getElementById(`light-pos-${axis}`).disabled = !enabled;
                });
                this.app.scene.usePoint = enabled;
                updateShininessAvailability();
                this.app.requestRender?.();
            };

            // Update shininess based on slider input
            document.getElementById('shininess-slider').oninput = (e) => {
                const inverted = 129 - parseFloat(e.target.value); // 129 - val, if range [1,128]
                this.app.scene.shininess = inverted;
                this.app.requestRender?.();
            };

            // change color light 
            document.getElementById('light-color').oninput = (e) => {
                const hex = e.target.value;
                const rgb = this.hexToRGBArray(hex);
                this.app.scene.lightColor = rgb;
                this.app.requestRender?.();
            };

            // change position on point light around the 3 defined axis
            document.getElementById('light-pos-x').oninput = (e) => {
                this.app.scene.pointLightPos[0] = parseFloat(e.target.value);
                this.app.requestRender?.();
            };
            document.getElementById('light-pos-y').oninput = (e) => {
                this.app.scene.pointLightPos[1] = parseFloat(e.target.value);
                this.app.requestRender?.();
            };
            document.getElementById('light-pos-z').oninput = (e) => {
                this.app.scene.pointLightPos[2] = parseFloat(e.target.value);
                this.app.requestRender?.();
            };

            // Scene controls
            document.getElementById('grid-toggle').onchange = (e) => {
                this.app.scene.gridEnabled = e.target.checked;
                this.app.requestRender?.();
            };

            // Floor and wall controls (colors and textures)
            document.getElementById('floor-color').oninput = (e) => {
                const hex = e.target.value;
                this.app.scene.floor.color = this.hexToRGBArray(hex);
                this.app.requestRender?.();
            };
            document.getElementById('floor-texture').onchange = (e) => {
                const val = e.target.value;
                const floor = this.app.scene.floor;
                if (val) {
                    floor.texture = loadTexture(this.app.gl, val);
                    floor.useTexture = true;
                } else {
                    floor.useTexture = false;
                }
                this.app.requestRender?.();
            };
            document.getElementById('wall-color').oninput = (e) => {
                const hex = e.target.value;
                const rgb = this.hexToRGBArray(hex);

                this.app.scene.objects.forEach(obj => {
                    if (obj.name && obj.name.startsWith('wall')) {
                        obj.color = rgb;
                    }
                });

                this.app.requestRender?.();
            };
            document.getElementById('wall-texture').onchange = (e) => {
                const val = e.target.value;
                this.app.scene.objects.forEach(obj => {
                    if (obj.name && obj.name.startsWith('wall')) {
                        if (val) {
                            obj.texture = loadTexture(this.app.gl, val);
                            obj.useTexture = true;
                        } else {
                            obj.useTexture = false;
                        }
                    }
                });
                this.app.requestRender?.();
            };

        });

        // Initialize slider values
        const pos = this.app.scene.pointLightPos;
        document.getElementById('light-pos-x').value = pos[0];
        document.getElementById('light-pos-y').value = pos[1];
        document.getElementById('light-pos-z').value = pos[2];
    }
    
    // utility function to convert hex color to RGB array
    hexToRGBArray(hex) {
        const r = parseInt(hex.substr(1, 2), 16) / 255;
        const g = parseInt(hex.substr(3, 2), 16) / 255;
        const b = parseInt(hex.substr(5, 2), 16) / 255;
        return [r, g, b];
    }

    // Load scene from JSON data
    // notice: once loaded you're able to edit the scene
    async _loadSceneFromData(data) {
        const gl = this.app.gl;
        const scene = this.app.scene;
        const factory = new ObjectFactory(gl);

        // Remove all objects except floor, walls, lights, and helpers
        scene.objects = scene.objects.filter(obj =>
            obj.name === 'floor' || 
            obj.name.startsWith('wall') || 
            obj.name === 'pointLightHelper' || 
            obj.name === 'grid' ||
            obj.name === 'door' ||
            obj.name === 'window' ||
            obj.name === 'directionalHelper'
        );

        for (const entry of data) {
            if (entry.name === 'floor') {
            // Floor
            scene.floor.color = entry.color || [0.8, 0.8, 0.6];
            scene.floor.useTexture = !!entry.texturePath;
            if (entry.texturePath) {
                scene.floor.texture = loadTexture(gl, entry.texturePath);
            }
            } else if (entry.name.startsWith('wall')) {
            // Walls
            const wall = scene.objects.find(o => o.name === entry.name);
            if (wall) {
                wall.color = entry.color || wall.color;
                wall.useTexture = !!entry.texturePath;
                if (entry.texturePath) {
                wall.texture = loadTexture(gl, entry.texturePath);
                }
            }
            } else if (entry.modelPath) {
            // Mobile Objects -> load with correct position and rotation
            try {
                const obj = await factory.loadObj(
                entry.modelPath,
                [0, 0, 0], // default position if no one is provided
                entry.scale || 1,
                entry.color || [1.0, 1.0, 1.0],
                entry.texturePath || null
                );

                obj.name = entry.name;
                obj.modelPath = entry.modelPath;
                obj.initialScale = entry.scale;

                // apply saved position and rotation
                if (entry.position) {
                // Reset matrix and apply saved position
                mat4.identity(obj.modelMatrix);
                mat4.translate(obj.modelMatrix, obj.modelMatrix, entry.position);

                // Apply rotation if saved
                if (entry.rotation) {
                    mat4.rotateX(obj.modelMatrix, obj.modelMatrix, entry.rotation[0]);
                    mat4.rotateY(obj.modelMatrix, obj.modelMatrix, entry.rotation[1]);
                    mat4.rotateZ(obj.modelMatrix, obj.modelMatrix, entry.rotation[2]);
                }

                // Update obj.position for consistency
                obj.position = [...entry.position]; // copy position to maintain immutability
                }

                scene.objects.push(obj);
                console.log(`Object "${entry.name}" loaded at position:`, entry.position);
            } catch (err) {
                console.error(`Error loading object "${entry.name}": ${err.message}`);
            }
            } else {
            console.warn(`Object "${entry.name}" ignored (no modelPath)`);
            }
        }

        this.app.requestRender?.();
        console.log('Scene imported with correct positions');
        }

    // Initialize the import modal for scene loading
    // It allows users to import a scene from a JSON file or drag-and-drop and implements keyboard controls 
    _initImportModal() {
        const modal = document.getElementById('import-modal');
        const closeBtn = document.getElementById('close-import');
        const cancelBtn = document.getElementById('btn-cancel-import');
        const confirmBtn = document.getElementById('btn-confirm-import');

        closeBtn.onclick = cancelBtn.onclick = () => {
            modal.style.display = 'none';
        };

        confirmBtn.onclick = () => {
            const fileInput = document.getElementById('scene-file-input');
            const file = fileInput.files[0];
            if (!file) return alert("No file selected.");

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    await this._loadSceneFromData(data);
                    modal.style.display = 'none';
                } catch (err) {
                    alert("Failed to load scene: " + err.message);
                }
            };
            reader.readAsText(file);
        };

        const dropArea = document.getElementById('drag-drop-area');
        dropArea.onclick = () => {
            const input = document.getElementById('scene-file-input');
            input.click();
            input.onchange = () => {
                if (input.files.length > 0) {
                    dropArea.textContent = `📄 ${input.files[0].name} ready to import`;
                }
            };
        };

        dropArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropArea.classList.add('drag-over');
        });

        dropArea.addEventListener('dragleave', () => {
            dropArea.classList.remove('drag-over');
        });

        dropArea.addEventListener('drop', (e) => {
            e.preventDefault();
            dropArea.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                document.getElementById('scene-file-input').files = e.dataTransfer.files;
                dropArea.textContent = `📄 ${file.name} ready to import`;
            }
        });

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            const selected = this.app.selectedObject;
            const scene = this.app.scene;
            const move = 0.1;
            const rot = Math.PI / 36;
            
            // commands to move selected object
            if (selected) {
                const m = selected.modelMatrix;

                // Translations
                if (e.key === 'i') mat4.translate(m, m, [0, 0, -move]);
                if (e.key === 'k') mat4.translate(m, m, [0, 0, move]);
                if (e.key === 'j') mat4.translate(m, m, [-move, 0, 0]);
                if (e.key === 'l') mat4.translate(m, m, [move, 0, 0]);
                if (e.key === 'u') mat4.translate(m, m, [0, move, 0]);
                if (e.key === 'o') mat4.translate(m, m, [0, -move, 0]);

                // Rotations
                if (e.key === 'q') mat4.rotateY(m, m, -rot);
                if (e.key === 'e') mat4.rotateY(m, m, rot);
                if (e.key === 'z') mat4.rotateX(m, m, -rot);
                if (e.key === 'x') mat4.rotateX(m, m, rot);
                if (e.key === 'n') mat4.rotateZ(m, m, -rot);
                if (e.key === 'm') mat4.rotateZ(m, m, rot);
            }

            // commands to move point light position
            const light = scene.pointLightPos;
            switch (e.key) {
                case 't': light[1] += move; break; // up
                case 'g': light[1] -= move; break; // down
                case 'f': light[0] -= move; break; // left
                case 'h': light[0] += move; break; // right
                case 'r': light[2] -= move; break; // forward
                case 'y': light[2] += move; break; // backward
            }

            this.app.requestRender?.(); 
        });
    }

    // Manually test FPS
    // FPS = frames per second, it is a measure of how many frames are rendered in one second
    // This method forces the renderer to update the FPS counter
    testFPS() {
        return this.app.renderer?.forceUpdateFPS?.() || false;
    }

    // Method to test camera status modes
    // 4 Modes: Orbit, Zoom, Manual, Free Look
    testCameraStatus() {
        const status = this.cameraStatusIntegration.statusManager;
        if (status) {
            console.log('Testing camera status modes...');
            
            // Test sequence
            setTimeout(() => status.setMode('Test Orbit'), 500);
            setTimeout(() => status.setMode('Test Zoom'), 1500);
            setTimeout(() => status.setMode('Test Manual'), 2500);
            setTimeout(() => status.setMode('Free Look'), 3500);
            
            console.log('Camera status test completed');
            return true;
        } else {
            console.warn('Camera status not available');
            return false;
        }
    }

    // Quick methods for camera modes
    showCameraOrbit() { this.cameraStatusIntegration.showOrbit(); }
    showCameraZoom(dir) { this.cameraStatusIntegration.showZoom(dir); }
    showCameraReset() { this.cameraStatusIntegration.showReset(); }
    showCameraFreeLook() { this.cameraStatusIntegration.showFreeLook(); }
}