// scene.js 
// This file contains manages the 3D scene, including objects, lights, and textures.
// It is responsible for initializing the scene, creating objects, and updating their states.

import { mat4, vec4, vec3 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/+esm';

export class SceneManager {
  // initialize the scene manager and define the properties
  constructor(gl, renderer) {
    this.gl = gl;
    this.renderer = renderer;
    this.objects = [];
    this.ambientLight = [0.3, 0.3, 0.3];
    this.lightColor = [1.0, 1.0, 1.0];
    this.lightDirection = [1.0, -1.0, 0.0]; 
    this.pointLightPos = [0.0, 2.0, 2.0];
    this.shininess = 32.0;
    this.useDirectional = true; // directional light
    this.usePoint = true; // point light
    this.gridEnabled = true;
    this.windowTexture = null;
    this.shutterTexture = null;
    this.skyTexture = null;
  }

  async init() {
    // register the shader programs
    this.renderer.registerProgram('basic', basicVertexShader, basicFragmentShader,  ['aPosition', 'aTexCoord', 'aNormal'], 
      [
        'uModelMatrix', 'uViewMatrix', 'uProjectionMatrix',
        'uNormalMatrix',
        'uColor', 'uUseTexture', 'uSampler',
        'uAmbientLight', 'uLightColor', 'uLightDirection', 'uPointLightPos',
        'uUseDirectional', 'uUsePoint', 'uShininess'
      ]);

    this.renderer.registerProgram('grid', gridVertexShader, gridFragmentShader);

    // load the textures for the window and shutters
    try {
      // texture of the sky for the window opened
      this.skyTexture = await this.createSkyTexture();
      console.log('Sky texture created');

      // texture of the shutters for the window closed
      this.shutterTexture = await this.createShutterTexture();
      console.log('Shutter texture created');
    } catch (error) {
      console.warn('Failed to load window textures:', error);
    }

    // create the 3D objects (the scene elements)
    this._createFloor();
    this._createWalls();
    this._createDoor();
    this._createDirectionalHelper(); 
    this._createLightHelper();
    this.createGrid();
  }

  // create a procedural texture for the sky
  async createSkyTexture() {
    const gl = this.gl;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');  // Sky blue
    gradient.addColorStop(0.3, '#98D8E8'); // Lighter blue
    gradient.addColorStop(0.7, '#B0E0E6'); // Powder blue
    gradient.addColorStop(1, '#F0F8FF');   // Alice blue

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw some clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.drawCloud(ctx, 80, 150, 60);
    this.drawCloud(ctx, 280, 180, 45);
    this.drawCloud(ctx, 150, 250, 35);
    this.drawCloud(ctx, 350, 220, 40);

    // draw the sun (above) on the right
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(450, 400, 35, 0, Math.PI * 2);
    ctx.fill();

    // sun rays (above all)
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)';
    ctx.lineWidth = 4;
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI * 2) / 12;
      ctx.beginPath();
      ctx.moveTo(450 + Math.cos(angle) * 45, 400 + Math.sin(angle) * 45);
      ctx.lineTo(450 + Math.cos(angle) * 70, 400 + Math.sin(angle) * 70);
      ctx.stroke();
    }

    return this.canvasToTexture(canvas);
  }

  // create a texture for the shutters to use when the window is closed
  async createShutterTexture() {
    const gl = this.gl;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // dark background
    ctx.fillStyle = '#2C1810';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // slats 
    const slats = 16;
    const slatHeight = canvas.height / slats;
    
    for (let i = 0; i < slats; i++) { // for each slat 
      const y = i * slatHeight;

      // main slat
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(0, y, canvas.width, slatHeight - 2);

      // shadow of the slat
      ctx.fillStyle = '#654321';
      ctx.fillRect(0, y + slatHeight - 6, canvas.width, 4);

      // Highlight of the slat
      ctx.fillStyle = '#A0522D';
      ctx.fillRect(0, y, canvas.width, 2);
    }

    // add wood texture (not to be changed, always this for now)
    for (let i = 0; i < 200; i++) {
      ctx.fillStyle = `rgba(${100 + Math.random() * 50}, ${30 + Math.random() * 20}, ${10 + Math.random() * 10}, 0.3)`;
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, Math.random() * 20);
    }

    return this.canvasToTexture(canvas);
  }

  // draw a cloud on the canvas
  // x,y = center of the cloud, size = radius of the cloud
  drawCloud(ctx, x, y, size) {
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.arc(x + size * 0.6, y, size * 0.8, 0, Math.PI * 2);
    ctx.arc(x - size * 0.6, y, size * 0.8, 0, Math.PI * 2);
    ctx.arc(x, y - size * 0.6, size * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // convert a canvas to a WebGL texture
  // this is used to create the textures for the sky and shutters
  canvasToTexture(canvas) {
    const gl = this.gl;
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    
    // texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    return texture;
  }

  // create a grid for the floor in order to be precise when organizing furniture (lines in XZ plane)
  createGrid(size = 10, step = 1) {
    const lines = [];
    
    for (let i = -size; i <= size; i += step) {
        lines.push(-size, 0.01, i,  size, 0.01, i); // X
        lines.push(i, 0.01, -size, i, 0.01, size); // Z
        // Y = 0.01
    }

    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(lines), this.gl.STATIC_DRAW);

    this.grid = {
      name: 'grid',
      vertexBuffer: buffer,
      vertexCount: lines.length / 3,
      modelMatrix: mat4.create(),
      program: 'grid',
      color: [0.3, 0.3, 0.3], // Gray 
      selectable: false, 
      isGrid: true
    };
  }

  update(deltaTime) {
    for (const obj of this.objects) {
      // update the model matrix for each object when the point light moves
      if (obj.name === 'pointLightHelper') {
          mat4.identity(obj.modelMatrix);
          mat4.translate(obj.modelMatrix, obj.modelMatrix, this.pointLightPos);
      }
      
      // handle directional light 
      if (obj.name === 'window') {
        this.updateWindow(obj);
      }

      // handle door animation
      if (obj.name === 'door') {
        // opening
        if (obj.isOpening && obj.openAngle < Math.PI / 2) {
            obj.openAngle += deltaTime * 1.0;
            if (obj.openAngle >= Math.PI / 2) {
                obj.openAngle = Math.PI / 2;
                obj.isOpening = false;
                obj.isOpen = true;
            }
        } 
        // closing
        else if (obj.isClosing && obj.openAngle > 0) {
            obj.openAngle -= deltaTime * 1.0;
            if (obj.openAngle <= 0) {
                obj.openAngle = 0;
                obj.isClosing = false;
                obj.isOpen = false;
            }
        }

        // Apply transformations to the door
        mat4.identity(obj.modelMatrix);
        mat4.translate(obj.modelMatrix, obj.modelMatrix, obj.position);
        mat4.translate(obj.modelMatrix, obj.modelMatrix, [0.4, 0, 0]); // Pivot point
        mat4.rotateY(obj.modelMatrix, obj.modelMatrix, -obj.openAngle);
        mat4.translate(obj.modelMatrix, obj.modelMatrix, [-0.4, 0, 0]);

      }
    }
  }

  // update the window texture based on the state of the directional light
  updateWindow(windowObj) {
    if (this.useDirectional) {
      // opened window -> shows sky texture
      windowObj.texture = this.skyTexture;
      windowObj.color = [1.0, 1.0, 1.0]; // White to show the texture
      windowObj.useTexture = true;
    } else {
      // Closed window - shows shutters
      windowObj.texture = this.shutterTexture;
      windowObj.color = [0.8, 0.6, 0.4]; // Slightly brown
      windowObj.useTexture = true;
    }
  }

  // utility function to create the floor
  _createFloor() {
    const gl = this.gl;

    // Create a simple floor with a grid pattern
    const positions = new Float32Array([
      -5, 0, -5,  5, 0, 5,  5, 0,  -5,
      -5, 0, -5,  -5, 0,  5,  5, 0,  5
    ]);

    // Texture coordinates for the floor
    // Using a simple grid pattern on the floor
    const texCoords = new Float32Array([
      0, 0, 1, 0, 1, 1,
      0, 0, 1, 1, 0, 1
    ]);

    // Normals for the floor (upward facing)
    // All normals point up since the floor is flat
    const normals = new Float32Array([
      0, 1, 0,  0, 1, 0,  0, 1, 0,
      0, 1, 0,  0, 1, 0,  0, 1, 0
    ]);

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);

    this.floor = {
      name: 'floor',
      vertexBuffer,
      texCoordBuffer,
      normalBuffer,
      vertexCount: 6,
      modelMatrix: mat4.create(),
      program: 'basic',
      color: [0.8, 0.8, 0.6],
      selectable: false,
      useTexture: false, // it's possibile to add a texture to the floor or change its color 
      texture: null
    };

    this.objects.push(this.floor);
  }

  // create the walls of the scene (in order to place also window and door)
  _createWalls() {
    const gl = this.gl;

    const colors = [
        [0.8, 0.8, 0.6], // back
        [0.8, 0.8, 0.6], // front
        [0.8, 0.8, 0.6], // left
        [0.8, 0.8, 0.6], // right
    ];

    const walls = [
        [-5, 0, -5, 5, 3, -5], // bottom left and top right corners
        [5, 0, 5, -5, 3, 5],
        [-5, 0, 5, -5, 3, -5],
        [5, 0, -5, 5, 3, 5]
    ];

    walls.forEach((coords, i) => {
      if (i === 2) {
        const color = colors[i];

        // parts of the wall with a window
        this._addWallSegment(-5, 0.0, 5.0, -5, 0.8, -5.0, color);  // Down
        this._addWallSegment(-5, 2.2, 5.0, -5, 3.0, -5.0, color);  // Up
        this._addWallSegment(-5, 0.8, 5.0, -5, 2.2, 2.0, color);   // Left
        this._addWallSegment(-5, 0.8, -1.0, -5, 2.2, -5.0, color); // Right

        // Create the window segment with dynamic texture system -> this creates a window that can be opened and closed
        console.log('Creating window system');
        this._addWindowSegment(-5, 0.8, 2.0, -5, 2.2, -1.0);

      } else {
        // Altre pareti normali (senza finestra)
        const [x1, y1, z1, x2, y2, z2] = coords;

        const positions = new Float32Array([
          x1, y1, z1,  x2, y1, z2,  x2, y2, z2,
          x1, y1, z1,  x2, y2, z2,  x1, y2, z1
        ]);

        const texCoords = new Float32Array([
          0, 0, 1, 0, 1, 1,
          0, 0, 1, 1, 0, 1
        ]);

        const p1 = [x1, y1, z1];
        const p2 = [x2, y1, z2];
        const p3 = [x2, y2, z2];

        // due lati del triangolo (p2 - p1) e (p3 - p1)
        const u = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
        const v = [p3[0] - p1[0], p3[1] - p1[1], p3[2] - p1[2]];

        // prodotto vettoriale u x v
        const normal = [
          u[1] * v[2] - u[2] * v[1],
          u[2] * v[0] - u[0] * v[2],
          u[0] * v[1] - u[1] * v[0]
        ];

        const normLength = Math.hypot(...normal);
        const normalized = normal.map(n => n / normLength);

        const normals = new Float32Array([
          ...normalized, ...normalized, ...normalized,
          ...normalized, ...normalized, ...normalized
        ]);

        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

        const texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

        const normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);

        this.objects.push({
          name: `wall_${i}`,
          vertexBuffer,
          texCoordBuffer,
          normalBuffer,
          vertexCount: positions.length / 3,
          modelMatrix: mat4.create(),
          program: 'basic',
          color: colors[i],
          useTexture: false,
          texture: null,
          selectable: false,
          visible: true
        });
      }
    });
  }

  // utility function to add a wall segment in order to create the walls of the scene
  _addWallSegment(x1, y1, z1, x2, y2, z2, color) {
    const gl = this.gl;

    const positions = new Float32Array([
        x1, y1, z1,  x2, y1, z2,  x2, y2, z2,
        x1, y1, z1,  x2, y2, z2,  x1, y2, z1
    ]);

    const texCoords = new Float32Array([
        0, 0, 1, 0, 1, 1,
        0, 0, 1, 1, 0, 1
    ]);

    const dx = x2 - x1, dz = z2 - z1;
    const edge1 = [x2 - x1, y2 - y1, z2 - z1];
    const edge2 = [0, 1, 0]; // su (asse Y)

    const normal = [
      edge1[1] * edge2[2] - edge1[2] * edge2[1],
      edge1[2] * edge2[0] - edge1[0] * edge2[2],
      edge1[0] * edge2[1] - edge1[1] * edge2[0]
    ];

    const length = Math.hypot(...normal);
    const norm = normal.map(n => -n);

    const normals = new Float32Array([...norm, ...norm, ...norm, ...norm, ...norm, ...norm]);

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);

    this.objects.push({
      name: 'wall_segment',
      vertexBuffer,
      texCoordBuffer,
      normalBuffer,
      vertexCount: 6,
      modelMatrix: mat4.create(),
      program: 'basic',
      color,
      useTexture: false,
      texture: null,
      selectable: false,
      visible: true
    });
  }

  // utility function to add a window segment in order to create the window of the scene
  _addWindowSegment(x1, y1, z1, x2, y2, z2) {
    const gl = this.gl;

    const positions = new Float32Array([
        x1, y1, z1,  x2, y1, z2,  x2, y2, z2,
        x1, y1, z1,  x2, y2, z2,  x1, y2, z1
    ]);

    // Texture coordinates to avoid stretching
    const texCoords = new Float32Array([
        0, 0, 1, 0, 1, 1,
        0, 0, 1, 1, 0, 1
    ]);

    const dx = x2 - x1, dz = z2 - z1;
    const normal = [dz, 0, -dx];
    const length = Math.hypot(...normal);
    const norm = normal.map(n => n / length);

    const normals = new Float32Array([...norm, ...norm, ...norm, ...norm, ...norm, ...norm]);

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);

    // create the window object with dynamic texture system
    const windowObj = {
      name: 'window',
      vertexBuffer,
      texCoordBuffer,
      normalBuffer,
      vertexCount: 6,
      modelMatrix: mat4.create(),
      program: 'basic',
      color: [1.0, 1.0, 1.0],
      useTexture: true,
      texture: this.skyTexture,
      selectable: false
    };

    this.objects.push(windowObj);
    console.log('Window created with dynamic texture system');
  }

  // utility function to create the door
  _createDoor() {
    const gl = this.gl;

    const positions = new Float32Array([
      0, 0, 0,   0.8, 0, 0,   0.8, 2, 0, // width = 0.8, height = 2
      0, 0, 0,   0.8, 2, 0,   0, 2, 0
    ]);

    const texCoords = new Float32Array([
      0, 0, 1, 0, 1, 1,
      0, 0, 1, 1, 0, 1
    ]);

    const normals = new Float32Array([
      0, 0, 1, 0, 0, 1, 0, 0, 1,
      0, 0, 1, 0, 0, 1, 0, 0, 1
    ]);

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);

    const door = {
      name: 'door',
      vertexBuffer,
      texCoordBuffer,
      normalBuffer,
      vertexCount: 6,
      modelMatrix: mat4.create(),
      program: 'basic',
      color: [0.6, 0.3, 0.1],
      useTexture: false,
      texture: null,
      selectable: false,
      position: [3.0, 0.0, -4.9],
      isOpening: false,
      isClosing: false,
      isOpen: false,
      openAngle: 0,
      visible: true
    };

    mat4.translate(door.modelMatrix, door.modelMatrix, door.position);
    this.objects.push(door);

    console.log('Door system created');
  }

  // utility function to create a light helper for the point light
  _createLightHelper() {
    const gl = this.gl;
 
    const positions = new Float32Array([ 
        -0.05, -0.05, -0.05,  0.05, -0.05, -0.05,  0.05,  0.05, -0.05,
        -0.05, -0.05, -0.05,  0.05,  0.05, -0.05, -0.05,  0.05, -0.05,
        -0.05, -0.05,  0.05,  0.05, -0.05,  0.05,  0.05,  0.05,  0.05,
        -0.05, -0.05,  0.05,  0.05,  0.05,  0.05, -0.05,  0.05,  0.05
    ]);

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const modelMatrix = mat4.create();
    mat4.translate(modelMatrix, modelMatrix, this.pointLightPos);

    this.objects.push({
        name: 'pointLightHelper',
        vertexBuffer,
        vertexCount: positions.length / 3,
        modelMatrix,
        program: 'basic',
        color: [1.0, 1.0, 0.0],
        selectable: false,
        useTexture: false,
        isHelper: true
    });
  }

  // utility function to create a directional light helper
  _createDirectionalHelper() {
    const dir = vec3.normalize([], this.lightDirection);
    const origin = [0, 2.5, 0]; // starting point of the directional light
    const end = vec3.scaleAndAdd([], origin, dir, -2.0); 

    const vertices = new Float32Array([...origin, ...end]);
    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

    this.directionalHelper = {
      name: 'directionalHelper',
      vertexBuffer: buffer,
      vertexCount: 2, // line
      modelMatrix: mat4.create(),
      program: 'grid',
      color: [1.0, 1.0, 0.0],
      selectable: false
    };

    this.objects.push(this.directionalHelper);
  }

  // utility function to get the object at a specific screen position
  // this is used to select objects in the scene
  // Once selected the object becomes yellow and can be moved
  getObjectAtScreen(x, y, camera) {
    for (const obj of this.objects) {
        if (!obj.selectable) continue;
        const bbox = this._getObjectBoundingBox(obj);
        if (this._screenPointInsideBBox(x, y, bbox, camera)) {
            return obj;
        }
    }
    return null;
  }

  _getObjectBoundingBox(obj) { // unit cube
    const min = [-0.5, 0, -0.5];
    const max = [0.5, 1, 0.5];
    return { min, max, matrix: obj.modelMatrix };
  }

  
  pickObject(screenX, screenY, camera) {
    const ndcX = (2 * screenX) / this.gl.canvas.width - 1;
    const ndcY = 1 - (2 * screenY) / this.gl.canvas.height;

    for (let obj of this.objects) {
        if (!obj.selectable) continue;

        const model = obj.modelMatrix;
        const pos = [model[12], model[13], model[14]];

        const viewProj = mat4.create();
        mat4.multiply(viewProj, camera.projectionMatrix, camera.viewMatrix);
        const clip = vec4.fromValues(pos[0], pos[1], pos[2], 1);
        vec4.transformMat4(clip, clip, viewProj);
        const ndc = [clip[0] / clip[3], clip[1] / clip[3]];

        const dx = Math.abs(ndcX - ndc[0]);
        const dy = Math.abs(ndcY - ndc[1]);

        if (dx < 0.1 && dy < 0.1) {
            return obj;
        }
    }

    return null;
  }


  // utility function to export the scene
  export() {
    const data = [];

    // prepares an export for each object 
    for (const obj of this.objects) {
      const entry = {
        name: obj.name,
      };

      if (obj.modelPath) { // for user-imported objects
        entry.modelPath = obj.modelPath;
        entry.texturePath = obj.texture?.url || null;
        entry.scale = obj.initialScale || 1.0;
        entry.color = obj.color;
        
        // extract position from the modelMatrix
        entry.position = this.extractPositionFromMatrix(obj.modelMatrix);
        
        // extract rotation from the modelMatrix
        entry.rotation = this.extractRotationFromMatrix(obj.modelMatrix);
      }

      data.push(entry);
    }

    return data;
  }

  // helper function to extract the position from the modelMatrix in column-major order
  extractPositionFromMatrix(matrix) { // X, Y, Z translation of the object
    return [matrix[12], matrix[13], matrix[14]];
  }

  // helper function to extract the rotation from the modelMatrix
  extractRotationFromMatrix(matrix) {
    const rotX = Math.atan2(matrix[6], matrix[10]);
    const rotY = Math.atan2(-matrix[2], Math.sqrt(matrix[6] * matrix[6] + matrix[10] * matrix[10]));
    const rotZ = Math.atan2(matrix[1], matrix[0]);
    return [rotX, rotY, rotZ];
  }

}

// SHADERS 
const basicVertexShader = `
attribute vec3 aPosition;
attribute vec2 aTexCoord;
attribute vec3 aNormal;

uniform mat4 uModelMatrix; 
uniform mat4 uViewMatrix; 
uniform mat4 uProjectionMatrix;
uniform mat4 uNormalMatrix;

varying vec3 vNormal;
varying vec3 vFragPos;
varying vec2 vTexCoord;

void main() {
    vec4 worldPos = uModelMatrix * vec4(aPosition, 1.0); 
    vFragPos = worldPos.xyz; 
    vNormal = mat3(uNormalMatrix) * aNormal; 
    vTexCoord = aTexCoord;
    gl_Position = uProjectionMatrix * uViewMatrix * worldPos;
} 
`;

const basicFragmentShader = `
precision mediump float;

uniform vec3 uColor;
uniform bool uUseTexture;
uniform sampler2D uSampler;

uniform vec3 uAmbientLight;
uniform vec3 uLightColor;
uniform vec3 uLightDirection;
uniform vec3 uPointLightPos;

uniform bool uUseDirectional;
uniform bool uUsePoint;

uniform float uShininess;

varying vec3 vNormal;
varying vec3 vFragPos;
varying vec2 vTexCoord;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(-vFragPos); 
    
    vec3 lighting = uAmbientLight;
    vec3 specular = vec3(0.0);

    if (uUseDirectional) {
      vec3 lightDir = normalize(-uLightDirection);
      float diff = max(dot(normal, lightDir), 0.0); 

      /*      Blinn-Phong specular reflection model */
      vec3 halfwayDir = normalize(lightDir + viewDir); 
      float spec = pow(max(dot(normal, halfwayDir), 0.0), uShininess); 
      specular += spec * uLightColor; 

      lighting += diff * uLightColor; 
    }

    if (uUsePoint) {
      vec3 toLight = normalize(uPointLightPos - vFragPos);
      float dist = length(uPointLightPos - vFragPos);
      float atten = 1.0 / (0.1 + 0.1 * dist + 0.01 * dist * dist); 

      float diff = max(dot(normal, toLight), 0.0);

      vec3 halfwayDir = normalize(toLight + viewDir);
      float spec = pow(max(dot(normal, halfwayDir), 0.0), uShininess);
      specular += atten * spec * uLightColor;

      lighting += atten * diff * uLightColor;
    }

    vec3 baseColor = uUseTexture ? texture2D(uSampler, vTexCoord).rgb * uColor : uColor; 
    vec3 finalColor = baseColor * lighting + specular * 0.1;

    gl_FragColor = vec4(finalColor, 1.0);
}
`;

const gridVertexShader = `
attribute vec3 aPosition;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
}
`;

const gridFragmentShader = `
precision mediump float;
uniform vec3 uColor;
void main() {
    gl_FragColor = vec4(uColor, 1.0); 
}
`;