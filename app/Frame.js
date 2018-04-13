const THREE = require('three');
import { TweenLite } from 'gsap';
import { camera, cameraCube, visWidth, visHeight } from './camera.js';
import { ray } from './input-handler.js';
import { FRAME_SRCS, SPREAD_X, SPREAD_Y, PHOTO_SRCS } from './CONSTANTS.js';

const TOP_RENDER_ORDER = 99999;
class Frame extends THREE.Object3D {
	constructor(args) {
		super(args);
		const { position, index, photo, aspectRatio, renderOrder } = args;
		console.log(position.y);
		this.index = index;
		this.frame = new THREE.Object3D();
		this.frame.name = "FRAME_AND_PLANE";
		this.add(this.frame);
		this.orientation = PHOTO_SRCS[this.index].orientation;
		const geom = this.orientation === 'l' ? window.app.loadedAssets.frameL : window.app.loadedAssets.frameP;
		geom.forEach(c => {
			const copy = c.children[0].clone();
			copy.name = c.name;
			// copy.geometry.normalize();
			const bufferGeom = new THREE.BufferGeometry().fromGeometry(copy.geometry);
			if (PHOTO_SRCS[this.index].orientation === 'l') {
				bufferGeom.rotateZ(Math.PI * -0.5);
			}

			copy.geometry = bufferGeom;
			this.frame.add(copy);
		});

		this.plane = this.getObjectByName("PLANE");
		this.surround = this.getObjectByName("FRAME");

		this.surround.geometry.computeBoundingBox();
		const size = this.surround.geometry.boundingBox.size();
		// this.surround.scale.set(1.5, 1.5, 1.5);
		// this.plane.scale.set(1.5, 1.5, 1.5);
		this.boxSize = size;
		this.aspectRatio = size.y / size.x;

		// this.getObjectByName("FRAME").remove(surround);
		// const bufferGeom = new THREE.BufferGeometry().fromGeometry(surround.geometry);
		// this.surround = new THREE.Mesh(bufferGeom, surround.material);
		// this.getObjectByName("FRAME").add(this.surround);


		this._renderOrder = Math.abs(Math.round(position.z * 100));

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

		this.mass = 0.9 + (Math.random() * 0.1);
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
		// this.setupShadow();
	}

	setupFrame() {
		console.log(this.orientation);
		const geom = new THREE.BoxGeometry(
			this.orientation === 'p' ? this.width : this.height * 2,
			this.orientation === 'p' ? this.height : this.width,
			5
		);

		const material = new THREE.MeshBasicMaterial({ color: 0x0000ff, wireframe: true, visible: true });
		const mesh = new THREE.Mesh(geom, material);
		mesh.scale.set(0.5, 0.5, 0.5);
		mesh.name = "INPUT_LISTENER";
		mesh.onClick = this.onClick;
		mesh.onFocus = this.onFocus;
		mesh.onBlur = this.onBlur;
		mesh.onIntersect = this.onIntersect;
		this.inputListener = mesh;

		const frameTexture = window.app.loadedAssets.frameTextures[0];
		const photoTexture = window.app.loadedAssets.imageTextures[this.index];

		this.add(mesh);
		this.frame.scale.set(this.width, this.width, this.width);
		// this.frame.rotation.z = Math.PI / 2;

		const frameMaterial = new THREE.MeshStandardMaterial({
			color: 0xffffff,
			map: frameTexture,
			bumpMap: frameTexture,
			bumpScale: 0.06,
			envMap: cameraCube.renderTarget.texture,
			envMapIntensity: 0.4,
			metalness: 0.45,
			roughness: 0.4,
			transparent: true,
			depthWrite: false,
		});
		this.surround.material = frameMaterial;
		this.surround.renderOrder = this._renderOrder + 1;

		const photoMaterial = new THREE.MeshStandardMaterial({
			color: 0xffffff,
			map: photoTexture,
			envMap: cameraCube.renderTarget.texture,
			envMapIntensity: 0.4,
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
			transparent: true,
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
		// this.width = visWidth > visHeight ? visWidth * 0.66 : visWidth * 0.55;
		this.width = visWidth * 0.6;
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
		if (this.shadow) this.shadow.material.side = THREE.DoubleSide;
		if (this.shadow) this.shadow.renderOrder = TOP_RENDER_ORDER - 2;
		this.plane.renderOrder = TOP_RENDER_ORDER - 1;
		this.surround.renderOrder = TOP_RENDER_ORDER + 1;
		this.renderOrder = TOP_RENDER_ORDER;

		const dist = (Math.max(this.height, this.width) * 0.36) / Math.tan(Math.PI * camera.fov / 360);

		const { x, y, z } = (() => {
			const rand = Math.random();
			if (rand > 0.66) return { x: Math.PI * 2, y: 0, z: 0 };
			if (rand > 0.33) return { x: 0, y: Math.PI * 2, z: 0 };
			return { x: 0, y: 0, z: Math.PI * 2 };
		})();

		TweenLite.to(this.position, 1.5, { x: 0, y: 0, z: 250 - dist, ease: Elastic.easeOut.config(0.9, 0.5), onComplete: this.onAnimationComplete });
		TweenLite.to(this.rotation, 1.5, { x, y, z, ease: Elastic.easeOut.config(0.9, 0.5) });
		TweenLite.to(camera.position, 0.5, { x: 0, y: 0, z: 250, ease: Power4.easeOut });
		if (this.shadow) TweenLite.to(this.shadow.material, 0.5, { opacity: 0, ease: Power4.easeOut });
	}

	unSelect() {
		window.selectedObject = null;
		this.isAnimating = true;
		this.isSelected = false;
		if (this.shadow) this.shadow.material.side = THREE.DoubleSide;
		if (this.shadow) this.shadow.renderOrder = this._renderOrder - 1;
		this.plane.renderOrder = this._renderOrder + 1;
		this.surround.renderOrder = this._renderOrder;
		this.renderOrder = undefined;

		this.targetOffsetPosition.set(0, 0, 0);
		this.currentOffsetPosition.set(0, 0, 0);
		this.positionOffsetVelocity.set(0, 0, 0);

		TweenLite.to(this.position, 1.5, { ...this.restPosition, ease: Elastic.easeOut.config(0.9, 0.5), onComplete: this.onAnimationComplete });
		TweenLite.to(this.rotation, 1.5, { ...this.backupRotation, ease: Elastic.easeOut.config(0.9, 0.5) });
		TweenLite.to(camera.position, 0.5, { x: 0, y: 0, z: 300, ease: Power4.easeOut });
		if (this.shadow) TweenLite.to(this.shadow.material, 0.5, { opacity: 0.3, ease: Power4.easeOut });
	}

	onAnimationComplete() {
		this.isAnimating = false;
		if (this.shadow) this.shadow.material.side = THREE.FrontSide;
		// this.surround.material.side = THREE.FrontSide;
	}

	reposition() {
		this.restPosition.y *= -1;
		this.restPosition.x = Math.random() * visWidth * SPREAD_X;
		if (this.index % 2 === 0) this.restPosition.x -= visWidth * SPREAD_X;
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

		if (this.acc.y > 0 && this.restPosition.y > visHeight * SPREAD_Y * 0.5
			||
			this.acc.y < 0 && this.restPosition.y < visHeight * SPREAD_Y * -0.5
		) this.reposition();

		this.acc.set(0, 0, 0);
	}
}

export default Frame;

