const THREE = require('three');
import { TweenLite } from 'gsap';
import { camera, cameraCube, visWidth, visHeight } from './camera.js';
import { ray } from './input-handler.js';
import { FRAME_SRCS, PHOTO_SRCS } from './CONSTANTS.js';

class Frame extends THREE.Object3D {
	constructor(args) {
		super(args);
		const { position, index, model, photo, aspectRatio, renderOrder } = args;

		this.frame = new THREE.Object3D();
		this.frame.name = "FRAME_AND_PLANE";
		this.add(this.frame);
		model.forEach(c => {
			const copy = c.children[0].clone();
			copy.name = c.name;
			// copy.geometry.normalize();
			const bufferGeom = new THREE.BufferGeometry().fromGeometry(copy.geometry);
			copy.geometry = bufferGeom;
			this.frame.add(copy);
		});


		// this.aspectRatio = aspectRatio;
		console.log(this.frame);


		this.plane = this.getObjectByName("PLANE");
		this.surround = this.getObjectByName("FRAME");

		this.surround.geometry.computeBoundingBox();
		console.log(this.surround.geometry.boundingBox.size());
		const size = this.surround.geometry.boundingBox.size();
		this.boxSize = size;
		this.aspectRatio = size.y / size.x;
		console.log(aspectRatio);

		// this.getObjectByName("FRAME").remove(surround);
		// const bufferGeom = new THREE.BufferGeometry().fromGeometry(surround.geometry);
		// this.surround = new THREE.Mesh(bufferGeom, surround.material);
		// this.getObjectByName("FRAME").add(this.surround);


		this._renderOrder = Math.abs(Math.round(position.z));
		console.log(this._renderOrder);

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

		this.shadow = null;
		this.inputListener = null;
		// this.frame = null;

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
		this.setupFrame();
		this.setupShadow();

		console.log(this);
	}

	setupFrame() {
		const geom = new THREE.BoxGeometry(this.width, this.height, 5);
		const material = new THREE.MeshBasicMaterial({ color: 0x0000ff, wireframe: true, visible: false });
		const mesh = new THREE.Mesh(geom, material);
		mesh.name = "INPUT_LISTENER";
		mesh.onClick = this.onClick;
		mesh.onFocus = this.onFocus;
		mesh.onBlur = this.onBlur;
		mesh.onIntersect = this.onIntersect;
		this.inputListener = mesh;

		const frameTexture = new THREE.TextureLoader().load(FRAME_SRCS[0]);
		const photoTexture = new THREE.TextureLoader().load(PHOTO_SRCS[0]);

		this.add(mesh);
		this.frame.scale.set(this.width, this.width, this.width);
		// this.frame.rotation.z = Math.PI / 2;

		const frameMaterial = new THREE.MeshStandardMaterial({
			color: 0xffffff,
			map: frameTexture,
			envMap: cameraCube.renderTarget.texture,
			metalness: 0.6,
			roughness: 0.66,
			transparent: true,
			depthWrite: false,
		});
		this.surround.material = frameMaterial;
		this.surround.renderOrder = this._renderOrder + 1;

		const photoMaterial = new THREE.MeshStandardMaterial({
			color: 0xffffff,
			map: photoTexture,
			envMap: cameraCube.renderTarget.texture,
			envMapIntensity: 0.35,
			side: THREE.DoubleSide,
			depthWrite: false,
			metalness: 0.1,
			roughness: 0.2,
			transparent: true,
		});
		this.plane.material = photoMaterial;
		this.plane.renderOrder = this._renderOrder;
	}

	setupShadow() {
		const geom = new THREE.PlaneGeometry(this.boxSize.x * this.width * 1.1, this.boxSize.y * this.width * 1.1, 1);
		const texture = new THREE.TextureLoader().load('assets/shadow.png');
		const material = new THREE.MeshBasicMaterial({
			map: texture,
			// color: 0xff0000,
			transparent: true,
			// wireframe: true,
			depthTest: false,
			depthWrite: false,
			opacity: .6,
			fog: false,
		});
		const mesh = new THREE.Mesh(geom, material);
		mesh.name = "SHADOW";
		mesh.position.x = this.width * -0.05;
		mesh.position.y = this.width * -0.08;
		mesh.renderOrder = this._renderOrder - 1;
		this.shadow = mesh;
		this.add(this.shadow);
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
		this.width = visWidth > visHeight ? visWidth * 0.35 : visWidth * 0.45;
		this.height = this.width * this.aspectRatio;
	}

	onIntersect(intersect) {
		if (this.isSelected || this.isAnimating) return;
		this.tmp.copy(intersect.point).sub(this.position);
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
		this.shadow.material.side = THREE.DoubleSide;
		this.surround.material.side = THREE.DoubleSide;
		this.shadow.renderOrder = 98;
		this.plane.renderOrder = 99;
		this.surround.renderOrder = 100;
		this.renderOrder = 999;

		console.log(this.rotation);

		const dist = (Math.max(this.height, this.width) * 0.4) / Math.tan(Math.PI * camera.fov / 360);

		TweenLite.to(this.position, 1.5, { x: 0, y: 0, z: -250 + dist, ease: Elastic.easeOut.config(0.9, 0.5), onComplete: this.onAnimationComplete });
		TweenLite.to(this.rotation, 1.5, { x: 0, y: 0, z: 0, ease: Elastic.easeOut.config(0.9, 0.5) });
		TweenLite.to(camera.position, 0.5, { x: 0, y: 0, z: -250, ease: Power4.easeOut });
		TweenLite.to(this.shadow.material, 0.5, { opacity: 0, ease: Power4.easeOut });
	}

	unSelect() {
		window.selectedObject = null;
		this.isAnimating = true;
		this.isSelected = false;
		this.shadow.material.side = THREE.DoubleSide;
		this.shadow.renderOrder = this._renderOrder - 1;
		this.plane.renderOrder = this._renderOrder + 1;
		this.surround.renderOrder = this._renderOrder;
		this.renderOrder = undefined;

		this.targetOffsetPosition.set(0, 0, 0);
		this.currentOffsetPosition.set(0, 0, 0);
		this.positionOffsetVelocity.set(0, 0, 0);

		TweenLite.to(this.position, 1.5, { ...this.restPosition, ease: Elastic.easeOut.config(0.9, 0.5), onComplete: this.onAnimationComplete });
		TweenLite.to(this.rotation, 1.5, { ...this.backupRotation, ease: Elastic.easeOut.config(0.9, 0.5) });
		TweenLite.to(camera.position, 0.5, { x: 0, y: 0, z: -300, ease: Power4.easeOut });
		TweenLite.to(this.shadow.material, 0.5, { opacity: 0.3, ease: Power4.easeOut });
	}

	onAnimationComplete() {
		this.isAnimating = false;
		this.shadow.material.side = THREE.FrontSide;
		// this.surround.material.side = THREE.FrontSide;
	}

	reposition() {
		this.restPosition.y *= (-1 - (Math.random() * 0.5));
		this.restPosition.x = Math.random() * visWidth * 0.5;
		if (this.index % 2 === 0) this.restPosition.x -= visWidth * 0.5;
	}

	update(correction) {
		this.restPosition.add(this.acc.multiplyScalar(correction));
		if (!this.isSelected && !this.isAnimating) {

			this.tmp.copy(
				this.tmp.copy(camera.position)
				.add(ray.direction.normalize().multiplyScalar(40))
			);
			this.lookAtTarget.add(
				this.tmp.sub(this.lookAtTarget)
				.multiplyScalar(0.05)
			);
			this.lookAt(this.lookAtTarget);

			const spring = 0.0085;
			const damping = 0.8;
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

