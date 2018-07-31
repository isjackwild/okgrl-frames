const THREE = require('three');
import _ from 'lodash';
import detectIt from 'detect-it';

export let scene, hdrScene, boxMesh;
import { camera, cameraCube, visWidth, visHeight } from './camera.js';
import { intersectableObjects } from './input-handler.js';
import Frame from './Frame.js';
import { WIND_Y_VELOCITY, MAX_SCROLL_SPEED, SPREAD_X, SPREAD_Y, SPREAD_Y_S, FRAMES_COUNT, HDR_SRC } from './CONSTANTS.js';
import { convertToRange } from './lib/maths';

const frames = [];

const SCROLL = new THREE.Vector3();
const WIND = new THREE.Vector3(0, WIND_Y_VELOCITY, 0);

let isTouched = false, easeTouchMove = false, debounceTouchMove = false;
let touchDiff = 0;
let touchCurrent = 0;
let touchLast = 0;

export const init = () => {
	window.addEventListener('mousewheel', onMouseWheel, detectIt.passiveEvents ? {passive:true} : false);
	window.addEventListener('touchstart', onTouchStart);
	window.addEventListener('touchend', onTouchEnd);
	window.addEventListener('touchmove', onTouchMove);
	
	hdrScene = new THREE.Scene();
	scene = new THREE.Scene();

	scene.add(camera);
	scene.add(new THREE.AmbientLight( 0xffffff, 0.6 ));
	// scene.add(new THREE.AxesHelper(100));
	const spot = new THREE.SpotLight(0xffffff, 0.33);
	spot.position.set(visWidth * 0.4, visHeight * 1.2, camera.position.z);
	scene.add(spot);

	const skybox = new THREE.Mesh(
		new THREE.SphereBufferGeometry(100, 12, 12),
		new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load(HDR_SRC, () => { window.hdrNeedsRender = true }), side: THREE.BackSide })
	);

	hdrScene.add(skybox);
	hdrScene.add(new THREE.AmbientLight( 0xffffff ));

	const directionalLight = new THREE.PointLight( 0xffffff, 0.15, 0, 2 );
	directionalLight.position.copy(camera.position);
	directionalLight.position.z = -10000;
	directionalLight.position.y = -100;

	for (let i = 0; i < FRAMES_COUNT; i++) {
		let x = Math.random() * visWidth * SPREAD_X;
		if (i % 2 === 0) x -= visWidth * SPREAD_X;

		const y = (i * visHeight * (window.app.size === 's' ? SPREAD_Y_S : SPREAD_Y) / FRAMES_COUNT) - (visHeight * (window.app.size === 's' ? SPREAD_Y_S : SPREAD_Y) * 0.5);
		const z = i % 2 ? -30 - Math.random() * 15 : 0 - Math.random() * 15;
		const renderOrder = i % 2 ? 1 : 2;

		const f = new Frame({ position: new THREE.Vector3(x, y, z), index: i, renderOrder });
		frames.push(f);
		intersectableObjects.push(f.plane);
		scene.add(f);
	}
}

const onMouseWheel = _.throttle((e) => {
	SCROLL.y = Math.min(e.wheelDeltaY * 0.035, 66) * -1;
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
	touchDiff = Math.min(touchLast - touchCurrent, 66);
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
	SCROLL.y = _.clamp(SCROLL.y, MAX_SCROLL_SPEED * -1, MAX_SCROLL_SPEED);
	frames.forEach(f => {
		f.applyForce(WIND);
		f.applyForce(SCROLL);
		f.update(correction);
	});
	SCROLL.set(0, 0, 0);
	debounceTouchMove = false;
	if (doEaseTouchMove) doEaseTouchMove();
}