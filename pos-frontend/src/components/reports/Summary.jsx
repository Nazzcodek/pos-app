import React from "react";
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";

const SalesReportSummary = ({ summary }) => {
  // Format currency values
  const formatCurrency = (value) => {
    return `$${parseFloat(value).toFixed(2)}`;
  };

  if (!summary || Object.keys(summary).length === 0) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Summary
        </Typography>
        <Typography color="text.secondary">
          No summary data available
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Summary
      </Typography>

      <List dense>
        <ListItem>
          <ListItemText
            primary="Total Sales"
            secondary={summary.total_sales || 0}
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Total Amount"
            secondary={formatCurrency(summary.total_amount || 0)}
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Total Items"
            secondary={summary.total_items || 0}
          />
        </ListItem>
      </List>

      <Divider sx={{ my: 2 }} />

      {/* Sales by user accordion */}
      {summary.sales_by_user && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>Sales by User</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              {Object.entries(summary.sales_by_user).map(([user, data]) => (
                <ListItem key={user}>
                  <ListItemText
                    primary={user}
                    secondary={`${data.total_sales} sales | ${formatCurrency(
                      data.total_amount
                    )} | ${data.total_items} items`}
                  />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Items by product accordion - if available */}
      {summary.items_by_product && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>Items by Product</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              {Object.entries(summary.items_by_product).map(
                ([product, data]) => (
                  <ListItem key={product}>
                    <ListItemText
                      primary={product}
                      secondary={`${data.quantity} units | ${formatCurrency(
                        data.total_amount
                      )} | ${data.category}`}
                    />
                  </ListItem>
                )
              )}
            </List>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Items by category accordion - if available */}
      {summary.items_by_category && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>Items by Category</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              {Object.entries(summary.items_by_category).map(
                ([category, data]) => (
                  <ListItem key={category}>
                    <ListItemText
                      primary={category}
                      secondary={`${data.quantity} units | ${formatCurrency(
                        data.total_amount
                      )}`}
                    />
                  </ListItem>
                )
              )}
            </List>
          </AccordionDetails>
        </Accordion>
      )}
    </Paper>
  );
};

export default SalesReportSummary;
