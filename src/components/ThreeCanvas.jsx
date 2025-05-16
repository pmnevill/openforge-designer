import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Canvas } from '@react-three/fiber';
import { v4 as uuidv4 } from 'uuid';

import { addTile } from '../store/tileSlice';
import SceneContent from './SceneContent';
import PartSelectionDialog from './PartSelectionDialog';
import { useGetBlueprintsQuery } from '../api/openforgeApi';

function ThreeCanvas() {
  const dispatch = useDispatch();
  const { data, isLoading, error } = useGetBlueprintsQuery();
  const { blueprints } = data || {};

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBlueprint, setSelectedBlueprint] = useState(null);

  const handleOpenDialog = (blueprint) => {
    setSelectedBlueprint(blueprint);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedBlueprint(null);
  };

  return (
    <>
      <Canvas
        style={{ height: '100vh' }}
        camera={{ position: [0, 10, 10], fov: 75, near: 0.1, far: 1000 }}
        shadows
      >
        {/* Ambient light for a baseline illumination */}
        <ambientLight intensity={0.2} />
        {/* Hemisphere light for soft, directional ambient lighting */}
        <hemisphereLight
          skyColor={0xffffff} // Bright white light from above (sky)
          groundColor={0x444444} // Darker gray light from below (ground)
          intensity={0.6} // Adjust intensity to balance with directional light
        />
        {/* Directional light for primary lighting and shadows */}
        <directionalLight
          position={[5, 10, 5]}
          intensity={0.8} // Reduced intensity to balance with hemisphere light
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-near={0.5}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        <SceneContent blueprints={blueprints} onDrop={handleOpenDialog} />
      </Canvas>
      {dialogOpen &&
        <PartSelectionDialog
          open={dialogOpen}
          onClose={handleDialogClose}
          blueprint={selectedBlueprint}
          onConfirm={(stlUrls) => {
            if (selectedBlueprint && stlUrls.length > 0) {
              const tile = {
                id: uuidv4(),
                blueprintId: selectedBlueprint.id,
                position: { x: 2, y: 2, z: 0 },
                rotation: 0,
                stlUrls,
              };
              dispatch(addTile(tile));
              console.log('Dropped Tile with Selected Parts:', tile);
            }
            handleDialogClose();
          }}
        />
      }
    </>
  );
}

export default ThreeCanvas;