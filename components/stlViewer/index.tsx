import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { STLLoader as Loader } from "three/examples/jsm/loaders/STLLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { createAnimate } from './stlHelpers/animate';

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
const addCorePices = function (
	intersect: THREE.Intersection<THREE.Object3D<THREE.Event>>,
	scene: THREE.Scene, loader: Loader,
	wing: any
) {
	const coreModelPath = '/assets/tektonicCoreParts/CoreStep.stl'
	const whiteTexture = '/assets/whiteTextureBasic.jpg'
	
	// render model 
	loader.load(coreModelPath, (geometry) => {
		const material = new THREE.MeshMatcapMaterial({
			color: 0xffffff, // color for texture
			matcap: textureLoader.load(whiteTexture)
		});
		const mesh = new THREE.Mesh(geometry, material);
		mesh.geometry.computeVertexNormals();
		mesh.geometry.center();
		mesh.position.copy(intersect.point)
		mesh.rotation.z = 1.65;  // will add some rotation
		mesh.rotation.x = -0.3;   // rotate model of core element
		scene.add(mesh);
	});

	// const wingPartPath = '/assets/tektonicWings/tectonic_long.stl'
	loader.load(wing.path, (geometry) => {
		const material = new THREE.MeshMatcapMaterial({
			color: 0xabdbe3, // color for texture
			matcap: textureLoader.load(whiteTexture)
		});
		const mesh = new THREE.Mesh(geometry, material);
		mesh.geometry.computeVertexNormals();
		mesh.geometry.center();
		mesh.position.copy(intersect.point)
		// rotations
		mesh.rotation.y = wing?.rotations.y;  // will add some rotation
		mesh.rotation.x = wing?.rotations.x;   // rotate model of core element

		//possitions
		if (wing?.movedPos.x)
			mesh.position.x += wing?.movedPos.x
		if (wing?.movedPos.y)
			mesh.position.y += wing?.movedPos.y
		if (wing?.movedPos.z)
			mesh.position.z += wing?.movedPos.z

		// scales
		mesh.scale.x = wing?.scale || 0.7
		mesh.scale.y = wing?.scale || 0.7
		mesh.scale.z = wing?.scale || 0.7
		scene.add(mesh);
	});

}


export default function StlViewer({ sizeX = 1500, sizeY = 1000, pathToModel = '/assets/Lyn.stl', pathToModelTexture = '/assets/whiteTextureBasic.jpg' }) {
	const containerRef = useRef();
	useEffect(() => {
		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(
			750,
			sizeX / sizeY,
			10,
			100000
		);
		var clickMouse = new THREE.Vector2();
		// render model 
		loader.load(pathToModel, (geometry) => {
			const material = new THREE.MeshMatcapMaterial({
				color: 0xffffff, // color for texture
				matcap: textureLoader.load(pathToModelTexture)
			});
			const mesh = new THREE.Mesh(geometry, material);
			mesh.geometry.computeVertexNormals();
			mesh.geometry.center();
			// will add click method to object
			renderer.domElement.addEventListener('click', (event) => {
				clickMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
				clickMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

				//model event handler
				const raycaster = new THREE.Raycaster();
				raycaster.setFromCamera(clickMouse, camera);

				// add and handle events
				const intersects = raycaster.intersectObjects([mesh]);
				if (intersects.length > 0) { // clicked on model or no
					var intersect = intersects[0];
					//show core screw/(implant) pices 
					addCorePices(intersect, scene, loader, wings.wing5)
				}
			});
			scene.add(mesh);
		});
		const renderer = new THREE.WebGLRenderer();
		// add controls to window
		const controls = new OrbitControls(camera, renderer.domElement);
		// zoom parameters how much can zoom 
		controls.maxDistance = 450;
		controls.minDistance = 125;
		const geometry = new THREE.BoxGeometry(0, 0, 0);
		const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // give materials or textures to model
		const cube = new THREE.Mesh(geometry, material);
		scene.add(cube);
		//  three js window 
		renderer.setSize(sizeX, sizeY);
		if (containerRef.current)
			(containerRef.current as any).appendChild(renderer.domElement);
		const animate = createAnimate({ scene, camera, renderer });
		camera.position.z = 350;
		animate.animate();
	}, []);

	return <div ref={containerRef} />;
}
