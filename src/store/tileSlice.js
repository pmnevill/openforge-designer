import { createSlice } from '@reduxjs/toolkit';

const tileSlice = createSlice({
  name: 'tiles',
  initialState: {
    placedTiles: [],
  },
  reducers: {
    addTile: (state, action) => {
      const newTile = action.payload;
      const isOverlapping = state.placedTiles.some(
        (t) =>
          t.position.x === newTile.position.x &&
          t.position.y === newTile.position.y
      );
      if (!isOverlapping) {
        state.placedTiles.push(newTile);
      }
    },
    updateTilePosition: (state, action) => {
      const { id, position } = action.payload;
      const tile = state.placedTiles.find((t) => t.id === id);
      if (tile) {
        const isOverlapping = state.placedTiles.some(
          (t) =>
            t.id !== id &&
            t.position.x === position.x &&
            t.position.y === position.y
        );
        if (!isOverlapping) {
          tile.position = position;
        }
      }
    },
    rotateTile: (state, action) => {
      const { id, rotation } = action.payload;
      const tile = state.placedTiles.find((t) => t.id === id);
      if (tile) {
        tile.rotation = rotation % (2 * Math.PI);
      }
    },
  },
});

export const { addTile, updateTilePosition, rotateTile } = tileSlice.actions;
export default tileSlice.reducer;