import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box,
  Typography,
  Grid,
  Chip,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
} from "@mui/material";
import {
  fetchInvoices,
  fetchInvoiceById,
} from "../../redux/slices/invoiceSlice";
import InvoiceDetail from "../invoices/InvoiceDetail";

const SupplierDetails = ({ supplierData }) => {
  const dispatch = useDispatch();
  const { invoices, loading } = useSelector((state) => state.invoices);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Parse items_supplied if it's a string
  const parsedItemsSupplied = supplierData.items_supplied
    ? typeof supplierData.items_supplied === "string"
      ? JSON.parse(supplierData.items_supplied)
      : supplierData.items_supplied
    : [];

  const items = parsedItemsSupplied.map((item) =>
    typeof item === "string" ? { name: item } : item
  );

  // Fetch invoices related to this supplier when component mounts
  useEffect(() => {
    if (supplierData && supplierData.id) {
      // Make sure we're passing the supplier_id in the filters object
      dispatch(
        fetchInvoices({
          skip: 0,
          limit: 100, // Get all invoices first, then we'll handle pagination in the component
          filters: { supplier_id: supplierData.id },
        })
      );
    }
  }, [dispatch, supplierData]);

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRowClick = (invoice) => {
    // First fetch the complete invoice details
    dispatch(fetchInvoiceById(invoice.id));
    // Then open the modal
    setDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
  };

  const handleEditInvoice = () => {
    // Implement edit functionality if needed
    setDetailModalOpen(false);
  };

  const DetailField = ({ label, value, isLink = false }) => (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {label}
      </Typography>
      {value ? (
        isLink ? (
          <Link href={value} target="_blank" rel="noopener noreferrer">
            {value}
          </Link>
        ) : (
          <Typography variant="body1">{value}</Typography>
        )
      ) : (
        <Typography variant="body2" color="text.secondary" fontStyle="italic">
          Not provided
        </Typography>
      )}
    </Box>
  );

  // Get current page invoices
  const currentInvoices =
    invoices && invoices.length > 0
      ? invoices.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
      : [];

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <DetailField label="Company Name" value={supplierData.company_name} />
          <DetailField
            label="Contact Person"
            value={supplierData.contact_person}
          />
          <DetailField label="Email" value={supplierData.email} />
          <DetailField label="Phone Number" value={supplierData.phone_number} />
        </Grid>
        <Grid item xs={12} md={6}>
          <DetailField
            label="Website"
            value={supplierData.website}
            isLink={Boolean(supplierData.website)}
          />
          <DetailField label="Address" value={supplierData.address} />
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Items Supplied
            </Typography>
            {items && items.length > 0 ? (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {items.map((item, index) => (
                  <Chip
                    key={index}
                    label={
                      typeof item === "string" ? item : item.name || "Unknown"
                    }
                    size="small"
                    sx={{ mb: 1 }}
                  />
                ))}
              </Box>
            ) : (
              <Typography
                variant="body2"
                color="text.secondary"
                fontStyle="italic"
              >
                No items listed
              </Typography>
            )}
          </Box>
        </Grid>

        {/* Invoices Section */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Supplier Invoices
          </Typography>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Paper variant="outlined">
              <TableContainer>
                <Table sx={{ minWidth: 650 }} size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Invoice #</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Due Date</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentInvoices.length > 0 ? (
                      currentInvoices.map((invoice) => (
                        <TableRow
                          key={invoice.id}
                          hover
                          onClick={() => handleRowClick(invoice)}
                          sx={{ cursor: "pointer" }}
                        >
                          <TableCell>{invoice.invoice_number}</TableCell>
                          <TableCell>
                            {new Date(
                              invoice.invoice_date
                            ).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {invoice.due_date
                              ? new Date(invoice.due_date).toLocaleDateString()
                              : "N/A"}
                          </TableCell>
                          <TableCell align="right">
                            ₦{parseFloat(invoice.total_amount).toFixed(2)}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={invoice.is_paid ? "PAID" : "UNPAID"}
                              color={invoice.is_paid ? "success" : "warning"}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          No invoices found for this supplier
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              {/* Pagination component */}
              {invoices && invoices.length > 0 && (
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={invoices.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              )}
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Invoice Detail Modal */}
      <InvoiceDetail
        open={detailModalOpen}
        onClose={handleCloseDetailModal}
        onEditClick={handleEditInvoice}
      />
    </Box>
  );
};

export default SupplierDetails;
