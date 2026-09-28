import React, { JSX , useRef, RefObject } from "react";
import { RootState, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// creates a crosshair sprite that is in front of the camera
export function CrosshairSprite(props: React.ComponentProps<'sprite'>): JSX.Element {
    // create a mutable reference to the sprite that we can edit during runtime
    const spriteRef: RefObject<THREE.Sprite | null> = useRef<THREE.Sprite>(null);
    const mapTexture: THREE.Texture = new THREE.TextureLoader().load("/crosshair.png");

    // disable anti aliasing for the texture
    mapTexture.minFilter = THREE.NearestFilter;
    mapTexture.magFilter = THREE.NearestFilter;

    // run our update function 
    useFrame((state: RootState) => {
        if (spriteRef.current === null)
            return;

        // get our camera from the rootstate
        const camera: THREE.Camera = state.camera;
        // create a copy of our camera positon (because operations with vectors mutate the original vector)
        const cameraCurrentPos: THREE.Vector3 = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z);
        // create a default vector pointing towards the default dir of the camera's forward 
        const forwardVector: THREE.Vector3 = new THREE.Vector3(0, 0, -1);
        // get the pos of our sprite (which is a little bit in front of the center of our camera)
        const spritePos: THREE.Vector3 = cameraCurrentPos.add(
            forwardVector.applyQuaternion(camera.quaternion)
        );
        // set the actual instance's position
        spriteRef.current.position.set(
            spritePos.x,
            spritePos.y,
            spritePos.z
        );
        // also change the scale
        if (props.scale !== undefined) {
            const scale: THREE.Vector3 = props.scale as THREE.Vector3;
            spriteRef.current.scale.set(scale.x, scale.y, scale.z);
        }
    });

    return (
        // though the documentation is bad, this is what it's supposed to look like
        <sprite {...props} ref={spriteRef} scale={[1, 1, 1]}>
            {/* 
                depthTest attribute is set to true by default but setting it false means it always renders even if it's supposed to
                be occluded by an object
            */}
            <spriteMaterial attach="material" map={mapTexture} depthTest={false} />
        </sprite>
    );
}