const THREE = require('three');
export let camera, visWidth = 0, visHeight = 0;

export const init = () => {
	camera = new THREE.PerspectiveCamera(45, window.app.width / window.app.height, 1, 10000);
	camera.position.z = -300;
	onResize(window.innerWidth, window.innerHeight);
}

export const onResize = (w, h) => {
	if (!camera) return
	camera.aspect = w / h;
	camera.updateProjectionMatrix();

	const vFOV = camera.fov * Math.PI / 180;
	visHeight = 2 * Math.tan( vFOV / 2 ) * Math.abs(camera.position.z);

	const aspect = window.innerWidth / window.innerHeight;
	visWidth = visHeight * aspect;
}