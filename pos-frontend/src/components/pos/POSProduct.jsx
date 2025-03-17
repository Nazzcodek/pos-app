import {
  Box,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  CircularProgress,
} from "@mui/material";
import API_URL from "../common/envCall";

export const CategoryBar = ({
  categories,
  activeCategory,
  onCategoryClick,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 1,
        p: 2,
        overflowX: "auto",
        bgcolor: "background.paper",
      }}
    >
      {" "}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: 1,
          width: "100%",
        }}
      >
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={activeCategory === category.id ? "contained" : "outlined"}
            onClick={() => onCategoryClick(category.id)}
          >
            {category.name}
          </Button>
        ))}
      </Box>
    </Box>
  );
};

// ProductGrid.jsx

export const ProductCard = ({ product, onAddToCart }) => {
  return (
    <Card
      onClick={() => onAddToCart(product)}
      sx={{
        cursor: "pointer",
        "&:hover": { transform: "scale(1.02)" },
        transition: "transform 0.2s",
      }}
    >
      <CardMedia
        component="img"
        height="140"
        image={`${API_URL}/${product.image}`}
        alt={product.name}
      />
      <CardContent>
        <Typography
          variant="subtitle1"
          noWrap
          sx={{ textTransform: "capitalize" }}
        >
          {product.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          ₦{product.price.toFixed(2)}
        </Typography>
      </CardContent>
    </Card>
  );
};

export const ProductGrid = ({ products, loading, onAddToCart }) => {
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Grid container spacing={2} sx={{ p: 2 }}>
      {products.map((product) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
          <ProductCard product={product} onAddToCart={onAddToCart} />
        </Grid>
      ))}
    </Grid>
  );
};
