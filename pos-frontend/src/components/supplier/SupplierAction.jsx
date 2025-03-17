import React from "react";
import { Box, Button, Tooltip } from "@mui/material";
import { ImportExport as ExportIcon } from "@mui/icons-material";
import {
  exportToCSV,
  exportToExcel,
  exportToPDF,
} from "../../utils/exportUtils";

const SupplierActionButtons = ({ suppliers }) => {
  const handleExport = (format) => {
    const columns = [
      { id: "company_name", label: "Company Name" },
      { id: "contact_person", label: "Contact Person" },
      { id: "email", label: "Email" },
      { id: "phone_number", label: "Phone Number" },
      {
        id: "items_supplied",
        label: "Items Supplied",
        render: (row) =>
          row.items_supplied ? JSON.parse(row.items_supplied).join(", ") : "",
      },
    ];

    switch (format) {
      case "csv":
        exportToCSV(suppliers, "suppliers", columns);
        break;
      case "excel":
        exportToExcel(suppliers, "suppliers", columns);
        break;
      case "pdf":
        exportToPDF(suppliers, "suppliers", columns);
        break;
      default:
        console.warn(`Unsupported export format: ${format}`);
    }
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
      <Tooltip title="Export Options">
        <Box>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            sx={{ mr: 1 }}
            onClick={() => handleExport("csv")}
          >
            CSV
          </Button>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            sx={{ mr: 1 }}
            onClick={() => handleExport("excel")}
          >
            Excel
          </Button>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={() => handleExport("pdf")}
          >
            PDF
          </Button>
        </Box>
      </Tooltip>
    </Box>
  );
};

export default SupplierActionButtons;
