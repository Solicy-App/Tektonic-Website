import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { STLLoader as Loader } from "three/examples/jsm/loaders/STLLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const loader = new Loader();
const textureLoader = new THREE.TextureLoader();

function createAnimate({ scene, camera, renderer }) {
	const triggers = [];

	function animate() {
		requestAnimationFrame(animate);

		triggers.forEach((trigger) => {
			trigger();
		});

		renderer.render(scene, camera);
	}
	function addTrigger(cb) {
		if (typeof cb === "function") triggers.push(cb);
	}
	function offTrigger(cb) {
		const triggerIndex = triggers.indexOf(cb);
		if (triggerIndex !== -1) {
			triggers.splice(triggerIndex, 1);
		}
	}
	return {
		animate,
		addTrigger,
		offTrigger
	};
}

export default function StlViewer({sizeX=1000, sizeY=1000}) {

	const containerRef = useRef();

	useEffect(() => {
		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(
			750,
			sizeX/ sizeY,
			10,
			100000
		);

		loader.load('/assets/Lyn.stl', (geometry) => {
			const material = new THREE.MeshMatcapMaterial({
				color: 0xffffff,
				matcap: textureLoader.load('/assets/matcap-porcelain-white.jpg')
			});
			const mesh = new THREE.Mesh(geometry, material);

			mesh.geometry.computeVertexNormals();
			mesh.geometry.center();

			scene.add(mesh);

			mesh.rotation.x = -1.2;

			animate.addTrigger(() => {
			});
		});

		const renderer = new THREE.WebGLRenderer();

		const controls = new OrbitControls(camera, renderer.domElement);

		controls.maxDistance = 700;
		controls.minDistance = 100;

		const geometry = new THREE.BoxGeometry(0, 0, 0);
		const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
		const cube = new THREE.Mesh(geometry, material);
		scene.add(cube);

		const secondaryLight = new THREE.PointLight(0xff0000, 1, 100);
		secondaryLight.position.set(5, 5, 5);
		scene.add(secondaryLight);

		renderer.setSize(sizeX, sizeY);
		if (containerRef.current)
			(containerRef.current as any).appendChild(renderer.domElement);

		const animate = createAnimate({ scene, camera, renderer });

		camera.position.z = 500;

		animate.animate();
	}, []);

	return <div ref={containerRef} />;
}
