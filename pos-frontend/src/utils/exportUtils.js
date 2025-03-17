import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

/**
 * Export data to CSV format
 * @param {Array} data - Array of objects to export
 * @param {string} fileName - Name of the file without extension
 * @param {Array} columns - Array of column definitions
 */

export const exportToCSV = (data, fileName, columns) => {
  try {
    // Format data with readable column headers
    const formattedData = formatDataForExport(data, columns);

    // Create CSV content
    const header = columns.map((col) => col.label).join(",");
    const rows = formattedData.map((item) =>
      columns
        .map((col) => {
          const value = item[col.id];
          // Escape commas and quotes in the value
          return typeof value === "string"
            ? `"${value.replace(/"/g, '""')}"`
            : value ?? "";
        })
        .join(",")
    );

    const csvContent = [header, ...rows].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `${fileName}.csv`);
  } catch (error) {
    console.error("Error exporting to CSV:", error);
    alert("Failed to export to CSV. See console for details.");
  }
};

/**
 * Export data to Excel format
 * @param {Array} data - Array of objects to export
 * @param {string} fileName - Name of the file without extension
 * @param {Array} columns - Array of column definitions
 */
export const exportToExcel = (data, fileName, columns) => {
  try {
    // Format data with readable column headers
    const formattedData = formatDataForExport(data, columns);

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");

    // Format column headers
    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    const headerRow = range.s.r;

    // Replace property names with readable column headers
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: headerRow, c: col });
      const columnIndex = col - range.s.c;
      if (columnIndex < columns.length) {
        worksheet[cellAddress].v = columns[columnIndex].label;
      }
    }

    // Auto-size columns
    const columnsWidth = columns.map((col) => ({
      wch: Math.max(col.label.length, 10),
    }));
    worksheet["!cols"] = columnsWidth;

    // Generate and download file
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    alert("Failed to export to Excel. Make sure xlsx library is installed.");
  }
};

/**
 * Export data to PDF format
 * @param {Array} data - Array of objects to export
 * @param {string} fileName - Name of the file without extension
 * @param {Array} columns - Array of column definitions
 */
export const exportToPDF = (data, fileName, columns) => {
  try {
    // Format data
    const formattedData = formatDataForExport(data, columns);

    // Create document
    const doc = new jsPDF("landscape");

    // Add title
    doc.setFontSize(16);
    doc.text(`Inventory Export - ${new Date().toLocaleDateString()}`, 14, 15);

    // Convert data for autotable
    const headers = columns.map((col) => col.label);
    const rows = formattedData.map((item) =>
      columns.map((col) => {
        const value = item[col.id];
        return value !== null && value !== undefined ? String(value) : "";
      })
    );

    // Use autoTable as a standalone function instead of a method on doc
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 25,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: "linebreak",
      },
      columnStyles: {
        // Adjust column widths if needed
        id: { cellWidth: 20 },
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
      },
    });

    // Save PDF
    doc.save(`${fileName}.pdf`);
  } catch (error) {
    console.error("Error exporting to PDF:", error);
    alert(
      "Failed to export to PDF. Make sure jspdf and jspdf-autotable are installed."
    );
  }
};

/**
 * Export data to JSON format
 * @param {Array} data - Array of objects to export
 * @param {string} fileName - Name of the file without extension
 */
export const exportToJSON = (data, fileName) => {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    saveAs(blob, `${fileName}.json`);
  } catch (error) {
    console.error("Error exporting to JSON:", error);
    alert("Failed to export to JSON.");
  }
};

/**
 * Format data for better readability in exports
 * @param {Array} data - Raw data from the table
 * @param {Array} columns - Column definitions
 * @returns {Array} Formatted data with proper column mappings
 */
const formatDataForExport = (data, columns) => {
  return data.map((item) => {
    const formattedItem = {};

    columns.forEach((col) => {
      // Use render function for formatted display if available
      if (col.render && typeof col.render === "function") {
        try {
          // For simple value formatting like currency or dates
          let renderedValue = col.render(item);

          // If the render function returns a React element, try to extract text value
          if (
            renderedValue &&
            typeof renderedValue === "object" &&
            renderedValue.props
          ) {
            // Handle Chip components - extract the label
            if (
              renderedValue.type &&
              renderedValue.type.displayName === "Chip"
            ) {
              renderedValue = renderedValue.props.label;
            }
            // Handle Switch components - extract the checked status
            else if (
              renderedValue.type &&
              renderedValue.type.displayName === "Switch"
            ) {
              renderedValue = renderedValue.props.checked
                ? "Enabled"
                : "Disabled";
            }
            // Default fallback for other components
            else {
              renderedValue =
                item[col.id] !== undefined ? String(item[col.id]) : "";
            }
          }

          formattedItem[col.id] = renderedValue;
        } catch (e) {
          // Fallback to raw value if render function fails
          formattedItem[col.id] =
            item[col.id] !== undefined ? item[col.id] : "";
        }
      } else {
        // Use raw value if no render function
        formattedItem[col.id] = item[col.id] !== undefined ? item[col.id] : "";
      }
    });

    return formattedItem;
  });
};
