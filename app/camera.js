const THREE = require('three');
export let camera, cameraPlaque, cameraCube, cameraCubePlaque, visWidth = 0, visHeight = 0;

export const init = () => {
	camera = new THREE.PerspectiveCamera(45, window.app.width / window.app.height, 10, 500);
	camera.position.z = 300;
	
	cameraPlaque = new THREE.PerspectiveCamera();
	cameraPlaque.copy(camera);

	onResize(window.innerWidth, window.innerHeight);

	cameraCube = new THREE.CubeCamera(1, 200, 800);
	cameraCube.children.forEach(c => {
		c.fov = 90;
		c.updateProjectionMatrix();
	});

	cameraCubePlaque = new THREE.CubeCamera(1, 1, 800);
	cameraCubePlaque.children.forEach(c => {
		c.fov = 25;
		c.updateProjectionMatrix();
	});
}

export const onResize = (w, h) => {
	if (!camera) return
	camera.aspect = w / h;
	camera.updateProjectionMatrix();

	cameraPlaque.aspect = w / h;
	cameraPlaque.updateProjectionMatrix();

	const vFOV = camera.fov * Math.PI / 180;
	visHeight = 2 * Math.tan( vFOV / 2 ) * Math.abs(camera.position.z);

	const aspect = window.innerWidth / window.innerHeight;
	visWidth = visHeight * aspect;
}