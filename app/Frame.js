const THREE = require('three');
import { TweenLite } from 'gsap';
import { camera } from './camera.js';
import { ray } from './input-handler.js';

class Frame extends THREE.Object3D {
	constructor(args) {
		super(args);
		const { position } = args;

		this.position.copy(position);
		this.restPosition = new THREE.Vector3().copy(position);
		
		this.currentOffsetPosition = new THREE.Vector3();
		this.targetOffsetPosition = new THREE.Vector3();
		this.positionOffsetVelocity = new THREE.Vector3(0, 0, 0);
		this.currentToTargetOffsetVector = new THREE.Vector3();

		this.targetRotation = new THREE.Euler();
		this.backupRotation = new THREE.Euler();

		this.acc = new THREE.Vector3();
		this.tmp = new THREE.Vector3();
		this.tmp2 = new THREE.Vector3();

		this.mass = Math.random() * 0.3 + 0.7;

		this.isDead = false;
		this.isSelected = false;
		this.isAnimating = false;
		this.isFocused = false;

		this.onClick = this.onClick.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onIntersect = this.onIntersect.bind(this);
		this.select = this.select.bind(this);
		this.unSelect = this.unSelect.bind(this);
		this.onAnimationComplete = this.onAnimationComplete.bind(this);

		this.setupMesh();
	}

	setupMesh() {
		const geom = new THREE.BoxGeometry(100, 60, 7);
		const material = new THREE.MeshBasicMaterial({ color: 0x0000ff, wireframe: true });
		const mesh = new THREE.Mesh(geom, material);
		mesh.onClick = this.onClick;
		mesh.onFocus = this.onFocus;
		mesh.onBlur = this.onBlur;
		mesh.onIntersect = this.onIntersect;
		this.add(mesh);
	}

	onClick() {
		if (this.isAnimating) return;
		if (this.isSelected) return this.unSelect();
		this.select();
	}

	onFocus() {
		this.isFocused = true;
	}

	onBlur() {
		this.isFocused = false;
		this.targetOffsetPosition.set(0, 0, 0);
	}
	
	onIntersect(intersect) {
		if (this.isSelected || this.isAnimating) {
			this.targetOffsetPosition.set(0, 0, 0);
		} else {
			this.tmp.copy(intersect.point).sub(this.position)
			this.targetOffsetPosition.copy(intersect.point).sub(this.position);
		}
	}

	applyForce(vec) {
		if (this.isSelected) return;
		this.tmp.copy(vec).multiplyScalar(this.mass);
		this.acc.add(this.tmp);
	}

	select() {
		this.isAnimating = true;
		this.isSelected = true;
		this.backupRotation.copy(this.rotation);

		TweenLite.to(this.position, 1.5, { x: 0, y: 0, z: -100, ease: Elastic.easeOut.config(0.9, 0.5), onComplete: this.onAnimationComplete });
		TweenLite.to(this.rotation, 1.5, { x: 0, y: 0, z: 0, ease: Elastic.easeOut.config(0.9, 0.5) });
		TweenLite.to(camera.position, 0.5, { x: 0, y: 0, z: -200, ease: Power4.easeOut });
	}

	unSelect() {
		this.isAnimating = true;
		this.isSelected = false;

		this.targetOffsetPosition.set(0, 0, 0);

		this.targetRotation.copy(this.backupRotation);

		TweenLite.to(this.position, 1.5, { x: this.restPosition.x, y: this.restPosition.y, z: this.restPosition.z, ease: Elastic.easeOut.config(0.9, 0.5), onComplete: this.onAnimationComplete });
		TweenLite.to(this.rotation, 1.5, { x: this.targetRotation.x, y: this.targetRotation.y, z: this.targetRotation.z, ease: Elastic.easeOut.config(0.9, 0.5) });
		TweenLite.to(camera.position, 0.5, { x: 0, y: 0, z: -300, ease: Power4.easeOut });
	}

	onAnimationComplete() {
		this.isAnimating = false;
		console.log('on animation complete');
	}

	update(correction) {
		this.restPosition.add(this.acc.multiplyScalar(correction));
		if (!this.isSelected && !this.isAnimating) {

			// WTF is happening here?
			// this.backupRotation.copy(this.rotation);
			this.lookAt(this.tmp.copy(camera.position).add(ray.direction.normalize().multiplyScalar(111)));
			// this.targetRotation.copy(this.rotation);
			// this.rotation.copy(this.backupRotation);
			// this.rotation.x += (this.targetRotation.x - this.rotation.x) * 0.1;
			// this.rotation.y += (this.targetRotation.y - this.rotation.y) * 0.1;
			// this.rotation.z += (this.targetRotation.z - this.rotation.z) * 0.1;
			

			const spring = 0.025;
			const damping = 0.92;
			this.positionOffsetVelocity.add(this.tmp.copy(this.targetOffsetPosition).sub(this.currentOffsetPosition).multiplyScalar(spring).multiplyScalar(correction));
			this.currentOffsetPosition.add(this.positionOffsetVelocity.multiplyScalar(damping));

			this.position.copy(this.restPosition).add(this.currentOffsetPosition);
		}

		this.acc.set(0, 0, 0);
	} 
}

export default Frame;



