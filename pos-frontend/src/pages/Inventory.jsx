import React, { useState } from "react";
import { Box, Typography, Tab, Tabs, Container } from "@mui/material";
import RawMaterialInventory from "../components/invetories/RawMaterial";
import EquipmentInventory from "../components/invetories/Equipment";

const InventoryPage = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ width: "100%", p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Inventory Management
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="inventory tabs"
          >
            <Tab label="Raw Materials" />
            <Tab label="Equipment" />
          </Tabs>
        </Box>

        {tabValue === 0 && <RawMaterialInventory />}
        {tabValue === 1 && <EquipmentInventory />}
      </Box>
    </Container>
  );
};

export default InventoryPage;
