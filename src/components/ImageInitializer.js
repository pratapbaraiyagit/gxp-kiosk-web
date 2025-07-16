// components/ImageInitializer.js
import { useEffect, useState } from "react";
import { initializeImageStorage } from "../utils/bulkImageStorage";

// Component to initialize image storage when app starts
const ImageInitializer = ({ children }) => {
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        // This will store images in IndexedDB and preload them into the cache
        await initializeImageStorage();
        setInitialized(true);
      } catch (error) {
        setError(
          "Failed to load application resources. Please refresh the page."
        );
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light">
        <div
          className="spinner-border text-info mb-3"
          style={{ width: "4rem", height: "4rem" }}
          role="status"
        >
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-muted fw-semibold">
          Loading application resources...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="image-error-container">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Refresh</button>
      </div>
    );
  }

  return children;
};

export default ImageInitializer;
