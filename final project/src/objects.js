// objects.js

import { ObjMesh } from './obj.js';
import { mat4 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/+esm';

// this class is used to load an object file, normalize it, trnasform it into a WebGL buffer and optionally assigning a texture
export class ObjectFactory {
    constructor(gl) {
        this.gl = gl; // receives a WebGL context and saves it
    }

    // loads an object file from a URL, normalizes it, and returns a WebGL object
    async loadObj(url, position = [0, 0, 0], scale = 0.5, color = [0.9, 0.5, 0.2], textureUrl = null) {
        const response = await fetch(url); // loads the object file from the server
        const objText = await response.text();

        const mesh = new ObjMesh();
        mesh.parse(objText);

        if (!mesh.vpos || mesh.vpos.length === 0) {
            throw new Error("Mesh has no vertices to normalize.");
        }

        mesh.shiftAndScale([0, 0, 0], scale); // move and scale the object to take at it the center of the scene and make it proportional to the scene itself
        const { positionBuffer, texCoordBuffer, normalBuffer } = mesh.getVertexBuffers(); // extract flattened buffers ready to be used in WebGL

        const gl = this.gl;

        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionBuffer), gl.STATIC_DRAW);

        let texCoordBuf = null;
        if (texCoordBuffer && texCoordBuffer.length > 0) {
            texCoordBuf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuf);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoordBuffer), gl.STATIC_DRAW);
        }

        let normalBuf = null;
        if (normalBuffer && normalBuffer.length > 0) {
            normalBuf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, normalBuf);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalBuffer), gl.STATIC_DRAW);
        }

        const modelMatrix = mat4.create();
        mat4.translate(modelMatrix, modelMatrix, position); // translate to desired position

        // construct the object with all the necessary properties
        const object = {
            name: 'object',
            vertexBuffer,
            texCoordBuffer: texCoordBuf,
            normalBuffer: normalBuf,
            vertexCount: positionBuffer.length / 3,
            modelMatrix,
            program: 'basic',
            color,
            selectable: true,
            useTexture: !!textureUrl,
            texture: null,
        };

        if (textureUrl) { // if a texture URL is provided, load the texture
            object.texture = loadTexture(gl, textureUrl);
        }

        // useful information to save the scene and then load to re-use
        object.modelPath = url;
        object.initialScale = scale;
        object.position = position;

        return object;
    }

}

// this function loads a texture from a URL and returns a WebGL texture object
export function loadTexture(gl, url) {
    const texture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0,
        gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255])
    ); 

    const image = new Image();
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
                      gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
    };
    image.src = url;

    texture.image = image;
    texture.url = url;

    return texture;
}