const THREE = require('three');
import _ from 'lodash';

export let scene, hdrScene, boxMesh;
import { camera, visWidth, visHeight } from './camera.js';
import { intersectableObjects } from './input-handler.js';
import Frame from './Frame.js';
import { WIND_Y_VELOCITY, FRAMES_COUNT, HDR_SRC } from './CONSTANTS.js';

const frames = [];

const SCROLL = new THREE.Vector3();
const WIND = new THREE.Vector3(0, WIND_Y_VELOCITY, 0);

let isTouched = false, easeTouchMove = false, debounceTouchMove = false;
let touchDiff = 0;
let touchCurrent = 0;
let touchLast = 0;

export const init = (framesObjects) => {
	window.addEventListener('mousewheel', onMouseWheel);
	window.addEventListener('touchstart', onTouchStart);
	window.addEventListener('touchend', onTouchEnd);
	window.addEventListener('touchmove', onTouchMove);
	hdrScene = new THREE.Scene();
	scene = new THREE.Scene();
	scene.add(camera);
	scene.add(new THREE.AmbientLight( 0xffffff, 0.5 ));
	const spot = new THREE.SpotLight(0xffffff, 0.8);
	spot.position.set(visWidth * 0.4, visHeight * 1.2, camera.position.z);
	scene.add(spot);

	const skybox = new THREE.Mesh(
		new THREE.SphereBufferGeometry(100, 12, 12),
		new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load(HDR_SRC, () => { window.hdrNeedsRender = true }), side: THREE.BackSide })
	);

	hdrScene.add(skybox);
	hdrScene.add(new THREE.AmbientLight( 0xffffff ));


	for (let i = 0; i < FRAMES_COUNT; i++) {
		let x = Math.random() * visWidth * 0.5;
		if (i % 2 === 0) x -= visWidth * 0.5;
		const y = (i * visHeight * 1.6 / FRAMES_COUNT) - (visHeight * 1.6 * 0.5);
		const z = i % 2 ? -30 - Math.random() * 15 : 0 - Math.random() * 15;
		const renderOrder = i % 2 ? 1 : 2;

		const model = framesObjects[Math.floor(Math.random() * framesObjects.length)];
		const f = new Frame({ position: new THREE.Vector3(x, y, z), index: i, model, renderOrder });
		f.lookAt(camera.position);
		frames.push(f);
		intersectableObjects.push(f.inputListener);
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
	SCROLL.y = touchDiff / 2;

	touchLast = touchCurrent;
}, 16.666);

const doEaseTouchMove = () => {
	touchDiff /= 1.075;
	SCROLL.y = touchDiff / 2;
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