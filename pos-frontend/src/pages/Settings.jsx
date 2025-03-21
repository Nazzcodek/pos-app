import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Typography, Button, Box, Paper } from "@mui/material";
import { ArrowBack, Edit } from "@mui/icons-material";
import SettingsForm from "../components/settings/SettingsForm";
import SettingsDetail from "../components/settings/SettingsDetail";
import DepartmentDetail from "../components/settings/DepartmentDetail";

const SettingsPage = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSaveComplete = () => {
    setIsEditing(false);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Settings
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/dashboard")}
          startIcon={<ArrowBack />}
        >
          Back to Dashboard
        </Button>
      </Box>

      <Typography variant="body1" color="textSecondary" paragraph>
        Configure your restaurant information. These settings will be used
        throughout the application.
      </Typography>

      {isEditing ? (
        <SettingsForm onSaveComplete={handleSaveComplete} />
      ) : (
        <Paper sx={{ p: 3, mt: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Edit />}
              onClick={handleEditClick}
            >
              Edit Settings
            </Button>
          </Box>
          <SettingsDetail />
        </Paper>
      )}

      <DepartmentDetail />
    </Container>
  );
};

export default SettingsPage;
