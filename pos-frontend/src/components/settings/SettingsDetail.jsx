import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSettings } from "../../redux/slices/settingsSlice";
import {
  Typography,
  Avatar,
  Divider,
  Box,
  Chip,
  Card,
  CardContent,
} from "@mui/material";
import {
  LocationOn,
  Phone,
  Email,
  Business,
  Restaurant,
} from "@mui/icons-material";
import Grid from "@mui/material/Grid2";
import Loader from "../common/Loader";
import API_URL from "../common/envCall";

const SettingsDetail = () => {
  const dispatch = useDispatch();
  const { settings, loading, error } = useSelector((state) => state.settings);

  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);

  if (loading) return <Loader />;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!settings) return <Typography>No settings found.</Typography>;

  return (
    <Grid container spacing={4}>
      {/* Logo Section - Card with shadow and rounded corners */}
      <Grid item xs={12} md={4}>
        <Card elevation={2} sx={{ height: "100%" }}>
          <CardContent sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Restaurant Logo
            </Typography>
            {settings.image ? (
              <Avatar
                src={`${API_URL}/${settings.image}`}
                sx={{
                  width: 180,
                  height: 180,
                  mx: "auto",
                  my: 2,
                  boxShadow: 3,
                }}
                alt={settings.restaurant_name || "Restaurant Logo"}
              />
            ) : (
              <Avatar
                sx={{
                  width: 180,
                  height: 180,
                  mx: "auto",
                  my: 2,
                  bgcolor: "primary.light",
                  boxShadow: 3,
                }}
                alt="No Logo"
              >
                <Restaurant sx={{ fontSize: 80 }} />
              </Avatar>
            )}
            <Chip
              label={settings.business_name || "Business Name"}
              icon={<Business />}
              color="primary"
              variant="outlined"
              sx={{ mt: 2 }}
            />
          </CardContent>
        </Card>
      </Grid>

      {/* Details Section */}
      <Grid item xs={12} md={8}>
        <Card elevation={2} sx={{ height: "100%" }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h4" gutterBottom color="primary">
                {settings.restaurant_name || "Restaurant Name"}
              </Typography>
              <Typography
                variant="subtitle1"
                color="text.secondary"
                gutterBottom
              >
                {settings.business_name || "Business Name"}
              </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Address Information */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid xs={12}>
                <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                  <LocationOn color="primary" sx={{ mr: 2, mt: 0.5 }} />
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Address
                    </Typography>
                    <Typography variant="body1">
                      {settings.street && `${settings.street}, `}
                      {settings.city && `${settings.city}, `}
                      {settings.state && `${settings.state}, `}
                      {settings.zip_code && `${settings.zip_code}, `}
                      {settings.country || ""}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            {/* Contact Information */}
            <Grid container spacing={2}>
              {settings.phone && (
                <Grid xs={12} md={6}>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Phone color="primary" sx={{ mr: 2 }} />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Phone
                      </Typography>
                      <Typography variant="body1">{settings.phone}</Typography>
                    </Box>
                  </Box>
                </Grid>
              )}

              {settings.email && (
                <Grid xs={12} md={6}>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Email color="primary" sx={{ mr: 2 }} />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Email
                      </Typography>
                      <Typography variant="body1">{settings.email}</Typography>
                    </Box>
                  </Box>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default SettingsDetail;
