import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  Card,
  CardHeader,
  TablePagination,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import SellOutlinedIcon from "@mui/icons-material/SellOutlined";
import { Print } from "@mui/icons-material";
import api from "../../api";
import { getReceipt } from "../../routes/POSSales";
import { printReceipt } from "../pos/ReceiptPrinter";
import SaleDetailsModal from "./SalesModal";

const TodaySalesTable = () => {
  const [salesData, setSalesData] = useState({ rows: [], summary: {} });
  const [loading, setLoading] = useState(true);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [isPrinting, setIsPrinting] = useState(false);

  const fetchSalesData = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const response = await api.get("/sales/report/date-range", {
        params: {
          start_date: today,
          end_date: today,
          page: 1,
          page_size: 50,
        },
      });
      setSalesData(response.data);
    } catch (error) {
      console.error("Failed to fetch sales data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRowClick = (sale) => {
    setSelectedSale(sale);
    setDetailsModalOpen(true);
  };

  const handlePrint = async (saleId, e) => {
    if (e) {
      e.stopPropagation();
    }
    if (isPrinting) return;

    setIsPrinting(true);
    try {
      const receiptData = await getReceipt(saleId);
      const currentSale = { id: saleId };
      await printReceipt(receiptData, currentSale);
    } catch (error) {
      console.error("Error printing receipt:", error);
    } finally {
      setIsPrinting(false);
    }
  };

  const formatTime = (dateTimeString) => {
    if (!dateTimeString) return "N/A";
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box mt={4}>
      <Card elevation={0} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <CardHeader
          title={
            <Box display="flex" alignItems="center">
              <SellOutlinedIcon sx={{ mr: 1, color: "#1a3a3a" }} />
              <Typography variant="h6" component="div">
                Today's Transactions
              </Typography>
            </Box>
          }
          subheader={
            <Typography variant="subtitle2" color="text.secondary">
              {salesData.rows.length} transactions totaling ₦
              {Number(salesData.summary.total_amount).toLocaleString(
                undefined,
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }
              )}
            </Typography>
          }
          sx={{
            backgroundColor: "#f8fafc",
            borderBottom: "1px solid #e2e8f0",
          }}
        />

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f8fafc" }}>
                <TableCell sx={{ fontWeight: "600", color: "#64748b" }}>
                  Time
                </TableCell>
                <TableCell sx={{ fontWeight: "600", color: "#64748b" }}>
                  Username
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: "600", color: "#64748b" }}
                >
                  Total
                </TableCell>
                <TableCell sx={{ fontWeight: "600", color: "#64748b" }}>
                  Receipt
                </TableCell>
                <TableCell sx={{ fontWeight: "600", color: "#64748b" }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {salesData.rows
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row) => (
                  <TableRow
                    key={row.sale_id}
                    onClick={() => handleRowClick(row)}
                    sx={{
                      cursor: "pointer",
                      "&:hover": { bgcolor: "#f1f5f9" },
                      "&:nth-of-type(odd)": { backgroundColor: "#fafafa" },
                    }}
                  >
                    <TableCell>{formatTime(row.date_time)}</TableCell>
                    <TableCell>{row.username}</TableCell>
                    <TableCell align="right">
                      ₦
                      {row.total.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>{row.receipt_number}</TableCell>
                    <TableCell>
                      <Tooltip title="Print Receipt">
                        <span>
                          <IconButton
                            size="small"
                            onClick={(e) => handlePrint(row.sale_id, e)}
                            disabled={isPrinting}
                            sx={{
                              opacity: isPrinting ? 0.5 : 1,
                              cursor: isPrinting ? "not-allowed" : "pointer",
                            }}
                          >
                            <Print fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={salesData.rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ borderTop: "1px solid #e2e8f0" }}
        />
      </Card>

      <SaleDetailsModal
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        saleId={selectedSale?.sale_id}
        onPrint={() => handlePrint(selectedSale?.sale_id)}
        isPrinting={isPrinting}
      />
    </Box>
  );
};

export default TodaySalesTable;
