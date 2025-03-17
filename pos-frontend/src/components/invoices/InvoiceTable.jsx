import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Tooltip,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  PictureAsPdf as PdfIcon,
  Receipt as ReceiptIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import { exportToPDF } from "../../utils/exportUtils";
import {
  fetchInvoiceById,
  removeInvoice,
  markAsPaid,
} from "../../redux/slices/invoiceSlice";

const InvoiceTable = ({ onViewDetail, onEditClick }) => {
  const dispatch = useDispatch();
  const { invoices, loading } = useSelector((state) => state.invoices);
  const { suppliers } = useSelector((state) => state.suppliers);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event, invoice) => {
    setAnchorEl(event.currentTarget);
    setSelectedInvoice(invoice);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleView = () => {
    if (selectedInvoice) {
      dispatch(fetchInvoiceById(selectedInvoice.id))
        .unwrap()
        .then(() => {
          onViewDetail(selectedInvoice.id);
        });
    }
    handleMenuClose();
  };

  const handleEdit = () => {
    if (selectedInvoice) {
      onEditClick(selectedInvoice);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (selectedInvoice) {
      if (window.confirm("Are you sure you want to delete this invoice?")) {
        dispatch(removeInvoice(selectedInvoice.id));
      }
    }
    handleMenuClose();
  };

  const handleMarkAsPaid = () => {
    if (selectedInvoice && !selectedInvoice.is_paid) {
      dispatch(markAsPaid({ invoiceId: selectedInvoice.id }));
    }
    handleMenuClose();
  };

  const handleRowClick = (invoiceId) => {
    dispatch(fetchInvoiceById(invoiceId))
      .unwrap()
      .then(() => {
        onViewDetail(invoiceId);
      });
  };

  const handleExportToPDF = () => {
    if (selectedInvoice) {
      dispatch(fetchInvoiceById(selectedInvoice.id))
        .unwrap()
        .then((invoice) => {
          // Define columns for PDF export
          const columns = [
            { id: "invoice_number", label: "Invoice #" },
            { id: "supplier", label: "Supplier" },
            { id: "invoice_date", label: "Date" },
            { id: "total_amount", label: "Amount" },
            { id: "is_paid", label: "Payment Status" },
          ];

          // Prepare data for export
          const data = [
            {
              invoice_number: invoice.invoice_number,
              supplier: invoice.supplier
                ? invoice.supplier.company_name
                : "N/A",
              invoice_date: format(
                new Date(invoice.invoice_date),
                "MM/dd/yyyy"
              ),
              total_amount: invoice.total_amount
                ? `₦${invoice.total_amount.toFixed(2)}`
                : "N/A",
              is_paid: invoice.is_paid ? "Paid" : "Unpaid",
            },
          ];

          // Export to PDF
          exportToPDF(data, `Invoice-${invoice.invoice_number}`, columns);
        });
    }
    handleMenuClose();
  };

  const getSupplierNameById = (supplierId) => {
    const supplier = suppliers.find((sup) => sup.id === supplierId);
    return supplier ? supplier.company_name : "N/A";
  };

  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - invoices.length) : 0;

  return (
    <Paper sx={{ width: "100%", mb: 2 }}>
      <TableContainer>
        <Table sx={{ minWidth: 750 }} aria-labelledby="invoiceTable">
          <TableHead>
            <TableRow>
              <TableCell>Invoice #</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Total Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((invoice) => (
                <TableRow
                  hover
                  key={invoice.id}
                  onClick={() => handleRowClick(invoice.id)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell>{invoice.invoice_number}</TableCell>
                  <TableCell>
                    {getSupplierNameById(invoice.supplier_id)}
                  </TableCell>
                  <TableCell>
                    {format(new Date(invoice.invoice_date), "MM/dd/yyyy")}
                  </TableCell>
                  <TableCell align="right">
                    {invoice.total_amount !== undefined
                      ? `₦${invoice.total_amount.toFixed(2)}`
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={invoice.is_paid ? "Paid" : "Unpaid"}
                      color={invoice.is_paid ? "success" : "warning"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="More options">
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, invoice)}
                          size="small"
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            {emptyRows > 0 && (
              <TableRow style={{ height: 53 * emptyRows }}>
                <TableCell colSpan={6} />
              </TableRow>
            )}
            {invoices.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="subtitle1" sx={{ py: 5 }}>
                    No invoices found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={invoices.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleView}>
          <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleExportToPDF}>
          <PdfIcon fontSize="small" sx={{ mr: 1 }} />
          Export to PDF
        </MenuItem>
        {selectedInvoice && !selectedInvoice.is_paid && (
          <MenuItem onClick={handleMarkAsPaid}>
            <ReceiptIcon fontSize="small" sx={{ mr: 1 }} />
            Mark as Paid
          </MenuItem>
        )}
        <MenuItem onClick={handleDelete} sx={{ color: "error.main" }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default InvoiceTable;
