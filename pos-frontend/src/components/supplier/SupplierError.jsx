import React, { useState, useEffect } from "react";
import { Snackbar, Alert } from "@mui/material";

const SupplierErrorHandler = ({ error }) => {
  const [openErrorSnackbar, setOpenErrorSnackbar] = useState(false);

  useEffect(() => {
    if (error) {
      setOpenErrorSnackbar(true);
    }
  }, [error]);

  const handleCloseErrorSnackbar = () => {
    setOpenErrorSnackbar(false);
  };

  return (
    <Snackbar
      open={openErrorSnackbar}
      autoHideDuration={6000}
      onClose={handleCloseErrorSnackbar}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert
        onClose={handleCloseErrorSnackbar}
        severity="error"
        sx={{ width: "100%" }}
      >
        {error && error.message ? error.message : "An error occurred"}
      </Alert>
    </Snackbar>
  );
};

export default SupplierErrorHandler;
