import api from "../api";

export const salesRoutes = {
  getDailySales: (date, reportType = "sales") =>
    api.get(`sales/report/daily/${date}`, {
      params: { report_type: reportType },
    }),

  getWeeklySales: (startDate, reportType = "sales") =>
    api.get("/sales/report/weekly", {
      params: { start_date: startDate, report_type: reportType },
    }),

  getMonthlySales: (year, month, reportType = "sales") =>
    api.get(`/sales/report/monthly/${year}/${month}`, {
      params: { report_type: reportType },
    }),

  getDateRangeSales: (startDate, endDate, reportType = "sales") =>
    api.get("/sales/report/date-range", {
      params: {
        start_date: startDate,
        end_date: endDate,
        report_type: reportType,
      },
    }),

  getHourlySales: (date, hour, reportType = "sales") =>
    api.get(`/sales/report/hourly/${date}/${hour}`, {
      params: { report_type: reportType },
    }),
};

export const getDailySales = async (date, reportType = "sales") => {
  try {
    const response = await api.get(`/sales/report/daily/${date}`, {
      params: { report_type: reportType },
    });
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

export const getWeeklySales = async (startDate, reportType = "sales") => {
  try {
    const response = await api.get("/sales/report/weekly", {
      params: { start_date: startDate, report_type: reportType },
    });
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

export const getMonthlySales = async (year, month, reportType = "sales") => {
  try {
    const response = await api.get(`/sales/report/monthly/${year}/${month}`, {
      params: { report_type: reportType },
    });
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

export const getDateRangeSales = async ({
  reportType,
  groupBy,
  startDate,
  endDate,
  minAmount,
  maxAmount,
  receiptNumber,
}) => {
  // Convert groupBy array to API parameter
  let groupByParam = "";
  if (Array.isArray(groupBy) && groupBy.length > 0) {
    groupByParam = groupBy.join(",");
  } else if (typeof groupBy === "string") {
    groupByParam = groupBy;
  }

  try {
    const response = await api.get(
      `/sales/report/${reportType === "items" ? "items" : "date-range"}`,
      {
        params: {
          start_date: startDate,
          end_date: endDate,
          min_amount: minAmount,
          max_amount: maxAmount,
          group_by: groupByParam,
          receipt_number: receiptNumber,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getHourlySales = async (date, hour, reportType) => {
  try {
    const response = await api.get(`/sales/report/hourly/${date}/${hour}`, {
      params: { report_type: reportType },
    });
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

export const exportReportApi = async ({
  format,
  startDate,
  endDate,
  filters,
  columns,
}) => {
  try {
    // Construct query parameters
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      report_type: filters.report_type,
      ...(filters.group_by && { group_by: filters.group_by }),
      ...(filters.min_amount && { min_amount: filters.min_amount }),
      ...(filters.max_amount && { max_amount: filters.max_amount }),
    });

    // Add columns if they exist
    if (columns && columns.length > 0) {
      columns.forEach((col) => params.append("columns", col));
    }

    const response = await api.get(
      `/sales/export/${format}?${params.toString()}`,
      {
        responseType: "blob",
      }
    );

    // Handle the file download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `sales_report.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return response;
  } catch (error) {
    // Properly handle blob responses containing error messages
    if (error.response?.data instanceof Blob) {
      // Create a promise to handle the asynchronous FileReader
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorMsg = JSON.parse(reader.result);
            reject(new Error(errorMsg.detail || "Export failed"));
          } catch (e) {
            reject(new Error("Export failed: Could not parse error response"));
          }
        };
        reader.onerror = () =>
          reject(new Error("Export failed: Could not read error response"));
        reader.readAsText(error.response.data);
      });
    }
    throw error;
  }
};
