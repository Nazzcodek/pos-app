import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

// Main export function that handles all export formats
export const exportData = (
  rows,
  columns,
  format,
  reportTitle = "Sales Report"
) => {
  if (!rows || rows.length === 0) {
    throw new Error("No data to export");
  }

  // Format the filename with date
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .substring(0, 19);
  const filename = `${reportTitle.replace(/\s+/g, "-")}_${timestamp}`;

  switch (format.toLowerCase()) {
    case "excel":
      return exportToExcel(rows, columns, `${filename}.xlsx`, reportTitle);
    case "csv":
      return exportToCSV(rows, columns, `${filename}.csv`);
    case "pdf":
      return exportToPDF(rows, columns, `${filename}.pdf`, reportTitle);
    case "json":
      return exportToJSON(rows, `${filename}.json`);
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
};

// Prepare data for export based on visible columns
const prepareData = (rows, columns) => {
  return rows.map((row) => {
    const newRow = {};
    columns.forEach((col) => {
      // Get column definition to access formatter if available
      if (col.id in row) {
        // Apply formatting if a format function is provided
        if (col.format && typeof col.format === "function") {
          newRow[col.label] = col.format(row[col.id]);
        } else {
          newRow[col.label] = row[col.id];
        }
      }
    });
    return newRow;
  });
};

// Export to Excel
const exportToExcel = (rows, columns, filename, sheetName) => {
  const formattedData = prepareData(rows, columns);
  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate Excel file and trigger download
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, filename);

  return true;
};

// Export to CSV
const exportToCSV = (rows, columns, filename) => {
  const formattedData = prepareData(rows, columns);

  // Convert JSON to CSV
  const header = columns.map((col) => col.label);
  const csvRows = [];

  // Add header row
  csvRows.push(header.join(","));

  // Add data rows
  formattedData.forEach((row) => {
    const values = header.map((key) => {
      const value = row[key] || "";
      // Escape commas and quotes
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(","));
  });

  const csvString = csvRows.join("\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, filename);

  return true;
};

// Export to PDF
const exportToPDF = (rows, columns, filename, title) => {
  const formattedData = prepareData(rows, columns);
  const orientation = columns.length > 6 ? "l" : "p"; // Use landscape if more than 6 columns, otherwise portrait
  const doc = new jsPDF(orientation, "mm", "a4");

  // Add title
  doc.setFontSize(16);
  doc.text(title, 14, 15);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

  // Set up table data
  const tableHeaders = columns.map((col) => col.label);
  const tableData = formattedData.map((row) =>
    tableHeaders.map((header) => {
      const value = row[header];
      // Clean currency symbols for better PDF display
      if (typeof value === "string" && value.startsWith("₦")) {
        return value.replace("₦", "NGN ");
      }
      return value !== undefined && value !== null ? value : "";
    })
  );

  // Add totals row if appropriate
  const totalRow = [];
  let hasTotal = false;

  tableHeaders.forEach((header) => {
    if (header === "Till" || header === "Quantity") {
      const total = rows.reduce((sum, row) => sum + (row.quantity || 0), 0);
      totalRow.push(total.toLocaleString());
      hasTotal = true;
    } else if (header === "Total") {
      const total = rows.reduce((sum, row) => sum + (row.total || 0), 0);
      totalRow.push(`NGN ${total.toFixed(2)}`);
      hasTotal = true;
    } else {
      totalRow.push(header === "Product" ? "TOTALS" : "");
    }
  });

  if (hasTotal) {
    tableData.push(totalRow);
  }

  // Generate the table
  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: 25,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [66, 66, 66] },
    footStyles: {
      fillColor: [211, 211, 211],
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { top: 30 },
  });

  // Save the PDF
  doc.save(filename);
  return true;
};

// Export to JSON
const exportToJSON = (rows, filename) => {
  const blob = new Blob([JSON.stringify(rows, null, 2)], {
    type: "application/json",
  });
  saveAs(blob, filename);
  return true;
};

// Helper to get formatted columns based on report type
export const getExportColumns = (
  reportType,
  visibleColumns,
  columnDefinitions
) => {
  // Filter columns based on visible columns
  return columnDefinitions
    .filter((col) => visibleColumns.includes(col.id))
    .map((col) => ({
      id: col.id,
      label: col.label,
      format: col.format,
    }));
};
