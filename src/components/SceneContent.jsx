import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addTile, updateTilePosition } from '../store/tileSlice';
import { Grid, DragControls, OrbitControls } from '@react-three/drei';
import Tile from './Tile';

function SceneContent({ blueprints, onDrop }) {
  const dispatch = useDispatch();
  const placedTiles = useSelector((state) => state.tiles.placedTiles);
  const [draggableMeshes, setDraggableMeshes] = useState([]);

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
    if (blueprint) {
      onDrop(blueprint); // Trigger the dialog opening
    } else {
      console.log('Blueprint not found for ID:', blueprintId);
    }
  };

  useEffect(() => {
    const canvas = document.querySelector('canvas');
    canvas.addEventListener('dragover', (e) => e.preventDefault());
    canvas.addEventListener('drop', handleDrop);
    return () => {
      canvas.removeEventListener('dragover', (e) => e.preventDefault());
      canvas.removeEventListener('drop', handleDrop);
    };
  }, [blueprints, onDrop]);

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