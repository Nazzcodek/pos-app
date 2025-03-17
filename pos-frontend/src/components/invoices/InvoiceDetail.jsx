import React, { useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Box,
  Chip,
  Divider,
} from "@mui/material";
import dayjs from "dayjs";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { markAsPaid } from "../../redux/slices/invoiceSlice";

const InvoiceDetail = ({ open, onClose, onEditClick }) => {
  const dispatch = useDispatch();
  const { currentInvoice } = useSelector((state) => state.invoices);
  const { rawMaterials = [], equipments = [] } = useSelector(
    (state) => state.inventory
  );
  const modalRef = useRef();

  if (!currentInvoice) {
    return null;
  }

  // Combine raw materials and equipments into a single inventory list
  const combinedInventory = [
    ...rawMaterials.map((item) => ({ ...item, source: "raw_material" })),
    ...equipments.map((item) => ({ ...item, source: "equipment" })),
  ];

  // Function to get inventory name by ID
  const getInventoryNameById = (id) => {
    const inventoryItem = combinedInventory.find((item) => item.id === id);
    return inventoryItem ? inventoryItem.name : `Item #${id}`;
  };

  const handleExportToPDF = () => {
    const input = modalRef.current;
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice-${currentInvoice.invoice_number}.pdf`);
    });
  };

  const handleMarkAsPaid = () => {
    if (!currentInvoice.is_paid) {
      dispatch(markAsPaid({ invoiceId: currentInvoice.id }));
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { minHeight: "80vh" } }}
    >
      <div ref={modalRef}>
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">
              Invoice #{currentInvoice.invoice_number}
            </Typography>
            <Chip
              label={currentInvoice.is_paid ? "PAID" : "UNPAID"}
              color={currentInvoice.is_paid ? "success" : "warning"}
              variant="outlined"
            />
          </Box>
        </DialogTitle>

        <DialogContent>
          <Grid container spacing={3}>
            {/* Invoice header information */}
            <Grid item xs={12}>
              <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Supplier
                    </Typography>
                    <Typography variant="body1">
                      {currentInvoice.supplier
                        ? currentInvoice.supplier.company_name
                        : "N/A"}
                    </Typography>
                    {currentInvoice.supplier && (
                      <>
                        <Typography variant="body2">
                          {currentInvoice.supplier.contact_person}
                        </Typography>
                        <Typography variant="body2">
                          {currentInvoice.supplier.email}
                        </Typography>
                        <Typography variant="body2">
                          {currentInvoice.supplier.phone}
                        </Typography>
                      </>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" justifyContent="space-between">
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">
                          Invoice Date
                        </Typography>
                        <Typography variant="body1">
                          {dayjs(currentInvoice.invoice_date).format(
                            "MM/DD/YYYY"
                          )}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">
                          Due Date
                        </Typography>
                        <Typography variant="body1">
                          {currentInvoice.due_date
                            ? dayjs(currentInvoice.due_date).format(
                                "MM/DD/YYYY"
                              )
                            : "N/A"}
                        </Typography>
                      </Box>
                    </Box>

                    {currentInvoice.is_paid && currentInvoice.payment_date && (
                      <Box mt={2}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Payment Date
                        </Typography>
                        <Typography variant="body1">
                          {dayjs(currentInvoice.payment_date).format(
                            "MM/DD/YYYY"
                          )}
                        </Typography>
                      </Box>
                    )}

                    <Box mt={2}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Total Amount
                      </Typography>
                      <Typography variant="h5" color="primary">
                        ₦{parseFloat(currentInvoice.total_amount).toFixed(2)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Invoice items */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Invoice Items
              </Typography>
              <Paper elevation={0} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentInvoice.inventory_items &&
                    currentInvoice.inventory_items.length > 0 ? (
                      currentInvoice.inventory_items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {getInventoryNameById(item.inventory_id)}
                          </TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">
                            ₦{item.unit_price.toFixed(2)}
                          </TableCell>
                          <TableCell align="right">
                            ₦{(item.quantity * item.unit_price).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          No items found
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow>
                      <TableCell colSpan={2} />
                      <TableCell align="right">
                        <Typography variant="subtitle1">
                          Total Amount:
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle1">
                          ₦{parseFloat(currentInvoice.total_amount).toFixed(2)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Paper>
            </Grid>

            {/* Notes section */}
            {currentInvoice.notes && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Notes
                </Typography>
                <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body2">
                    {currentInvoice.notes}
                  </Typography>
                </Paper>
              </Grid>
            )}

            {/* Status & history */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Status & History
              </Typography>
              <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                >
                  <Typography variant="subtitle1">Current Status:</Typography>
                  <Chip
                    label={currentInvoice.is_paid ? "PAID" : "UNPAID"}
                    color={currentInvoice.is_paid ? "success" : "warning"}
                  />
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Created on:
                  </Typography>
                  <Typography variant="body2">
                    {currentInvoice.created_at
                      ? dayjs(currentInvoice.created_at).format("MM/DD/YYYY")
                      : "N/A"}
                  </Typography>
                </Box>

                {currentInvoice.updated_at && (
                  <Box mt={1}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Last updated:
                    </Typography>
                    <Typography variant="body2">
                      {dayjs(currentInvoice.updated_at).format("MM/DD/YYYY")}
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
      </div>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
        <Button onClick={onEditClick} color="primary">
          Edit
        </Button>
        {!currentInvoice.is_paid && (
          <Button
            onClick={handleMarkAsPaid}
            color="success"
            variant="contained"
          >
            Mark as Paid
          </Button>
        )}
        <Button onClick={handleExportToPDF} color="primary" variant="contained">
          Export to PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InvoiceDetail;
