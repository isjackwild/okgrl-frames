const THREE = require('three');
const dat = require('dat-gui');
require('./vendor/ColladaLoader.js');

const loadingManager = new THREE.LoadingManager();
const textureLoader = new THREE.TextureLoader(loadingManager);
// const colladaLoader = new THREE.ColladaLoader(loadingManager);

import { init, renderer } from './loop.js';
import { camera, onResize as onResizeCamera } from './camera.js';
import { GEOM_LANDSCAPE, GEOM_PORTRAIT, FRAME_SRCS, PHOTO_SRCS } from './CONSTANTS.js';
import _ from 'lodash';

window.app = window.app || {};
window.app.size = 'm';
const loadedFrames = [];
const loadedFrameTextures = [];
const loadedImageTextures = [];
window.app.loadedAssets = {
	frameP: null,
	frameL: null,
	frameTextures: [],
	imageTextures: [],
}

let imagesLoaded = false;

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
	loadingManager.onLoad = () => {
		imagesLoaded = true;
		if (window.app.loadedAssets.frameP && window.app.loadedAssets.frameL) init();
	}

	new THREE.ColladaLoader(loadingManager).load(GEOM_PORTRAIT, object => {
		object.scene.name = 'PORTRAIT';
		window.app.loadedAssets.frameP = object.scene.children;
		if (window.app.loadedAssets.frameP && window.app.loadedAssets.frameL && imagesLoaded) init();
	});
	new THREE.ColladaLoader(loadingManager).load(GEOM_LANDSCAPE, object => {
		object.scene.name = 'LANDSCAPE';
		window.app.loadedAssets.frameL = object.scene.children;
		if (window.app.loadedAssets.frameP && window.app.loadedAssets.frameL && imagesLoaded) init();
	});
	FRAME_SRCS.forEach(s => textureLoader.load(s, texture => window.app.loadedAssets.frameTextures.push(texture)));
	PHOTO_SRCS.forEach((s, i) => textureLoader.load(s.src, texture => window.app.loadedAssets.imageTextures[i] = texture));
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

	window.app.size = (() => {
		if ((window.app.height > window.app.width) && (window.app.width <= 768)) return 's';
		if (window.app.width > 1900) return 'l';
		return 'm';
	})();

	console.log(window.app.size);
	if (renderer) renderer.setSize(window.app.width, window.app.height);
	onResizeCamera(window.app.width, window.app.height);
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