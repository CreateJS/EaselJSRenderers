/*
* RendererSVGMtx by Grant Skinner. Dec 5, 2010
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
var RendererSVGMtx = function(root, surface) {
  this.initialize(root, surface);
}
var p = RendererSVGMtx.prototype = new Renderer();

// static properties:

// public properties:
	p.snapToPixel = true;
	p._tmpZ = 0;
	p._defs = null;
	p._clipPaths = {};
	p._nextClipID = 0;
	
	p.svgns = "http://www.w3.org/2000/svg";
	p.xlinkns = "http://www.w3.org/1999/xlink";

// constructor:

// public methods:

	p.getSurface = function(width, height) {
		if (this.surface == null) {
			this.surface = document.createElementNS(this.svgns, "svg:svg");
			this.surface.style.overflow = "hidden";
			this.surface.style.position = "absolute";
		}
		if (width) { this.surface.setAttribute("width",width); }
		if (height) { this.surface.setAttribute("height",height); }
		return this.surface;
	}

	/**
	* Clears the target canvas. Useful if autoClear is set to false.
	* @method clear
	**/
	p.clear = function() {
		if (!this.surface) { return; }
		while (this.surface.firstChild) { this.surface.removeChild(this.surface.firstChild); }
		this._clipPaths = {};
	}

	p.render = function(displayObject, surface) {
		displayObject = displayObject || this.root;
		surface = surface || this.surface;
		this._tmpZ = 0;
		if (displayObject && surface) {
			this.clear();
			this._defs = document.createElementNS(this.svgns,"defs");
			this.surface.appendChild(this._defs);
			this._render(displayObject,null,surface);
		}
	}

	p._render = function(o,mtx,svg) {
		if (!o.isVisible()) { return ""; }

		if (mtx) {
			o._matrix.reinitialize(mtx.a,mtx.b,mtx.c,mtx.d,mtx.tx,mtx.ty,mtx.alpha,mtx.shadow,mtx.compositeOperation);
		} else {
			o._matrix.reinitialize(1,0,0,1,0,0);
		}
		mtx = o._matrix;
		mtx.appendTransform(o.x, o.y, o.scaleX, o.scaleY, o.rotation, o.skewX, o.skewY, o.regX, o.regY);

		// render the element:
		var node = o.__node;
		var style;
		if (o.cacheCanvas) {
			// not really supported by SVG, would need to use toDataURL() which is very costly!
		} else if (o instanceof Bitmap) {
			if (!node) {
				node = o.__node = document.createElementNS(this.svgns,"image");
				node.setAttributeNS(this.xlinkns,"xlink:href",o.image.src);
				node.setAttribute("width",o.image.width);
				node.setAttribute("height",o.image.height);
			}
			//if (node.src != o.image.src) { node.src = o.image.src; } // seems to have a negative impact on perf.
			style = node.style;
		} else if (o instanceof Container) {
			var list = o.children.slice(0);
			for (var i=0,l=list.length; i<l; i++) {
				this._render(list[i],mtx,svg);
			}
			return; // do not need to add a node for containers when using Matrix rendering.
		} else if (o instanceof BitmapAnimation) {
			var frame = o.spriteSheet.getFrame(o.currentFrame);
			if (frame) {
				var rect = frame.rect;
				if (!node) {
					node = o.__node = document.createElementNS(this.svgns,"image");
					node.setAttributeNS(this.xlinkns,"xlink:href",frame.image.src);
					node.setAttribute("width",frame.image.width);
					node.setAttribute("height",frame.image.height);
				}
				
				var clipCode = rect.width+"_"+rect.height;
				var clip = this._clipPaths[clipCode];
				if (!clip) {
					clip = this._clipPaths[clipCode] = document.createElementNS(this.svgns,"clipPath");
					clip.setAttribute("id","clip_"+(++this._nextClipID));
					var clipRect = document.createElementNS(this.svgns,"rect");
					clipRect.setAttribute("width",rect.width);
					clipRect.setAttribute("height",rect.height);
					clip.appendChild(clipRect);
					this._defs.appendChild(clip);
				}
				node.setAttribute("x",-rect.x);
				node.setAttribute("y",-rect.y);
				node.setAttribute("clip-path","url(#"+clip.id+")");
			}
		}
		
		if (node) {
			node.setAttribute("transform","matrix("+[mtx.a,mtx.b,mtx.c,mtx.d,mtx.tx,mtx.ty].join(",")+")");
			node.setAttribute("opacity",o.alpha);
			
			svg.appendChild(node);
		
		}

	}

window.RendererSVGMtx = RendererSVGMtx;
}(window));