##EASELJS DYNAMIC RENDERERS:

This is an experiment that aims to provide runtime pluggable renderers for a subset EaselJS content. They allow you to create your content for EaselJS, then render it to a variety of surfaces (ex. Canvas, WebGL, HTML DOM) dynamically at runtime. It is really only intended as a proof of concept, and as a starting point for more complete renderers.

If you are not familiar with EaselJS already, this is not the best place to start.

Currently, most renderers support displaying Bitmap, BitmapAnimation, Container, and content that has had .cache() applied (ex. Shape, Text). 

Currently, these renderers have only been developed for and tested in Webkit browsers, as proofs of concept. There is a lot of room for improvement and optimization. For example, it should be possible to extend these renderers to support Text directly, as well as providing mouse & possibly touch interaction for all surfaces. Most renderers (WebGL in particular) would also benefit from sprite sheet generation to reduce texture count, most likely via SpriteSheetBuilder.

##Supported surfaces:

**Null renderer:**
* RendererNullMtx - no rendering. Useful for isolating calculation vs display costs.

**Canvas 2D:**
* Renderer2DMtx - uses the EaselJS matrix class avoiding save & restore.
* Renderer2D - transformation based renderer using save & restore.

**HTML DOM:**
* RendererDOMMtx - uses the EaselJS matrix, persistent DOM elements & document fragments.
* RendererDOMMtxStr - generates innerHTML on the surface div using matrix values.
* RendererDOMStr - generates innerHTML on the surface div using transforms.

**SVG:**
* RendererSVGMtx - uses the EaselJS matrix, persistent SVG elements & document fragments.
* RendererSVGMtxStr - generates SVG strings using matrix values.
* RendererSVGStr - generates SVG strings using transforms.

**WebGL:**
* RendererWebGL - sample WebGL renderer. Lots of room for optimizations.

**Flash:**
* RendererSWF - very rough, outdated Flash renderer. Included for reference only.

The renderers that are most stable, and would make the most sense to extend moving forward are: Renderer2DMtx, RendererDOMMtx, and RendererWebGL.