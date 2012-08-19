/*
* RendererSVGMtxStr by Grant Skinner. Dec 5, 2010
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
var RendererSVGMtxStr = function(root, surface) {
  this.initialize(root, surface);
}
var p = RendererSVGMtxStr.prototype = new Renderer();

// static properties:

// public properties:
	p.snapToPixel = true;
	p._defs = "";
	p._clipPaths = {};
	p._nextClipID = 0;

// constructor:

// public methods:

	p.getSurface = function(width, height) {
		if (this.surface == null) {
			this.surface = document.createElement("div");
			this.surface.style.overflow = "hidden";
			this.surface.style.position = "absolute";
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
		if (!this.surface) { return; }
		this.surface.innerHTML = "";
		this._clipPaths = {};
	}

	p.render = function(displayObject, surface) {
		displayObject = displayObject || this.root;
		surface = surface || this.surface;
		if (displayObject && surface) {
			this._clipPaths = {};
			this._defs = "";
			var html = "<svg width='"+this.surface.style.pixelWidth+"' height='"+this.surface.style.pixelWidth+"'>";
			var view = this._render(displayObject,0);
			html += "<defs>"+this._defs+"</defs>"+view;
			//console.log(html);
			surface.innerHTML = html;
		}
	}

	p._render = function(o,mtx,z) {
		if (!o.isVisible()) { return ""; }

		if (mtx) {
			o._matrix.reinitialize(mtx.a,mtx.b,mtx.c,mtx.d,mtx.tx,mtx.ty,mtx.alpha,mtx.shadow,mtx.compositeOperation);
		} else {
			o._matrix.reinitialize(1,0,0,1,0,0);
		}
		mtx = o._matrix;
		mtx.appendTransform(o.x, o.y, o.scaleX, o.scaleY, o.rotation, o.skewX, o.skewY, o.regX, o.regY);

		// render the element:
		var tag = "";
		if (o.cacheCanvas) {
			// not really possible when using strings.
		} else if (o instanceof Bitmap) {
			tag = "<image width='"+o.image.width+"' height='"+o.image.height+"' xlink:href='"+o.image.src+"'";
			if (o.alpha != 1) { tag += " opacity='"+o.alpha+"'"; } // TODO: GDS: need to change this to use matrix values.
			if (mtx.a == 1 && mtx.b == 0 && mtx.c == 0 && mtx.d == 1) {
				tag += " x='"+mtx.tx+"' y='"+mtx.ty+"'/>";
			} else {
				tag += " transform='matrix("+[mtx.a,mtx.b,mtx.c,mtx.d,mtx.tx,mtx.ty].join(",")+")'/>";
			}
		} else if (o instanceof Container) {
			var list = o.children.slice(0);
			for (var i=0,l=list.length; i<l; i++) {
				tag += "\n\t"+this._render(list[i],mtx,z);
			}
		} else if (o instanceof BitmapAnimation) {
			var frame = o.spriteSheet.getFrame(o.currentFrame);
			if (frame) {
				var rect = frame.rect;
				var clipCode = rect.width+"_"+rect.height;
				var clipID = this._clipPaths[clipCode];
				if (!clipID) {
					clipID = "clip_"+(++this._nextClipID);
					this._defs += "<clippath id='clip_"+clipID+"'><rect width='"+rect.width+"' height='"+rect.height+"'/></clipPath>"
				}
				
				tag += "<image clip-path='url(#clip_"+clipID+")' width='"+frame.image.width+
						  "' height='"+frame.image.height+"' xlink:href='"+frame.image.src+
						  "' x='"+(-rect.x)+"' y='"+(-rect.y)+"'";
				tag += " transform='matrix("+[mtx.a,mtx.b,mtx.c,mtx.d,mtx.tx,mtx.ty].join(",")+")'";
				if (o.alpha != 1) { tag += " opacity='"+o.alpha+"'"; }
				tag += " /></g>";
			}
		}
		return tag;

	}

window.RendererSVGMtxStr = RendererSVGMtxStr;
}(window));