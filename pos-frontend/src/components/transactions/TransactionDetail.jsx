import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Paper,
  Chip,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import dayjs from "dayjs";

// Map transaction types to friendly labels and colors
const transactionTypeConfig = {
  issue: { label: "Issue", color: "error" },
  restock: { label: "Restock", color: "success" },
  return: { label: "Return", color: "info" },
  damage: { label: "Damage", color: "warning" },
  write_off: { label: "Write Off", color: "error" },
  maintenance: { label: "Maintenance", color: "secondary" },
};

const TransactionDetail = ({ open, onClose, transaction, onEdit }) => {
  if (!transaction) return null;

  const handleEdit = () => {
    onEdit(transaction);
    onClose();
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return dayjs(dateString).format("MMM D, YYYY h:mm A");
    } catch (error) {
      return dateString;
    }
  };

  // Get transaction type configuration
  const typeConfig = transactionTypeConfig[transaction.transaction_type] || {
    label: transaction.transaction_type,
    color: "default",
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h5">Transaction Details</Typography>
        <Box>
          <Tooltip title="Edit Transaction">
            <IconButton onClick={handleEdit} color="primary" sx={{ mr: 1 }}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <IconButton onClick={onClose} color="default">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Paper elevation={0} sx={{ p: 2, bgcolor: "background.paper", mb: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Inventory
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {transaction.inventory_name || "N/A"}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Transaction Type
                </Typography>
                <Chip
                  label={typeConfig.label}
                  color={typeConfig.color}
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Quantity
                </Typography>
                <Typography variant="body1">
                  {transaction.quantity?.toLocaleString() || "N/A"}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Transaction Date
                </Typography>
                <Typography variant="body1">
                  {formatDate(transaction.transaction_date)}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Department
                </Typography>
                <Typography variant="body1">
                  {transaction.department || "N/A"}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Previous Quantity
                </Typography>
                <Typography variant="body1">
                  {transaction.previous_quantity?.toLocaleString() || "N/A"}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Resulting Quantity
                </Typography>
                <Typography variant="body1">
                  {transaction.resulting_quantity?.toLocaleString() || "N/A"}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Created By
                </Typography>
                <Typography variant="body1">
                  {transaction.created_by || "N/A"}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Updated By
                </Typography>
                <Typography variant="body1">
                  {transaction.updated_by || "N/A"}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Notes
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    mt: 0.5,
                    borderColor: "divider",
                    minHeight: "80px",
                    bgcolor: "background.default",
                  }}
                >
                  <Typography variant="body1">
                    {transaction.notes || "No notes provided."}
                  </Typography>
                </Paper>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: "flex", gap: 2 }}>
                {transaction.is_locked && (
                  <Chip
                    label="Locked"
                    color="warning"
                    size="small"
                    icon={<i className="material-icons">lock</i>}
                  />
                )}
                {transaction.is_system_generated && (
                  <Chip
                    label="System Generated"
                    color="info"
                    size="small"
                    icon={<i className="material-icons">computer</i>}
                  />
                )}
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
        <Button
          onClick={handleEdit}
          variant="contained"
          color="primary"
          startIcon={<EditIcon />}
        >
          Edit
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransactionDetail;
