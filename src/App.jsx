import ThreeCanvas from './components/ThreeCanvas';
import Sidebar from './components/Sidebar';
import { Box } from '@mui/material';

function App() {
  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1 }}>
        <h1>OpenForge Dungeon Designer</h1>
        <ThreeCanvas />
      </Box>
    </Box>
  );
}

export default App;