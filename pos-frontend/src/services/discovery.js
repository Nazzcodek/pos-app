class ZeroconfDiscovery {
  constructor() {
    this.foundServices = new Map();
    this.listeners = [];
    this.discoveryActive = false;
    this.selectedService = null;
    this.discoveryTimeout = null;
    this.lastDiscoveryTime = 0;
    this.discoveryInterval = 60000; // Don't re-discover more often than once per minute
  }

  /**
   * Start discovering WebSocket services on the network
   * @param {number} timeout - Time in ms to search for services (default: 5000ms)
   * @returns {Promise} - Resolves when discovery completes
   */
  startDiscovery(timeout = 5000) {
    // Return cached services if we've discovered recently and have some services
    const now = Date.now();
    if (
      this.foundServices.size > 0 &&
      now - this.lastDiscoveryTime < this.discoveryInterval
    ) {
      return Promise.resolve(Array.from(this.foundServices.values()));
    }

    // If discovery is already active, wait for it to complete
    if (this.discoveryActive) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!this.discoveryActive) {
            clearInterval(checkInterval);
            resolve(Array.from(this.foundServices.values()));
          }
        }, 100);
      });
    }

    this.discoveryActive = true;

    // Create and configure the discovery endpoint
    return new Promise((resolve) => {
      // Clear any previous timeouts
      if (this.discoveryTimeout) {
        clearTimeout(this.discoveryTimeout);
      }

      // Using the fetch API to get available services from our backend proxy
      fetch("/api/discover_services")
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              `HTTP error ${response.status}: ${response.statusText}`
            );
          }

          // Check content type to avoid parsing HTML as JSON
          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            throw new Error(`Invalid content type: ${contentType}`);
          }

          return response.json();
        })
        .then((services) => {
          // Clear old services
          this.foundServices.clear();

          if (services && Array.isArray(services)) {
            services.forEach((service) => {
              if (this.isValidService(service)) {
                this.foundServices.set(service.id, service);
                this.notifyListeners("serviceFound", service);
              }
            });
          }

          this.lastDiscoveryTime = Date.now();
        })
        .catch((error) => {
          console.error("Error discovering services:", error);
        })
        .finally(() => {
          this.discoveryActive = false;
          resolve(Array.from(this.foundServices.values()));
        });

      // Set a maximum time for discovery process
      this.discoveryTimeout = setTimeout(() => {
        this.discoveryActive = false;
        resolve(Array.from(this.foundServices.values()));
      }, timeout);
    });
  }

  /**
   * Validate service object structure
   */
  isValidService(service) {
    return (
      service &&
      typeof service === "object" &&
      service.id &&
      service.ip &&
      service.port
    );
  }

  /**
   * Stop the discovery process
   */
  stopDiscovery() {
    this.discoveryActive = false;
    if (this.discoveryTimeout) {
      clearTimeout(this.discoveryTimeout);
    }
  }

  /**
   * Get the list of currently discovered services
   * @returns {Array} - List of service objects
   */
  getServices() {
    return Array.from(this.foundServices.values());
  }

  /**
   * Select a specific service to connect to
   * @param {string} serviceId - ID of the service to select
   * @returns {object|null} - The selected service or null if not found
   */
  selectService(serviceId) {
    if (this.foundServices.has(serviceId)) {
      this.selectedService = this.foundServices.get(serviceId);
      this.notifyListeners("serviceSelected", this.selectedService);
      return this.selectedService;
    }
    return null;
  }

  /**
   * Get the currently selected service
   * @returns {object|null} - Selected service or null if none selected
   */
  getSelectedService() {
    return this.selectedService;
  }

  /**
   * Add event listener for service events
   * @param {Function} callback - Function to call when events occur
   */
  addEventListener(callback) {
    if (typeof callback === "function" && !this.listeners.includes(callback)) {
      this.listeners.push(callback);
    }
  }

  /**
   * Remove event listener
   * @param {Function} callback - Function to remove
   */
  removeEventListener(callback) {
    const index = this.listeners.indexOf(callback);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notify all listeners of an event
   * @param {string} event - Event name
   * @param {object} data - Event data
   */
  notifyListeners(event, data) {
    this.listeners.forEach((listener) => {
      try {
        listener(event, data);
      } catch (error) {
        console.error("Error in Zeroconf listener:", error);
      }
    });
  }

  /**
   * Mock discovery for testing or development environments
   * @param {Array} mockServices - Array of mock service objects to use
   */
  mockDiscovery(mockServices = []) {
    this.foundServices.clear();

    mockServices.forEach((service) => {
      if (this.isValidService(service)) {
        this.foundServices.set(service.id, service);
        this.notifyListeners("serviceFound", service);
      }
    });

    return Promise.resolve(Array.from(this.foundServices.values()));
  }

  /**
   * Force a refresh of the discovery process
   */
  forceRefresh() {
    this.lastDiscoveryTime = 0;
    return this.startDiscovery();
  }
}

// Create singleton instance
const zeroconfDiscovery = new ZeroconfDiscovery();
export default zeroconfDiscovery;
