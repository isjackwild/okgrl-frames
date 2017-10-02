const THREE = require('three');
const dat = require('dat-gui');
require('./vendor/ColladaLoader.js');

export const textureLoader = new THREE.TextureLoader();
export const colladaLoader = new THREE.ColladaLoader();


import { init, renderer } from './loop.js';
import { camera, onResize as onResizeCamera } from './camera.js';
import { GEOM_SRCS } from './CONSTANTS.js';
import _ from 'lodash';

window.app = window.app || {};
const loadedFrames = [];

const kickIt = () => {
	if (window.location.search.indexOf('debug') > -1) app.debug = true;
	if (app.debug) {
		app.gui = new dat.GUI();
	}
	addEventListeners();
	onResize();

	GEOM_SRCS.forEach(s => {
		colladaLoader.load(s, onLoadedGeom);
	});
}

const onLoadedGeom = (object) => {
	const frame = object.scene.children;
	loadedFrames.push(frame);

	if (loadedFrames.length === GEOM_SRCS.length) init(loadedFrames);
}

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