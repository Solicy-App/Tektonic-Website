import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { STLLoader as Loader } from 'three/examples/jsm/loaders/STLLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import { createAnimate } from './stlHelpers/animate';
import { centerGroup } from './stlHelpers/centerGroup';
import { getIntersectObjectsOfClick } from './stlHelpers/getIntersectObjectsOfClick';

const loader = new Loader();
const textureLoader = new THREE.TextureLoader();

export default function StlViewer({
	sizeX = 1400,
	sizeY = 1400,
	pathToModel = '/assets/Lyn.stl',
	pathToModelTexture = '/assets/whiteTextureBasic.jpg',
	activeWing,
	wingsMesh
}) {
	const containerRef = useRef();
	const [transformControls, setTransformControls] = useState<TransformControls>(undefined);
	const [orbitControls, setOrbitControls] = useState(undefined);
	const [orbitControlsValues, setOrbitControlsValues] = useState<any>({
		LEFT: THREE.MOUSE.ROTATE,
		MIDDLE: THREE.MOUSE.PAN,
		RIGHT: THREE.MOUSE.PAN // for now it's as the same like the middle button
	});
	const [renderer, setRenderer] = useState(undefined);
	const [camera, setCamera] = useState(undefined);
	const [scene, setScene] = useState(undefined);
	const [coreModelMesh, setCoreModelMesh] = useState(null);
	const [pieces, setPieces] = useState({});
	const [draggingControl, setDraggingControl] = useState(false);

	const rotationSpeed = 0.01;
	let dragDirection = '';

	useEffect(() => {
		setScene(new THREE.Scene());
		const cam = new THREE.PerspectiveCamera(750, sizeX / sizeY, 10, 100000);
		setCamera(cam);

		setRenderer(new THREE.WebGLRenderer());
	}, []);

	useEffect(() => {
		const handleClick = (event) => {
			if (!draggingControl) {
				const intersects = getIntersectObjectsOfClick(
					event,
					sizeX,
					sizeY,
					camera,
					Object.values(pieces)
				);
				if (intersects.length) {
					transformControls.attach(intersects[0].object.parent);
				} else {
					orbitControls.enableZoom = true;
					transformControls.detach();
				}
			}
		};

		if (renderer && transformControls) {
			// Use setTimeout to let the draggingControl check do its job.
			setTimeout(() => {
				renderer.domElement.addEventListener('click', handleClick);
			}, 0);
			return () => {
				renderer.domElement.removeEventListener('click', handleClick);
			};
		}
	}, [renderer, transformControls, pieces, draggingControl]);

	useEffect(() => {
		if (renderer && camera && scene) {
			setTransformControls(new TransformControls(camera, renderer.domElement));

			renderer.setSize(sizeX, sizeY);
			setOrbitControls(new OrbitControls(camera, renderer.domElement));

			// three js window
			if (containerRef.current) (containerRef.current as any).appendChild(renderer.domElement);
			const animate = createAnimate({ scene, camera, renderer });
			camera.position.z = 350;
			animate.animate();

			renderModel();
		}
	}, [renderer, camera, scene]);

	useEffect(() => {
		if (orbitControls) {
			// add controls to window
			// zoom parameters how much can zoom
			orbitControls.maxDistance = 450;
			orbitControls.minDistance = 125;
			orbitControls.mouseButtons = orbitControlsValues;
		}
	}, [orbitControls]);
	let rotateGroup = true;
	const clickEKey = () => {
		transformControls.dragging = false;
		transformControls.enabled = false;
		transformControls.showX = false;
		transformControls.showY = false;
		transformControls.showZ = false;
		const onClick = (event, meshes, mouseType) => {
			const cameraRotationMatrix = new THREE.Matrix4();
			cameraRotationMatrix.extractRotation(camera.matrixWorld);
			const positions = camera.position;
			const mouse = new THREE.Vector3(5, 2);
			mouse.x = (event.clientX / 1400) * 2 - 1;
			mouse.y = -(event.clientY / 1400) * 2 + 1;
			const raycaster = new THREE.Raycaster();
			raycaster.setFromCamera(mouse, camera);

			for (let index = 0; index < scene.children.length; index++) {
				const element = scene.children[index];
				if (element.type == 'Group') {
					const intersectsGroup = raycaster?.intersectObject(element.children[0]);
					if (mouseType == 'mousedown' && intersectsGroup.length > 0) {
						element['mousedown'] = true;
						orbitControls.enablePan = false;
						orbitControls.enableRotate = false;
					}
					console.log(mouseType, element);
					
					if (mouseType == 'mousemove' && element['mousedown']) {
						console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>');
						
						const movementScale = 0.085;
						const worldCoordinates = new THREE.Vector3(mouse.x * 210, mouse.y * 205, 0);
						worldCoordinates.unproject(camera);
						rotateGroup = false;
						const movementX = worldCoordinates.x - element.position.x;
						const movementY = worldCoordinates.y - element.position.y;
						const movementZ = worldCoordinates.z - element.position.z;

						element.position.x = movementX * movementScale;
						element.position.y = movementY * movementScale;
						element.position.z = movementZ * movementScale;

						setTransformControls(transformControls);
					}
					if (mouseType == 'mouseup') {
						element['mousedown'] = false;
						orbitControls.enablePan = true;
						orbitControls.enableRotate = true;
						setTransformControls(transformControls);
						rotateGroup = true;
						dragDirection = '';
					}
				}
			}

			for (let i = 0; i < meshes.length; i++) {
				const mesh = meshes[i];
				const intersectsTop = raycaster.intersectObject(mesh.top);
				const intersectsBottom = raycaster.intersectObject(mesh.bottom);
				const intersectsRight = raycaster.intersectObject(mesh.right);
				const intersectsLeft = raycaster.intersectObject(mesh.left);

				let mouseLeaveX = mesh.mouseLeaveX;
				let mouseLeaveY = mesh.mouseLeaveY;
				const cameraToTop = new THREE.Vector3().subVectors(mesh.top.position, camera.position);
				cameraToTop.normalize();
				const angleTop = cameraToTop.angleTo(camera.getWorldDirection(new THREE.Vector3()));
				const angleTopDegrees = THREE.MathUtils.radToDeg(angleTop);

				// if (mesh.element.rotation._z > 0) {
				if (angleTopDegrees >= 1.15 && angleTopDegrees <= 1.33) {
					mesh.right.visible = false;
					mesh.left.visible = false;
					mesh.top.visible = true;
					mesh.bottom.visible = true;
				} else if (angleTopDegrees >= 0.17 && angleTopDegrees < 1) {
					mesh.right.visible = true;
					mesh.left.visible = true;
					mesh.top.visible = false;
					mesh.bottom.visible = false;
				} else {
					mesh.right.visible = false;
					mesh.left.visible = false;
					mesh.top.visible = false;
					mesh.bottom.visible = false;
				}
				// } else {
				// 	if (angleTopDegrees >= 1) {
				// 		mesh.right.visible = true;
				// 		mesh.left.visible = true;
				// 		mesh.top.visible = false;
				// 		mesh.bottom.visible = false;
				// 	} else if (angleTopDegrees >= 0.17 && angleTopDegrees < 1) {
				// 		mesh.right.visible = false;
				// 		mesh.left.visible = false;
				// 		mesh.top.visible = true;
				// 		mesh.bottom.visible = true;
				// 	} else {
				// 		mesh.right.visible = false;
				// 		mesh.left.visible = false;
				// 		mesh.top.visible = false;
				// 		mesh.bottom.visible = false;
				// 	}
				// }

				if (intersectsBottom.length > 0) {
					orbitControls.enableRotate = false;
					if (mouseType == 'mousedown') {
						mesh.dragBottom = true;
					}
				} else if (intersectsTop.length > 0) {
					orbitControls.enableRotate = false;
					if (mouseType == 'mousedown') {
						mesh.dragTop = true;
					}
				} else if (intersectsRight.length > 0) {
					orbitControls.enableRotate = false;
					if (mouseType == 'mousedown') {
						mesh.dragRight = true;
					}
				} else if (intersectsLeft.length > 0) {
					orbitControls.enableRotate = false;
					if (mouseType == 'mousedown') {
						mesh.dragLeft = true;
					}
				}
				if (!rotateGroup) return;

				dragDirection = '';

				if (mouseType == 'mousemove' && mesh.dragTop) {
					if (mouseLeaveX > event.clientX) {
						mesh.element.rotateX(positions.x / 17500);
						mesh.element.rotateZ(positions.z / 17500);
					} else {
						mesh.element.rotateX((-1 * positions.x) / 17500);
						mesh.element.rotateZ((-1 * positions.z) / 17500);
					}
				}

				if (mouseType == 'mousemove' && mesh.dragBottom) {
					if (mouseLeaveX > event.clientX) {
						mesh.element.rotateX((-1 * positions.x) / 17500);
						mesh.element.rotateZ((-1 * positions.z) / 17500);
					} else {
						mesh.element.rotateZ(positions.z / 17500);
						mesh.element.rotateX(positions.x / 17500);
					}
				}

				if (mouseType == 'mousemove' && mesh.dragLeft) {
					dragDirection = 'dragLeft';
				}

				if (mouseType == 'mousemove' && mesh.dragRight) {
					dragDirection = 'dragRight';
				}

				const deltaX = event.clientX - mesh.mouseLeaveX;
				const deltaY = event.clientY - mesh.mouseLeaveY;

				switch (dragDirection) {
					case 'dragLeft':
						mesh.element.rotation.y += deltaX * rotationSpeed;
						break;
					case 'dragRight':
						mesh.element.rotation.y -= deltaX * rotationSpeed;
						break;
				}

				if (mouseType == 'mouseup') {
					mesh.dragTop = false;
					mesh.dragBottom = false;
					mesh.dragRight = false;
					mesh.dragLeft = false;
					orbitControls.enableRotate = true;
				}

				mesh.mouseLeaveX = event.clientX;
				mesh.mouseLeaveY = event.clientY;
			}
		};

		const meshes = [];
		const spritePoint = new THREE.TextureLoader().load('assets/point1.svg');
		const spriteMaterial = new THREE.SpriteMaterial({ map: spritePoint });

		for (let i = 0; i < scene.children.length; i++) {
			const element = scene.children[i];
			if (element.type == 'Group') {
				let top = true;
				let bottom = true;
				let right = true;
				let left = true;
				for (let j = 0; j < element.children.length; j++) {
					const child = element.children[j];
					if (child.name == 'pointTop') {
						top = false;
					}
					if (child.name == 'pointBottom') {
						bottom = false;
					}

					if (child.name == 'pointRight') {
						right = false;
					}

					if (child.name == 'pointLeft') {
						left = false;
					}
				}

				const meshTop = new THREE.Sprite(spriteMaterial);
				meshTop.scale.set(3, 1.4, 1);
				meshTop.name = 'pointTop';
				meshTop.position.set(0.9, 8, -0.8);

				const meshBottom = new THREE.Sprite(spriteMaterial);
				meshBottom.scale.set(3, 1.4, 1);
				meshBottom.position.set(-0.2, -8, 1);
				meshBottom.name = 'pointBottom';

				const meshRight = new THREE.Sprite(spriteMaterial);
				meshRight.scale.set(3, 1.4, 1);
				meshRight.position.set(8, -0.5, 0);
				meshRight.name = 'pointRight';
				meshRight.rotateX(Math.PI / 4);

				const meshLeft = new THREE.Sprite(spriteMaterial);
				meshLeft.scale.set(3, 1.4, 1);
				meshLeft.position.set(-8, 0.5, 0);
				meshLeft.name = 'pointLeft';

				meshes.push({
					top: meshTop,
					bottom: meshBottom,
					right: meshRight,
					left: meshLeft,
					element,
					dragTop: false,
					dragBotom: false,
					dragRight: false,
					click: false,
					mouseLeaveX: 0,
					mouseLeaveY: 0
				});

				if (top) {
					element.add(meshTop);
				}

				if (bottom) {
					element.add(meshBottom);
				}

				if (right) {
					element.add(meshRight);
				}

				if (left) {
					element.add(meshLeft);
				}
			}
		}
		renderer.domElement.addEventListener('mousemove', (ev) => onClick(ev, meshes, 'mousemove'));
		renderer.domElement.addEventListener('mousedown', (ev) => onClick(ev, meshes, 'mousedown'));
		renderer.domElement.addEventListener('mouseup', (ev) => onClick(ev, meshes, 'mouseup'));
		renderer.domElement.addEventListener('click', (ev) => onClick(ev, meshes, 'click'));
		setTransformControls(transformControls);
	};

	useEffect(() => {
		const handleDblClick = (event) => {
			const intersects = getIntersectObjectsOfClick(
				event,
				sizeX,
				sizeY,
				camera,
				[coreModelMesh],
				true
			);
			const mouse = new THREE.Vector3(5, 2);
			mouse.x = (event.clientX / 1400) * 2 - 1;
			mouse.y = -(event.clientY / 1400) * 2 + 1;
			const raycaster = new THREE.Raycaster();
			raycaster.setFromCamera(mouse, camera);
			for (let index = 0; index < scene.children.length; index++) {
				const element = scene.children[index];
				if (element.type == 'Group') {
					const intersectsGroup = raycaster?.intersectObject(element.children[0]);
					if (intersectsGroup?.length > 0) {
						for (let index = 0; index < element.children.length; index++) {
							const el = element.children[index];
							if (el?.name == activeWing.subName && el?.name?.search('angle') != -1) {
								el.visible = true;
							} else if (el?.name?.search('angle') != -1) {
								el.visible = false;
							}
						}
						return;
					}
				}
			}
			if (intersects.length > 0) {
				// clicked on model or no
				let intersect = intersects[0];
				//show core screw/(implant) pices
				const core = addCorePieces(intersect, scene, loader);
				setScene(core);
			}
		};

		if (renderer) {
			renderer.domElement.addEventListener('dblclick', handleDblClick);
			return () => {
				renderer.domElement.removeEventListener('dblclick', handleDblClick);
			};
		}
	}, [activeWing, coreModelMesh, wingsMesh]);

	useEffect(() => {
		if (transformControls) {
			transformControls.space = 'local';
			transformControls.addEventListener('change', () => {
				renderer.render(scene, camera);
			});
			transformControls.addEventListener('dragging-changed', (event) => {
				orbitControls.enabled = !event.value;
				setDraggingControl(event.value);
			});

			window.addEventListener('keydown', (event) => {
				switch (event.keyCode) {
					case 46: // D
						if (transformControls.object) {
							setPieces((oldPice) =>
								Object.keys(oldPice).reduce((obj, k) => {
									if (k !== transformControls.object.uuid) {
										obj[k] = oldPice[k];
									}
									return obj;
								}, {})
							);
							scene.remove(transformControls.object);
							transformControls.detach();
						}
						break;
				}
			});
		}
	}, [transformControls]);

	const renderModel = () => {
		loader.load(pathToModel, (geometry) => {
			const material = new THREE.MeshMatcapMaterial({
				color: 0xffffff, // color for texture
				matcap: textureLoader.load(pathToModelTexture)
			});
			const mesh = new THREE.Mesh(geometry, material);
			mesh.geometry.computeVertexNormals();
			mesh.geometry.center();
			// will add click method to object
			setCoreModelMesh(mesh);
			mesh.rotateY(0.5);
			scene.add(mesh);
		});
	};

	// will add core paces to model
	const addCorePieces = function (
		intersect: THREE.Intersection<THREE.Object3D<THREE.Event>>,
		scene: THREE.Scene,
		loader: Loader
	) {
		const coreModelPath = '/assets/tektonicCoreParts/CoreStep.stl';
		const whiteTexture = '/assets/whiteTextureBasic.jpg';
		let coreModelMesh = undefined;
		let wingModelMesh = undefined;

		const group = new THREE.Group();

		// render model
		loader.load(coreModelPath, (geometry) => {
			const material = new THREE.MeshMatcapMaterial({
				color: 0xffffff, // color for texture
				matcap: textureLoader.load(whiteTexture)
			});
			coreModelMesh = new THREE.Mesh(geometry, material);
			coreModelMesh.geometry.computeVertexNormals();
			coreModelMesh.geometry.center();
			coreModelMesh.position.copy(intersect.point);
			coreModelMesh.rotation.z = 1.65; // will add some rotation
			coreModelMesh.rotation.x = -0.1; // rotate model of core element

			coreModelMesh.geometry.center();

			group.attach(coreModelMesh);
			centerGroup(group);
			for (let i = 0; i < wingsMesh.length; i++) {
				loader.load(wingsMesh[i].path, (geometry) => {
					const whiteTexture = '/assets/whiteTextureBasic.jpg';
					let wingModelMesh = undefined;
					const material = new THREE.MeshMatcapMaterial({
						color: 0xabdbe3, // color for texture
						matcap: textureLoader.load(whiteTexture)
					});
					wingModelMesh = new THREE.Mesh(geometry, material);
					wingModelMesh.geometry.computeVertexNormals();
					wingModelMesh.geometry.center();
					// rotations
					wingModelMesh.rotation.y = wingsMesh[i]?.rotations.y; // will add some rotation
					wingModelMesh.rotation.x = wingsMesh[i]?.rotations.x; // rotate model of core element
					wingModelMesh.position.set(group.position.x, group.position.y, group.position.z);
					wingModelMesh.visible = false;

					//possitions
					if (wingsMesh[i]?.movedPos.x) wingModelMesh.position.x += wingsMesh[i].movedPos.x;
					if (wingsMesh[i]?.movedPos.y) wingModelMesh.position.y += wingsMesh[i].movedPos.y;
					if (wingsMesh[i]?.movedPos.z) wingModelMesh.position.z += wingsMesh[i].movedPos.z;
					// wingModelMesh.position.set(group.position.x, group.position.y, group.position.z)
					// scales
					wingModelMesh.scale.x = wingsMesh[i]?.scale || 0.7;
					wingModelMesh.scale.y = wingsMesh[i]?.scale || 0.7;
					wingModelMesh.scale.z = wingsMesh[i]?.scale || 0.7;
					wingModelMesh.name = wingsMesh[i].subName;
					group.attach(wingModelMesh);
				});
			}
			clickEKey();
			// clickWKey()
		});

		// loader.load(activeWing.path, (geometry) => {
		// 	const material = new THREE.MeshMatcapMaterial({
		// 		color: 0xabdbe3, // color for texture
		// 		matcap: textureLoader.load(whiteTexture)
		// 	});
		// 	wingModelMesh = new THREE.Mesh(geometry, material);
		// 	wingModelMesh.geometry.computeVertexNormals();
		// 	wingModelMesh.geometry.center();
		// 	wingModelMesh.position.copy(intersect.point);
		// 	// rotations
		// 	wingModelMesh.rotation.y = activeWing?.rotations.y;  // will add some rotation
		// 	wingModelMesh.rotation.x = activeWing?.rotations.x;   // rotate model of core element

		// 	//possitions
		// 	if (activeWing?.movedPos.x)
		// 		wingModelMesh.position.x += activeWing?.movedPos.x;
		// 	if (activeWing?.movedPos.y)
		// 		wingModelMesh.position.y += activeWing?.movedPos.y;
		// 	if (activeWing?.movedPos.z)
		// 		wingModelMesh.position.z += activeWing?.movedPos.z;

		// 	// scales
		// 	wingModelMesh.scale.x = activeWing?.scale || 0.7;
		// 	wingModelMesh.scale.y = activeWing?.scale || 0.7;
		// 	wingModelMesh.scale.z = activeWing?.scale || 0.7;
		// 	group.attach(wingModelMesh);
		// 	centerGroup(group);
		// });

		setPieces((prevPieces) => {
			let pieces = Object.assign({}, prevPieces);
			pieces[group.uuid] = group;
			return pieces;
		});

		const axis = new THREE.Vector3(0, 1, 1.5); // local Y/Z axis
		group.rotateOnAxis(axis, 0.1);
		scene.attach(group);
		transformControls.detach();
		scene.attach(transformControls);
		return scene;
	};

	return (
		<>
			<div
				id="info"
				style={{
					position: 'absolute',
					top: '0px',
					width: '100%',
					padding: '10px',
					boxSizing: 'border-box',
					textAlign: 'center',
					userSelect: 'none',
					pointerEvents: 'none',
					zIndex: 1,
					color: '#ffffff'
				}}
			>
				"W" translate | "E" rotate | "R" scale | "D" remove
			</div>
			<div ref={containerRef} />
		</>
	);
}
