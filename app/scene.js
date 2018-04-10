const THREE = require('three');
import _ from 'lodash';

export let scene, plaqueScene, hdrScene, boxMesh, plaqueLight, plaque;
import { camera, cameraCube, cameraCubePlaque, visWidth, visHeight } from './camera.js';
import { intersectableObjects } from './input-handler.js';
import Frame from './Frame.js';
import { WIND_Y_VELOCITY, SPREAD_X, SPREAD_Y, FRAMES_COUNT, HDR_SRC } from './CONSTANTS.js';
import { convertToRange } from './lib/maths';

const frames = [];

const SCROLL = new THREE.Vector3();
const WIND = new THREE.Vector3(0, WIND_Y_VELOCITY, 0);

let isTouched = false, easeTouchMove = false, debounceTouchMove = false;
let touchDiff = 0;
let touchCurrent = 0;
let touchLast = 0;

export const init = () => {
	console.log(window.app);
	window.addEventListener('mousewheel', onMouseWheel);
	window.addEventListener('touchstart', onTouchStart);
	window.addEventListener('touchend', onTouchEnd);
	window.addEventListener('touchmove', onTouchMove);
	
	hdrScene = new THREE.Scene();
	scene = new THREE.Scene();
	plaqueScene = new THREE.Scene();

	scene.add(camera);
	scene.add(new THREE.AmbientLight( 0xffffff, 0.33 ));
	const spot = new THREE.SpotLight(0xffffff, 0.66);
	spot.position.set(visWidth * 0.4, visHeight * 1.2, camera.position.z);
	scene.add(spot);

	const skybox = new THREE.Mesh(
		new THREE.SphereBufferGeometry(100, 12, 12),
		new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load(HDR_SRC, () => { window.hdrNeedsRender = true }), side: THREE.BackSide })
	);

	hdrScene.add(skybox);
	hdrScene.add(new THREE.AmbientLight( 0xffffff ));

	const plaqueLight = new THREE.SpotLight(0xffffff, 0.1);
	plaqueLight.penumbra = 1;
	plaqueLight.angle = 1.05;
	plaqueLight.position.set(0, 250, -10000);
	plaqueScene.add(plaqueLight);
	plaqueScene.add(new THREE.AmbientLight( 0xffffff, 0.3 ));
	const directionalLight = new THREE.PointLight( 0xffffff, 0.15, 0, 2 );
	directionalLight.position.copy(camera.position);
	directionalLight.position.z = -10000;
	directionalLight.position.y = -100;
	// directionalLight.target.position.set(0, 0, 0);
	plaqueScene.add(directionalLight);
	plaque = new THREE.Mesh(
		new THREE.BoxGeometry(300 * 0.66, 90 * 0.66, 5),
		new THREE.MeshStandardMaterial({
			color: 0xd6c962,
			map: new THREE.TextureLoader().load('assets/maps/plaque--map.jpg'),
			bumpMap: new THREE.TextureLoader().load('assets/maps/plaque--map.jpg'),
			bumpScale: 2,
			metalnessMap: new THREE.TextureLoader().load('assets/maps/plaque--map.jpg'),
			roughnessMap: new THREE.TextureLoader().load('assets/maps/plaque--roughness-map.jpg'),
			envMap: cameraCubePlaque.renderTarget.texture,
			envMapIntensity: 0.8,
			side: THREE.DoubleSide,
			metalness: 0.85,
			roughness: 0.95,
			transparent: true,
			depthWrite: false,
		}),
	);
	plaqueScene.add(plaque);
	cameraCubePlaque.position.copy(plaque.position);

	for (let i = 0; i < FRAMES_COUNT; i++) {
		let x = Math.random() * visWidth * SPREAD_X;
		if (i % 2 === 0) x -= visWidth * SPREAD_X;

		const y = (i * visHeight * SPREAD_Y / FRAMES_COUNT) - (visHeight * SPREAD_Y * 0.5);
		const z = i % 2 ? -30 - Math.random() * 15 : 0 - Math.random() * 15;
		const renderOrder = i % 2 ? 1 : 2;

		// const model = window.app.loadedAssets.frames[0];
		const f = new Frame({ position: new THREE.Vector3(x, y, z), index: i, renderOrder });
		// f.lookAt(camera.position);
		frames.push(f);
		intersectableObjects.push(f.inputListener);
		scene.add(f);
	}

	scene.add(cameraCubePlaque);

	window.addEventListener('mousemove', ({ clientX, clientY }) => {
		const posX = convertToRange(clientX, [0, window.innerWidth], [-190, 190]);
		const posY = convertToRange(clientY, [0, window.innerHeight], [50, -50]);
		plaqueLight.position.x = posX;
		plaqueLight.position.y = posY;

		const rotX = convertToRange(clientY, [0, window.innerHeight], [-0.1, 0.1]);
		const rotY = convertToRange(clientX, [0, window.innerWidth], [-0.075, 0.075]);
		plaque.rotation.x = rotX;
		plaque.rotation.y = rotY;
	});
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
	plaque.material.needsUpdate = true;
	plaque.material.envMap.needsUpdate = true;
	if (doEaseTouchMove) doEaseTouchMove();
}