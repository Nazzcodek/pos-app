import React from "react";
import { useNavigate } from "react-router-dom";
import { Container, Typography, Button, Box } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import SettingsForm from "../components/settings/SettingsForm";

const SettingsPage = () => {
  const navigate = useNavigate();
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

      <SettingsForm />
    </Container>
  );
};

export default SettingsPage;
