import React, { JSX, useState } from "react";
import * as THREE from "three";

// Define the Cube component as a function that accepts mesh properties
// React.ComponentProps<'mesh'> means it accepts any props that a regular mesh would accept
// This includes position, rotation, scale, onClick handlers, etc.
export function Cube(props: React.ComponentProps<'mesh'>) {
  
    // STATE MANAGEMENT
    // Track if the cube is currently being hovered/selected
    const [isHovered, setIsHovered] = useState(false);
    const [color, setColor] = useState("#ff6b35"); // Start with orange
    
    // INTERACTION HANDLER
    // Function to cycle through colors when the cube is clicked/touched in XR
    const changeColor = () => {
        const colors = ["#ff6b35", "#4ecdc4", "#45b7d1", "#96ceb4", "#ffeaa7"];
        const currentIndex = colors.indexOf(color);
        const nextIndex = (currentIndex + 1) % colors.length;
        setColor(colors[nextIndex]);
    };

    return (
        // mesh is the fundamental 3D object in Three.js
        // It combines geometry (shape) with material (appearance)
        // {...props} spreads any props passed to this component onto the mesh
        <mesh 
        {...props}
        
        // XR-COMPATIBLE INTERACTIONS
        // These events work with mouse, touch, XR controllers, and hand tracking
        onClick={changeColor}
        
        onPointerOver={() => {
            setIsHovered(true);
            document.body.style.cursor = 'pointer';
        }}
        
        onPointerOut={() => {
            setIsHovered(false);
            document.body.style.cursor = 'default';
        }}
        
        // Scale up slightly when hovered for visual feedback in XR
        scale={isHovered ? 1.1 : 1}
        >
        
        {/* 
            boxGeometry defines the shape of our cube
            args={[width, height, depth]} - in this case, a 2x2x2 cube
            Geometry defines the vertices and faces that make up the 3D shape
        */}
        <boxGeometry args={[2, 2, 2]} />
        
        {/* 
            meshStandardMaterial defines how the surface looks and reacts to light
            This material responds realistically to lighting in the scene
            The color now changes based on user interaction
        */}
        <meshStandardMaterial 
            color={color}         // Dynamic color that changes when clicked
            metalness={0.1}       // How metallic the surface looks (0 = not metallic, 1 = very metallic)
            roughness={0.3}       // How rough the surface is (0 = mirror-like, 1 = very rough)
            emissive={isHovered ? "#111111" : "#000000"} // Slight glow when hovered in XR
        />
        </mesh>
    );
}

export function Sphere(props: React.ComponentProps<"mesh">): JSX.Element {
    return (
        <mesh 
            {...props} 
            userData={{isInteractable: true}}
        >
            {
                /*
                args here represent radius, num of width segments, num of height segments (segments equiv to edge loops and provides)
                a smoother sphere
                */
            }
            <sphereGeometry args={[5, 10, 5]}></sphereGeometry>
            <meshStandardMaterial
                color={"#ff0000"}
                metalness={0.9}
                roughness={0.2}
                opacity={0.5}
                emissive={"#222222"}
            ></meshStandardMaterial>
        </mesh>
    );
}