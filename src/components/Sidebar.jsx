import { List, ListItem, ListItemText, Drawer, Typography } from '@mui/material';
import { useGetBlueprintsQuery } from '../api/openforgeApi';

function Sidebar() {
  const { data, isLoading, error } = useGetBlueprintsQuery();

  const handleDragStart = (event, blueprint) => {
    event.dataTransfer.setData('blueprintId', blueprint.id);
  };

  if (isLoading) return <Typography>Loading...</Typography>;
  if (error) return <Typography>Error: {error.message}</Typography>;

  return (
    <Drawer variant="permanent" sx={{ width: 240, flexShrink: 0 }}>
      <Typography variant="h6" sx={{ p: 2 }}>
        Tile Palette
      </Typography>
      <List>
        {data?.blueprints
          .map((blueprint) => (
            <ListItem
              key={blueprint.id}
              button
              draggable
              onDragStart={(e) => handleDragStart(e, blueprint)}
            >
              <ListItemText primary={blueprint.blueprint_name} />
            </ListItem>
          ))}
      </List>
    </Drawer>
  );
}

export default Sidebar;