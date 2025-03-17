import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  IconButton,
  Alert,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { fetchDashboardData } from "../redux/slices/dashboardSlice";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import SalesStatCards from "../components/dashboard/DashboardCard";
import SalesChart from "../components/dashboard/DailySalesChart";
import TodaySalesTable from "../components/dashboard/DashboardTable";

const Dashboard = () => {
  const dispatch = useDispatch();
  const { data, loading, error } = useSelector((state) => state.dashboard);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // eslint-disable-next-line
  const [tableData, setTableData] = useState({
    todaySalesDetails: [],
    todaySales: 0,
  });

  useEffect(() => {
    dispatch(fetchDashboardData());
  }, [dispatch]);

  // Process data for table when dashboard data changes
  useEffect(() => {
    if (data && data.todayTransactions) {
      // Transform the transactions data into the format expected by the table
      const formattedTransactions = data.todayTransactions.map(
        (transaction) => ({
          sale_id: transaction.id,
          date_time: transaction.timestamp,
          username: transaction.username,
          total: parseFloat(transaction.amount),
          receipt_number: transaction.receipt_number || `REC-${transaction.id}`,
        })
      );

      // Calculate total sales amount for today
      const totalSalesAmount = formattedTransactions.reduce(
        (sum, transaction) => sum + (transaction.total || 0),
        0
      );

      setTableData({
        todaySalesDetails: formattedTransactions,
        todaySales: totalSalesAmount,
      });
    }
  }, [data]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    dispatch(fetchDashboardData()).then(() => {
      setTimeout(() => setIsRefreshing(false), 1000);
    });
  };

  if (loading && !isRefreshing) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        sx={{ bgcolor: "#f8fafc" }}
      >
        <CircularProgress sx={{ color: "#4338ca" }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        sx={{ bgcolor: "#f8fafc", p: 3 }}
      >
        <Alert severity="error" sx={{ maxWidth: 600 }}>
          <Typography variant="h6" gutterBottom>
            Error Loading Dashboard
          </Typography>
          <Typography>{error}</Typography>
          <Box mt={2}>
            <IconButton color="primary" onClick={handleRefresh}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Alert>
      </Box>
    );
  }

  if (!data) return null;

  // Calculate trend data
  const getTrendData = (current, previous) => {
    if (!previous) return { change: 0, isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return {
      change: Math.abs(change).toFixed(1),
      isPositive: change >= 0,
    };
  };

  // Example trend calculations (replace with actual logic based on your data)
  const todayTrend = getTrendData(data.todaySales, data.todaySales * 0.9);
  const weekTrend = getTrendData(data.weekSales, data.weekSales * 0.85);
  const monthTrend = getTrendData(data.monthSales, data.monthSales * 1.05);

  const statsCards = [
    {
      title: "Today's Sales",
      value: data.todaySales,
      trend: todayTrend,
      bgcolor: "#ede9fe",
      borderColor: "#8b5cf6",
      iconColor: "#6d28d9",
    },
    {
      title: "This Week's Sales",
      value: data.weekSales,
      trend: weekTrend,
      bgcolor: "#e0f2fe",
      borderColor: "#38bdf8",
      iconColor: "#0369a1",
    },
    {
      title: "This Month's Sales",
      value: data.monthSales,
      trend: monthTrend,
      bgcolor: "#f0fdf4",
      borderColor: "#4ade80",
      iconColor: "#16a34a",
    },
  ];

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        bgcolor: "#f8fafc",
        p: { xs: 1, sm: 2, md: 3 },
      }}
    >
      <Container
        maxWidth="xl"
        sx={{
          p: { xs: 1, sm: 2 },
          height: "100%",
        }}
      >
        <DashboardHeader
          title="Sales Dashboard"
          handleRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        <SalesStatCards statsCards={statsCards} />

        <SalesChart dailySalesData={data.dailySalesData} />

        <TodaySalesTable />
      </Container>
    </Box>
  );
};

export default Dashboard;
