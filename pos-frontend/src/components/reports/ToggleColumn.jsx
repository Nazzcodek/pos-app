import React, { useState } from "react";
import {
  Button,
  Menu,
  MenuItem,
  Checkbox,
  ListItemText,
  Typography,
  Divider,
} from "@mui/material";
import { ViewColumn } from "@mui/icons-material";

const ColumnToggleMenu = ({
  columns,
  visibleColumns,
  onToggle,
  onToggleAll,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleToggle = (columnId) => {
    onToggle(columnId);
  };

  const handleToggleAll = (selectAll) => {
    onToggleAll(selectAll);
    handleClose();
  };

  // Check if all columns are selected
  const allSelected = columns.length === visibleColumns.length;
  const someSelected = visibleColumns.length > 0 && !allSelected;

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<ViewColumn />}
        onClick={handleClick}
        size="small"
      >
        Columns ({visibleColumns.length}/{columns.length})
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          style: {
            maxHeight: 300,
            width: 250,
          },
        }}
      >
        <MenuItem disabled>
          <Typography variant="subtitle2">Select columns to display</Typography>
        </MenuItem>
        <MenuItem onClick={() => handleToggleAll(true)}>
          <Checkbox
            checked={allSelected}
            indeterminate={someSelected}
            color="primary"
            size="small"
          />
          <ListItemText primary="Select All" />
        </MenuItem>
        <MenuItem onClick={() => handleToggleAll(false)}>
          <Checkbox checked={false} color="primary" size="small" />
          <ListItemText primary="Deselect All" />
        </MenuItem>
        <Divider />
        {columns.map((column) => (
          <MenuItem
            key={column.id}
            onClick={() => handleToggle(column.id)}
            dense
          >
            <Checkbox
              checked={visibleColumns.includes(column.id)}
              color="primary"
              size="small"
            />
            <ListItemText primary={column.label} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default ColumnToggleMenu;
