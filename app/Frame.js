const THREE = require('three');
import { TweenLite } from 'gsap';
import { camera } from './camera.js';
import { ray } from './input-handler.js';

class Frame extends THREE.Object3D {
	constructor(args) {
		super(args);
		const { position } = args;

		this.position.copy(position);
		this.positionVelocity = new THREE.Vector3(0, 0, 0);
		this.restPosition = new THREE.Vector3().copy(position);
		this.targetPosition = new THREE.Vector3().copy(position);
		this.restToTargetVector = new THREE.Vector3();

		this.targetRotation = new THREE.Euler();
		this.backupRotation = new THREE.Euler();
		this.tmpEuler = new THREE.Euler();

		this.acc = new THREE.Vector3();
		this.tmp = new THREE.Vector3();

		this.mass = Math.random() * 0.3 + 0.7;

		this.isDead = false;
		this.isSelected = false;
		this.isAnimating = false;
		this.isFocused = false;

		this.onClick = this.onClick.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);

		this.setupMesh();
		console.log(this);
	}

	setupMesh() {
		const geom = new THREE.BoxGeometry(100, 60, 7);
		const material = new THREE.MeshBasicMaterial({ color: 0x0000ff, wireframe: true });
		const mesh = new THREE.Mesh(geom, material);
		mesh.onClick = this.onClick;
		mesh.onFocus = this.onFocus;
		mesh.onBlur = this.onBlur;
		this.add(mesh);
	}

	onClick() {
		if (this.isAnimating) return;
		console.log('on click');
		this.isSelected = !this.isSelected;
		if (this.isSelected) return this.select();
		this.unSelect();
	}

	onFocus() {
		console.log('on focus');
		this.isFocused = true;
	}

	onBlur() {
		console.log('on blur');
		this.isFocused = false;
	}

	applyForce(vec) {
		if (this.isSelected) return;
		this.tmp.copy(vec).multiplyScalar(this.mass);
		this.acc.add(this.tmp);
	}

	select() {
		this.isAnimating = true;
		// this.backupRotation.copy(this.rotation);
		// this.lookAt(camera.position);
		// this.targetRotation.copy(this.rotation);
		// this.rotation.copy(this.backupRotation);

		TweenLite.to(this.position, 1.5, { x: 0, y: 0, z: -100, ease: Elastic.easeOut.config(0.9, 0.5), oncomplete: () => this.isAnimating = false });
		TweenLite.to(this.rotation, 1.5, { x: 0, y: 0, z: 0, ease: Elastic.easeOut.config(0.9, 0.5) });
		TweenLite.to(camera.position, 0.4, { x: 0, y: 0, z: -200, ease: Sine.easeOut });
	}

	unSelect() {
		this.isAnimating = true;
		this.backupRotation.copy(this.rotation);
		this.lookAt(this.tmp.copy(camera.position).add(ray.direction.normalize().multiplyScalar(200)));
		this.targetRotation.copy(this.rotation);
		this.rotation.copy(this.backupRotation);
		TweenLite.to(this.position, 1.5, { x: this.restPosition.x, y: this.restPosition.y, z: this.restPosition.z, ease: Elastic.easeOut.config(0.9, 0.5), oncomplete: () => this.isAnimating = false });
		TweenLite.to(this.rotation, 1.5, { x: this.targetRotation.x, y: this.targetRotation.y, z: this.targetRotation.z, ease: Elastic.easeOut.config(0.9, 0.5) });
		TweenLite.to(camera.position, 0.4, { x: 0, y: 0, z: -300, ease: Sine.easeOut });
	}

	update(correction) {
		this.restPosition.add(this.acc.multiplyScalar(correction));
		if (!this.isSelected && !this.isAnimating) {
			if (this.isFocused) {
				
				this.tmp
					.copy(ray.direction.normalize())
					.multiplyScalar(this.position.distanceTo(camera.position));

				this.targetPosition
					.copy(camera.position)
					.add(this.tmp);


				this.restToTargetVector
					.copy(this.targetPosition)
					.sub(this.restPosition);
				const scalar = 1 - ((this.restToTargetVector.length() / 30) / 2);
				this.restToTargetVector
					.multiplyScalar(Math.max(0, scalar))
					.clampLength(0, 30);
				this.targetPosition.copy(this.restPosition).add(this.restToTargetVector);
			} else {
				this.targetPosition.copy(this.restPosition);
			}

			// WTF is happening here?
			// this.backupRotation.copy(this.rotation);
			this.lookAt(this.tmp.copy(camera.position).add(ray.direction.normalize().multiplyScalar(200)));
			// this.targetRotation.copy(this.rotation);
			// this.rotation.copy(this.backupRotation);
			// this.rotation.x += (this.targetRotation.x - this.rotation.x) * 0.1;
			// this.rotation.y += (this.targetRotation.y - this.rotation.y) * 0.1;
			// this.rotation.z += (this.targetRotation.z - this.rotation.z) * 0.1;

			const spring = 0.025;
			const damping = 0.92;
			// TODO. have offset position seperate to other position, so don't get super springy on scroll
			this.positionVelocity.add(this.tmp.copy(this.targetPosition).sub(this.position).multiplyScalar(spring).multiplyScalar(correction));
			this.position.add(this.positionVelocity.multiplyScalar(damping));


		}




		this.acc.set(0, 0, 0);
	} 
}

export default Frame;



