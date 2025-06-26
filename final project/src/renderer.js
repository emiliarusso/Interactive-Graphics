// renderer.js
import { createShaderProgram } from './utils.js';
import { mat4 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/+esm';

export class WebGLRenderer {
    constructor(gl) {
        this.gl = gl;
        this.programs = {};
        this._initGLSettings();
        this.lastFpsUpdate = performance.now();
        this.frameCount = 0;
        
        // FPS element - initialization
        this.fpsElement = null;
        this.initFpsElement();
    }

    // Initialize FPS element with retry logic 
    // This method will try to find the FPS element in the DOM and log debug information
    // If the element is not found, it will retry every 100ms for a maximum of 5 seconds
    // If the element is found, it will log the number of retries and update the FPS
    initFpsElement() {
        const findFpsElement = () => {
            this.fpsElement = document.getElementById('fps-counter');
            if (this.fpsElement) {
                console.log('FPS element found:', this.fpsElement);
                return true;
            }
            return false;
        };

        // Try 
        if (!findFpsElement()) {
            console.log('FPS element not found, retrying...');

            // Retry every 100ms for max 5 seconds
            let retryCount = 0;
            const maxRetries = 50;
            
            const retryInterval = setInterval(() => {
                retryCount++;
                
                if (findFpsElement()) {
                    clearInterval(retryInterval);
                    console.log(`FPS element found after ${retryCount} retries`);
                } else if (retryCount >= maxRetries) {
                    clearInterval(retryInterval);
                    console.warn('FPS element not found after max retries');
                }
            }, 100);
        }
    }

    // initialize WebGL settings
    _initGLSettings() {
        const gl = this.gl;
        gl.enable(gl.DEPTH_TEST); // closer objects hide farther ones
        gl.enable(gl.CULL_FACE); // no render of back faces
        gl.clearColor(0.1, 0.1, 0.1, 1.0); // dark gray background
    }

    // Register a shader program with the given name
    registerProgram(name, vertexSrc, fragmentSrc) {
        const program = createShaderProgram(this.gl, vertexSrc, fragmentSrc);
        if (!program) {
            throw new Error(`Failed to create shader program: ${name}`);
        }
        this.programs[name] = program;
    }

    // render function: it's the main method that renders the scene
    // It iterates through all objects in the scene, sets up the shaders, matrices, and attributes,
    // and draws each object. It also handles visibility checks, lighting, textures, and outlines
    render(scene, camera) {
        const gl = this.gl;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height); // drawing area to full canvas size
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        for (const object of scene.objects) {
            // Visibility check: skip rendering if the object is not visible
            if (object.visible === false) {
                continue;
            }

            const program = this.programs[object.program];
            if (!program) continue;

            gl.useProgram(program);

            // Define matrices
            const uView = gl.getUniformLocation(program, 'uViewMatrix');
            const uProj = gl.getUniformLocation(program, 'uProjectionMatrix');
            const uModel = gl.getUniformLocation(program, 'uModelMatrix');
            gl.uniformMatrix4fv(uView, false, camera.viewMatrix);
            gl.uniformMatrix4fv(uProj, false, camera.projectionMatrix);
            gl.uniformMatrix4fv(uModel, false, object.modelMatrix);

            // Normal matrix definition (NormalMatrix = inverseTranspose(model))
            const normalMatrix = mat4.create();
            if (mat4.invert(normalMatrix, object.modelMatrix)) {
                mat4.transpose(normalMatrix, normalMatrix);
            } else {
                mat4.identity(normalMatrix); // fallback if not invertible
            }
            const uNormalMatrix = gl.getUniformLocation(program, 'uNormalMatrix');
            gl.uniformMatrix4fv(uNormalMatrix, false, normalMatrix);

            // Color
            // if the object has a color, use it; otherwise, use a default gray
            const uColor = gl.getUniformLocation(program, 'uColor');
            gl.uniform3fv(uColor, object.color || [0.6, 0.6, 0.6]);

            // Texture handling
            // If the object uses a texture, bind it; otherwise, disable texture usage (None)
            const uUseTexture = gl.getUniformLocation(program, 'uUseTexture');
            gl.uniform1i(uUseTexture, object.useTexture ? 1 : 0);
            if (object.useTexture && object.texture) {
                const uSampler = gl.getUniformLocation(program, 'uSampler');
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, object.texture);
                gl.uniform1i(uSampler, 0); // index of the texture unit
            }
            else {
                gl.bindTexture(gl.TEXTURE_2D, null);  // disable current texture if not needed
            }

            // Lighting: use values from the scene
            gl.uniform3fv(gl.getUniformLocation(program, 'uAmbientLight'), scene.ambientLight);
            gl.uniform3fv(gl.getUniformLocation(program, 'uLightColor'), scene.lightColor);
            gl.uniform3fv(gl.getUniformLocation(program, 'uLightDirection'), scene.lightDirection);
            gl.uniform3fv(gl.getUniformLocation(program, 'uPointLightPos'), scene.pointLightPos);
            gl.uniform1i(gl.getUniformLocation(program, 'uUseDirectional'), scene.useDirectional ? 1 : 0);
            gl.uniform1i(gl.getUniformLocation(program, 'uUsePoint'), scene.usePoint ? 1 : 0);
            gl.uniform1f(gl.getUniformLocation(program, 'uShininess'), scene.shininess);    

            // Blend for transparent objects
            // blend = src * srcAlpha + dst * (1 - srcAlpha)
            if (object.transparent) {
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            } else {
                gl.disable(gl.BLEND);
            }

            // Buffers: bind the vertex, texture coordinate, and normal buffers if they exist
            // it's important because they are defined in the shader
            if (object.vertexBuffer) {
                const aPosition = gl.getAttribLocation(program, 'aPosition');
                gl.bindBuffer(gl.ARRAY_BUFFER, object.vertexBuffer);
                gl.enableVertexAttribArray(aPosition);
                gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
            }

            if (object.texCoordBuffer) {
                const aTexCoord = gl.getAttribLocation(program, 'aTexCoord');
                gl.bindBuffer(gl.ARRAY_BUFFER, object.texCoordBuffer);
                gl.enableVertexAttribArray(aTexCoord);
                gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);
            }

            if (object.normalBuffer) {
                const aNormal = gl.getAttribLocation(program, 'aNormal');
                gl.bindBuffer(gl.ARRAY_BUFFER, object.normalBuffer);
                gl.enableVertexAttribArray(aNormal);
                gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
            }

            gl.drawArrays(gl.TRIANGLES, 0, object.vertexCount);
        }


        // Grid (if enabled)
        if (scene.gridEnabled && scene.grid) {
            const grid = scene.grid;
            const program = this.programs['grid'];
            if (!program) {
                console.warn("Shader 'grid' not found.");
            } else {
                gl.useProgram(program);

                // Matrices
                const uModelView = gl.getUniformLocation(program, 'uModelViewMatrix');
                const uProjection = gl.getUniformLocation(program, 'uProjectionMatrix');
                const modelView = mat4.create();
                mat4.multiply(modelView, camera.viewMatrix, grid.modelMatrix);

                gl.uniformMatrix4fv(uModelView, false, modelView);
                gl.uniformMatrix4fv(uProjection, false, camera.projectionMatrix);

                // Color
                const uColor = gl.getUniformLocation(program, 'uColor');
                gl.uniform3fv(uColor, grid.color || [0.3, 0.3, 0.3]);

                // Attributes
                const aPosition = gl.getAttribLocation(program, 'aPosition');
                gl.bindBuffer(gl.ARRAY_BUFFER, grid.vertexBuffer);
                gl.enableVertexAttribArray(aPosition);
                gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);

                gl.drawArrays(gl.LINES, 0, grid.vertexCount); // draw objects using triangle gemoetry
            }
        }

        // Outline for the selected object
        // If an object is selected, it's made a little bit bigger and rendered with a bright color
        // This is useful for highlighting the selected object in order to move it or edit its properties
        if (scene.selectedObject) {
            const object = scene.selectedObject;
            const program = this.programs[object.program];
            if (!program) return;

            gl.useProgram(program);

            // slightly scale the model matrix for the outline effect
            const outlineMatrix = mat4.clone(object.modelMatrix);
            mat4.scale(outlineMatrix, outlineMatrix, [1.03, 1.03, 1.03]);

            // Uniforms base
            const uModel = gl.getUniformLocation(program, 'uModelMatrix');
            const uView = gl.getUniformLocation(program, 'uViewMatrix');
            const uProj = gl.getUniformLocation(program, 'uProjectionMatrix');
            const uNormalMatrix = gl.getUniformLocation(program, 'uNormalMatrix');

            gl.uniformMatrix4fv(uModel, false, outlineMatrix);
            gl.uniformMatrix4fv(uView, false, camera.viewMatrix);
            gl.uniformMatrix4fv(uProj, false, camera.projectionMatrix);

            const normalMatrix = mat4.create();
            if (mat4.invert(normalMatrix, outlineMatrix)) {
                mat4.transpose(normalMatrix, normalMatrix);
            } else {
                mat4.identity(normalMatrix);
            }
            gl.uniformMatrix4fv(uNormalMatrix, false, normalMatrix);

            // set up the outline color
            const uColor = gl.getUniformLocation(program, 'uColor');
            gl.uniform3fv(uColor, [1.0, 1.0, 0.0]);

            // Disable texture for the outline
            gl.uniform1i(gl.getUniformLocation(program, 'uUseTexture'), 0);

            // Buffers
            if (object.vertexBuffer) {
                const aPosition = gl.getAttribLocation(program, 'aPosition');
                gl.bindBuffer(gl.ARRAY_BUFFER, object.vertexBuffer);
                gl.enableVertexAttribArray(aPosition);
                gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
            }
            if (object.normalBuffer) {
                const aNormal = gl.getAttribLocation(program, 'aNormal');
                gl.bindBuffer(gl.ARRAY_BUFFER, object.normalBuffer);
                gl.enableVertexAttribArray(aNormal);
                gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
            }

            // Draw the outline in wireframe 
            gl.enable(gl.POLYGON_OFFSET_FILL);
            gl.polygonOffset(1, 1); // push the object back to avoid z-fighting
            gl.drawArrays(gl.TRIANGLES, 0, object.vertexCount);
            gl.disable(gl.POLYGON_OFFSET_FILL);
        }

        // FPS calculation and update
        this.updateFPS();
    }

    // update FPS: this method is called every frame to calculate and update the FPS counter
    // It checks if the FPS element exists, updates its text content, and logs debug information
    updateFPS() {
        const now = performance.now();
        this.frameCount++;

        if (now - this.lastFpsUpdate >= 1000) { // if more than 1 second has passed
            const fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
            
            // Debug FPS calculation
            console.log(`FPS: ${fps} (frames: ${this.frameCount}, time: ${(now - this.lastFpsUpdate).toFixed(2)}ms)`);

            // Retry finding the element if it doesn't exist
            if (!this.fpsElement) {
                this.fpsElement = document.getElementById('fps-counter');
                if (this.fpsElement) {
                    console.log('FPS element found on retry');
                }
            }
            
            if (this.fpsElement) {
                const newText = `FPS: ${fps}`;
                this.fpsElement.textContent = newText;
                console.log(`FPS updated: ${newText}`);
            } else {
                console.warn('FPS element still not found. Available elements with "fps" in ID:');

                // Debug: show all elements with "fps" in the ID
                const allElements = document.querySelectorAll('[id*="fps"]');
                allElements.forEach((el, index) => {
                    console.log(`  ${index}: #${el.id} - "${el.textContent}"`);
                });

                // Debug: show all elements with class "status-item"
                const statusItems = document.querySelectorAll('.status-item');
                console.log('Status items found:');
                statusItems.forEach((el, index) => {
                    console.log(`  ${index}: #${el.id || 'no-id'} - "${el.textContent}"`);
                });
            }
            
            this.lastFpsUpdate = now;
            this.frameCount = 0;
        }
    }

    // DEBUG: Force update FPS for testing purposes
    // This method is used to manually test the FPS counter by updating it with a fixed text
    forceUpdateFPS() {
        this.fpsElement = document.getElementById('fps-counter');
        if (this.fpsElement) {
            this.fpsElement.textContent = 'FPS: MANUAL TEST';
            console.log('Manual FPS test successful');
            return true;
        } else {
            console.warn('Manual FPS test failed - element not found');
            return false;
        }
    }

    // Method to count visible/invisible objects
    getVisibilityStats(scene) {
        let visible = 0;
        let invisible = 0;
        
        for (const obj of scene.objects) {
            if (obj.visible === false) {
                invisible++;
            } else {
                visible++;
            }
        }
        
        return { visible, invisible, total: visible + invisible };
    }
}