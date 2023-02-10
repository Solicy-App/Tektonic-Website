import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { STLLoader as Loader } from "three/examples/jsm/loaders/STLLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { TransformControls } from "three/examples/jsm/controls/TransformControls";
import { createAnimate } from './stlHelpers/animate';
import { centerGroup } from './stlHelpers/centerGroup';
import { ArrowHelper, Vector3 } from 'three';
import { getIntersectObjectsOfClick } from './stlHelpers/getIntersectObjectsOfClick';

const loader = new Loader();
const textureLoader = new THREE.TextureLoader();

const wings = {
	wing1: {
		path: '/assets/tektonicWings/tectonic_long.stl' ,
		rotations: {x: 1.3, y: 0.2},
		scale: 0.8,
		movedPos: {x: 4}
	},
	wing2: {
		path: '/assets/tektonicWings/tectonic_angle1.stl' ,
		rotations: {x: 1.3, y: 0.2},
		scale: 0.8,
		movedPos: {x: -1, z: -2, y: -2}
	},
	wing3: {
		path: '/assets/tektonicWings/tectonic_angle2.stl' ,
		rotations: {x: 1.1, y: 0.2},
		scale: 0.8,
		movedPos: {x: 1, z: 0, y: -2}
	},
	wing4: {
		path: '/assets/tektonicWings/tectonic_single.stl' ,
		rotations: {x: 1.1, y: 0.2},
		scale: 0.8,
		movedPos: {x: -3, z: 1, y: -2}
	},
	wing5: {
		path: '/assets/tektonicWings/tectonic_straight.stl' ,
		rotations: {x: 1.1, y: 0.2},
		scale: 0.8,
		movedPos: {x: 0.5, z: 0.5, y: -2}
	},
}

// will add core paces to model
const addCorePieces = function (
	intersect: THREE.Intersection<THREE.Object3D<THREE.Event>>,
	scene: THREE.Scene, loader: Loader,
	wing: any,
	transformControls: TransformControls,
	collection: any,
) {
	const coreModelPath = '/assets/tektonicCoreParts/CoreStep.stl'
	const whiteTexture = '/assets/whiteTextureBasic.jpg'
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
		coreModelMesh.position.copy(intersect.point)
		coreModelMesh.rotation.z = 1.65;  // will add some rotation
		coreModelMesh.rotation.x = -0.3;   // rotate model of core element
		coreModelMesh.geometry.center();

		group.attach(coreModelMesh);
	});

	// const wingPartPath = '/assets/tektonicWings/tectonic_long.stl'
	loader.load(wing.path, (geometry) => {
		const material = new THREE.MeshMatcapMaterial({
			color: 0xabdbe3, // color for texture
			matcap: textureLoader.load(whiteTexture)
		});
		wingModelMesh = new THREE.Mesh(geometry, material);
		wingModelMesh.geometry.computeVertexNormals();
		wingModelMesh.geometry.center();
		wingModelMesh.position.copy(intersect.point)
		// rotations
		wingModelMesh.rotation.y = wing?.rotations.y;  // will add some rotation
		wingModelMesh.rotation.x = wing?.rotations.x;   // rotate model of core element

		//possitions
		if (wing?.movedPos.x)
			wingModelMesh.position.x += wing?.movedPos.x
		if (wing?.movedPos.y)
			wingModelMesh.position.y += wing?.movedPos.y
		if (wing?.movedPos.z)
			wingModelMesh.position.z += wing?.movedPos.z

		// scales
		wingModelMesh.scale.x = wing?.scale || 0.7
		wingModelMesh.scale.y = wing?.scale || 0.7
		wingModelMesh.scale.z = wing?.scale || 0.7

		group.attach(wingModelMesh);
		centerGroup(group);
		// const box = new THREE.BoxHelper(group, 0xffff00);
		// scene.add(box);
	});

	collection[group.uuid] = group;
	scene.attach(group);
	transformControls.detach();
	transformControls.attach(group);
	scene.attach(transformControls);
}


export default function StlViewer({ sizeX = 1500, sizeY = 1000, pathToModel = '/assets/Lyn.stl', pathToModelTexture = '/assets/whiteTextureBasic.jpg' }) {
	const containerRef = useRef();
	let transformControls: TransformControls = undefined;
	let orbitControls = undefined;
	let scene = undefined;
	let camera = undefined;
	let renderer = undefined;
	const pieces = {};

	useEffect(() => {
		scene = new THREE.Scene();
		camera = new THREE.PerspectiveCamera(
			750,
			sizeX / sizeY,
			10,
			100000
		);
		init();
		renderModel();
		//  three js window
		if (containerRef.current)
			(containerRef.current as any).appendChild(renderer.domElement);
		const animate = createAnimate({ scene, camera, renderer });
		camera.position.z = 350;
		animate.animate();
	});

	const init = () => {
		renderer = new THREE.WebGLRenderer();
		renderer.setSize(sizeX, sizeY);
		orbitControls = new OrbitControls(camera, renderer.domElement);
		// add controls to window
		// zoom parameters how much can zoom
		orbitControls.maxDistance = 450;
		orbitControls.minDistance = 125;
		initTransformControls();

		addEvents();

		// const axesHelper = new THREE.AxesHelper( 100 );
		// scene.add( axesHelper );
	}

	const handleClick = (event) => {
		const intersects = getIntersectObjectsOfClick(event, sizeX, sizeY, camera, Object.values(pieces));
		if (intersects.length) {
			transformControls.attach(intersects[0].object.parent);
		} else {
			transformControls.detach();
		}
	}

	const addEvents = () => {
		renderer.domElement.addEventListener('click', handleClick);
	}

	const initTransformControls = () => {
		transformControls = new TransformControls(camera, renderer.domElement);
		transformControls.addEventListener('change', () => {
			renderer.render(scene, camera);
		});
		transformControls.addEventListener('dragging-changed', event => orbitControls.enabled = ! event.value);

		window.addEventListener( 'keydown', event => {
			switch ( event.keyCode ) {
				case 87: // W
					transformControls.setMode( 'translate' );
					break;
				case 69: // E
					transformControls.setMode( 'rotate' );
					break;
				case 82: // R
					transformControls.setMode( 'scale' );
					break;
			}
		});
	}

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
			renderer.domElement.addEventListener('dblclick', (event) => handleDblClick(event, mesh));
			// const box = new THREE.BoxHelper(mesh, 0xffff00);
			// scene.add(box);
			scene.add(mesh);
		});
	}

	const handleDblClick = (event, mesh) => {
		const intersects = getIntersectObjectsOfClick(event, sizeX, sizeY, camera, [mesh]);
		if (intersects.length > 0) { // clicked on model or no
			let intersect = intersects[0];
			//show core screw/(implant) pices
			addCorePieces(intersect, scene, loader, wings.wing5, transformControls, pieces);
		}
	}

	return (<>
		<div id="info" style={{
			position: "absolute",
			top: "0px",
			width: "100%",
			padding: "10px",
			boxSizing: "border-box",
			textAlign: "center",
			userSelect: "none",
			pointerEvents: "none",
			zIndex: 1,
			color: '#ffffff'
		}}>
			"W" translate | "E" rotate | "R" scale
		</div>
		<div ref={containerRef} />
	</>);
}
