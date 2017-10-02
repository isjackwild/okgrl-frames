const THREE = require('three');
import { init as initScene, scene, update as updateScene } from './scene.js';
import { init as initCamera, camera, onResize as onResizeCamera } from './camera.js';
import { init as initInputHandler } from './input-handler.js';

let canvas;
let raf, then, now, correction, isFocused = true, isInit = false, isAnimating = false;
let currentCamera, currentScene;
export let renderer;

export const init = (frames) => {
	canvas = document.getElementsByClassName('canvas')[0];
	setupRenderer();
	initCamera();
	initScene(frames);
	initInputHandler();
	window.addEventListener('focus', onFocus);
	window.addEventListener('blur', onBlur);

	currentCamera = camera;
	currentScene = scene;
	now = new Date().getTime();
	animate();
	isInit = true;
}

export const kill = () => {
	cancelAnimationFrame(raf);
	isAnimating = false;
}

const onFocus = () => {
	if (!isInit || isAnimating) return;
	isFocused = true;
	animate();
}

const onBlur = () => {
	isFocused = false;
	cancelAnimationFrame(raf);
	isAnimating = false;
	then = now = correction = null;
}

const setupRenderer = () => {
	renderer = new THREE.WebGLRenderer({
		canvas,
		antialias: true,
		alpha: true,
	});
	renderer.setClearColor(0xffffff, 0);
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
	isAnimating = true;
	then = now ? now : null;
	now = new Date().getTime();
	correction = then ? (now - then) / 16.666 : 1;

	update(correction);
	render();
	raf = requestAnimationFrame(animate);
}
