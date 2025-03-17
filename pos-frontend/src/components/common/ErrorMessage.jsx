import React from "react";
import { Paper, Typography, Box, Button } from "@mui/material";
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";

const ErrorMessage = ({
  message = "An error occurred while fetching data",
  onRetry = null,
}) => {
  // Parse error message from different formats
  let errorText = message;

  if (typeof message === "object" && message !== null) {
    if (message.message) {
      errorText = message.message;
    } else if (message.response && message.response.data) {
      if (typeof message.response.data === "string") {
        errorText = message.response.data;
      } else if (message.response.data.message) {
        errorText = message.response.data.message;
      } else {
        errorText = `Server error: ${
          message.response.status || "Unknown error"
        }`;
      }
    } else if (message.status === 401 || message.status === 403) {
      errorText = "Authentication error. Please log in again.";
    } else {
      try {
        errorText = JSON.stringify(message);
      } catch {
        errorText = "An error occurred. Please try again.";
      }
    }
  }

  return (
    <Paper
      sx={{
        p: 4,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 200,
        borderLeft: "4px solid #f44336",
      }}
      elevation={1}
    >
      <ErrorIcon color="error" sx={{ fontSize: 48, mb: 2 }} />

      <Typography variant="h6" color="error" gutterBottom>
        Something went wrong
      </Typography>

      <Typography
        variant="body1"
        color="text.secondary"
        align="center"
        sx={{ maxWidth: 500 }}
      >
        {errorText}
      </Typography>

      {onRetry && (
        <Box mt={3}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={onRetry}
          >
            Try Again
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default ErrorMessage;
