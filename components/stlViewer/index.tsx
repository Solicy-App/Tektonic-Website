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
						transformControls.setMode('translate');
						break;
					case 69: // E
						transformControls.setMode('rotate');
						const onClick = (event, meshes) => {
							// calculate the mouse position in normalized device coordinates (-1 to +1)
							const mouse = new THREE.Vector2(5, 2);
							mouse.x = (event.clientX / 1400) * 2 - 1;
							mouse.y = -(event.clientY / 1400) * 2 + 1;

							// create a new raycaster
							const raycaster = new THREE.Raycaster();

							// set the raycaster's origin to the camera position
							raycaster.setFromCamera(mouse, camera);

							// calculate the intersections between the raycaster and the mesh
							for (let i = 0; i < meshes.length; i++) {
								const mesh = meshes[i];

								const intersects = raycaster.intersectObject(mesh);

								// if the mouse click intersects with the mesh, log a message to the console
								if (intersects.length > 0) {
									console.log(`clicked on the image! -> ${i}`);
								}
							}
						}

						const meshes = [];
						const spriteMap = new THREE.TextureLoader().load('assets/point1.png');
						const spriteMaterial = new THREE.SpriteMaterial({ map: spriteMap });
						console.log(scene.children);
						const len =  scene.children.length
						for (let i = 1; i < scene.children.length - 1; i++) {
							
							const mesh = new THREE.Sprite(spriteMaterial);
							mesh.scale.set(6, 2, 1);
							const element = scene.children[i];


							mesh.position.set(element.position.x, element.position.y + 8, element.position.z - 2);
							meshes.push(mesh)
						}
						for (let i = 0; i < meshes.length; i++) {
							const el = meshes[i];
							scene.add(el);
						}
						renderer.domElement.addEventListener('click', (ev) => onClick(ev, meshes));
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
		});

		loader.load(activeWing.path, (geometry) => {
			const material = new THREE.MeshMatcapMaterial({
				color: 0xabdbe3, // color for texture
				matcap: textureLoader.load(whiteTexture)
			});
			wingModelMesh = new THREE.Mesh(geometry, material);
			wingModelMesh.geometry.computeVertexNormals();
			wingModelMesh.geometry.center();
			wingModelMesh.position.copy(intersect.point);
			// rotations
			wingModelMesh.rotation.y = activeWing?.rotations.y;  // will add some rotation
			wingModelMesh.rotation.x = activeWing?.rotations.x;   // rotate model of core element

			//possitions
			if (activeWing?.movedPos.x)
				wingModelMesh.position.x += activeWing?.movedPos.x;
			if (activeWing?.movedPos.y)
				wingModelMesh.position.y += activeWing?.movedPos.y;
			if (activeWing?.movedPos.z)
				wingModelMesh.position.z += activeWing?.movedPos.z;

			// scales
			wingModelMesh.scale.x = activeWing?.scale || 0.7;
			wingModelMesh.scale.y = activeWing?.scale || 0.7;
			wingModelMesh.scale.z = activeWing?.scale || 0.7;
			group.attach(wingModelMesh);
			centerGroup(group);
		});

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
