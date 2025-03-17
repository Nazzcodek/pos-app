import React from "react";
import { Grid, Card, CardContent, Typography, Box } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import { formatCurrency } from "./utils";

const StatCard = ({ card }) => {
  return (
    <Card
      sx={{
        bgcolor: "#ffffff",
        height: "100%",
        borderRadius: 2,
        boxShadow:
          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        transition: "all 0.2s ease-in-out",
        position: "relative",
        overflow: "hidden",
        border: `1px solid ${card.borderColor}`,
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow:
            "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        },
        "&:before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          width: "6px",
          height: "100%",
          backgroundColor: card.borderColor,
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography
          variant="subtitle1"
          sx={{
            color: "#64748b",
            fontSize: { xs: "0.875rem", md: "1rem" },
            mb: 1,
          }}
        >
          {card.title}
        </Typography>

        <Typography
          variant="h4"
          component="div"
          sx={{
            fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
            fontWeight: 700,
            color: "#0f172a",
            mb: 1,
          }}
        >
          {formatCurrency(card.value)}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center" }}>
          {card.trend.isPositive ? (
            <TrendingUpIcon
              sx={{ color: "#16a34a", mr: 0.5, fontSize: "1.25rem" }}
            />
          ) : (
            <TrendingDownIcon
              sx={{ color: "#dc2626", mr: 0.5, fontSize: "1.25rem" }}
            />
          )}
          <Typography
            variant="body2"
            sx={{
              color: card.trend.isPositive ? "#16a34a" : "#dc2626",
              fontWeight: 600,
            }}
          >
            {card.trend.change}%{" "}
            {card.trend.isPositive ? "increase" : "decrease"}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

const SalesStatCards = ({ statsCards }) => {
  return (
    <Grid
      container
      spacing={{ xs: 2, sm: 3, md: 4 }}
      sx={{ mb: { xs: 3, sm: 4, md: 5 } }}
    >
      {statsCards.map((card, index) => (
        <Grid item xs={12} sm={4} key={index}>
          <StatCard card={card} />
        </Grid>
      ))}
    </Grid>
  );
};

export default SalesStatCards;
