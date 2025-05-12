function transposeMatrix(m) {
	let result = [];
	for (let row = 0; row < 4; row++) {
		for (let col = 0; col < 4; col++) {
			result.push(m[row + col * 4]); // read as column-major
		}
	}
	return result;
}

// This function takes the translation and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// You can use the MatrixMult function defined in project5.html to multiply two 4x4 matrices in the same format.
function GetModelViewMatrix( translationX, translationY, translationZ, rotationX, rotationY )
{
	// Modify the code below to form the transformation matrix.
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
	var mv = MatrixMult(trans, transposeMatrix(MatrixMult(rotationXMatrix, rotationYMatrix)));
    
	return mv;
}


// Complete the implementation of the following class.

class MeshDrawer
{
	// The constructor is a good place for taking care of the necessary initializations.
	constructor()
	{
		// initializations
		this.program = InitShaderProgram(VS, FS);
		this.mvLocation = gl.getUniformLocation(this.program, "mv");
		this.mvpLocation = gl.getUniformLocation(this.program, "mvp");
		this.normalMatrixLocation = gl.getUniformLocation(this.program, "normalMatrix");
		this.lightDirLocation = gl.getUniformLocation(this.program, "lightDirection");
		this.shininessLocation = gl.getUniformLocation(this.program, "shininess");
		this.textureLocation = gl.getUniformLocation(this.program, "sampler");
		this.axisSwapLocation = gl.getUniformLocation(this.program, "useSwap");
		this.textureDisplayLocation = gl.getUniformLocation(this.program, "showText");
		this.positionLocation = gl.getAttribLocation(this.program, "vertPos");
		this.texCoordLocation = gl.getAttribLocation(this.program, "vertTexCoord");
		this.normalLocation = gl.getAttribLocation(this.program, "vertNormal");
		
		this.positionBuffer = gl.createBuffer();
		this.textureBuffer = gl.createBuffer();
		this.normalBuffer = gl.createBuffer();	
	}
	
	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions,
	// an array of 2D texture coordinates, and an array of vertex normals.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex and every three consecutive 
	// elements in the normals array form a vertex normal.
	// Note that this method can be called multiple times.
	setMesh( vertPos, texCoords, normals )
	{
		// Update the contents of the vertex buffer objects.
		gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);
		
		// add normals
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

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
	// The arguments are the model-view-projection transformation matrixMVP,
	// the model-view transformation matrixMV, the same matrix returned
	// by the GetModelViewProjection function above, and the normal
	// transformation matrix, which is the inverse-transpose of matrixMV.
	draw(matrixMVP, matrixMV, matrixNormal) {
		gl.useProgram(this.program);

		// Set matrix uniforms
		gl.uniformMatrix4fv(this.mvpLocation, false, matrixMVP);
		gl.uniformMatrix4fv(gl.getUniformLocation(this.program, "mv"), false, matrixMV);
		gl.uniformMatrix3fv(gl.getUniformLocation(this.program, "normalMatrix"), false, matrixNormal);

		// Bind position buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
		gl.enableVertexAttribArray(this.positionLocation);
		gl.vertexAttribPointer(this.positionLocation, 3, gl.FLOAT, false, 0, 0);

		// Bind texture coord buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
		gl.enableVertexAttribArray(this.texCoordLocation);
		gl.vertexAttribPointer(this.texCoordLocation, 2, gl.FLOAT, false, 0, 0);

		// Bind normal buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.enableVertexAttribArray(this.normalLocation);
		gl.vertexAttribPointer(this.normalLocation, 3, gl.FLOAT, false, 0, 0);

		// Draw
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
		this.showTexture(true);
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
	
	// This method is called to set the incoming light direction
	setLightDir( x, y, z )
	{
		// set the uniform parameter(s) of the fragment shader to specify the light direction.
		gl.useProgram(this.program);
		gl.uniform3f(this.lightDirLocation, x, y, z);
	}
	
	// This method is called to set the shininess of the material
	setShininess( shininess )
	{
		// set the uniform parameter(s) of the fragment shader to specify the shininess.
		gl.useProgram(this.program);
		gl.uniform1f(this.shininessLocation, shininess);
	}
}

// Vertex Shader
var VS = `
attribute vec3 vertPos;
attribute vec2 vertTexCoord;
attribute vec3 vertNormal;
uniform mat4 mvp;
uniform mat4 mv;
uniform mat3 normalMatrix;
uniform bool useSwap;
varying vec2 fragTexCoord;
varying vec3 fragNormal;
void main() {
    vec3 position = vertPos;
    if(useSwap) {
        position = vec3(vertPos.x, vertPos.z, -vertPos.y); // Swap Y and Z
    }
    gl_Position = mvp * vec4(position, 1);
    fragTexCoord = vertTexCoord;
    fragNormal = normalMatrix * vertNormal;
}
`;

// Fragment Shader
var FS = `
precision mediump float;
uniform sampler2D sampler;
varying vec2 fragTexCoord;
varying vec3 fragNormal;
uniform vec3 lightDirection;
uniform float shininess;
uniform bool showText;
void main() {
    vec4 texColor = texture2D(sampler, fragTexCoord);
    vec3 normal = normalize(fragNormal);
    vec3 lightDir = normalize(lightDirection);
    vec3 viewDir = normalize(-vec3(gl_FragCoord)); // Assuming camera at origin
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 specular = vec3(1.0) * spec; // Assuming white specular color
    vec3 diffuse = vec3(1.0) * diff; // Assuming white diffuse color
    vec3 color = (showText ? vec3(texColor) : vec3(1, 1, 1)) * diffuse + specular;
    gl_FragColor = vec4(color, 1.0);
}
`;