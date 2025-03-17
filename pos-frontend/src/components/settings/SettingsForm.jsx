import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSettings,
  updateSettings,
} from "../../redux/slices/settingsSlice";
import {
  TextField,
  Button,
  Container,
  Typography,
  Avatar,
  Box,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import Loader from "../common/Loader";
import API_URL from "../common/envCall";

const SettingForm = () => {
  const dispatch = useDispatch();
  const { settings, loading, error } = useSelector((state) => state.settings);

  const [formData, setFormData] = useState({
    business_name: "",
    restaurant_name: "",
    city: "",
    state: "",
    street: "",
    zip_code: "",
    country: "",
    phone: "",
    email: "",
    image: null,
  });

  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);

  useEffect(() => {
    if (settings) {
      setFormData({
        business_name: settings.business_name || "",
        restaurant_name: settings.restaurant_name || "",
        city: settings.city || "",
        state: settings.state || "",
        street: settings.street || "",
        zip_code: settings.zip_code || "",
        country: settings.country || "",
        phone: settings.phone || "",
        email: settings.email || "",
        image: null,
      });
    }
  }, [settings]);

  const handleChange = (e) => {
    let { name, value } = e.target;

    if (name === "zip_code") {
      value = value.trim() === "" ? null : parseFloat(value);
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, image: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();

    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null) {
        // Convert zip_code to float
        if (key === "zip_code") {
          data.append(key, parseFloat(formData[key]));
        } else {
          data.append(key, formData[key]);
        }
      }
    });

    const result = dispatch(updateSettings(data));
    if (updateSettings.rejected.match(result)) {
      console.error("Update failed:", result.payload);
    }
  };

  return (
    <Container maxWidth="md">
      {loading && <Loader />}
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Business Name"
              name="business_name"
              value={formData.business_name}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Restaurant Name"
              name="restaurant_name"
              value={formData.restaurant_name}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="City"
              name="city"
              value={formData.city}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="State"
              name="state"
              value={formData.state}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Street"
              name="street"
              value={formData.street}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Zip Code"
              name="zip_code"
              type="number"
              value={formData.zip_code || ""}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Country"
              name="country"
              value={formData.country}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
          </Grid>

          {/* Logo Section */}
          <Grid item xs={12} textAlign="center" sx={{ mt: 2 }}>
            <Typography variant="h6">Logo</Typography>
            {settings && settings.image ? (
              <Avatar
                src={`${API_URL}/${settings.image}`}
                sx={{ width: 100, height: 100, mb: 2, mx: "auto" }}
              />
            ) : (
              <Avatar sx={{ width: 100, height: 100, mb: 2, mx: "auto" }} />
            )}
            <input type="file" onChange={handleFileChange} />
          </Grid>
        </Grid>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
          <Button variant="contained" color="primary" type="submit">
            Save Settings
          </Button>
        </Box>
      </form>
    </Container>
  );
};

export default SettingForm;
