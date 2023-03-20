import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { STLLoader as Loader } from 'three/examples/jsm/loaders/STLLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import { createAnimate } from './stlHelpers/animate';
import { centerGroup } from './stlHelpers/centerGroup';
import { getIntersectObjectsOfClick } from './stlHelpers/getIntersectObjectsOfClick';

const loader = new Loader();
const textureLoader = new THREE.TextureLoader();
let mouseLeaveX
let mouseLeaveY
let leavTime = false
export default function StlViewer({
	sizeX = 1400,
	sizeY = 1400,
	pathToModel = '/assets/Lyn.stl',
	pathToModelTexture = '/assets/whiteTextureBasic.jpg',
	activeWing
}) {
	const containerRef = useRef();
	const [transformControls, setTransformControls] = useState<TransformControls>(undefined);
	const [orbitControls, setOrbitControls] = useState(undefined);
	const [renderer, setRenderer] = useState(undefined);
	const [camera, setCamera] = useState(undefined);
	const [scene, setScene] = useState(undefined);
	const [coreModelMesh, setCoreModelMesh] = useState(null);
	const [pieces, setPieces] = useState({});
	const [draggingControl, setDraggingControl] = useState(false);
	const [meshesData, setMeshesData] = useState([]);

	let scrollRotateEvent;

	useEffect(() => {
		setScene(new THREE.Scene());
		const cam = new THREE.PerspectiveCamera(
			750,
			sizeX / sizeY,
			10,
			100000
		)
		setCamera(cam);

		setRenderer(new THREE.WebGLRenderer());
	}, []);

	const changeCameraPosition = () => {
		for (let i = 0; i < scene.children.length; i++) {
			const core = scene.children[i];

			if (core.type == 'Group') {
				// core.lookAt(camera.position)
				// console.log(core);
			}
		}
	}

	useEffect(() => {
		const handleClick = (event) => {
			changeCameraPosition()
			if (!draggingControl) {
				const intersects = getIntersectObjectsOfClick(event, sizeX, sizeY, camera, Object.values(pieces));
				const scrollRotate = (e) => {
					e.preventDefault();
					orbitControls.enableZoom = false;

					const pos = camera.position
					let x = 0;
					let y = 0;
					let z = 0;
					if (pos.x > pos.y && pos.x > pos.z) {
						x = 0.1;
						y = pos.y / (pos.x * 10)
						z = pos.z / (pos.x * 10)
					} else if (pos.y > pos.x && pos.y > pos.z) {
						y = 0.1;
						x = pos.y / (pos.y * 10)
						z = pos.z / (pos.y * 10)
					} else if (pos.z > pos.x && pos.z > pos.y) {
						z = 0.1;
						x = pos.y / (pos.z * 10)
						z = pos.z / (pos.z * 10)
					}
					intersects[0].object.parent.rotateX(x)
					intersects[0].object.parent.rotateY(y)
					intersects[0].object.parent.rotateZ(z)

					return
				}
				if (intersects.length) {

					transformControls.attach(intersects[0].object.parent);
					renderer.domElement.addEventListener('wheel', scrollRotate);
					scrollRotateEvent = scrollRotate;
				} else {
					orbitControls.enableZoom = true;
					renderer.domElement.removeEventListener('wheel', scrollRotateEvent);
					transformControls.detach();
				}
			}
		}

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
			if (containerRef.current)
				(containerRef.current as any).appendChild(renderer.domElement);
			const animate = createAnimate({ scene, camera, renderer });
			camera.position.z = 350;
			animate.animate();

			renderModel();
		}
	}, [renderer, camera, scene]);

	useEffect(() => {
		if (orbitControls) {
			console.log(orbitControls, 'orbitControls');

			// add controls to window
			// zoom parameters how much can zoom
			orbitControls.maxDistance = 450;
			orbitControls.minDistance = 125;
			orbitControls.mouseButtons = {
				LEFT: THREE.MOUSE.ROTATE,
				MIDDLE: THREE.MOUSE.PAN,
				RIGHT: THREE.MOUSE.PAN,  // for now it's as the same like the middle button
			};
		}
	}, [orbitControls]);

	useEffect(() => {
		const handleDblClick = (event) => {
			const intersects = getIntersectObjectsOfClick(event, sizeX, sizeY, camera, [coreModelMesh], true);
			if (intersects.length > 0) { // clicked on model or no
				let intersect = intersects[0];
				//show core screw/(implant) pices
				const core = addCorePieces(intersect, scene, loader);
				setScene(core)
			}
		};

		if (renderer) {
			renderer.domElement.addEventListener('dblclick', handleDblClick);
			return () => {
				renderer.domElement.removeEventListener('dblclick', handleDblClick);
			};
		}
	}, [activeWing, coreModelMesh]);

	useEffect(() => {
		if (transformControls) {
			// const myCustomGizmo = new THREE.Object3D();
			// // add your custom Gizmo objects to myCustomGizmo here

			// const myCustomGizmoHelper = new THREE.GizmoHelper(myCustomGizmo);
			// transformControls.gizmo = myCustomGizmoHelper;
			transformControls.space = 'local';
			transformControls.addEventListener('change', () => {
				renderer.render(scene, camera);

			});
			transformControls.addEventListener('dragging-changed', event => {
				orbitControls.enabled = !event.value;
				setDraggingControl(event.value);
			});

			window.addEventListener('keydown', event => {
				switch (event.keyCode) {
					case 87: // W
						transformControls.dragging = true
						transformControls.enabled = true
						transformControls.showX = true
						transformControls.showY = true
						transformControls.showZ = true
						transformControls.setMode('translate');

						for (let i = 0; i < scene.children.length; i++) {
							const element = scene.children[i];
							if (element.type == "Group") {
								for (let j = 0; j < element.children.length; j++) {
									const mesh = element.children[j]

									if (mesh.name == 'pointTop' || mesh.name == 'pointBottom') {
										scene.remove(mesh)
									}
								}
							}
						}
						break;
					case 69: // E
						transformControls.setMode('translate');
						transformControls.dragging = false
						transformControls.showX = false
						transformControls.showY = false
						transformControls.showZ = false
						transformControls.camera.visible = false

						const onClick = (event, meshes, mouseType) => {
							const mouse = new THREE.Vector2(5, 2);
							mouse.x = (event.clientX / 1400) * 2 - 1;
							mouse.y = -(event.clientY / 1400) * 2 + 1;
							const raycaster = new THREE.Raycaster();
							raycaster.setFromCamera(mouse, camera);

							const material = new THREE.MeshBasicMaterial({
								map: texture,
								transparent: true
							});

							const geometry = new THREE.PlaneGeometry(16.5, 16.5);
							const meshZ = new THREE.Mesh(geometry, material);
							meshZ.name = 'meshZ'
							const meshZR = new THREE.Mesh(geometry, material);
							meshZR.name = 'meshZR'
							meshZR.rotation.set(0, Math.PI, 0);
							const meshY = new THREE.Mesh(geometry, material);
							meshY.name = 'meshY'
							meshY.rotation.set(Math.PI / 2, 0, 0);
							const meshYR = new THREE.Mesh(geometry, material);
							meshYR.name = 'meshYR'
							meshYR.rotation.set(Math.PI / 2, Math.PI, 0);
							const meshX = new THREE.Mesh(geometry, material);
							meshX.name = 'meshX'
							meshX.rotation.set(0, Math.PI / 2, 0);
							const meshXR = new THREE.Mesh(geometry, material);
							meshXR.name = 'meshXR'
							meshXR.rotation.set(0, -Math.PI / 2, 0);

							for (let i = 0; i < meshes.length; i++) {
								const mesh = meshes[i];
								const intersectsTop = raycaster.intersectObject(mesh.top);
								// const intersectsBottom = raycaster.intersectObject(mesh.bottom);
								// const intersectsLeft = raycaster.intersectObject(mesh.left);
								const intersectsRight = raycaster.intersectObject(mesh.right);
								// const intersectsLeftX = raycaster.intersectObject(mesh.leftX);
								const intersectsRightX = raycaster.intersectObject(mesh.rightX);
								if (mouseType == 'mousedown') {
									leavTime = true
									setTimeout(() => {
										leavTime = false
									}, 200)
								}
								if (mouseType == 'mouseup' && leavTime) {
									const aaaa = []
									for (let j = 0; j < mesh.top.parent.children.length; j++) {
										const element = mesh.top.parent.children[j];

										if (!(element.name == 'meshZ' || element.name == 'meshZR' || element.name == 'meshY' || element.name == 'meshYR' || element.name == 'meshX' || element.name == 'meshXR')) {
											aaaa.push(element)
										}
									}
									mesh.top.parent.children = aaaa
								}
								if (intersectsTop.length > 0) {
									orbitControls.enableRotate = false
									if (mouseType == 'mousedown') {
										mesh.dragTop = true
									}
									if (mouseType == 'mouseup') {
										mesh.top.parent.add(meshZ)
										mesh.top.parent.add(meshZR)
									}
								} 
								// else if (intersectsBottom.length > 0) {
								// 	orbitControls.enableRotate = false
								// 	if (mouseType == 'mousedown') {
								// 		mesh.dragBottom = true
								// 	}
								// 	if (mouseType == 'mouseup') {
								// 		mesh.bottom.parent.add(meshZ)
								// 		mesh.bottom.parent.add(meshZR)
								// 	}
								// } 
								// else if (intersectsLeft.length > 0) {
								// 	orbitControls.enableRotate = false
								// 	if (mouseType == 'mousedown') {
								// 		mesh.dragLeft = true
								// 	}
								// 	if (mouseType == 'mouseup') {
								// 		mesh.left.parent.add(meshY)
								// 		mesh.left.parent.add(meshYR)
								// 	}
								// } 
								else if (intersectsRight.length > 0) {
									orbitControls.enableRotate = false
									if (mouseType == 'mousedown') {
										mesh.dragRight = true
									}
									if (mouseType == 'mouseup') {
										mesh.right.parent.add(meshY)
										mesh.right.parent.add(meshYR)
									}
								}
								// else if (intersectsLeftX.length > 0) {
								// 	orbitControls.enableRotate = false
								// 	if (mouseType == 'mousedown') {
								// 		mesh.dragLeftX = true
								// 	}
								// 	if (mouseType == 'mouseup') {
								// 		mesh.leftX.parent.add(meshX)
								// 		mesh.leftX.parent.add(meshXR)
								// 	}
								// } 
								else if (intersectsRightX.length > 0) {
									orbitControls.enableRotate = false
									if (mouseType == 'mousedown') {
										mesh.dragRightX = true
									}
									if (mouseType == 'mouseup') {
										mesh.rightX.parent.add(meshX)
										mesh.rightX.parent.add(meshXR)
									}
								}

								if (mouseType == 'mousemove' && mesh.dragTop) {
									if (mouseLeaveX > event.clientX) {
										mesh.element.rotateZ(+0.01)
									} else {
										mesh.element.rotateZ(-0.01)
									}
								}

								// if (mouseType == 'mousemove' && mesh.dragBottom) {
								// 	if (mouseLeaveX > event.clientX) {
								// 		mesh.element.rotateZ(-0.01)
								// 	} else {
								// 		mesh.element.rotateZ(+0.01)
								// 	}
								// }


								// if (mouseType == 'mousemove' && mesh.dragLeft) {
								// 	if (mouseLeaveY > event.clientY) {
								// 		mesh.element.rotateY(-0.01)
								// 	} else {
								// 		mesh.element.rotateY(+0.01)
								// 	}
								// }


								if (mouseType == 'mousemove' && mesh.dragRight) {
									if (mouseLeaveY > event.clientY) {
										mesh.element.rotateY(-0.01)
									} else {
										mesh.element.rotateY(+0.01)
									}
								}


								// if (mouseType == 'mousemove' && mesh.dragLeftX) {
								// 	if (mouseLeaveY > event.clientY) {
								// 		mesh.element.rotateX(-0.01)
								// 	} else {
								// 		mesh.element.rotateX(+0.01)
								// 	}
								// }

								if (mouseType == 'mousemove' && mesh.dragRightX) {
									if (mouseLeaveY > event.clientY) {
										mesh.element.rotateX(-0.01)
									} else {
										mesh.element.rotateX(+0.01)
									}
								}

								if (mouseType == 'mouseup') {
									mesh.dragTop = false
									// mesh.dragBottom = false
									// mesh.dragLeft = false
									mesh.dragRight = false
									// mesh.dragLeftX = false
									mesh.dragRightX = false
									orbitControls.enableRotate = true

								}
							}

							mouseLeaveX = event.clientX
							mouseLeaveY = event.clientY
						}

						const meshes = [];
						const spritePoint = new THREE.TextureLoader().load('assets/point1.png');
						const spriteMaterial = new THREE.SpriteMaterial({ map: spritePoint });
						const textureLoader = new THREE.TextureLoader();
						const texture = textureLoader.load('assets/112.png');

						for (let i = 0; i < scene.children.length; i++) {
							const element = scene.children[i];
							if (element.type == "Group") {
								let top = true;
								// let bottom = true;
								// let left = true;
								let right = true;
								// let leftX = true;
								let rightX = true;
								for (let j = 0; j < element.children.length; j++) {
									const child = element.children[j]
									if (child.name == 'pointTop') {
										top = false
									}
									// if (child.name == 'pointBottom') {
									// 	bottom = false
									// }
									// if (child.name == 'pointLeft') {
									// 	left = false
									// }
									if (child.name == 'pointRight') {
										right = false
									}
									// if (child.name == 'pointLeftX') {
									// 	leftX = false
									// }
									if (child.name == 'pointRightX') {
										rightX = false
									}
								}

								const meshTop = new THREE.Sprite(spriteMaterial);
								meshTop.scale.set(6, 2, 1);
								meshTop.name = 'pointTop'
								meshTop.position.set(0, 8, 0);

								// const meshBottom = new THREE.Sprite(spriteMaterial);
								// meshBottom.scale.set(6, 2, 1);
								// meshBottom.position.set(0, -8, 0);
								// meshBottom.name = 'pointBottom'

								// const meshLeft = new THREE.Sprite(spriteMaterial);
								// meshLeft.scale.set(6, 2, 1);
								// meshLeft.position.set(-8, 0, 0);
								// meshLeft.name = 'pointLeft'

								const meshRight = new THREE.Sprite(spriteMaterial);
								meshRight.scale.set(6, 2, 1);
								meshRight.position.set(8, 0, 0);
								meshRight.name = 'pointRight'

								// const meshLeftX = new THREE.Sprite(spriteMaterial);
								// meshLeftX.scale.set(6, 2, 1);
								// meshLeftX.position.set(0, 0, -8);
								// meshLeftX.name = 'pointLeftX'

								const meshRightX = new THREE.Sprite(spriteMaterial);
								meshRightX.scale.set(6, 2, 1);
								meshRightX.position.set(0, 0, 8);
								meshRightX.name = 'pointRightX'

								meshes.push({
									// bottom: meshBottom,
									top: meshTop,
									// left: meshLeft,
									right: meshRight,
									// leftX: meshLeftX,
									rightX: meshRightX,
									element,
									dragTop: false,
									// dragBotom: false,
									// dragLeft: false,
									dragRight: false,
									// dragLeftX: false,
									dragRightX: false,
									click: false
								})
								if (top) {
									element.add(meshTop)
								}
								// if (bottom) {
								// 	element.add(meshBottom)
								// }
								// if (left) {
								// 	element.add(meshLeft)
								// }
								if (right) {
									element.add(meshRight)
								}
								// if (leftX) {
								// 	element.add(meshLeftX)
								// }
								if (rightX) {
									element.add(meshRightX)
								}
							}
						}
						setMeshesData(meshes)
						renderer.domElement.addEventListener('mousemove', (ev) => onClick(ev, meshes, 'mousemove'));
						renderer.domElement.addEventListener('mousedown', (ev) => onClick(ev, meshes, 'mousedown'));
						renderer.domElement.addEventListener('mouseup', (ev) => onClick(ev, meshes, 'mouseup'));
						renderer.domElement.addEventListener('click', (ev) => onClick(ev, meshes, 'click'));
						setTransformControls(transformControls);
						break;
					// case 82: // R
					// 	transformControls.setMode('scale');
					// 	break;
					case 46: // D
						if (transformControls.object) {
							setPieces((oldPice) => Object.keys(oldPice).reduce((obj, k) => {
								if (k !== transformControls.object.uuid) {
									obj[k] = oldPice[k];
								}
								return obj;
							}, {}))
							scene.remove(transformControls.object)
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
			mesh.rotateY(0.5)
			scene.add(mesh);
		});
	};

	// will add core paces to model
	const addCorePieces = function (
		intersect: THREE.Intersection<THREE.Object3D<THREE.Event>>,
		scene: THREE.Scene, loader: Loader,
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
			coreModelMesh.rotation.z = 1.65;  // will add some rotation
			coreModelMesh.rotation.x = -0.1;   // rotate model of core element

			coreModelMesh.geometry.center();

			group.attach(coreModelMesh);
			centerGroup(group);
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
		})

		const axis = new THREE.Vector3(0, 1, 1.5); // local Y/Z axis
		group.rotateOnAxis(axis, 0.1);
		scene.attach(group);
		transformControls.detach();
		scene.attach(transformControls);
		return scene
	};

	return (<>
		<div id='info' style={{
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
		}}>
			"W" translate | "E" rotate | "R" scale | "D" remove
		</div>
		<div ref={containerRef} />
	</>);
}
