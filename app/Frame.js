const THREE = require('three');
import { TweenLite } from 'gsap';
import { camera, visWidth, visHeight } from './camera.js';
import { ray } from './input-handler.js';

class Frame extends THREE.Object3D {
	constructor(args) {
		super(args);
		const { position, index } = args;

		this.index = index;
		this.position.copy(position);
		this.restPosition = new THREE.Vector3().copy(position);
		
		this.currentOffsetPosition = new THREE.Vector3();
		this.targetOffsetPosition = new THREE.Vector3();
		this.positionOffsetVelocity = new THREE.Vector3(0, 0, 0);
		this.currentToTargetOffsetVector = new THREE.Vector3();

		// this.targetRotation = new THREE.Euler();
		this.backupRotation = new THREE.Euler();
		this.lookAtTarget = new THREE.Vector3();

		this.acc = new THREE.Vector3();
		this.tmp = new THREE.Vector3();
		this.tmp2 = new THREE.Vector3();

		this.mass = Math.random() * 0.3 + 0.7;
		this.width = 0;
		this.height = 0;

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

		this.onResize();
		this.setupMesh();
	}

	setupMesh() {
		const geom = new THREE.BoxGeometry(this.width, this.height, 5);
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

	onResize() {
		this.width = visWidth > visHeight ? visWidth * 0.28 : visWidth * 0.4;
		this.height = this.width * 0.5625;
		console.log('do resize');
	}
	
	onIntersect(intersect) {
		if (this.isSelected || this.isAnimating) return;
		this.tmp.copy(intersect.point).sub(this.position)
		this.targetOffsetPosition.copy(intersect.point).sub(this.position);
	}

	applyForce(vec) {
		if (this.isSelected || this.isAnimating) return;
		this.tmp.copy(vec).multiplyScalar(this.mass);
		this.acc.add(this.tmp);
	}

	select() {
		if (window.selectedObject) window.selectedObject.unSelect();
		window.selectedObject = this;
		this.isAnimating = true;
		this.isSelected = true;
		this.backupRotation.copy(this.rotation);

		TweenLite.to(this.position, 1.5, { x: 0, y: 0, z: -100, ease: Elastic.easeOut.config(0.9, 0.5), onComplete: this.onAnimationComplete });
		TweenLite.to(this.rotation, 1.5, { x: 0, y: 0, z: 0, ease: Elastic.easeOut.config(0.9, 0.5) });
		TweenLite.to(camera.position, 0.5, { x: 0, y: 0, z: -200, ease: Power4.easeOut });
	}

	unSelect() {
		window.selectedObject = null;
		this.isAnimating = true;
		this.isSelected = false;

		this.targetOffsetPosition.set(0, 0, 0);
		this.currentOffsetPosition.set(0, 0, 0);
		this.positionOffsetVelocity.set(0, 0, 0);

		TweenLite.to(this.position, 1.5, { ...this.restPosition, ease: Elastic.easeOut.config(0.9, 0.5), onComplete: this.onAnimationComplete });
		TweenLite.to(this.rotation, 1.5, { ...this.backupRotation, ease: Elastic.easeOut.config(0.9, 0.5) });
		TweenLite.to(camera.position, 0.5, { x: 0, y: 0, z: -300, ease: Power4.easeOut });
	}

	onAnimationComplete() {
		this.isAnimating = false;
	}

	reposition() {
		this.restPosition.y *= -1;
		this.restPosition.x = Math.random() * visWidth * 0.5;
		if (this.index % 2 === 0) this.restPosition.x -= visWidth * 0.5;
	}

	update(correction) {
		this.restPosition.add(this.acc.multiplyScalar(correction));
		if (!this.isSelected && !this.isAnimating) {

			this.tmp.copy(
				this.tmp.copy(camera.position)
				.add(ray.direction.normalize().multiplyScalar(150))
			);
			this.lookAtTarget.add(
				this.tmp.sub(this.lookAtTarget)
				.multiplyScalar(0.05)
			);
			this.lookAt(this.lookAtTarget);
			

			const spring = 0.025;
			const damping = 0.92;
			this.positionOffsetVelocity.add(
				this.tmp.copy(this.targetOffsetPosition)
				.sub(this.currentOffsetPosition)
				.multiplyScalar(spring)
				.multiplyScalar(correction)
			);
			this.currentOffsetPosition.add(
				this.positionOffsetVelocity
				.multiplyScalar(damping)
			);

			this.position.copy(this.restPosition).add(this.currentOffsetPosition);
		}

		if (this.acc.y > 0 && this.restPosition.y > visHeight * 0.5 + this.height || this.acc.y < 0 && this.restPosition.y < visHeight * -0.5 - this.height)
			this.reposition();

		this.acc.set(0, 0, 0);
	} 
}

export default Frame;



