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
import dayjs from "dayjs"; // Correctly import dayjs
import { useSelector } from "react-redux";
import InventoryTransactions from "./InventoryTransactions";

const RawMaterialDetail = ({ open, onClose, material, onEdit, canEdit }) => {
  const suppliers = useSelector((state) => state.suppliers.items);
  const loading = useSelector((state) => state.inventory.loading);

  // Check if material exists to prevent errors
  if (!material && !loading) {
    return null;
  }

  const supplier = suppliers?.find((s) => s.id === material?.supplier_id);

  const getStatusColor = (status) => {
    switch (status) {
      case "in_stock":
        return "success";
      case "depleted":
        return "error";
      case "damaged":
        return "warning";
      case "expired":
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
      aria-labelledby="material-detail-dialog-title"
    >
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <DialogTitle id="material-detail-dialog-title">
            <Typography variant="h5" component="div">
              {material?.name}
            </Typography>
            <Chip
              label={formatStatus(material?.status)}
              color={getStatusColor(material?.status)}
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
                            {material?.description || "N/A"}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" sx={{ fontWeight: "bold" }}>
                            Quantity
                          </TableCell>
                          <TableCell>
                            {material?.quantity}{" "}
                            {material?.quantity_unit?.toUpperCase()}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" sx={{ fontWeight: "bold" }}>
                            Price Per Unit
                          </TableCell>
                          <TableCell>
                            {material?.price_per_unit
                              ? `₦${parseFloat(material.price_per_unit).toFixed(
                                  2
                                )}`
                              : "N/A"}
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
                    Additional Details
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell component="th" sx={{ fontWeight: "bold" }}>
                            Batch Number
                          </TableCell>
                          <TableCell>
                            {material?.batch_number || "N/A"}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" sx={{ fontWeight: "bold" }}>
                            Expiry Date
                          </TableCell>
                          <TableCell>
                            {material?.expiry_date
                              ? dayjs(material.expiry_date).format(
                                  "MMM DD, YYYY"
                                )
                              : "N/A"}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" sx={{ fontWeight: "bold" }}>
                            Supplier
                          </TableCell>
                          <TableCell>
                            {supplier ? supplier.company_name : "N/A"}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" sx={{ fontWeight: "bold" }}>
                            Created At
                          </TableCell>
                          <TableCell>
                            {material?.created_at
                              ? dayjs(material.created_at).format(
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
                            {material?.updated_at
                              ? dayjs(material.updated_at).format(
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

              {material?.notes && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Notes
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="body1">{material.notes}</Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
            {material && (
              <Grid item xs={12}>
                <InventoryTransactions inventoryId={material.id} />
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

export default RawMaterialDetail;
