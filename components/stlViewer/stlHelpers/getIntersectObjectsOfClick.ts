import * as THREE from 'three';

export const getIntersectObjectsOfClick = (event, sizeX, sizeY, camera, objects, recursive=true) => {
	let clickMouse = new THREE.Vector2();

	clickMouse.x = (event.clientX / sizeX) * 2 - 1;
	clickMouse.y = -(event.clientY / sizeY) * 2 + 1;

	const raycaster = new THREE.Raycaster();
	raycaster.setFromCamera(clickMouse, camera);

	// var arrow = new THREE.ArrowHelper( raycaster.ray.direction, raycaster.ray.origin, 800, 0xff0000 );
	// scene.add( arrow );

	return raycaster.intersectObjects(objects, recursive);
}
