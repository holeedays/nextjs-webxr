import * as THREE from "three";
import { useRef, useEffect, RefObject } from "react";
import { clamp, lerpScalar } from "./utils";

// updates the movement of our movement controller
export function updateMovement(
	camera: THREE.Camera, 
	delta: number, 
	dirBools: {forward: boolean, backward: boolean, left: boolean, right: boolean, shift: boolean},
	normalMoveSpeed: number,
	fastMoveSpeed: number
): void {
  	// get rot
	const cameraRot: THREE.Quaternion = camera.quaternion;
	// instantiate a new Vector3 to hold a normalized version of our movment
	const movementVector: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
	// also get the target move speed based on if we held down the shift key or not
	const targetMoveSpeed: number = dirBools.shift? fastMoveSpeed: normalMoveSpeed;

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

// updates the view and camera rotation of our movement controller
export function updateCameraRotation(
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

// a hook to deal with pick up logic with interactable objects in the scene
// returns a method that is passed to useFrame() for consistent update (NOTE: react renders and useFrame() are
// separate processes)
export function usePickUpLogic(
	camera: THREE.Camera, 
	raycastIntersections: RefObject<THREE.Intersection[]>, 
	defaultHoldDist: number
): (zoomControlBools: {zoom_in: boolean, zoom_out: boolean}) => void {
	// NOTE: you must use useRef, useState to actually change the variable or else react wont actually do anything (so nothing
	// will change for things like useFrame, etc even if the variable actually changed)

	// do note that useState actually triggers a rerender (which essentially causes the component function body
	// to run again, which can end up refreshing local variables and adding more event listeners if not cleaned 
	// up properly); use useEffect() in the case of event listeners 
	const pickedUpObject: RefObject<THREE.Object3D | null> = useRef<THREE.Object3D | null>(null);
	// these 2 worked together, additionalHoldDist tries to lerp to targetAdditionalHoldDist essentially
	const additionalHoldDist: RefObject<number> = useRef<number>(0);
	const targetAdditionalHoldDist: RefObject<number> = useRef<number>(0);
	// this variable sets our initial hold distance
	const initialHoldDist: RefObject<number> = useRef<number>(0);

	// handler for a pick up event (e.g. when the mouse is clicked), wrapped in a useEffect to avoid rendering
	// multiple listeners
	useEffect(() => {
		const handlePickUp: (ev: MouseEvent) => void = (ev: MouseEvent) => {
			// prevents recurrent event listeners of the window element from occuring + bubbling and capturing
			ev.stopImmediatePropagation();

			// toggle pick up logic here
			if (pickedUpObject.current === null && raycastIntersections.current.length > 0) {

				// get the objects from our intersection
				const target: THREE.Object3D = raycastIntersections.current[0].object;
				const parent: THREE.Object3D | null = target.parent;
				// also do this to set our initial hold dist (basically the dist between the pivot (hopefully center
				// in most cases, may have to edit it in blender... "Asia building glb" not looking too good here") 
				// and the point that was hit so this is the dist where the object is almost clipping into our camera
				const intersectionPoint: THREE.Vector3 = raycastIntersections.current[0].point;
				initialHoldDist.current = intersectionPoint.distanceTo(target.position);

				// this check is for custom 3D models which may be put in a group (like the potted plant)
				// we want the actual object holding the position (which we should have added the isInteractable
				// boolean to)
				if (parent?.userData !== undefined && parent.userData.isInteractable === true) 
					pickedUpObject.current = parent;
				else
					pickedUpObject.current = target;

				// also reset the additional hold dist vars here
				additionalHoldDist.current = 0;
				targetAdditionalHoldDist.current = 0;
			}
			else if (pickedUpObject.current !== null) {
				pickedUpObject.current = null;
			}
		}
		// add the handler for our mouse click event over here
		window.addEventListener("mouseup", handlePickUp);
		return () => window.removeEventListener("mouseup", handlePickUp);
	}, [raycastIntersections]); // useEffect returns and activates again only when raycastIntersections reference 
								// is altered (e.g. the raycastIntersections var itself is reassigned, not 
								// raycastIntersections.current)

	// since drei's getScroll() hook is not what I intended I will opt for using good old fashioned event listeners for 
	// scroll (zooming) logic, this handler just deals with adjusting the target additional hold dist, which updates 
	// additional hold dist directly
	useEffect(() => {
		// deltaY is massive so we need a value to reduce it slightly so it's manegable
		const deltaDampener: number = 0.01;

		const handlePickedUpObjectDistScroll: (ev: Event) => void = (ev: Event) => {
			const evAsWheelEvent: WheelEvent = ev as WheelEvent;
			targetAdditionalHoldDist.current -= evAsWheelEvent.deltaY*deltaDampener;
		}
		window.addEventListener("wheel", handlePickedUpObjectDistScroll);
		return () => window.removeEventListener("wheel", handlePickedUpObjectDistScroll);
	}, []);

	// handler for controlling distance for a picked up object with a wheel event (e.g. scroll)
	const updatePickedUpObjectDist: (
		zoomControlBools: {zoom_in: boolean, zoom_out: boolean},
		scrollZoomSpeed?: number,
		keyZoomSpeed?: number
	) => void = (
		zoomControlBools: {zoom_in: boolean, zoom_out: boolean},
		scrollZoomSpeed: number = 0.05,
		keyZoomSpeed: number = 0.5
	) => {
		// zoom buttons logic here
		// if buttons are pressed, then there is no lerping, only scrolling should actually have the lerping effect
		if (zoomControlBools.zoom_in) {
			additionalHoldDist.current -= keyZoomSpeed;
			targetAdditionalHoldDist.current = additionalHoldDist.current;
		}
		if (zoomControlBools.zoom_out) {
			additionalHoldDist.current += keyZoomSpeed;
			targetAdditionalHoldDist.current = additionalHoldDist.current;
		}

		// scroll logic here
		// a bit spaghetti-like I know but this should be fine
		additionalHoldDist.current = lerpScalar(
			additionalHoldDist.current, 
			targetAdditionalHoldDist.current, 
			scrollZoomSpeed
		);
	}

	// handler for controlling object's transform position (sort of like setting the object as a child here)
	const updatePickedUpObjectTransform: () => void = () => {
		if (pickedUpObject.current === null)
			return;

		// get the camera pos
		const cameraCurrentPos: THREE.Vector3 = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z);
		// get out net hold distance
		const holdDist: number = initialHoldDist.current+defaultHoldDist+additionalHoldDist.current;
		// get our forward vector scaled by hold dist
		const forwardVector: THREE.Vector3 = new THREE.Vector3(0, 0, -1*holdDist);
		const targetPos: THREE.Vector3 = cameraCurrentPos.add(
			forwardVector.applyQuaternion(camera.quaternion)
		);

		// set the pos of our object
		pickedUpObject.current.position.set(targetPos.x, targetPos.y, targetPos.z);
	}

	// this will run in useFrame and constantly update our object relative to our camera, sort of like parenting but probably a lot
	// more laggy :/
	const updatePickUp: (
		zoomControlBools: {zoom_in: boolean, zoom_out: boolean}
	) => void = (
		zoomControlBools: {zoom_in: boolean, zoom_out: boolean}
	) => {
		// update our zoom effect for our obj
		updatePickedUpObjectDist(zoomControlBools);
		// and update the transform of the object
		updatePickedUpObjectTransform();
	}

	// return our update method so we can pass it to useFrame
	return updatePickUp;
}