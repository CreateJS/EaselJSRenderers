/*
* Renderer2D by Grant Skinner. Dec 5, 2010
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

/**
* A stage is the root level Container for a display list. Each time its tick method is called, it will render its display
* list to its target canvas.
* @class Stage
* @extends Container
* @constructor
* @param {HTMLCanvasElement} canvas The canvas the stage will render to.
**/
var RendererSWF = function(root, surface) {
  this.initialize(root, surface);
}
var p = RendererSWF.prototype = new Renderer();
	// public properties:
	p.snapToPixel = true;
	p.swf;
	p.idByData = {};
	p.renderBuffer = {};
	p.currentId = 0;
	p.dataByImage = {};
	
	p.idList = []
	p.matrixList = [];
	p.dataList = [];
	
// constructor:

// public methods:

	p.getSurface = function(width, height) {
		var swf = "RendererCPU.swf";
		//var swf = "RendererGPU.swf";
		var wmode = "direct";
		if (this.surface == null) {
			this.surface = document.createElement("div");
			this.surface.innerHTML = '<object id="SWFRenderer" type="application/x-shockwave-flash" data="'+swf+'?'+(Math.random() * 2000|0)+'" width="100%" height="100%"><param name="movie" value="'+swf+'?'+(Math.random() * 2000|0)+'" /><param name="quality" value="high" /><param name="bgcolor" value="#000000" /><param name="play" value="true" /><param name="loop" value="true" /><param name="wmode" value="wmode" /><param name="menu" value="true" /><param name="devicefont" value="false" /><param name="salign" value="" /><param name="allowScriptAccess" value="sameDomain" /><!--<![endif]--><!--[if !IE]>--></object>';
		}
		if (width) { this.surface.style.pixelWidth = width; }
		if (height) { this.surface.style.pixelHeight = height; }
		
		return this.surface;
	}

	/**
	* Clears the target canvas. Useful if autoClear is set to false.
	* @method clear
	**/
	p.clear = function() {
		if(p.swf){
			//p.swf.clear();
		}
	}

	p.render = function(displayObject, surface) {
		if(!p.swf){
			p.swf = document.getElementById("SWFRenderer");
		}
		//Check if external interface is ready...
		if(!p.swf.renderBatch){ return; }
		
		displayObject = displayObject || this.root;
		surface = surface || this.surface;
		if (displayObject && surface) {
			//Clear buffered render values
			p.idList.length = 0;
			p.dataList.length = 0;
			p.matrixList.length = 0;
		
			//Start recursion
			this._render(p.swf, displayObject);
		}
		
		if(p.swf.renderBatch){
			p.renderBuffer.id = p.idList.join(",");
			p.renderBuffer.data = p.dataList.join(",");
			p.renderBuffer.matrix = p.matrixList.join(",");
			
			p.swf.renderBatch(p.renderBuffer);
		}
	}

	p._render = function(ctx,o,mtx) {
		
		if (!o.isVisible()) { return; }
		
		if (mtx) {
			o._matrix.reinitialize(mtx.a,mtx.b,mtx.c,mtx.d,mtx.tx,mtx.ty,mtx.alpha,mtx.shadow,mtx.compositeOperation);
		} else {
			o._matrix.reinitialize(1,0,0,1,0,0);
		}
		mtx = o._matrix;
		mtx.appendTransform(o.x, o.y, o.scaleX, o.scaleY, o.rotation, o.skewX, o.skewY, o.regX, o.regY);
		
		// Try and get a cache...
		var cacheData = p.sampleData;
		if(!o.cacheCanvas){
			if(o instanceof Bitmap){
				if(p.dataByImage[o.image.src]){
					cacheData = p.dataByImage[o.image.src];
					//console.log("Render from image cache");
				} else {
					o.cache(0, 0, o.image.width * o.scaleX, o.image.height * o.scaleY);
					cacheData = o.getCacheDataURL();
					p.dataByImage[o.image.src] = cacheData;
					//console.log("Cache bitmap: " + o.image.src);
				}
			} else if(o instanceof BitmapSequence){
				if(p.dataByImage[o.spriteSheet.image.src + "-" + o.currentFrame]){
					cacheData = p.dataByImage[o.spriteSheet.image.src + "-" + o.currentFrame];
					//console.log("Render from image cache");
				} else {
					//@GRANT - This part is broken, it should be getting a full untransformed cache for each frame... 
					//instead transforms are being applied to the cache, so I end up with random image scale/rotation
					o.cache(0, 0, o.spriteSheet.frameWidth, o.spriteSheet.frameHeight);
					cacheData = o.getCacheDataURL();
					p.dataByImage[o.spriteSheet.image.src + "-" + o.currentFrame] = cacheData;
					//console.log("Cache bitmapSequence: " + o.spriteSheet.image.src + "-" + o.currentFrame);
				}
			}
		}
		
		//Render element
		if (o instanceof Container == false && cacheData) {
			cacheData = cacheData.split("base64,")[1];
			var id = p.idByData[cacheData];
			//If we don't have an id yet for this image, make one, and pass the full data.
			if(isNaN(id)){
				id = p.currentId++;
				p.idByData[cacheData] = id;
				p.dataList.push(cacheData);
				//console.log("Caching sprite for id:" + id);
			} 
			//Render by id, we've already passed data to the swf.
			else {
				id = p.idByData[cacheData];
				p.dataList.push("");
				//console.log("Using cache: ", id);
			}
			p.idList.push(id);
			p.matrixList.push(mtx.a + "|" + mtx.b + "|" + mtx.c + "|" + mtx.d + "|" + mtx.tx + "|" + mtx.ty + "|" + o.alpha);

		} else if (o instanceof Container) {
			var list = o.children.slice(0);
			for (var i=0,l=list.length; i<l; i++) {
				this._render(ctx,list[i]);
			}
		} else {
			console.log("Skipped rendering, no cache.");
		}
	}

window.RendererSWF = RendererSWF;
}(window));