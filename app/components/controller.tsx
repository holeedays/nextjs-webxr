import { JSX, useRef, RefObject } from "react";
import * as THREE from "three";
import { ScrollControlsState, useKeyboardControls, useScroll } from "@react-three/drei";
import { useFrame, useThree, RootState } from "@react-three/fiber";
import { getInteractableObjectsInScene, getInteractableObjectsInRaycast } from "./utils";
import { updateCameraRotation, updateMovement, usePickUpLogic } from "./controller-funcs";

// key maps that will be serialized by react three drei 
export const keyMap: {name: string, keys: string[]}[] = [
	// movement keys
	{ name: "forward", keys: ["ArrowUp", "w", "W"] },
	{ name: "backward", keys: ["ArrowDown", "s", "S"] },
	{ name: "left", keys: ["ArrowLeft", "a", "A"] },
	{ name: "right", keys: ["ArrowRight", "d", "D"] },
	{ name: "shift", keys: ["Shift"] },

	// misc keys
	{ name: "zoom_in", keys: ["+"] },
	{ name: "zoom_out", keys: ["-"] }
]

// this is our invisible object that exists in our canvas, functioning like much like a unity script component and driving all
// user oriented logic 
export function Controller(): JSX.Element {  
	// mouse controls (useThree().mouse is deprecated; use pointer instead)
	const {pointer, camera} = useThree();
	// get our keyboard controls
	const [subscribeKeys, getKeys] = useKeyboardControls();
	// get our scroll controls
	const scroll: ScrollControlsState = useScroll();

	// an array that updates with the current raycast intersections
	const raycastIntersections: RefObject<THREE.Intersection[]> = useRef<THREE.Intersection[]>([]);

	// variables for updateMovment() (e.g. controls the controller movespeed)
  	const normalMoveSpeed: number = 5;
	const fastMoveSpeed: number = normalMoveSpeed * 2;
	// variables for initPickUpLogic (e.g. controls interaction logic with the player and interactables)
	const objectHeldDist: number = 5;

	// init our pick up logic for interactable objects within the scene and return the handler for our update function
	const updatePickUp: (
		scroll: ScrollControlsState, 
		zoomControlBools: {zoom_in: boolean, zoom_out: boolean}
	) => void = usePickUpLogic(camera, raycastIntersections, objectHeldDist);

	// NOTE: useFrame has to be rendered within the canvas so it must be included in a react component; it is the equivalent of update
	// or a draw function
	// state incudes all the core components of the scene including camera, gl, canvas, raycaster etc
	useFrame((state: RootState, delta: number) => {
		// destructure the things we need
		const {camera, scene} = state;
		const {forward, backward, left, right, shift, zoom_in, zoom_out} = getKeys();
		
		// get all the current intersections we have currently
		const currentIntersections: THREE.Intersection[] | null = (
			getInteractableObjectsInRaycast(
				camera, 
				getInteractableObjectsInScene(scene)
			)
		);
		// this shouldn't return null unless we don't pass an array to the second param of getInteractableObjectsInRaycast()
		if (currentIntersections !== null)
			raycastIntersections.current = currentIntersections;

		// handle movement here
		updateCameraRotation(camera, pointer);
		updateMovement(camera, delta, {forward, backward, left, right, shift}, normalMoveSpeed, fastMoveSpeed);
	
		// update pick up logic here
		updatePickUp(scroll, {zoom_in, zoom_out});
	});

	return (
		<mesh>
		</mesh>
	);
}