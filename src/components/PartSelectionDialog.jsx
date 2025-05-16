import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  TextField,
  Autocomplete,
} from '@mui/material';

const PartSelectionDialog = ({ onClose, blueprint, onConfirm, availableParts }) => {
  const [partSlots, setPartSlots] = useState([]); // Slots from blueprint_config.parts with query results
  const [selectedParts, setSelectedParts] = useState({}); // Selected blueprint for each slot
  const [filters, setFilters] = useState({}); // Filters for each slot (additional tags from tag_counts)
  const [filterTags, setFilterTags] = useState({}); // Available filter tags for each slot from tag_counts

  // Fetch options for each part when the dialog opens
  useEffect(() => {
    if (open && blueprint) {
      const fetchOptionsForParts = async () => {
        const slots = blueprint.blueprint_config?.parts || [];
        const slotData = await Promise.all(
          slots.map(async (part) => {
            const requireTags = part.tags?.require || [];
            const denyTags = part.tags?.deny || [];
            const payload = {
              require: requireTags,
              deny: denyTags,
            };

            try {
              const response = await fetch('/api/blueprints/tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              });
              const data = await response.json();
              const blueprints = data.blueprints || [];
              const tagCounts = data.tag_counts || {};

              // Extract available filter tags from tag_counts
              const availableTags = Object.keys(tagCounts).filter(
                (tag) => tagCounts[tag] > 0 && !requireTags.some((req) => req.tag === tag)
              );

              return {
                slot: part.name, // e.g., "right wall"
                originalRequire: requireTags,
                originalDeny: denyTags,
                options: blueprints, // List of blueprints that match
                filterTags: availableTags, // Tags for further filtering
              };
            } catch (error) {
              console.error(`Error fetching options for part ${part.name}:`, error);
              return {
                slot: part.name,
                originalRequire: requireTags,
                originalDeny: denyTags,
                options: [],
                filterTags: [],
              };
            }
          })
        );

        setPartSlots(slotData);

        // Initialize selected parts
        const initialSelections = {};
        slotData.forEach((part) => {
          initialSelections[part.slot] = part.options[0]?.storage_address || null;
        });
        setSelectedParts(initialSelections);

        // Initialize filter tags for each slot
        const initialFilterTags = {};
        slotData.forEach((part) => {
          initialFilterTags[part.slot] = part.filterTags;
        });
        setFilterTags(initialFilterTags);

        // Reset filters
        setFilters({});
      };

      fetchOptionsForParts();
    }
  }, [open, blueprint]);

  // Handle filter changes for a specific slot
  const handleFilterChange = (slot, event, values) => {
    setFilters((prev) => ({ ...prev, [slot]: values }));

    // Find the slot data
    const slotData = partSlots.find((part) => part.slot === slot);
    if (!slotData) return;

    // Re-query with the additional filters
    const fetchFilteredOptions = async () => {
      const payload = {
        require: [...slotData.originalRequire, ...values.map((tag) => ({ tag }))],
        deny: slotData.originalDeny,
      };

      try {
        const response = await fetch('/api/blueprints/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        const blueprints = data.blueprints || [];
        const tagCounts = data.tag_counts || {};

        // Update filter tags with new tag_counts
        const availableTags = Object.keys(tagCounts).filter(
          (tag) => tagCounts[tag] > 0 && !payload.require.some((req) => req.tag === tag)
        );
        setFilterTags((prev) => ({ ...prev, [slot]: availableTags }));

        // Update options for this slot
        const updatedSlots = partSlots.map((part) =>
          part.slot === slot
            ? { ...part, options: blueprints, filterTags: availableTags }
            : part
        );
        setPartSlots(updatedSlots);

        // Reset selection if the current selection is no longer available
        if (
          selectedParts[slot] &&
          !blueprints.some((bp) => bp.storage_address === selectedParts[slot])
        ) {
          setSelectedParts((prev) => ({
            ...prev,
            [slot]: blueprints[0]?.storage_address || null,
          }));
        }
      } catch (error) {
        console.error(`Error fetching filtered options for part ${slot}:`, error);
      }
    };

    fetchFilteredOptions();
  };

  // Handle selection of a blueprint for each slot
  const handlePartChange = (slot, value) => {
    setSelectedParts((prev) => ({ ...prev, [slot]: value }));
  };

  // Confirm selections and add to canvas
  const handleConfirm = () => {
    const stlUrls = Object.values(selectedParts).filter(Boolean);
    onConfirm(stlUrls.map(url => url?.split('https://objects.openforge.tools')?.[1] || ''));
    onClose();
  };

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Select Parts for {blueprint?.blueprint_name || 'Tile'}</DialogTitle>
      <DialogContent>
        {partSlots.map((part) => (
          <Box key={part.slot} sx={{ mb: 3, border: '1px solid #ddd', p: 2, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              {part.slot}
            </Typography>
            {/* Filter Section for this Part */}
            <Autocomplete
              multiple
              options={filterTags[part.slot] || []}
              value={filters[part.slot] || []}
              onChange={(e, values) => handleFilterChange(part.slot, e, values)}
              renderInput={(params) => (
                <TextField {...params} label={`Filter Options for ${part.slot}`} placeholder="Select filters" />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip label={option} {...getTagProps({ index })} />
                ))
              }
              sx={{ mb: 2 }}
            />
            {/* Part Selection Dropdown */}
            <FormControl fullWidth margin="dense">
              <InputLabel>Select Blueprint</InputLabel>
              <Select
                value={selectedParts[part.slot] || ''}
                onChange={(e) => handlePartChange(part.slot, e.target.value)}
                label="Select Blueprint"
              >
                {part.options.length === 0 ? (
                  <MenuItem value="" disabled>
                    No blueprints available
                  </MenuItem>
                ) : (
                  part.options.map((option) => (
                    <MenuItem key={option.storage_address} value={option.storage_address}>
                      {option.blueprint_name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Box>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleConfirm} variant="contained" color="primary">
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PartSelectionDialog;