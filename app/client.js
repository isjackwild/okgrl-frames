const THREE = require('three');
const dat = require('dat-gui');
require('./vendor/ColladaLoader.js');

const loadingManager = new THREE.LoadingManager();
const textureLoader = new THREE.TextureLoader(loadingManager);
const colladaLoader = new THREE.ColladaLoader(loadingManager);

import { init, renderer } from './loop.js';
import { camera, onResize as onResizeCamera } from './camera.js';
import { GEOM_SRCS, FRAME_SRCS, PHOTO_SRCS } from './CONSTANTS.js';
import _ from 'lodash';

window.app = window.app || {};
const loadedFrames = [];
const loadedFrameTextures = [];
const loadedImageTextures = [];
window.app.loadedAssets = {
	frames: [],
	frameTextures: [],
	imageTextures: [],
}


const kickIt = () => {
	if (window.location.search.indexOf('debug') > -1) app.debug = true;
	if (app.debug) {
		app.gui = new dat.GUI();
	}
	addEventListeners();
	onResize();

	// GEOM_SRCS.forEach(s => {
	// 	colladaLoader.load(s, onLoadedGeom);
	// });
	loadingManager.onLoad = init;
	GEOM_SRCS.forEach(s => colladaLoader.load(s, object => window.app.loadedAssets.frames.push(object.scene.children)));
	FRAME_SRCS.forEach(s => textureLoader.load(s, texture => window.app.loadedAssets.frameTextures.push(texture)));
	PHOTO_SRCS.forEach(s => textureLoader.load(s.src, texture => window.app.loadedAssets.imageTextures.push(texture)));
}

// const load = () => {

// }

// const onLoadedGeom = (object) => {
// 	const frame = object.scene.children;
// 	loadedFrames.push(frame);

// 	if (loadedFrames.length === GEOM_SRCS.length) init(loadedFrames);
// }


const onResize = () => {
	window.app.width = window.innerWidth;
	window.app.height = window.innerHeight;

	if (renderer) renderer.setSize(window.app.width, window.app.height);
	onResizeCamera();
}

const addEventListeners = () => {
	window.addEventListener('resize', _.debounce(onResize, 111));
	window.addEventListener('orientationchange', _.debounce(onResize, 111));
}


if (document.addEventListener) {
	document.addEventListener('DOMContentLoaded', kickIt);
} else {
	window.attachEvent('onload', kickIt);
}