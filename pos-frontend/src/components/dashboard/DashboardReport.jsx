import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSalesReport } from "../../redux/slices/salesSlice";
import SalesReportFilters from "./SalesReportFilters";
import SalesReportTable from "./SalesReportTable";
import TodaySalesTable from "./TodaySalesTable";
import { Box } from "@mui/material";

const SalesReport = () => {
  const dispatch = useDispatch();
  const { salesReport, loading, error } = useSelector((state) => state.sales);
  const [filters, setFilters] = useState({
    reportType: "sales",
    startDate: new Date().setHours(0, 0, 0, 0), // Start of the day
    endDate: new Date().setHours(23, 59, 59, 999), // End of the day
    groupBy: [],
    minAmount: null,
    maxAmount: null,
  });

  const [todaySalesDetails, setTodaySalesDetails] = useState([]);
  const [todaySalesTotal, setTodaySalesTotal] = useState(0);

  useEffect(() => {
    // Fetch sales report data when filters change
    dispatch(fetchSalesReport(filters))
      .unwrap()
      .then((data) => {
        setTodaySalesDetails(data);
        setTodaySalesTotal(data.reduce((sum, sale) => sum + sale.total, 0));
      })
      .catch((error) => {
        console.error("Failed to fetch sales report:", error);
      });
  }, [dispatch, filters]);

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleApplyFilters = () => {
    // Re-fetch data with updated filters
    dispatch(fetchSalesReport(filters))
      .unwrap()
      .then((data) => {
        setTodaySalesDetails(data);
        setTodaySalesTotal(data.reduce((sum, sale) => sum + sale.total, 0));
      })
      .catch((error) => {
        console.error("Failed to fetch sales report:", error);
      });
  };

  const handleResetFilters = () => {
    setFilters({
      reportType: "sales",
      startDate: new Date().setHours(0, 0, 0, 0), // Start of the day
      endDate: new Date().setHours(23, 59, 59, 999), // End of the day
      groupBy: [],
      minAmount: null,
      maxAmount: null,
    });
  };

  return (
    <Box>
      <SalesReportFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
      />

      {/* Sales Report Table */}
      <SalesReportTable
        rows={salesReport}
        reportType={filters.reportType}
        visibleColumns={[
          "receipt_number",
          "date_time",
          "quantity",
          "total",
          "username",
        ]}
      />

      {/* Today's Sales Table */}
      <TodaySalesTable
        todaySalesDetails={todaySalesDetails}
        todaySales={todaySalesTotal}
      />
    </Box>
  );
};

export default SalesReport;
