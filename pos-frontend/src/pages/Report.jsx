import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Tab,
  Tabs,
} from "@mui/material";
import {
  fetchSalesReport,
  fetchDailyReport,
  updateFilters,
  resetFilters,
} from "../redux/slices/salesSlice";
import SalesReportFilters from "../components/reports/Filters";
import SalesReportTable from "../components/reports/Tables";
import SalesReportSummary from "../components/reports/Summary";
import SalesReportActions from "../components/reports/Actions";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";

const SalesReportPage = () => {
  const dispatch = useDispatch();
  const {
    rows = [],
    summary = {},
    loading,
    error,
    filters,
    visibleColumns,
  } = useSelector((state) => state.sales);

  // State to manage active tab
  const [activeTab, setActiveTab] = useState(filters?.reportType || "sales");

  useEffect(() => {
    dispatch(fetchDailyReport(new Date().toISOString().split("T")[0]));
  }, [dispatch]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    // Update report type in filters when tab changes
    dispatch(updateFilters({ reportType: newValue }));
  };

  const handleFilterChange = (newFilters) => {
    dispatch(updateFilters(newFilters));
  };

  const handleApplyFilters = () => {
    dispatch(fetchSalesReport({ ...filters, reportType: activeTab }));
  };

  const handleResetFilters = () => {
    dispatch(resetFilters());
    // Keep the current active tab when resetting other filters
    dispatch(updateFilters({ reportType: activeTab }));
    dispatch(fetchDailyReport(new Date().toISOString().split("T")[0]));
  };

  // Ensure we have safe values even if state is incomplete
  const safeRows = Array.isArray(rows) ? rows : [];
  const safeVisibleColumns =
    activeTab && visibleColumns?.[activeTab] ? visibleColumns[activeTab] : [];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Sales Report
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="report type tabs"
        >
          <Tab label="Sales" value="sales" />
          <Tab label="Sale Items" value="items" />
        </Tabs>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <SalesReportFilters
          filters={{ ...filters, reportType: activeTab }}
          onFilterChange={handleFilterChange}
          onApplyFilters={handleApplyFilters}
          onResetFilters={handleResetFilters}
        />
      </Paper>

      {loading ? (
        <Loader />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <>
          <Grid container spacing={3}>
            <Grid item xs={12} md={9}>
              <Paper sx={{ p: 2, mb: 3 }}>
                <SalesReportTable
                  rows={safeRows}
                  reportType={activeTab}
                  visibleColumns={safeVisibleColumns}
                />
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <SalesReportSummary summary={summary || {}} />
              <Box mt={3}>
                <SalesReportActions
                  reportType={activeTab}
                  visibleColumns={safeVisibleColumns}
                  filters={filters || {}}
                  rowCount={safeRows.length}
                  rows={safeRows}
                />
              </Box>
            </Grid>
          </Grid>
        </>
      )}
    </Container>
  );
};

export default SalesReportPage;
