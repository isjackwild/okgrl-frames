const THREE = require('three');
import _ from 'lodash';

export let scene, boxMesh;
import { camera, visWidth, visHeight } from './camera.js';
import { intersectableObjects } from './input-handler.js';
import Frame from './Frame.js';
import { WIND_Y_VELOCITY, FRAMES_COUNT } from './CONSTANTS.js';

const frames = [];

const SCROLL = new THREE.Vector3();
const WIND = new THREE.Vector3(0, WIND_Y_VELOCITY, 0);

let isTouched = false, easeTouchMove = false, debounceTouchMove = false;
let touchDiff = 0;
let touchCurrent = 0;
let touchLast = 0;



export const init = () => {
	window.addEventListener('mousewheel', onMouseWheel);
	scene = new THREE.Scene();
	scene.add(camera);
	scene.add(new THREE.AmbientLight( 0xffffff ));

	for (let i = 0; i < FRAMES_COUNT; i++) {
		let x = Math.random() * visWidth * 0.5;
		if (i % 2 === 0) x -= visWidth * 0.5;
		const y = (i * visHeight / FRAMES_COUNT) - (visHeight * 0.5);
		const z = i % 2 ? -12 : -6 - Math.random() * 4;


		const f = new Frame({ position: new THREE.Vector3(x, y, z), index: i });
		f.lookAt(camera.position);
		frames.push(f);
		intersectableObjects.push(f.frame);
		scene.add(f);
	}
}

const onMouseWheel = _.throttle((e) => {
	SCROLL.y = Math.min(e.wheelDeltaY * 0.15, 40) * -1;
}, 16.666);

const onTouchStart = (e) => {
	isTouched = true;
	easeTouchMove = false;
	touchLast = e.touches[0].clientY;
}

const onTouchEnd = () => {
	isTouched = false;
	SCROLL.y = 0;
	easeTouchMove = true;
}

const onTouchMove = _.throttle((e) => {
	if (debounceTouchMove) return;
	debounceTouchMove = true;

	e.preventDefault();
	touchCurrent = e.touches[0].clientY;
	touchDiff = Math.min(touchLast - touchCurrent, 77);
	SCROLL.y = touchDiff / 2 * -1;

	touchLast = touchCurrent;
}, 16.666);

const doEaseTouchMove = () => {
	touchDiff /= 1.075;
	SCROLL.y = touchDiff / 2 * -1;
	if (Math.abs(touchDiff) < 0.5) {
		easeTouchMove = false;
		SCROLL.y = 0;
	}
}

export const update = (correction) => {
	if (SCROLL.y < 0 && WIND.y > 0 || SCROLL.y > 0 && WIND.y < 0) WIND.y *= -1;
	frames.forEach(f => {
		f.applyForce(WIND);
		f.applyForce(SCROLL);
		f.update(correction);
	});
	SCROLL.set(0, 0, 0);
	debounceTouchMove = false;
	if (doEaseTouchMove) doEaseTouchMove();
}