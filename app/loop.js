const THREE = require('three');
import { init as initScene, scene, update as updateScene } from './scene.js';
import { init as initCamera, camera, onResize as onResizeCamera } from './camera.js';
import { init as initInputHandler } from './input-handler.js';

let canvas;
let raf, then, now, correction;
let currentCamera, currentScene;
export let renderer;

export const init = () => {
	canvas = document.getElementsByClassName('canvas')[0];
	setupRenderer();
	initCamera();
	initScene();
	initInputHandler();

	currentCamera = camera;
	currentScene = scene;
	now = new Date().getTime();
	animate();
}

export const kill = () => {
	cancelAnimationFrame(raf);
}

const setupRenderer = () => {
	renderer = new THREE.WebGLRenderer({
		canvas,
		antialias: true,
	});
	renderer.setClearColor(0xffffff);
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
}

const update = (correction) => {
	updateScene(correction);
}

const render = () => {
	currentCamera.lookAt(currentScene.position);
	renderer.render(currentScene, currentCamera);
}

const animate = () => {
	then = now ? now : null;
	now = new Date().getTime();
	correction = then ? (now - then) / 16.666 : 1;

	update(correction);
	render();
	raf = requestAnimationFrame(animate);
}
