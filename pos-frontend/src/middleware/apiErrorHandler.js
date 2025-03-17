import { toast } from "react-toastify";

/**
 * API request interceptor to add authentication headers and handle errors
 */
const setupApiInterceptors = (apiInstance, store) => {
  // Request interceptor
  apiInstance.interceptors.request.use(
    (config) => {
      // Add CSRF token if available
      const csrfToken = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute("content");
      if (csrfToken) {
        config.headers["X-CSRF-Token"] = csrfToken;
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor
  apiInstance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      // Handle specific error types
      if (error.response) {
        const { status, data } = error.response;

        // Authentication errors
        if (status === 401) {
          // If we get a 401, the user is no longer authenticated
          store.dispatch({ type: "auth/logout" });
          toast.error("Your session has expired. Please log in again.");
        }
        // Server errors
        else if (status >= 500) {
          toast.error("Server error. Please try again later.");
        }
        // Bad request errors with message
        else if (status === 400 && data && data.message) {
          toast.error(data.message);
        }

        // Handle HTML responses (which indicate something is wrong with the API)
        const contentType = error.response.headers["content-type"];
        if (contentType && contentType.includes("text/html")) {
          console.error("Received HTML response instead of JSON");
          error.isHtmlResponse = true;
        }
      }
      // Network errors
      else if (error.request) {
        toast.error("Network error. Please check your connection.");
      }

      return Promise.reject(error);
    }
  );
};

export default setupApiInterceptors;
