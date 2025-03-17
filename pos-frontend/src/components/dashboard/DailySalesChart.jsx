import React, { useState, useEffect } from "react";
import { Card, CardContent, Typography, Box, Tabs, Tab } from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { formatCurrency } from "./utils";
import { salesRoutes } from "../../routes/Reports";

const SalesChart = () => {
  const [tabValue, setTabValue] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const weekStartDate = new Date(currentDate);
        weekStartDate.setDate(currentDate.getDate() - currentDate.getDay());
        const weekStartString = weekStartDate.toISOString().split("T")[0];

        let response;
        if (tabValue === 0) {
          // Fetch daily sales for the current month
          response = await salesRoutes.getMonthlySales(year, month);

          if (!response.data || !response.data.daily_sales) {
            throw new Error("Invalid response format for monthly sales");
          }

          // Transform data with strict number conversion
          const transformedData = response.data.daily_sales.map((item) => {
            const salesValue = parseFloat(item.total_sales);
            return {
              name: new Date(item.date).toLocaleDateString("en-NG", {
                day: "2-digit",
              }),
              value: isNaN(salesValue) ? 0 : salesValue,
            };
          });

          setChartData(transformedData);
        } else if (tabValue === 1) {
          // Fetch weekly sales for the current week
          response = await salesRoutes.getWeeklySales(weekStartString);

          if (!response.data || !response.data.daily_sales) {
            throw new Error("Invalid response format for weekly sales");
          }

          // Transform data with strict number conversion
          const transformedData = response.data.daily_sales.map((item) => {
            const salesValue = parseFloat(item.total_sales);
            return {
              name: new Date(item.date).toLocaleDateString("en-NG", {
                weekday: "short",
              }),
              value: isNaN(salesValue) ? 0 : salesValue,
            };
          });

          setChartData(transformedData);
        } else if (tabValue === 2) {
          // Fetch monthly sales for the current year
          const monthlySales = [];
          for (let i = 1; i <= 12; i++) {
            try {
              const monthResponse = await salesRoutes.getMonthlySales(year, i);
              if (
                monthResponse.data &&
                monthResponse.data.total_sales !== undefined
              ) {
                const salesValue = parseFloat(monthResponse.data.total_sales);
                monthlySales.push({
                  name: new Date(year, i - 1).toLocaleString("en-NG", {
                    month: "short",
                  }),
                  value: isNaN(salesValue) ? 0 : salesValue,
                });
              }
            } catch (monthError) {
              console.error(`Error fetching data for month ${i}:`, monthError);
            }
          }

          setChartData(monthlySales);
        }
      } catch (err) {
        console.error("Error fetching sales data:", err);
        setError(err.message);
        // Set fallback test data to verify chart rendering
        setChartData([
          { name: "Item 1", value: 1000 },
          { name: "Item 2", value: 2000 },
          { name: "Item 3", value: 3000 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tabValue]);

  return (
    <Card
      sx={{
        mb: { xs: 3, sm: 4, md: 5 },
        p: 0,
        borderRadius: 2,
        boxShadow:
          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        overflow: "hidden",
      }}
    >
      <Box sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "#f8fafc" }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            "& .MuiTab-root": {
              fontWeight: 600,
              textTransform: "none",
              fontSize: "0.95rem",
              px: 3,
            },
            "& .Mui-selected": {
              color: "#1a3a3a !important",
            },
            "& .MuiTabs-indicator": {
              backgroundColor: "#1a3a3a",
              height: 3,
            },
          }}
        >
          <Tab label="Daily Sales (This Month)" />
          <Tab label="Daily Sales (This Week)" />
          <Tab label="Monthly Sales (This Year)" />
        </Tabs>
      </Box>

      <CardContent sx={{ p: 3 }}>
        <Typography
          variant="h6"
          sx={{
            mb: 3,
            fontSize: { xs: "1.1rem", sm: "1.25rem" },
            fontWeight: 600,
            color: "#1e293b",
          }}
        >
          {tabValue === 0
            ? "Daily Sales Chart (This Month)"
            : tabValue === 1
            ? "Daily Sales Chart (This Week)"
            : "Monthly Sales Chart (This Year)"}
        </Typography>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            Error: {error}
          </Typography>
        )}

        <Box
          sx={{
            width: "100%",
            height: { xs: 350, sm: 400, md: 450 },
            "& .recharts-wrapper": {
              margin: "0 auto",
            },
          }}
        >
          {loading ? (
            <Typography>Loading...</Typography>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 20,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: "#64748b" }} />
                <YAxis
                  tickFormatter={(value) => `₦${value / 1000}K`}
                  tick={{ fill: "#64748b" }}
                />
                <RechartsTooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "8px",
                    padding: "10px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="value"
                  name="Sales Amount"
                  fill="#1a3a3a"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Typography>No data available for the selected period</Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default SalesChart;
