import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addTile, updateTilePosition } from '../store/tileSlice';
import { Grid, DragControls, OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

import * as THREE from 'three';
import Tile from './Tile';

function SceneContent({ blueprints, onDrop }) {
  const dispatch = useDispatch();
  const placedTiles = useSelector((state) => state.tiles.placedTiles);
  const [draggableMeshes, setDraggableMeshes] = useState([]);
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const canvasRef = useRef();
  const { camera } = useThree(); // Access the R3F camera using useThree

  const handleDrag = (mesh) => {
    const tileId = mesh.userData.tileId;
    const newPosition = {
      x: Math.round(mesh.position.x / 2) * 2,
      y: Math.round(mesh.position.z / 2) * 2,
      z: mesh.position.y,
    };
    dispatch(updateTilePosition({ id: tileId, position: newPosition }));
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const blueprintId = event.dataTransfer.getData('blueprintId');
    const blueprint = blueprints.find((bp) => bp.id === blueprintId);
    if (!blueprint) {
      console.log('Blueprint not found for ID:', blueprintId);
      return;
    }

    // Get the canvas element and its bounding rectangle
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Calculate mouse position in normalized device coordinates (-1 to +1)
    mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Update raycaster with mouse position and camera
    raycaster.current.setFromCamera(mouse.current, camera);

    // Create a plane at y=0 to intersect with (ground plane)
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // y=0
    const intersectPoint = new THREE.Vector3();
    raycaster.current.ray.intersectPlane(plane, intersectPoint);

    // Snap the position to the 2x2-inch grid (to be updated to subgrid later)
    const snappedPosition = {
      x: Math.round(intersectPoint.x / 2) * 2,
      y: 0, // Ground plane
      z: Math.round(intersectPoint.z / 2) * 2,
    };

    // Pass the position to onDrop
    onDrop(blueprint, snappedPosition);
  };

  useEffect(() => {
    const canvas = document.querySelector('canvas');
    canvasRef.current = canvas;
    canvas.addEventListener('dragover', (e) => e.preventDefault());
    canvas.addEventListener('drop', handleDrop);
    return () => {
      canvas.removeEventListener('dragover', (e) => e.preventDefault());
      canvas.removeEventListener('drop', handleDrop);
    };
  }, [blueprints, onDrop, camera]); // Add camera to dependencies to ensure it’s available

  useEffect(() => {
    console.log('Placed Tiles in State:', placedTiles);
    const meshes = placedTiles
      .map((tile) => {
        const mesh = document.querySelector(`[data-tile-id="${tile.id}"]`);
        if (mesh) {
          mesh.userData.tileId = tile.id;
          return mesh;
        }
        return null;
      })
      .filter(Boolean);
    setDraggableMeshes(meshes);
  }, [placedTiles]);

  return (
    <>
      <Grid infiniteGrid cellSize={2} sectionSize={2} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="gray" />
      </mesh>
      {placedTiles.map((tile) => {
        const blueprint = blueprints.find((bp) => bp.id === tile.blueprintId);
        return (
          <Tile
            key={tile.id}
            tile={tile}
            blueprint={blueprint}
            name={`tile-${tile.id}`}
            data-tile-id={tile.id}
          />
        );
      })}
      {draggableMeshes.length > 0 && (
        <DragControls objects={draggableMeshes} onDrag={handleDrag} />
      )}
      <OrbitControls />
    </>
  );
}

export default SceneContent;