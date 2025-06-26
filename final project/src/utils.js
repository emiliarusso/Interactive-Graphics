// utils.js
// This file contains utility functions for WebGL rendering, including shader creation and program linking.
// It is used to create shaders and shader programs for rendering graphics in WebGL.

// this function creates a shader of the specified type (vertex or fragment) from the provided source code
// and returns the compiled shader object. If compilation fails, it logs an error and returns null
export function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

// This function creates a shader program by compiling vertex and fragment shaders from the provided source code
// and linking them together. It returns the linked program object. If linking fails, it logs an error and returns null.
export function createShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vertexShader || !fragmentShader) return null;

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        return null;
    }
    return program;
}
