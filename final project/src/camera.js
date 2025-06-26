// camera.js
import { mat4, vec3 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/+esm';

// this class manages an orbiting camera 
// the camera looks at a target point in the scene from a certain position
// it uses controls to: orbit around, zoom in and out, and reset the camera position
export class Camera {
    constructor(canvas) {
        this.canvas = canvas;

        this.position = vec3.fromValues(6, 6, 6);    // position from which the camera looks at the scene
        this.target = vec3.fromValues(0, 0, 0);      // target point the camera is looking at
        this.up = vec3.fromValues(0, 1, 0);          // Up direction

        this.viewMatrix = mat4.create();
        this.projectionMatrix = mat4.create();

        this.fov = 45 * Math.PI / 180; // field of view for perspective (how wide the camera sees)
        this.near = 0.1;
        this.far = 100.0;

        this.updateViewMatrix();
        this.updateProjectionMatrix(canvas.clientWidth, canvas.clientHeight);
    }

    // update the view matrix used to transform coordinates from world space to camera space
    updateViewMatrix() {
        mat4.lookAt(this.viewMatrix, this.position, this.target, this.up);
    }

    // set the projection matrix
    updateProjectionMatrix(width, height) {
        const aspect = width / height;
        mat4.perspective(this.projectionMatrix, this.fov, aspect, this.near, this.far);
    }

    // rotate the camera around the specified target point 
    // modifying theta (horizontal angle) and phi (vertical angle)
    orbit(dx, dy) {
        const radius = vec3.distance(this.position, this.target);
        const theta = Math.atan2(this.position[2], this.position[0]); 
        const phi = Math.acos(this.position[1] / radius); 

        const newTheta = theta - dx * 0.005;
        const newPhi = Math.max(0.1, Math.min(Math.PI - 0.1, phi - dy * 0.005)); // clamp

        const x = radius * Math.sin(newPhi) * Math.cos(newTheta);
        const y = radius * Math.cos(newPhi);
        const z = radius * Math.sin(newPhi) * Math.sin(newTheta);

        this.position = vec3.fromValues(x, y, z);
        this.updateViewMatrix();
    }

    // moves the camera along the direction between position and target
    // amount is the distance to move, positive to zoom in, negative to zoom out
    zoom(amount) {
        const dir = vec3.create();
        vec3.sub(dir, this.target, this.position);
        vec3.normalize(dir, dir);
        vec3.scaleAndAdd(this.position, this.position, dir, amount);
        this.updateViewMatrix();
        }
    
    // resets the camera to a default position and target
    reset() {
        this.position = vec3.fromValues(6, 6, 6);
        this.target = vec3.fromValues(0, 0, 0);
        this.updateViewMatrix();
    }
}


// system to dynamically visualize the current state of the camera on the UI 
// useful to give feedback to the user about camera interactions
export class CameraStatusManager {
    constructor(app) {
        this.app = app;
        this.statusElement = null;
        this.currentMode = 'Free Look';
        this.isInteracting = false;
        this.interactionTimeout = null;
        
        this.initStatusElement();
        this.bindCameraEvents();
    }

    initStatusElement() {
        // find the status element in the UI with retry
        const findStatusElement = () => {
            const statusItems = document.querySelectorAll('.status-item');
            for (const item of statusItems) {
                if (item.textContent.includes('Camera:')) {
                    this.statusElement = item;
                    console.log('Camera status element found:', this.statusElement);
                    return true;
                }
            }
            return false;
        };

        // Retry system as for FPS
        // in case the status element is not yet available, retry until it is found
        if (!findStatusElement()) {
            console.log('Camera status element not found, retrying...');
            
            let retryCount = 0;
            const maxRetries = 50;
            
            const retryInterval = setInterval(() => {
                retryCount++;
                
                if (findStatusElement()) {
                    clearInterval(retryInterval);
                    console.log(`Camera status element found after ${retryCount} retries`);
                    this.updateStatus(this.currentMode);
                } else if (retryCount >= maxRetries) {
                    clearInterval(retryInterval);
                    console.warn('Camera status element not found after max retries');
                }
            }, 100);
        } else {
            this.updateStatus(this.currentMode);
        }
    }

    // manage all events: mouse, keyboard, touch
    bindCameraEvents() {
        const canvas = this.app.canvas;
        if (!canvas) {
            console.warn('Canvas not available for camera events');
            return;
        }

        // Mouse events
        canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        canvas.addEventListener('wheel', (e) => this.onWheel(e));

        // Keyboard events
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));

        // Touch events per mobile
        canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
        canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
        canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));
    }

    onMouseDown(e) {
        this.isInteracting = true;
        
        if (e.button === 0) { // Left mouse button
            this.setMode('Orbiting');
        } else if (e.button === 2) { // Right mouse button
            this.setMode('Zooming');
        }
    }

    onMouseMove(e) {
        if (this.isInteracting) {
            this.clearInteractionTimeout();
        }
    }

    onMouseUp(e) {
        this.isInteracting = false;
        this.setModeWithTimeout('Free Look', 500);
    }

    onWheel(e) {
        if (e.deltaY > 0) {
            this.setMode('Zoom Out');
        } else {
            this.setMode('Zoom In');
        }
        this.setModeWithTimeout('Free Look', 800);
    }

    onKeyDown(e) {
        const key = e.key.toLowerCase();
        
        // Camera movement keys
        if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
            this.setMode('Manual Control');
        }
        
        // Reset key
        if (key === 'r') {
            this.setMode('Resetting View');
            this.setModeWithTimeout('Free Look', 1000);
        }
        
        // Zoom keys
        if (['+', '=', '-', '_'].includes(key)) {
            if (['+', '='].includes(key)) {
                this.setMode('Zoom In');
            } else {
                this.setMode('Zoom Out');
            }
            this.setModeWithTimeout('Free Look', 500);
        }
    }

    onKeyUp(e) {
        const key = e.key.toLowerCase();
        
        // Stop manual control when movement keys are released
        if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
            this.setModeWithTimeout('Free Look', 300);
        }
    }

    // Touch events per mobile
    onTouchStart(e) {
        this.isInteracting = true;
        
        if (e.touches.length === 1) {
            this.setMode('Touch Orbit');
        } else if (e.touches.length === 2) {
            this.setMode('Pinch Zoom');
        }
    }

    onTouchMove(e) {
        if (this.isInteracting) {
            this.clearInteractionTimeout();
        }
    }

    onTouchEnd(e) {
        this.isInteracting = false;
        this.setModeWithTimeout('Free Look', 500);
    }

    setMode(mode) {
        this.currentMode = mode;
        this.updateStatus(mode);
        console.log(`Camera mode: ${mode}`);
    }

    setModeWithTimeout(mode, delay) {
        this.clearInteractionTimeout();
        
        this.interactionTimeout = setTimeout(() => {
            if (!this.isInteracting) {
                this.setMode(mode);
            }
        }, delay);
    }

    clearInteractionTimeout() {
        if (this.interactionTimeout) {
            clearTimeout(this.interactionTimeout);
            this.interactionTimeout = null;
        }
    }

    updateStatus(mode) {
        if (this.statusElement) {
            this.statusElement.textContent = `Camera: ${mode}`;
        }
    }

    // methods to set specific camera modes
    setFreeLook() {
        this.setMode('Free Look');
    }

    setCustomMode(mode) {
        this.setMode(mode);
    }

    // method to show a camera animation with a description and duration
    showCameraAnimation(description, duration = 1000) {
        this.setMode(description);
        this.setModeWithTimeout('Free Look', duration);
    }
}

// Integration class to manage camera status in the application
export class CameraStatusIntegration {
    constructor(app) {
        this.app = app;
        this.statusManager = null;
    }

    init() {
        // initialize the CameraStatusManager after a short delay
        setTimeout(() => {
            this.statusManager = new CameraStatusManager(this.app);
            
            // make it available globally for the room renderer
            if (window.roomRenderer) {
                window.roomRenderer.cameraStatus = this.statusManager;
            }
        }, 200);
    }

    // Wrapper methods to facilitate camera status updates
    showOrbit() {
        this.statusManager?.setMode('Orbiting');
    }

    showZoom(direction = 'in') {
        const mode = direction === 'in' ? 'Zoom In' : 'Zoom Out';
        this.statusManager?.setMode(mode);
        this.statusManager?.setModeWithTimeout('Free Look', 800);
    }

    showReset() {
        this.statusManager?.showCameraAnimation('Resetting View');
    }

    showFreeLook() {
        this.statusManager?.setFreeLook();
    }
}