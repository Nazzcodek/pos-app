import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Paper,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  CircularProgress,
  Box,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import InventoryTransactions from "./InventoryTransactions";

const EquipmentDetail = ({ open, onClose, equipment, onEdit, canEdit }) => {
  const loading = useSelector((state) => state.inventory.loading);

  // Check if equipment exists to prevent errors
  if (!equipment && !loading) {
    return null;
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "in_stock":
        return "success";
      case "depleted":
        return "error";
      case "damaged":
        return "warning";
      case "maintenance":
        return "info";
      case "decommissioned":
        return "error";
      default:
        return "default";
    }
  };

  const formatStatus = (status) => {
    return status?.replace(/_/g, " ");
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="equipment-detail-dialog-title"
    >
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <DialogTitle id="equipment-detail-dialog-title">
            <Typography variant="h5" component="div">
              {equipment?.name}
            </Typography>
            <Chip
              label={formatStatus(equipment?.status)}
              color={getStatusColor(equipment?.status)}
              size="small"
              sx={{ ml: 1, textTransform: "capitalize" }}
            />
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: "100%" }}>
                  <Typography variant="h6" gutterBottom>
                    Basic Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell component="th" sx={{ fontWeight: "bold" }}>
                            Description
                          </TableCell>
                          <TableCell>
                            {equipment?.description || "N/A"}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" sx={{ fontWeight: "bold" }}>
                            Total Units
                          </TableCell>
                          <TableCell>
                            {equipment?.total_units || "N/A"}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" sx={{ fontWeight: "bold" }}>
                            Available Units
                          </TableCell>
                          <TableCell>
                            {equipment?.available_units || "N/A"}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" sx={{ fontWeight: "bold" }}>
                            Price Per Unit
                          </TableCell>
                          <TableCell>
                            {equipment?.price_per_unit
                              ? `$${parseFloat(
                                  equipment.price_per_unit
                                ).toFixed(2)}`
                              : "N/A"}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" sx={{ fontWeight: "bold" }}>
                            Maintenance Threshold (Hours)
                          </TableCell>
                          <TableCell>
                            {equipment?.maintenance_threshold_hours || "N/A"}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: "100%" }}>
                  <Typography variant="h6" gutterBottom>
                    Maintenance Details
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell component="th" sx={{ fontWeight: "bold" }}>
                            Maintenance Schedule
                          </TableCell>
                          <TableCell>
                            {equipment?.maintenance_schedule
                              ? dayjs(equipment.maintenance_schedule).format(
                                  "MMM DD, YYYY"
                                )
                              : "N/A"}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" sx={{ fontWeight: "bold" }}>
                            Last Maintained
                          </TableCell>
                          <TableCell>
                            {equipment?.last_maintained
                              ? dayjs(equipment.last_maintained).format(
                                  "MMM DD, YYYY"
                                )
                              : "N/A"}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" sx={{ fontWeight: "bold" }}>
                            Created At
                          </TableCell>
                          <TableCell>
                            {equipment?.created_at
                              ? dayjs(equipment.created_at).format(
                                  "MMM DD, YYYY"
                                )
                              : "N/A"}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" sx={{ fontWeight: "bold" }}>
                            Updated At
                          </TableCell>
                          <TableCell>
                            {equipment?.updated_at
                              ? dayjs(equipment.updated_at).format(
                                  "MMM DD, YYYY"
                                )
                              : "N/A"}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>

              {equipment?.notes && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Notes
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="body1">{equipment.notes}</Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
            {equipment && (
              <Grid item xs={12}>
                <InventoryTransactions inventoryId={equipment.id} />
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose} color="inherit">
              Close
            </Button>
            {canEdit && (
              <Button onClick={onEdit} color="primary" variant="contained">
                Edit
              </Button>
            )}
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

export default EquipmentDetail;
