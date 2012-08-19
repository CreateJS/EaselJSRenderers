/*
* RendererWebGL by Grant Skinner. Dec 5, 2010
* Visit http://easeljs.com/ for documentation, updates and examples.
*
*
* Copyright (c) 2010 Grant Skinner
*
* Permission is hereby granted, free of charge, to any person
* obtaining a copy of this software and associated documentation
* files (the "Software"), to deal in the Software without
* restriction, including without limitation the rights to use,
* copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the
* Software is furnished to do so, subject to the following
* conditions:
*
* The above copyright notice and this permission notice shall be
* included in all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
* EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
* OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
* NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
* HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
* WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
* FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
* OTHER DEALINGS IN THE SOFTWARE.
*/

/**
* The Easel Javascript library provides a retained graphics mode for canvas
* including a full, hierarchical display list, a core interaction model, and
* helper classes to make working with Canvas much easier.
* @module EaselJS
**/

(function(window) {
	
window.whereisit = {x:0, y:0};

/**
* A stage is the root level Container for a display list. Each time its tick method is called, it will render its display
* list to its target canvas.
* @class Stage
* @extends Container
* @constructor
* @param {HTMLCanvasElement} canvas The canvas the stage will render to.
**/
var RendererWebGL = function(root, surface) {
  this.initialize(root, surface);
};

var p = RendererWebGL.prototype = new Renderer();

// static properties:
	p.MAX_DEPTH = 1048576;

// public properties:
	p.snapToPixel = true;

// constructor:

// public methods:

	p.getSurface = function(width, height) {
		if (this.surface == null) {
			this.surface = document.createElement("canvas");
		}
		if (width) { this.surface.width = width; }
		if (height) { this.surface.height = height; }
		return this.surface;
	};

	/**
	* Clears the target canvas. Useful if autoClear is set to false.
	* @method clear
	**/
	p.clear = function() {
		if (!this.surface) { return; }
		if(!this.surface.init){
			this.initSurface(this.surface);
		}
	};
	
	p.initSurface = function(surface) {
		var ctx = undefined;
		try {
			ctx = surface.ctx = surface.getContext("experimental-webgl", {preserveDrawingBuffer: true});
			ctx.viewportWidth = surface.width;
			ctx.viewportHeight = surface.height;
		} catch (e) {}
		
		if (!ctx) {
			alert("Could not initialise WebGL. Make sure you've updated your browser, or try a different one like Google Chrome.");
		}
		
		// init matricies
		surface.idMatrix = mat4.create();
		surface.orthMatrix = mat4.create();
		this._matPool = [];
		
		// create shaders routines
		var textureShader = ctx.createShader(ctx.FRAGMENT_SHADER);
		ctx.shaderSource(textureShader, "" +
				"precision highp float;			\n" +
				
				"varying vec3 vTextureCoord;	\n" +
				"varying float vAlpha;			\n" +
				
				"uniform float uAlpha;			\n" +
				"uniform sampler2D uSampler0,uSampler1,uSampler2,uSampler3,uSampler4,uSampler5,uSampler6," +
				"uSampler7,uSampler8,uSampler9,uSampler10,uSampler11,uSampler12,uSampler13,uSampler14,uSampler15;\n" +
				
				"void main(void) { 				\n" +
				"	int sampler = int(vTextureCoord.z); 				\n" +
				"	vec4 color;											\n" +
				"	vec2 coord = vec2(vTextureCoord.s, vTextureCoord.t);\n" + 
				"		 if (sampler == 0) { 	color = texture2D(uSampler0, coord); } \n" +
				"	else if (sampler == 1) { 	color = texture2D(uSampler1, coord); } \n" +
				"	else if (sampler == 2) { 	color = texture2D(uSampler2, coord); } \n" +
				"	else if (sampler == 3) { 	color = texture2D(uSampler3, coord); } \n" +
				"	else if (sampler == 4) { 	color = texture2D(uSampler4, coord); } \n" +
				"	else if (sampler == 5) { 	color = texture2D(uSampler5, coord); } \n" +
				"	else if (sampler == 6) { 	color = texture2D(uSampler6, coord); } \n" +
				"	else if (sampler == 7) { 	color = texture2D(uSampler7, coord); } \n" +
				"	else if (sampler == 8) { 	color = texture2D(uSampler8, coord); } \n" +
				"	else if (sampler == 9) { 	color = texture2D(uSampler9, coord); } \n" +
				"	else if (sampler == 10) { 	color = texture2D(uSampler10, coord); } \n" +
				"	else if (sampler == 11) { 	color = texture2D(uSampler11, coord); } \n" +
				"	else if (sampler == 12) { 	color = texture2D(uSampler12, coord); } \n" +
				"	else if (sampler == 13) { 	color = texture2D(uSampler13, coord); } \n" +
				"	else if (sampler == 14) { 	color = texture2D(uSampler14, coord); } \n" +
				"	else if (sampler == 15) { 	color = texture2D(uSampler15, coord); } \n" +
				"	else { 						color = texture2D(uSampler0, vec2(vTextureCoord.s, vTextureCoord.t)); } \n" + 
				"	gl_FragColor = vec4(color.rgb, color.a * vAlpha);\n" +
				"}");
		
		ctx.compileShader(textureShader);
		if(!ctx.getShaderParameter(textureShader, ctx.COMPILE_STATUS)) { alert(ctx.getShaderInfoLog(textureShader)); }
		
		var vertexShader = ctx.createShader(ctx.VERTEX_SHADER);
		ctx.shaderSource(vertexShader, "" +
				"attribute vec3 aVertexPosition;	\n" +
				"attribute vec3 aTextureCoord;		\n" +
				"attribute float aAlpha;			\n" +
				
				"uniform mat4 uPMatrix;				\n" +
				"uniform bool uSnapToPixel;			\n" +
				
				"varying vec3 vTextureCoord;		\n" +
				"varying float vAlpha;				\n" +
				
				"void main(void) { 					\n" +
				"	vTextureCoord = aTextureCoord; 	\n" +
				"	vAlpha = aAlpha; 				\n" +
				"	gl_Position = uPMatrix * vec4(aVertexPosition, 1.0);	\n" +
				"}");
		ctx.compileShader(vertexShader);
		if(!ctx.getShaderParameter(vertexShader, ctx.COMPILE_STATUS)) { alert(ctx.getShaderInfoLog(vertexShader)); }
		
		// create shader programs
		var program = surface.shader = ctx.createProgram();

		ctx.attachShader(program,	vertexShader);
		ctx.attachShader(program,	textureShader);
		ctx.linkProgram(program);
		if(!ctx.getProgramParameter(program, ctx.LINK_STATUS)) { alert("Could not initialise shaders"); }
		ctx.enableVertexAttribArray(program.vertexPositionAttribute =	ctx.getAttribLocation(program, "aVertexPosition"));
		ctx.enableVertexAttribArray(program.uvCoordAttribute =			ctx.getAttribLocation(program, "aTextureCoord"));
		ctx.enableVertexAttribArray(program.colorAttribute =			ctx.getAttribLocation(program, "aAlpha"));
		program.orthMatrixUniform =	ctx.getUniformLocation(program, "uPMatrix");
		
		program.alphaUniform =		ctx.getUniformLocation(program, "uAlpha");
		program.snapToUniform =		ctx.getUniformLocation(program, "uSnapToPixel");
		
		ctx.useProgram(program);
		
		// setup key variables
		this._vertexDataCount = 7;
		this._root2 = Math.sqrt(2);
		this._index = 0;
		this._textures = [];
		this._cacheTextures = [];
		this._degToRad = Math.PI / 180;
		
		// setup buffers
		
		this.vertices = new Float32Array(this._vertexDataCount * 4 * 5000);
		
		this.arrayBuffer = ctx.createBuffer();
		this.indexBuffer = ctx.createBuffer();

		ctx.bindBuffer(ctx.ARRAY_BUFFER, this.arrayBuffer);
		ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
		
		var byteCount = (this._vertexDataCount * 4);
		ctx.vertexAttribPointer(program.vertexPositionAttribute, 3, ctx.FLOAT, 0, byteCount, 0);		
		ctx.vertexAttribPointer(program.uvCoordAttribute, 3, ctx.FLOAT, 0, byteCount, 12);
		ctx.vertexAttribPointer(program.colorAttribute, 1, ctx.FLOAT, 0, byteCount, 24);

		// Indices are set once and reused.
		this.indices = new Uint16Array(30000);
		for (var i = 0, l = this.indices.length; i < l; i += 6) {
			var j = i * 4 / 6;
			this.indices.set([j, j+1, j+2, j, j+2, j+3], i);
		}
		
		ctx.bufferData(ctx.ARRAY_BUFFER, this.vertices, ctx.STREAM_DRAW);
		ctx.bufferData(ctx.ELEMENT_ARRAY_BUFFER, this.indices, ctx.STATIC_DRAW);
		
		// setup viewport
		mat4.ortho(0, ctx.viewportWidth, ctx.viewportHeight, 0, -this.MAX_DEPTH, this.MAX_DEPTH, surface.orthMatrix);
		ctx.viewport(0, 0, ctx.viewportWidth, ctx.viewportHeight);
		ctx.colorMask(true, true, true, true);
		
		// setup blending
		ctx.blendFuncSeparate(ctx.SRC_ALPHA, ctx.ONE_MINUS_SRC_ALPHA, ctx.SRC_ALPHA, ctx.ONE);
		ctx.enable(ctx.BLEND); ctx.disable(ctx.DEPTH_TEST);
		
		// mark complete
		surface.init = true;
	};
	
	/*
	 * Takes the stored image and checks if it's already being stored in the buffer. If so, then it
	 * simply returns the samplerID and reuses the image. If not, then it stores the image and adds
	 * to the array of already-stored images.
	 * If this array hits 16 elements, a draw method is called to make room for new images.
	 */
	
	p._initTexture = function(src, ctx){
		if (!src) {
			return;
		}
		var textures = this._textures;
		var textureCount = this._cacheTextures.length + this._textures.length;

		for (var i = 0, l = textures.length; i < l; i++) {
			if (textures[i].image == src) {
				src.glTexture = textures[i];
				return i;
			}
		}
		if (!src.glTexture) {
			src.glTexture = ctx.createTexture();
			src.glTexture.image = src;
			
			ctx.activeTexture(ctx["TEXTURE" + textureCount]);
			ctx.bindTexture(ctx.TEXTURE_2D, src.glTexture);

			ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, ctx.RGBA, ctx.UNSIGNED_BYTE, src.glTexture.image);
			ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR);
			ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR);
			ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
			ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
		} else {
			ctx.activeTexture(ctx["TEXTURE" + textureCount]);
			ctx.bindTexture(ctx.TEXTURE_2D, src.glTexture);
		}

		ctx.uniform1i(ctx.getUniformLocation(ctx.canvas.shader, ("uSampler" + textureCount.toString())), textureCount);
		
		textures.push(src.glTexture);
		return textureCount;
	};
	
	/*
	 * The cache behaves differently, as we are a cacheID reference to decide on the images.
	 * Instead of only storing 16 images at a time, we store all the images we can get in an cache array and set
	 * them based on the cacheID of the object. This saves us from having to create new textures.
	 * Each texture also has an "_isUsed" property set to true on it.
	 * At the end of render, a cleanCache is called, which removes all the elements in the cache array that have not been
	 * used. This means that the cacheId has changed for that specific object, and it's now referencing a new texture.
	 */
	
	p._initCache = function(o, src, ctx){
		if (!src) {
			return;
		}
		var textures = this._cacheTextures;
		var textureCount = this._textures.length;

		for (var i = 0, l = textures.length; i < l; i++) {
			if (textures[i]._cacheID == o.cacheID) {
				textures[i]._isUsed = true;
				src.glTexture = textures[i];
				ctx.activeTexture(ctx["TEXTURE" + textureCount]);
				ctx.bindTexture(ctx.TEXTURE_2D, src.glTexture);
				this._textures.push(src.glTexture);
				return i;
			}
		}
		if (!src.glTexture) {
			src.glTexture = ctx.createTexture();
			src.glTexture.image = src;
			
			ctx.activeTexture(ctx["TEXTURE" + textureCount]);
			ctx.bindTexture(ctx.TEXTURE_2D, src.glTexture);

			ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, ctx.RGBA, ctx.UNSIGNED_BYTE, src.glTexture.image);
			ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR);
			ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR);
			ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
			ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
		} else {
			ctx.activeTexture(ctx["TEXTURE" + textureCount]);
			ctx.bindTexture(ctx.TEXTURE_2D, src.glTexture);
		}

		ctx.uniform1i(ctx.getUniformLocation(ctx.canvas.shader, ("uSampler" + textureCount.toString())), textureCount);
		src._cacheID = o.cacheID;
		src.glTexture._isUsed = true;
		
		this._textures.push(src.glTexture);
		textures.push(src.glTexture);
		return textureCount;
	};

	p.render = function(displayObject, surface) {
		displayObject = displayObject || this.root;
		surface = surface || this.surface;
		var ctx = surface.ctx;
		
		if (this.snapToPixel) {
			ctx.uniform1i(surface.shader.snapToUniform, 1);
		} else {
			ctx.uniform1i(surface.shader.snapToUniform, 0);
		}
		
		mat4.identity(surface.idMatrix);
		ctx.clear(ctx.COLOR_BUFFER_BIT | ctx.DEPTH_BUFFER_BIT);
		ctx.uniformMatrix4fv(surface.shader.orthMatrixUniform, false, surface.orthMatrix);
		
		if(!surface.init){
			initSurface(surface);
		}
		if (displayObject && surface) {
			var docFrag = document.createDocumentFragment();
			this._render(ctx, displayObject, surface.idMatrix, docFrag);
			this._draw(ctx);
		}
		
		this._cleanCache();
	};

	p._render = function(ctx, o, matrix, docFrag) {
		if (!o.isVisible()) { return; }
				
		var testLength = (this._index + 4) * this._vertexDataCount;
		if (this.vertices.length < testLength) {				
			this._draw(ctx);
		}
		var uFrame = 0, vFrame = 0, u = 1, v = 1, img = 0;
		var degToRad = this._degToRad;
		var mvMatrix = this._getMat4();
		
		/* 
		 * The samplerID of the image used. Images are stored in an array in the renderer as well as the samplers.
		 * Should the array hit 16, a draw method is called from inside _initTexture before the image is set, resetting the images.
		 * This lets us use as many images as we want.
		 * If the object has a cacheCanvas, however, that's what we will treat as a texture.
		 */
		var samplerID = 0;
		
		// render the element:
		if (o.cacheCanvas) {
			//this._drawToCache(ctx, o);
			img = o.cacheCanvas;
			samplerID = this._initCache(o, img, ctx);
			mat4.translate(matrix,	[o.x - o.regX, o.y - o.regY, 0],	mvMatrix);
			mat4.scale(mvMatrix,	[o.scaleX * img.width, o.scaleY * img.height, 1]);
			mat4.rotateX(mvMatrix,	o.skewX * degToRad);
			mat4.rotateY(mvMatrix,	o.skewY * degToRad);
			mat4.rotateZ(mvMatrix,	o.rotation * degToRad);
		} else if (o instanceof Bitmap) {
			// Bitmap is simply the image.
			img = o.image;
			samplerID = this._initTexture(img, ctx);
			mat4.translate(matrix,	[o.x - o.regX, o.y - o.regY, 0],	mvMatrix);
			mat4.scale(mvMatrix,	[o.scaleX * img.width, o.scaleY * img.height, 1]);
			mat4.rotateX(mvMatrix,	o.skewX * degToRad);
			mat4.rotateY(mvMatrix,	o.skewY * degToRad);
			mat4.rotateZ(mvMatrix,	o.rotation * degToRad);

		} else if (o instanceof Container) {
			var list = o.children.slice(0);
			mat4.translate(matrix,	[o.x - o.regX, o.y - o.regY, 0], 	mvMatrix);
			mat4.scale(mvMatrix,	[o.scaleX, o.scaleY, 1]);
			mat4.rotateX(mvMatrix,	o.skewX * degToRad);
			mat4.rotateY(mvMatrix,	o.skewY * degToRad);
			mat4.rotateZ(mvMatrix,	o.rotation * degToRad);
			for (var i=0,l=list.length; i<l; i++) {
				this._render(ctx,list[i],mvMatrix);
			}
			this._poolMat4(mvMatrix);
			return;
			
		} else if (o instanceof BitmapAnimation) {
			// BitmapAnimation uses a spritesheet, so we get the current frame for image.
			var frame = o.spriteSheet._frames[o.currentFrame];
			var rect = frame.rect;
			
			img = frame.image;
			samplerID = this._initTexture(img, ctx);
			
			u = (rect.width / img.width);
			v = (rect.height / img.height);
			uFrame = (rect.x / img.width);
			vFrame = (rect.y / img.height);
			
			mat4.translate(matrix,	[o.x - o.regX, o.y - o.regY, 0], 	mvMatrix);
			mat4.scale(mvMatrix,	[o.scaleX * rect.width, o.scaleY * rect.height, 1]);
			mat4.rotateX(mvMatrix,	o.skewX * degToRad);
			mat4.rotateY(mvMatrix,	o.skewY * degToRad);
			mat4.rotateZ(mvMatrix,	o.rotation * degToRad);
		}

		// Get positions of the 4 vertices. Each object is a square, drawn from the top-left point in a U shape.
		var pos1 = mat4.multiplyVec3(mvMatrix, [0,0,0]);
		var pos2 = mat4.multiplyVec3(mvMatrix, [0,1,0]);
		var pos3 = mat4.multiplyVec3(mvMatrix, [1,1,0]);
		var pos4 = mat4.multiplyVec3(mvMatrix, [1,0,0]);
		
		// Get yonder alpha.
		var alpha = o.alpha;
		
		this.vertices.set(
				[pos1[0], pos1[1],	pos1[2],	uFrame, 		vFrame, 		samplerID,		alpha,
				 pos2[0], pos2[1],	pos2[2], 	uFrame, 		vFrame + v, 	samplerID,		alpha,
				 pos3[0], pos3[1],	pos3[2],	uFrame + u,		vFrame + v, 	samplerID,		alpha,
				 pos4[0], pos4[1], 	pos4[2],	uFrame + u, 	vFrame, 		samplerID,		alpha], this._index * this._vertexDataCount);	

		// Add 4 vertices to the index count.
		this._index += 4;
		
		/*
		 * If we hit our texture limit, we draw. Draw will reset the texture and index values.
		 * This will effectively "reset" the renderer, but because we'll still be getting nodes in order, this won't change.
		 * It will be as though nothing ever happened, and all the nodes preceding this point never existed.
		 * Since they're already drawn, doing this will be no problem.
		 */
		this._poolMat4(mvMatrix);
		if (this._textures.length + this._cacheTextures.length > 31) {
			this._draw(ctx);
		}
	};
	
	/*
	 * _draw runs the draw method and resets everything. This way, multiple draw methods can be called (if needed).
	 */
	p._draw = function(ctx) {
		ctx.bufferSubData(ctx.ARRAY_BUFFER, 0, this.vertices.subarray(0, this._index * this._vertexDataCount));
		ctx.drawElements(ctx.TRIANGLES, this._index * 1.5, ctx.UNSIGNED_SHORT, 0);
		
		this._index = 0;
		this._textureCount = 0;
		this._textures = [];
	};
	
	/*
	 * Cache images are always being saved to the array. This will remove all those that aren't used (they've been overwritten
	 * by a new image due to a cacheID change).
	 */
	
	p._cleanCache = function() {
		var textures = this._cacheTextures;
		for (var i = 0, l = textures.length; i < l; i++) {
			if (!textures[i]._isUsed) {
				textures.splice(i, 1);
				i--;
				l--;
			} else {
				textures[i]._isUsed = false;
			}
		}
	};
	
	/*
	 * Because it takes so much processor to create mat4s, they are pooled.
	 */
	p._getMat4 = function() {
		if (this._matPool.length > 0) {
			return this._matPool.pop();
		} else {
			return mat4.create();
		}
	};
	p._poolMat4 = function(mat) {
		this._matPool.push(mat);
	};

window.RendererWebGL = RendererWebGL;
}(window));