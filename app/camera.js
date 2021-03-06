const THREE = require('three');
export let camera, cameraCube, visWidth = 0, visHeight = 0;

export const init = () => {
	camera = new THREE.PerspectiveCamera(45, window.app.width / window.app.height, 10, 500);
	camera.setFocalLength(80);
	camera.position.z = 300;


	onResize(window.innerWidth, window.innerHeight);

	cameraCube = new THREE.CubeCamera(1, 200, 800);
	cameraCube.children.forEach(c => {
		c.fov = 90;
		c.updateProjectionMatrix();
	});
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