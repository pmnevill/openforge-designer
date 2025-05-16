import { useRef } from 'react';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

const fallbackUrl = '/models/003540/00354077087ede614c97ed2c51d8d798.stl';

function Tile({ tile, blueprint }) {
  const meshRef = useRef();
  const partRefs = useRef([]);

  // Load geometries from STL URLs
  const geometries = useLoader(STLLoader, tile.stlUrls.length > 0 ? tile.stlUrls : [fallbackUrl]);

  // Compute bounding box and center each geometry
  const geometrySizes = geometries.map((geometry, index) => {
    if (!geometry.boundingBox) {
      geometry.computeBoundingBox();
      const box = geometry.boundingBox;
      console.log(`Geometry ${index} Bounding Box (Native, mm):`, {
        width: box.max.x - box.min.x,
        depth: box.max.y - box.min.y,
        height: box.max.z - box.min.z,
      });

      // Center the geometry
      const center = new THREE.Vector3();
      box.getCenter(center);
      geometry.translate(-center.x, -center.y, -center.z);

      // Recompute bounding box after centering
      geometry.computeBoundingBox();
      const newBox = geometry.boundingBox;
      console.log(`Geometry ${index} Bounding Box (Centered, mm):`, {
        min: newBox.min,
        max: newBox.max,
      });

      // Compute dimensions after scaling (mm to inches)
      const scaleFactor = 1 / 25.4;
      const width = (newBox.max.x - newBox.min.x) * scaleFactor;
      const depth = (newBox.max.y - newBox.min.y) * scaleFactor;
      const height = (newBox.max.z - newBox.min.z) * scaleFactor;
      return { width, depth, height };
    }
    return { width: 0, depth: 0, height: 0 };
  });

  const scaleFactor = 1 / 25.4; // Millimeters to inches

  // Define part transformations
  const getPartTransformation = (stlUrl, index) => {
    const part = blueprint?.blueprint_config?.parts?.[index];
    if (!part) return { rotation: [0, 0, 0], position: [tile.position.x, 0, tile.position.z] };

    const partName = part.name.toLowerCase();
    const { width, depth, height } = geometrySizes[index]; // Dimensions in inches

    const baseWidth = 2; // Base is 2x2 inches
    const baseDepth = 2;
    let baseHeight = 0;

    // Find base height
    const baseIndex = blueprint?.blueprint_config?.parts?.findIndex((p) =>
      p.name.toLowerCase().includes('base')
    );
    if (baseIndex !== -1 && baseIndex < geometrySizes.length) {
      baseHeight = geometrySizes[baseIndex].height;
    } else {
      baseHeight = 0.236; // Fallback (~6mm)
    }

    // Default rotation to align STL Z-up to scene Y-up
    let rotation = [0, 0, 0];
    let position = [tile.position.x, 0, tile.position.z]; // Start at tile origin, Y=0

    if (partName.includes('base')) {
      position = [tile.position.x, baseHeight / 2, tile.position.z];
    } else if (partName.includes('right wall')) {
      position = [tile.position.x + baseWidth / 2, baseHeight + height / 2, tile.position.z];
    } else if (partName.includes('left wall')) {
      position = [tile.position.x, baseHeight + height / 2, tile.position.z + baseDepth / 2];
      rotation = [0, 0, Math.PI / 2]; // Rotate around Z to align along scene Z
    } else if (partName.includes('column')) {
      position = [tile.position.x + baseWidth / 2, baseHeight + height / 2, tile.position.z + baseDepth / 2];
      rotation = [-Math.PI / 2, 0, Math.PI / 2];
    } else if (partName.includes('floor')) {
      position = [tile.position.x, baseHeight + height / 2, tile.position.z];
    }

    console.log(`Part ${index} (${partName}):`, { position, rotation, width, depth, height });
    return { rotation, position, scale: [scaleFactor, scaleFactor, scaleFactor] };
  };

  return (
    <mesh
      ref={meshRef}
      position={[tile.position.x, tile.position.y, tile.position.z]}
      rotation={[0, tile.rotation, 0]}
      userData={{ tileId: tile.id }}
    >
      <group scale={[scaleFactor, scaleFactor, scaleFactor]} rotation={[-Math.PI / 2, 0, 0]} position={[0.25, -1, 0]}>
        {geometries.map((geometry, index) => {
          const { rotation, position, scale } = getPartTransformation(tile.stlUrls[index], index);
          return (
            <mesh
              key={index}
              ref={(el) => (partRefs.current[index] = el)}
              castShadow
              receiveShadow
              position={position}
              rotation={rotation}
            >
              <primitive object={geometry} />
              <meshStandardMaterial color="blue" side={THREE.DoubleSide} roughness={0.5} metalness={0.2} />
            </mesh>
          );
        })}
      </group>
    </mesh>
  );
}

export default Tile;