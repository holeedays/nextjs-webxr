import * as THREE from 'three';
import { GLTF } from 'three-stdlib';

// Generic GLTF result type that can be used for any GLTF model
export type GLTFResult = GLTF & {
  nodes: Record<string, THREE.Object3D>;
  materials: Record<string, THREE.Material>;
  animations: THREE.AnimationClip[];
};

// bitwise operator to combine animation clip and this unnamed interface into one
export type GLTFAction = THREE.AnimationClip & {
  name: string,
  duration: number,
  tracks: Array<THREE.KeyframeTrack>,
  uuid: string,
  userData: Object
}
