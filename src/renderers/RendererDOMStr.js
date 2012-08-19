/*
* RendererDOMStr by Grant Skinner. Dec 5, 2010
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
var RendererDOMStr = function(root, surface) {
  this.initialize(root, surface);
}
var p = RendererDOMStr.prototype = new Renderer();

// static properties:

// public properties:
	p.snapToPixel = true;

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
	}

	p.render = function(displayObject, surface) {
		displayObject = displayObject || this.root;
		surface = surface || this.surface;
		if (displayObject && surface) {
			surface.innerHTML += this._render(displayObject,0);
		}
	}

	p._render = function(o,z) {
		if (!o.isVisible()) { return ""; }

		// handle the transform:
		var tx = o.x-o.regX;
		var ty = o.y-o.regY;
		var transform = (tx!=0 || ty!=0)|0;
		transform |= (o.scaleX!=1 || o.scaleY!=1)<<1;
		transform |= (o.rotation%360!=0)<<2;

		var style = "position:absolute;z-index:"+z+";";
		if (o.alpha != 1) { style += "opacity:"+o.alpha+";" }
		if (transform==1) {
			tx = tx+0.5|0;
			ty = ty+0.5|0;
			style += "left:"+tx+"px;top:"+ty+"px;";
		} else if (transform > 1) {
			if (o.regX || o.regY) { style += "-webkit-transform-origin:"+o.regX+"px "+o.regY+"px;"; }
			style += "-webkit-transform:";
			if (o.x || o.y) { style += " translate("+tx+"px,"+ty+"px)"; }
			if (transform&4) { style += " rotate("+o.rotation+"deg)"; }
			if (transform&2) { style += " scale("+o.scaleX+","+o.scaleY+")"; }
			style += ";";
		}

		// render the element:
		var tag = "";
		if (o.cacheCanvas) {
			// not really possible when using strings.
		} else if (o instanceof Bitmap) {
			tag = "<img src='"+o.image.src+"' style='"+style+"'></image>";
		} else if (o instanceof Container) {
			tag = "<div style='"+style+"'>";
			var list = o.children.slice(0);
			for (var i=0,l=list.length; i<l; i++) {
				tag += "\n\t"+this._render(list[i],i);
			}
			tag += "</div>"
		} else if (o instanceof BitmapAnimation) {
			var frame = o.spriteSheet.getFrame(o.currentFrame);
			if (frame) {
				var rect = frame.rect;
				tag = "<div style='"+style+"background-image:url(\""+frame.image.src+"\");" +
						  "background-position:"+(-rect.x)+"px "+(-rect.y)+"px;" +
						  "width:"+rect.width+"px;height:"+rect.height+"px;'/></div>";
			}
		}
		return tag;

	}

window.RendererDOMStr = RendererDOMStr;
}(window));