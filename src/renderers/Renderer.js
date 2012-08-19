/*
* Renderer by Grant Skinner. Dec 5, 2010
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
var Renderer = function(root,surface) {
  this.initialize(root,surface);
}
var p = Renderer.prototype;

// static properties:

// public properties:
	p.root = null;
	p.surface = null;
	p.tickOnUpdate = true;

// constructor:

	/**
	* Initialization method.
	* @method initialize
	* @param {DisplayObject} root
	* @protected
	**/
	p.initialize = function(root,surface) {
		this.root = root;
		this.surface = surface;
	}

// public methods:

	/**
	 * If the current surface is null, this creates a new DOM object that will be used as the
	 * display surface for this renderer. For example, for the WebGL renderer, this would return
	 * a Canvas object with the specified dimensions. If a surface is already set, calling
	 * createSurface will update the dimensions of the existing surface and return it.
	 * @method createSurface
	 * @param width The width of the surface to create (or to resize the current surface to)
	 * @param height The height of the surface to create (or resize the current surface to)
	 */
	p.getSurface = function(width, height) {}

	/**
	 * Clears the surface, ticks all display objects on the display list defined by root, and then renders root
	 * to the current surface. Use the clear(), tickDisplayList(), and render() methods if you want
	 * more control over the individual tasks.
	 * @method update
	 **/
	p.update = function() {
		this.clear();
		if (this.tickOnUpdate) { this.tickDisplayList(this.root, this.arguments); }
		this.render(this.root,this.surface);
	}

	/**
	* Calls the update method. Useful for adding the renderer as a listener to Ticker directly.
	* @property tick
	* @private
	* @type Function
	**/
	p.tick = p.update;

	/**
	* Clears all graphics that are currently rendered to the surface. Useful if autoClear is set to false.
	* @method clear
	**/
	p.clear = function() {}

	/**
	 * Renders the specified displayObject to the specified surface.
	 * @param displayObject The DisplayObject instance to render. Defaults to root.
	 * @param surface The surface to render to. This must be the appropriate type for the renderer. Defaults to surface.
	 */
	p.render = function(displayObject, surface) {}

	p.tickDisplayList = function(displayObject, params) {
		if (!displayObject || !displayObject._tick) { return; }
		displayObject._tick((params && params.length ? params : null));
	}

window.Renderer = Renderer;
}(window));