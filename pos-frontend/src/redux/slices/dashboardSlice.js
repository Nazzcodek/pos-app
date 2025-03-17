import { createSlice } from "@reduxjs/toolkit";
import { salesRoutes } from "../../routes/Reports";

const initialState = {
  data: null,
  loading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    fetchDashboardStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchDashboardSuccess(state, action) {
      state.loading = false;
      state.data = action.payload;
    },
    fetchDashboardFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
  fetchDashboardStart,
  fetchDashboardSuccess,
  fetchDashboardFailure,
} = dashboardSlice.actions;

export const fetchDashboardData = () => async (dispatch) => {
  try {
    dispatch(fetchDashboardStart());

    const currentDate = new Date();
    const todayString = currentDate.toISOString().split("T")[0];

    // Fetch today's sales
    const todaySalesResponse = await salesRoutes.getDailySales(todayString);

    // Fetch this week's sales
    const weekStartDate = new Date(currentDate);
    weekStartDate.setDate(currentDate.getDate() - currentDate.getDay());
    const weekStartString = weekStartDate.toISOString().split("T")[0];
    const weekSalesResponse = await salesRoutes.getWeeklySales(weekStartString);

    // Fetch this month's sales
    const monthSalesResponse = await salesRoutes.getMonthlySales(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1
    );

    // Fetch today's sales details
    const todaySalesDetailsResponse = await salesRoutes.getHourlySales(
      todayString,
      0
    );

    const dashboardData = {
      todaySales: todaySalesResponse.data.total_sales,
      weekSales: weekSalesResponse.data.total_sales,
      monthSales: monthSalesResponse.data.total_sales,
      dailySalesData: monthSalesResponse.data.daily_sales.map((item) => ({
        date: item.date,
        sales: item.total_sales,
      })),
      weeklySalesData: monthSalesResponse.data.weekly_sales.map((week) => ({
        weekNo: week.week_no,
        totalSales: week.total_sales,
        dailySales: week.daily_sales.map((day) => ({
          date: day.date,
          sales: day.total_sales,
        })),
      })),
      todaySalesDetails: todaySalesDetailsResponse.data.total_sales,
    };

    dispatch(fetchDashboardSuccess(dashboardData));
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    dispatch(fetchDashboardFailure(error.message));
  }
};

export default dashboardSlice.reducer;
