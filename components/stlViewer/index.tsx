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
	sizeX = 1500,
	sizeY = 1000,
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


	useEffect(() => {
		setScene(new THREE.Scene());
		setCamera(new THREE.PerspectiveCamera(
			750,
			sizeX / sizeY,
			10,
			100000
		));
		setRenderer(new THREE.WebGLRenderer());
	}, []);

	useEffect(() => {
		const handleClick = (event) => {
			if (!draggingControl) {
				const intersects = getIntersectObjectsOfClick(event, sizeX, sizeY, camera, Object.values(pieces));
				if (intersects.length) {
					transformControls.attach(intersects[0].object.parent);
				} else {
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
				addCorePieces(intersect, scene, loader);
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
						break;
					case 82: // R
						transformControls.setMode('scale');
						break;
					case 68: // D
						if (transformControls.object) {
							setPieces((oldPice) =>  Object.keys(oldPice).reduce((obj, k) => {
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

			// const box = new THREE.BoxHelper(mesh, 0xffff00);
			// scene.add(box);
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
			coreModelMesh.rotation.x = -0.3;   // rotate model of core element
			coreModelMesh.geometry.center();

			group.attach(coreModelMesh);
		});

		// const wingPartPath = '/assets/tektonicWings/tectonic_long.stl'
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
			// const box = new THREE.BoxHelper(group, 0xffff00);
			// scene.add(box);
		});

		setPieces((prevPieces) => {
			let pieces = Object.assign({}, prevPieces);
			pieces[group.uuid] = group;
			return pieces;
		})
		// pieces[group.uuid] = group;
		scene.attach(group);
		transformControls.detach();
		transformControls.attach(group);
		scene.attach(transformControls);
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
