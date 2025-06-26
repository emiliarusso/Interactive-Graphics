// obj.js
// this file contains the ObjMesh class that is used to load, parse, normalize and extract geometry buffers from an obj file
// this is very important to add furnitures to the scene

export class ObjMesh
{
	constructor()
	{
		this.vpos = [];	// vertex positions
		this.face = [];	// face vertex indices
		this.tpos = [];	// texture coordinates
		this.tfac = [];	// face texture coordinate indices
		this.norm = [];	// surface normals
		this.nfac = [];	// face surface normal indices
	}
	
	// Reads the obj file at the given URL and parses it
	load( url )
	{
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
				parse( this.responseText );
			}
		};
		xhttp.open("GET", url, true);
		xhttp.send();
	}
	
	// Parses the contents of an obj file and stores:
		// - vertex positions (v)
		// - texture coordinates (vt)
		// - normals (vn)
		// - faces (f) with vertex indices, texture coordinate indices and normal indices
	parse( objdata )
	{
		var lines = objdata.split('\n');
		for ( var i=0; i<lines.length; ++i ) {
			var line = lines[i].trim();
			var elem = line.split(/\s+/);
			switch ( elem[0][0] ) {
				case 'v':
					switch ( elem[0].length ) {
						case 1:
							this.vpos.push( [ parseFloat(elem[1]), parseFloat(elem[2]), parseFloat(elem[3]) ] );
							break;
						case 2:
							switch ( elem[0][1] ) {
								case 't':
									this.tpos.push( [ parseFloat(elem[1]), parseFloat(elem[2]) ] );
									break;
								case 'n':
									this.norm.push( [ parseFloat(elem[1]), parseFloat(elem[2]), parseFloat(elem[3]) ] );
									break;
							}
							break;
					}
					break;
				case 'f':
					var f=[], tf=[], nf=[];
					for ( var j=1; j<elem.length; ++j ) {
						var ids = elem[j].split('/');
						var vid = parseInt(ids[0]);
						if ( vid < 0 ) vid = this.vpos.length + vid + 1;
						f.push( vid - 1 );
						// vertex index is present
						if ( ids.length > 1 && ids[1] !== "" ) {
							var tid = parseInt(ids[1]);
							if ( tid < 0 ) tid = this.tpos.length + tid + 1;
							tf.push( tid - 1 );
						}
						// normal index is present
						if ( ids.length > 2 && ids[2] !== "" ) {
							var nid = parseInt(ids[2]);
							if ( nid < 0 ) nid = this.norm.length + nid + 1;
							nf.push( nid - 1 );
						}
					}
					this.face.push(f);
					if ( tf.length ) this.tfac.push(tf);
					if ( nf.length ) this.nfac.push(nf);
					break;
			}
		}
	}
	
	// Returns the bounding box of the object
	// AABB = Axis-Aligned Bounding Box
	getBoundingBox()
	{
		if ( this.vpos.length == 0 ) return null;
		var min = [...this.vpos[0]];
		var max = [...this.vpos[0]];
		for ( var i=1; i<this.vpos.length; ++i ) {
			for ( var j=0; j<3; ++j ) {
				if ( min[j] > this.vpos[i][j] ) min[j] = this.vpos[i][j];
				if ( max[j] < this.vpos[i][j] ) max[j] = this.vpos[i][j];
			}
		}
		return { min: min, max: max };
	}
	
	// This function centers the mesh around the given center point 
	// and scales it uniformly to fit largest dimension to the given scale.
	// this is useful to normalize the objects we add to the scene in order to be visually consistent
	shiftAndScale(center = [0, 0, 0], scale = 1.0) {
        if (!this.vpos.length) throw new Error("Mesh has no vertices to normalize.");

        let min = [...this.vpos[0]];
        let max = [...this.vpos[0]];

        for (let i = 1; i < this.vpos.length; i++) { // vpos[i] = [x,y,z]
            for (let j = 0; j < 3; j++) {
                min[j] = Math.min(min[j], this.vpos[i][j]);
                max[j] = Math.max(max[j], this.vpos[i][j]);
            }
        }

        const size = max.map((v, i) => v - min[i]); // width, height, depth
        const maxDim = Math.max(...size);
        const scaleFactor = scale / maxDim;

        for (let i = 0; i < this.vpos.length; i++) { // translate vertices
            for (let j = 0; j < 3; j++) {
                this.vpos[i][j] = (this.vpos[i][j] - (min[j] + max[j]) / 2) * scaleFactor + center[j];
            }
        }
    }

	// builds one triangle from face fi using indices i,j,k
	addTriangleToBuffers( vBuffer, tBuffer, nBuffer, fi, i, j, k )
	{
		var f  = this.face[fi];
		var tf = this.tfac[fi];
		var nf = this.nfac[fi];
		this.addTriangleToBuffer( vBuffer, this.vpos, f, i, j, k, this.addVertToBuffer3 );
		if ( tf ) {
			this.addTriangleToBuffer( tBuffer, this.tpos, tf, i, j, k, this.addVertToBuffer2 );
		}
		if ( nf ) {
			this.addTriangleToBuffer( nBuffer, this.norm, nf, i, j, k, this.addVertToBuffer3 );
		}
	}
		
	// adds a triangle's three vertices to a buffer
	addTriangleToBuffer( buffer, v, f, i, j, k, addVert )
	{
		addVert( buffer, v, f, i );
		addVert( buffer, v, f, j );
		addVert( buffer, v, f, k );
	}
	
	// adds a 3D vertex [x,y,z]
	addVertToBuffer3( buffer, v, f, i )
	{
		buffer.push( v[f[i]][0] );
		buffer.push( v[f[i]][1] );
		buffer.push( v[f[i]][2] );
	}

	// adds a 2D vertex [u,v] (used for texture)
	addVertToBuffer2( buffer, v, f, i )
	{
		buffer.push( v[f[i]][0] );
		buffer.push( v[f[i]][1] );
	}

	// creates flat arrays to be used in WebGL buffers
	getVertexBuffers() {
		const vBuffer = [];
		const tBuffer = [];
		const nBuffer = [];

		for (let i = 0; i < this.face.length; ++i) {
			const face = this.face[i];
			if (face.length < 3) continue;

			this.addTriangleToBuffers(vBuffer, tBuffer, nBuffer, i, 0, 1, 2); // first triangle
			for (let j = 3; j < face.length; ++j) { // additional triangles
				this.addTriangleToBuffers(vBuffer, tBuffer, nBuffer, i, 0, j - 1, j);
			}
		}

		return {
			positionBuffer: vBuffer, // flattened vertices
			texCoordBuffer: tBuffer.length ? tBuffer : null,	// flattened texture coordinates (if available)
			normalBuffer: nBuffer.length ? nBuffer : null,	// flattened normals (if available)
		};
	}
}