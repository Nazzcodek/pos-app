import {
  Paper,
  Typography,
  IconButton,
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  ButtonGroup,
} from "@mui/material";
import { Add, Remove, Delete, Print } from "@mui/icons-material";

const CartSidebar = ({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  loading,
}) => {
  const total = cartItems.reduce((sum, item) => sum + (item.total || 0), 0);

  return (
    <Paper
      sx={{
        width: 460,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography
        variant="h6"
        sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}
      >
        Cart ({cartItems.length} items)
      </Typography>

      <List sx={{ flexGrow: 1, overflow: "auto" }}>
        {cartItems.map((item) => (
          <ListItem key={item.id}>
            <ListItemText
              primary={item.name}
              secondary={`₦${item.total?.toFixed(2)}`}
            />
            <ListItemSecondaryAction>
              <ButtonGroup size="small">
                <IconButton
                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                >
                  <Remove />
                </IconButton>
                <Button>{item.quantity}</Button>
                <IconButton
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                >
                  <Add />
                </IconButton>
              </ButtonGroup>
              <IconButton onClick={() => onRemoveItem(item.id)}>
                <Delete />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
        <Typography variant="h6" gutterBottom>
          Total: ₦{total.toFixed(2)}
        </Typography>
        <Button
          fullWidth
          variant="outlined"
          color="error"
          onClick={onClearCart}
          startIcon={<Delete />}
          sx={{ mb: 1 }}
        >
          Clear Cart
        </Button>
        <Button
          fullWidth
          variant="contained"
          onClick={onCheckout}
          disabled={loading || cartItems.length === 0}
          startIcon={<Print />}
        >
          Checkout
        </Button>
      </Box>
    </Paper>
  );
};

export default CartSidebar;
