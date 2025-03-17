import fs from "fs";
import path from "path";
import { promisify } from "util";
import React from "react";

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const existsAsync = promisify(fs.exists);
const mkdirAsync = promisify(fs.mkdir);

// Path to settings file - adjust as needed for your project structure
const SETTINGS_DIR = path.join(process.cwd(), "data");
const SETTINGS_FILE = path.join(SETTINGS_DIR, "settings.json");

// Default settings structure
const DEFAULT_SETTINGS = {
  businessName: "",
  restaurantName: "",
  address: "",
  location: {
    lat: "",
    lng: "",
  },
  contactInfo: {
    phone: "",
    email: "",
  },
  lastUpdated: new Date().toISOString(),
};

/**
 * Get current settings from JSON file
 */
export const getSettings = async () => {
  try {
    // Check if settings directory exists
    const dirExists = await existsAsync(SETTINGS_DIR);
    if (!dirExists) {
      await mkdirAsync(SETTINGS_DIR, { recursive: true });
    }

    // Check if settings file exists
    const fileExists = await existsAsync(SETTINGS_FILE);
    if (!fileExists) {
      // Create default settings file if it doesn't exist
      await writeFileAsync(
        SETTINGS_FILE,
        JSON.stringify(DEFAULT_SETTINGS, null, 2)
      );
      return DEFAULT_SETTINGS;
    }

    // Read and parse settings file
    const data = await readFileAsync(SETTINGS_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading settings file:", error);
    throw new Error("Failed to load settings");
  }
};

/**
 * Save updated settings to JSON file
 * Only updates changed fields and preserves existing ones
 */
export const saveSettings = async (newSettings) => {
  try {
    // Get current settings
    const currentSettings = await getSettings();

    // Merge current settings with new settings (deep merge)
    const updatedSettings = deepMerge(currentSettings, newSettings);

    // Add last updated timestamp
    updatedSettings.lastUpdated = new Date().toISOString();

    // Ensure directory exists
    const dirExists = await existsAsync(SETTINGS_DIR);
    if (!dirExists) {
      await mkdirAsync(SETTINGS_DIR, { recursive: true });
    }

    // Write updated settings to file
    await writeFileAsync(
      SETTINGS_FILE,
      JSON.stringify(updatedSettings, null, 2)
    );

    return updatedSettings;
  } catch (error) {
    console.error("Error saving settings:", error);
    throw new Error("Failed to save settings");
  }
};

/**
 * Helper function to deep merge objects
 * This preserves nested structure and only updates changed values
 */
const deepMerge = (target, source) => {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }

  return output;
};

/**
 * Helper to check if value is an object
 */
const isObject = (item) => {
  return item && typeof item === "object" && !Array.isArray(item);
};

// client-side settings access
// For Next.js or other frameworks where you need client-side access
export const useSettings = () => {
  const [settings, setSettings] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings");
        if (!response.ok) {
          throw new Error("Failed to fetch settings");
        }
        const data = await response.json();
        setSettings(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { settings, loading, error };
};
