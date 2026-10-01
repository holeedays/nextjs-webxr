// Interactive 3D model component that loads a GLTF file
// This demonstrates advanced concepts: file loading, state management, and user interaction

import * as THREE from 'three'
import React, { JSX, useState } from 'react'
import { useGLTF } from '@react-three/drei'
import { GLTFResult } from '../../types/gltf'

// Component that renders a 3D potted plant model with interactive features
// It accepts group props, which means you can position, rotate, and scale the entire model
export function PottedPlant(props: React.ComponentProps<'group'>) {
  
	// GLTF LOADING
	// useGLTF hook loads a 3D model file and extracts its parts
	// The file '/potted-plant.glb' must be in the public folder
	const { nodes, materials } = useGLTF('/potted-plant.glb') as unknown as GLTFResult
	
	// STATE MANAGEMENT
	// useState hook manages the plant's position in 3D space
	// The position is an array of [x, y, z] coordinates
	// TypeScript annotation ensures type safety
	const [position, setPosition] = useState<[number, number, number]>([0, 0, 0])
	
	// INTERACTION HANDLER
	// Function that generates a random position when the plant is clicked
	const randomizePosition = () => {
		// Math.random() gives 0-1, subtract 0.5 to get -0.5 to 0.5, multiply by 20 for -10 to +10 range
		const randomX = (Math.random() - 0.5) * 20 // Random X coordinate between -10 and +10
		const randomZ = (Math.random() - 0.5) * 20 // Random Z coordinate between -10 and +10
		// Y is set to -1 to position the plant on the grid floor
		setPosition([randomX, -1, randomZ])
	}
	
	return (
		// group is like a container that holds multiple 3D objects together
		// It's useful for organizing complex models with multiple parts
		// dispose={null} prevents automatic cleanup, position applies our state
		<group {...props} dispose={null} position={position} userData={{isInteractable: true}}>
		
		{/* 
			The actual 3D mesh that renders the plant model
			This uses the geometry and materials loaded from the GLTF file
		*/}
		<mesh 
			// Extract geometry from the loaded model
			// We cast to THREE.Mesh because our generic type doesn't know the specific node type
			geometry={(nodes.Potted_Plant000 as unknown as THREE.Mesh).geometry} 
			
			// Use the material that came with the 3D model
			material={materials.Material} 
			
			// Scale up the model (original might be very small)
			scale={100}
			
			// XR-COMPATIBLE INTERACTION EVENTS
			// These events work with mouse, touch, XR controllers, and hand tracking
			
			// onClick: When user clicks/touches/points at the plant, trigger position randomization
			// This works with XR controllers, hand tracking, mouse, and touch
			onClick={randomizePosition}
			
			// XR Pointer Events Configuration
			// Note: XR interactions like grab/point are handled automatically by @react-three/xr
			// The onClick, onPointerOver, and onPointerOut events work with XR controllers and hand tracking
			
			// onPointerOver: When mouse hovers or XR controller/hand points at the plant
			onPointerOver={(e) => {
			// Mark the object as hovered (useful for other effects)
			e.object.parent!.userData.hovered = true;
			// Change cursor to pointer to indicate it's clickable (works in desktop mode)
			document.body.style.cursor = 'pointer';
			}}
			
			// onPointerOut: When mouse leaves or XR controller/hand stops pointing at the plant
			onPointerOut={(e) => {
			// Remove hovered state
			e.object.parent!.userData.hovered = false;
			// Reset cursor back to default (works in desktop mode)
			document.body.style.cursor = 'default';
			}}
		/>
		</group>
	);
}


// PERFORMANCE OPTIMIZATION
// Preload the GLTF file so it's ready when the component mounts
// This prevents loading delays when the component first renders
useGLTF.preload('/potted-plant.glb')



/////////////// PLEASE READ BELOW ////////////////





// NOTE: THIS DONT WORK BUT READ THE INSTRUCTIONS AND INFORMATION DOWN BELOWWWWWW 
// (SPECIFICALLY IN THE RETURN PART OF THE FUNCTION)

// this just renders a building
function AsiaBuilding(props: React.ComponentProps<"group">): JSX.Element {
	const { nodes, materials, scene } = useGLTF('/asia_building.glb') as unknown as GLTFResult;

	// this chunk wouldn't work simplt because the parent/child relationships aren't preserved :/
	// const meshes: JSX.Element[] = [];
	// Object.entries(nodes).forEach((value: [string, THREE.Object3D]) => {
	// 	const [key, obj] = value;
	// 	const objMesh: THREE.Mesh = obj as THREE.Mesh;
	// 	if (objMesh.isMesh) {
	// 		meshes.push((
	// 			<mesh 
	// 				key={key}
	// 				geometry={objMesh.geometry}
	// 				material={objMesh.material}
	// 				position={objMesh.position}
	// 				quaternion={objMesh.quaternion}
	// 				scale={objMesh.scale}
	// 			>
	// 			</mesh>
	// 		));
	// 	}
	// });

	return (
		<group 
			{...props} 
			dispose={null} 
			userData={{isInteractable: true}}
			position={[0,0,0]}
		>
			{/* {meshes} */}

			{/* 
				This will load the object as is, but it's just one object; the alternative to doing this is to run
				npx gltfjsx folderWhereYourModelsAre/yourmodel.glb, which converts the entire object into a jsx obj with 
				individual nodes sorted for you... I don't think there's any other true way of doing this

				THE STEPS ARE FOR GLTFJSX:
				1. First validate that the gltfjsx version matches with your current react version (there will be a lib
				called ink that gltfjsx depends on and basically if there is a version mismatch, you won't be able to convert)
				2. Next run the command "npx gltfjsx folderWhereYourModelsAre/yourmodel.glb --types"; in our case, it's the
				path would be public/asia_building for example. The --types flag just tells gltfjsx to add coherent types
				for everything (good for typescript environments, but it's entirely optional if you wanna)
				3. The output should now appear in your root folder
				4. There you have it! An exportable jsx component much like potted_plant.tsx :)
				5. Do note that you might have to edit the file a bit because not all imports are specified (to satisfy the
				type) and there's a custom GLTFAction interface which you have to create. It is an interface that extends 
				from THREE.Animationclips. In the type folder I opted for not extending but combining THREE.AnimationClip with
				an interface that has all the same properties as the animatiom clip. This is simply to satisfy the compiler.
			*/}
			{/* <primitive object={scene}>
			</primitive> */}

		</group>
	);
}