import * as THREE from 'three';
import { GLTF } from 'three-stdlib';

// Generic GLTF result type that can be used for any GLTF model
export type GLTFResult = GLTF & {
  nodes: Record<string, THREE.Object3D>;
  materials: Record<string, THREE.Material>;
  animations: THREE.AnimationClip[];
};

export interface GLTFAction extends THREE.AnimationClip {
}
