import * as THREE from "three";

// a standard clamp function
export function clamp(value: number, min: number, max: number): number {
    if (value > max)
        value = max;
    else if (value < min)
        value = min;

    return value;
}

// a standard lerp function
export function lerpScalar(value: number, targetValue: number, lerpDelta: number): number {
    // prevent lerpDelta from leaving the range [0, 1]
    lerpDelta = clamp(lerpDelta, 0, 1);
    const diff: number = targetValue - value;
    return value + diff*lerpDelta;
}

// gets all objects that have the userData property with isInteractable being true
export function getInteractableObjectsInScene(scene: THREE.Scene): THREE.Object3D[] {
	const interactableObjs: THREE.Object3D[] = [];
    scene.traverse((child: THREE.Object3D) => {
        if (child.userData !== undefined && child.userData.isInteractable === true) {
            interactableObjs.push(child);
        }
    });
    return interactableObjs;
}

// raycast from the center of the camera forward and return all intersection points 
export function getInteractableObjectsInRaycast(
    camera: THREE.Camera, 
    interactableObjects: THREE.Object3D[] | null = null,
    nearDistThreshold: number = 0,
    farDistThreshold: number = Number.POSITIVE_INFINITY
): THREE.Intersection[] | null {
    // return nothing if interactable objects is null
    if (interactableObjects === null)
        return null;

    // construct a raycaster starting at the camera's position
    const raycaster: THREE.Raycaster = new THREE.Raycaster(
        camera.position, 
        new THREE.Vector3(0, 0, -1), 
        nearDistThreshold, 
        farDistThreshold
    );
    // set the direction of the ray to the camera's forward
    raycaster.ray.direction.applyQuaternion(camera.quaternion);
    // return all the interesection points made
    return raycaster.intersectObjects(interactableObjects, true);
}
