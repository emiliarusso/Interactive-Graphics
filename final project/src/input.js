// input.js
// This file manages mouse and keyboard to control the camera in the app

export class InputManager {
    constructor(canvas, camera) {
        this.canvas = canvas; // WebGL canvas on which the camera operates
        this.camera = camera; // manages camera state and transformations
        this.isDragging = false;
        this.lastX = 0;
        this.lastY = 0;

        this.keyState = {};

        // Events mouse and keyboard
        canvas.addEventListener('mousedown', this._onMouseDown.bind(this));
        canvas.addEventListener('mouseup', this._onMouseUp.bind(this));
        canvas.addEventListener('mousemove', this._onMouseMove.bind(this));
        canvas.addEventListener('mouseleave', this._onMouseUp.bind(this));
        canvas.addEventListener('wheel', this._onWheel.bind(this), { passive: true });
        window.addEventListener('keydown', (e) => this.keyState[e.key.toLowerCase()] = true);
        window.addEventListener('keyup', (e) => this.keyState[e.key.toLowerCase()] = false);
    }

    _onMouseDown(e) {
        if (e.button === 0) {
            this.isDragging = true;
            this.lastX = e.clientX;
            this.lastY = e.clientY;
        }
    }

    _onMouseUp(e) {
        this.isDragging = false;
    }

    // evaluate how much the mouse has moved since the last event
    // and apply that to the camera's orbit
    _onMouseMove(e) {
        if (!this.isDragging) return;
        const dx = e.clientX - this.lastX;
        const dy = e.clientY - this.lastY;
        this.lastX = e.clientX;
        this.lastY = e.clientY;
        this.camera.orbit(dx, dy);
    }

    // zoom in and out according to the mouse wheel movement
    _onWheel(e) {
        this.camera.zoom(e.deltaY * 0.01);
    }

    // keyboard controls for camera movement
    update(deltaTime) {
        const speed = 0.05;
        if (this.keyState['arrowleft']) this.camera.orbit(5, 0); 
        if (this.keyState['arrowright']) this.camera.orbit(-5, 0);
        if (this.keyState['arrowup']) this.camera.orbit(0, 5);
        if (this.keyState['arrowdown']) this.camera.orbit(0, -5);
        if (this.keyState['-'] || this.keyState['=']) this.camera.zoom(-0.2); // zoom out
        if (this.keyState['+'] || this.keyState['_']) this.camera.zoom(0.2);  // zoom in
        if (this.keyState['r']) this.camera.reset(); // reset camera position
    }
}
