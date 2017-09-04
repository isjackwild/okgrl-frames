const THREE = require('three');
import _ from 'lodash';

export let scene, boxMesh;
import { camera, visWidth, visHeight } from './camera.js';
import { intersectableObjects } from './input-handler.js';
import Frame from './Frame.js';
import { WIND, FRAMES_COUNT } from './CONSTANTS.js';

const frames = [];

const SCROLL = new THREE.Vector3();

export const init = () => {
	window.addEventListener('mousewheel', onMouseWheel);
	scene = new THREE.Scene();
	scene.add(camera);
	scene.add(new THREE.AmbientLight( 0xffffff ));

	for (let i = 0; i < FRAMES_COUNT; i++) {
		const x = (Math.random() * visWidth) - (visWidth * 0.5);
		const y = (Math.random() * visHeight) - (visHeight * 0.5);
		const z = i % 2 ? -5 : -6 - Math.random() * 2;
		console.log(x, y, z);
		const f = new Frame({ position: new THREE.Vector3(x, y, z) });
		frames.push(f);
		intersectableObjects.push(f);
		scene.add(f);
	}
}

const onMouseWheel = _.throttle((e) => {
	SCROLL.y = Math.min(e.wheelDeltaY * 0.15, 40) * -1;
}, 16.666);

export const update = (correction) => {
	frames.forEach(f => {
		f.applyForce(WIND);
		f.applyForce(SCROLL);
		f.update(correction);
	});
	SCROLL.set(0, 0, 0);
}