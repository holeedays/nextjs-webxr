import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useState } from "react";
import { clamp } from "./utils";

// handles the movement of our movement controller
export function handleMovement(
	camera: THREE.Camera, 
	delta: number, 
	dirBools: {forward: boolean, backward: boolean, left: boolean, right: boolean, shift: boolean},
	normalMoveSpeed: number,
	fastMoveSpeed: number
): void {
  	// get rot
	const cameraRot: THREE.Quaternion = camera.quaternion;
	// instantiate a new Vector3 to hold a normalized version of our movment
	let movementVector: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
	// also get the target move speed based on if we held down the shift key or not
	let targetMoveSpeed: number = dirBools.shift? fastMoveSpeed: normalMoveSpeed;

	// check for keyboard inputs
	if (dirBools.forward)
		movementVector.z -= 1;
	if (dirBools.backward)
		movementVector.z += 1;
	if (dirBools.left) 
		movementVector.x -= 1;
	if (dirBools.right)
		movementVector.x += 1;

	// this is to normalize the movement vector to prevent sqrt(2) speed for diagonal movements
	movementVector.normalize();
	// and increase the normalized vector by: the target speed * delta time betwen frames
	movementVector.multiplyScalar(targetMoveSpeed*delta);
	// formula for transforming a vector by a directional vector (quaternion, not euler) is v' = q*v*q^-1
	// since most of our quaternions are normalized, the inverse quaternion is just where x, y, z are negated HOWEVER three.js does all the 
	// work for us so we don't have to do that :) 
	movementVector.applyQuaternion(cameraRot);
	camera.position.add(movementVector);
}

// handles the view and camera rotation of our movement controller
export function handleCameraRotation(
  camera: THREE.Camera,
  mouseDelta: THREE.Vector2,
  sensitivity: number = 1
): void {
	// the ideal way to do this without avoiding gimbal lock without parenting (e.g. body rotates around the y axis and the camera [which 
	// would be a child of the body and rotates only along the x/z axis]) is doing 2 subsequent quaternion transformations (similar to
	// a sequence of matrix rotations)

  	// mouseDelta is normalized by the canvas size so limits of x and y are [-1, 1]
	// since the limits are constrained to [-1, 1], we can say that the general limit the camera can rotate around the x axis is 
	// [-PI/2, PI/2] (which is the default unit of rotation for three.js euler angles); we can represent this as a normalized value 
	// then of PI/2 * mouseDelta.y
	const xRotLimNormalized: number = Math.PI/2;
	const xRotEuler: THREE.Euler = new THREE.Euler(
		// since we want to apply sensitivity as well, we should still clamp back the value to the limits of [-PI/2, PI/2]
		clamp(
				mouseDelta.y*xRotLimNormalized*sensitivity,
				-xRotLimNormalized,
				xRotLimNormalized
			), 
		0, 
		0, 
		THREE.Euler.DEFAULT_ORDER // default order means the axes are in 'XYZ' order
	);
	// rot around the y axis is unbounded, there's no clamping involved here 
	const yRotLimNormalized: number = Math.PI;
	const yRotEuler: THREE.Euler = new THREE.Euler(
		0,
		-mouseDelta.x*yRotLimNormalized*sensitivity,
		0,
		THREE.Euler.DEFAULT_ORDER
	);

	// create 2 new quaternions equivalent to the quaternion identity (no rotations)
	const xRotQuaternion: THREE.Quaternion = new THREE.Quaternion(0, 0, 0, 1);
	const yRotQuaternion: THREE.Quaternion = new THREE.Quaternion(0, 0, 0, 1);
	// you have to convert each individual euler transformation to indivudual quaternions first instead of chaining setFromEuler twice 
	// because that produces gimbal lock unfortunately 
	xRotQuaternion.setFromEuler(xRotEuler);
	yRotQuaternion.setFromEuler(yRotEuler);
	// note the order of the quaternion rotation (e.g. rot around the y axis first then the x axis): this simulates the parent body and 
	// child camera motion; doing the opposite causes a very weird rotation effect (like a spherical rotation)
	camera.setRotationFromQuaternion(
		yRotQuaternion.multiply(xRotQuaternion)
	);
}

export function initPickUpLogic(
	camera: THREE.Camera, 
	raycastIntersections: THREE.Intersection[], 
	objectHeldDist: number
): void {
	// switch statement for mouseup event listener
	let pickedUp: boolean = false;
	// NOTE: you must use useRef, useState to actually change the variable or else react wont rerender the window (so nothing
	// will change for things like useFrame, etc even if the variable actually changed)
	let [pickedUpObject, setPickedUpObject] = useState<THREE.Object3D | null>(null)

	// handler for a pick up event (e.g. when the mouse is clicked)
	const handlePickUp: (ev: MouseEvent) => void = (ev: MouseEvent) => {
		// do not run the function if there are no intersections
		if (raycastIntersections.length === 0)
			return;

		// prevents recurrent event listeners of the window element from occuring + bubbling and capturing
		ev.stopImmediatePropagation();

		if (!pickedUp) {
			setPickedUpObject(raycastIntersections[0].object);
			pickedUp = true;
			console.log(pickedUpObject);
		}
		else {
			setPickedUpObject(null);
			pickedUp = false;
			console.log("YAH");
		}
	};

	// we pass to another iteration of the update function, will probably reorganize later because the order is kinda like spaghetti
	// right now...
	// this will run in useFrame and constantly update our object relative to our camera, sort of like parenting but probably a lot
	// more laggy :/
	const updatePickUp: () => void = () => {
		if (pickedUpObject === null)
			return;

		const cameraCurrentPos: THREE.Vector3 = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z);
		const forwardVector: THREE.Vector3 = new THREE.Vector3(0, 0, -1*objectHeldDist);
		const targetPos: THREE.Vector3 = cameraCurrentPos.add(
			forwardVector.applyQuaternion(camera.quaternion)
		);

		// set the pos of our object
		pickedUpObject.position.set(targetPos.x, targetPos.y, targetPos.z);
	}

	// add the handlers over here
	window.addEventListener("mouseup", handlePickUp);
	useFrame(() => {
		updatePickUp();
	});
}