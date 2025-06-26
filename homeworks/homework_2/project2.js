// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The transformation first applies scale, then rotation, and finally translation.
// The given rotation value is in degrees.
function GetTransform(positionX, positionY, rotation, scale) {
	// Convert rotation to radians
	const radian = rotation * Math.PI / 180;

	// Create the transformation matrix: scale -> rotate -> translate
	return [
		scale * Math.cos(radian), scale * Math.sin(radian), 0, // Scale and rotate along the x-axis
		-scale * Math.sin(radian), scale * Math.cos(radian), 0, // Scale and rotate along the y-axis
		positionX, positionY, 1 // Translate along the x and y axes
	];
}

// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The arguments are transformation matrices in the same format.
// The returned transformation first applies trans1 and then trans2 -> trans2*trans1
function ApplyTransform( trans1, trans2 ) { // matrix multiplicationc
	const result = new Array(9);
	for (let col = 0; col < 3; col++) {
		for (let row = 0; row < 3; row++) {
			result[col * 3 + row] =
				trans2[0 * 3 + row] * trans1[col * 3 + 0] +
				trans2[1 * 3 + row] * trans1[col * 3 + 1] +
				trans2[2 * 3 + row] * trans1[col * 3 + 2];
		}
	}
	return result;
}