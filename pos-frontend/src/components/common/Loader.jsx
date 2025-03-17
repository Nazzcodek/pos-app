import React from "react";
import { CircularProgress, Typography, Paper } from "@mui/material";

const Loader = ({ message = "Loading data..." }) => {
  return (
    <Paper
      sx={{
        p: 4,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 200,
      }}
      elevation={1}
    >
      <CircularProgress size={60} thickness={4} sx={{ color: "#1a3a3a" }} />
      <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
        {message}
      </Typography>
    </Paper>
  );
};

export default Loader;
