import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchInvoices,
  setFilters,
  clearFilters,
} from "../redux/slices/invoiceSlice";
import InvoiceTable from "../components/invoices/InvoiceTable";
import InvoiceFilter from "../components/invoices/InvoiceFilter";
import InvoiceFormModal from "../components/invoices/InvoiceForm";
import InvoiceDetailModal from "../components/invoices/InvoiceDetail";
import { Box, Typography, Button, Stack, Paper } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

const InvoicePage = () => {
  const dispatch = useDispatch();
  const { invoices, loading, filters } = useSelector((state) => state.invoices);

  const [openForm, setOpenForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const loadInvoices = useCallback(() => {
    dispatch(fetchInvoices({ filters }));
  }, [dispatch, filters]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const handleCreateNew = () => {
    setEditData(null);
    setOpenForm(true);
  };

  const handleEdit = (invoice) => {
    setEditData(invoice);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setEditData(null);
  };

  const handleRowClick = (invoiceId) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    setSelectedInvoice(invoice);
  };

  const handleCloseDetail = () => {
    setSelectedInvoice(null);
  };

  const handleFilterChange = (newFilters) => {
    dispatch(setFilters(newFilters));
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Typography variant="h4" component="h1">
            Invoice Inventory
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreateNew}
            >
              Create Invoice
            </Button>
          </Stack>
        </Stack>

        <InvoiceFilter
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />
      </Paper>

      <Paper elevation={2} sx={{ p: 3 }}>
        <InvoiceTable
          invoices={invoices}
          loading={loading}
          onViewDetail={handleRowClick}
          onEditClick={handleEdit}
        />
      </Paper>

      {/* Modals */}
      <InvoiceFormModal
        open={openForm}
        onClose={handleCloseForm}
        editData={editData}
      />

      <InvoiceDetailModal
        open={Boolean(selectedInvoice)}
        onClose={handleCloseDetail}
        invoice={selectedInvoice}
        onEditClick={() => {
          handleEdit(selectedInvoice);
          handleCloseDetail();
        }}
      />
    </Box>
  );
};

export default InvoicePage;
