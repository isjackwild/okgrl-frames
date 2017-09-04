const THREE = require('three');
const dat = require('dat-gui');

import { init, renderer } from './loop.js';
import { camera, onResize as onResizeCamera } from './camera.js';
import _ from 'lodash';

window.app = window.app || {};


const kickIt = () => {
	if (window.location.search.indexOf('debug') > -1) app.debug = true;
	if (app.debug) {
		app.gui = new dat.GUI();
	}
	addEventListeners();
	onResize();
	init();
}

const onResize = () => {
	window.app.width = window.innerWidth;
	window.app.height = window.innerHeight;

	if (renderer) renderer.setSize(window.app.width, window.app.height);
	onResizeCamera();
}

const addEventListeners = () => {
	window.addEventListener('resize', _.throttle(onResize, 16.666));
}


if (document.addEventListener) {
	document.addEventListener('DOMContentLoaded', kickIt);
} else {
	window.attachEvent('onload', kickIt);
}