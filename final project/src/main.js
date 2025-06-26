// main.js
// This file initializes the RoomRenderer, sets up the WebGL context, and manages the rendering loop and input handling.

import { WebGLRenderer } from './renderer.js';
import { SceneManager } from './scene.js';
import { Camera } from './camera.js';
import { UIManager } from './ui.js';
import { InputManager } from './input.js';

export class RoomRenderer {
    constructor() {
        this.canvas = document.getElementById('glCanvas');
        this.gl = this.canvas.getContext('webgl2') || this.canvas.getContext('webgl');

        if (!this.gl) {
            throw new Error('WebGL not supported in this browser');
        }

        // to evaluate FPS and delta time in the rendering loop
        this.lastFrameTime = 0;
        this.fps = 0;

        // Core modules
        this.renderer = new WebGLRenderer(this.gl); // draws the scene
        this.scene = new SceneManager(this.gl, this.renderer); // manages the scene, objects, and lights
        this.camera = new Camera(this.canvas); // manages the view and its modalities
        this.requestRender = () => {
            this.renderer.render(this.scene, this.camera);
        };
        this.ui = new UIManager(this); // interactive controls
        this.input = new InputManager(this.canvas, this.camera); // controls through mouse, keyboard, ...

        // when the window is resized, the canvas is resized too and the camera projection matrix is updated
        this._resizeCanvas();
        window.addEventListener('resize', () => this._resizeCanvas());
    }

    async init() {
        // initialize objects of the scene and the UI
        await this.scene.init();
        await this.ui.init();

        // select an object with a click
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // pick the object at the clicked position
            const selected = this.scene.pickObject(x, y, this.camera);
            if (selected) {
                this.selectedObject = selected;
                console.log("Selected Object:", selected.name || 'unnamed');
            } else {
                this.selectedObject = null;
            }
        });
        // start the rendering loop
        this._startRenderingLoop();
    }

    // Update canvas dimension and camera projection matrix
    // to avoid stretching and to keep the aspect ratio
    _resizeCanvas() {
        const displayWidth = this.canvas.clientWidth;
        const displayHeight = this.canvas.clientHeight;

        if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
            this.canvas.width = displayWidth;
            this.canvas.height = displayHeight;
            this.gl.viewport(0, 0, displayWidth, displayHeight);
            this.camera.updateProjectionMatrix(displayWidth, displayHeight);
        }
    }

    // Each frame:
    // - evaluates deltaTime (time since last frame)
    // - updates input and scene
    // - renders the scene
    // - requests the next frame
    _startRenderingLoop() {
        const render = (time) => {
            const deltaTime = (time - this.lastFrameTime) * 0.001;
            this.lastFrameTime = time;

            this.fps = 1 / deltaTime;

            this.input.update(deltaTime);
            this.scene.update(deltaTime);
            this.scene.selectedObject = this.selectedObject;
            this.renderer.render(this.scene, this.camera);

            requestAnimationFrame(render);
        };

        requestAnimationFrame(render);
    }
}
