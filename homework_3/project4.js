// This function takes the projection matrix, the translation, and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// The given projection matrix is also a 4x4 matrix stored as an array in column-major order.
// You can use the MatrixMult function defined in project4.html to multiply two 4x4 matrices in the same format.
function GetModelViewProjection( projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY )
{
	var trans = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];

	var rotationXMatrix = [
		1, 0, 0, 0,
		0, Math.cos(rotationX), -Math.sin(rotationX), 0,
		0, Math.sin(rotationX), Math.cos(rotationX), 0,
		0, 0, 0, 1
	];
	var rotationYMatrix = [
		Math.cos(rotationY), 0, Math.sin(rotationY), 0,
		0, 1, 0, 0,
		-Math.sin(rotationY), 0, Math.cos(rotationY), 0,
		0, 0, 0, 1
	];

	// Apply the rotation matrices to the translation matrix
	var mvp = MatrixMult(projectionMatrix, trans);
	mvp = MatrixMult(mvp, rotationYMatrix);
	mvp = MatrixMult(mvp, rotationXMatrix);

	return mvp;
}


// Complete the implementation of the following class.

class MeshDrawer
{
	// The constructor is a good place for taking care of the necessary initializations.
	constructor()
	{
		// initializations
		this.program = InitShaderProgram(VS, FS);
		this.mvpLocation = gl.getUniformLocation(this.program, "mvp");
		this.textureLocation = gl.getUniformLocation(this.program, "sampler");
		this.positionLocation = gl.getAttribLocation(this.program, "vertPos");
		this.texCoordLocation = gl.getAttribLocation(this.program, "vertTexCoord");
		this.positionBuffer = gl.createBuffer();
		this.textureBuffer = gl.createBuffer();
		this.axisSwapLocation = gl.getUniformLocation(this.program, "useSwap");
		this.textureDisplayLocation = gl.getUniformLocation(this.program, "showText");
	}
	
	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions
	// and an array of 2D texture coordinates.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex.
	// Note that this method can be called multiple times.
	setMesh( vertPos, texCoords )
	{
		// Update the contents of the vertex buffer objects.
		gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
		this.numTriangles = vertPos.length / 3;
	}
	
	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ( swap )
	{
		// Set the uniform parameter(s) of the vertex shader
		gl.useProgram(this.program);
		gl.uniform1i(this.axisSwapLocation, swap ? 1 : 0);
	}
	
	// This method is called to draw the triangular mesh.
	// The argument is the transformation matrix, the same matrix returned
	// by the GetModelViewProjection function above.
	draw(trans) {
		// Complete the WebGL initializations before drawing
		gl.useProgram(this.program);
		gl.uniformMatrix4fv(this.mvpLocation, false, trans);

		// Bind texture
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.mytexture); // << ADD THIS LINE

		gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
		gl.vertexAttribPointer(this.positionLocation, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.positionLocation);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
		gl.vertexAttribPointer(this.texCoordLocation, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.texCoordLocation);

		gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
	}

	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture( img )
	{
		// Create and Bind the texture
		this.mytexture = gl.createTexture();
		gl.bindTexture( gl.TEXTURE_2D, this.mytexture );

		// You can set the texture image data using the following command.
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);

		// Now that we have a texture, it might be a good idea to set
		// some uniform parameter(s) of the fragment shader, so that it uses the texture.
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

		// activate the texture unit 0 and bind the texture to it
		gl.activeTexture(gl.TEXTURE0);
		gl.uniform1i(this.textureLocation, 0);
	}
	
	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture( show )
	{
		// set the uniform parameter(s) of the fragment shader to specify if it should use the texture.
		gl.useProgram(this.program);
		gl.uniform1i(this.textureDisplayLocation, show ? 1 : 0);
	}	
}

var VS = `
attribute vec3 vertPos;
attribute vec2 vertTexCoord;
uniform mat4 mvp;
varying vec2 fragTexCoord;
uniform bool useSwap;
void main() {
    mat4 swapMatrix = mat4(1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 1);
    if(useSwap){
        gl_Position = mvp * swapMatrix * vec4(vertPos, 1);
    } else {
        gl_Position = mvp * vec4(vertPos, 1);
    }
    fragTexCoord = vertTexCoord;
}
`;

var FS = `
precision mediump float;
uniform sampler2D sampler;
varying vec2 fragTexCoord;
uniform bool showText;
void main() {
    if(showText) {
        gl_FragColor = texture2D(sampler, fragTexCoord);
    } else {
        gl_FragColor = vec4(1, gl_FragCoord.z * gl_FragCoord.z, 0, 1);
    }
}
`;