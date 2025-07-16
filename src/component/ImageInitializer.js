// components/ImageInitializer.js
import { useEffect, useState } from "react";
import { initializeImageStorage } from "../utils/bulkImageStorage";

// Component to initialize image storage when app starts
const ImageInitializer = ({ children }) => {
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingTime, setLoadingTime] = useState(0);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const startTime = Date.now();

        // Start the timer
        const timerInterval = setInterval(() => {
          const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
          setLoadingTime(elapsedSeconds);
        }, 1000);

        await initializeImageStorage();
        setInitialized(true);

        // Clear the timer when loading is complete
        clearInterval(timerInterval);
      } catch (error) {
        // console.error("Failed to initialize image storage:", error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const handleRefresh = async () => {
    try {
      // Clear cookies (for browsers that support it)
      // if (navigator.cookieStore) {
      //   const cookies = await navigator.cookieStore.getAll();
      //   cookies.forEach((cookie) => {
      //     navigator.cookieStore.delete(cookie.name);
      //   });
      // } else {
      //   // Fallback for browsers without cookieStore API
      //   document.cookie.split(";").forEach((cookie) => {
      //     const eqPos = cookie.indexOf("=");
      //     const name =
      //       eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
      //     document.cookie =
      //       name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      //   });
      // }

      // Clear IndexedDB
      if (window.indexedDB) {
        const clearIndexedDB = async () => {
          try {
            // Get all database names
            const databases = await indexedDB.databases();

            // Create an array of promises to delete each database
            const deletePromises = databases.map((db) => {
              return new Promise((deleteResolve) => {
                const request = indexedDB.deleteDatabase(db.name);
                request.onsuccess = () => deleteResolve();
                request.onerror = () => {
                  deleteResolve(); // Resolve anyway to continue with other operations
                };
              });
            });

            // Wait for all databases to be deleted
            await Promise.all(deletePromises);
          } catch (error) {
            // console.error("Error clearing IndexedDB:", error);
          }
        };

        await clearIndexedDB();
      }

      // For clearing site data, we'll need to use cache API
      if (window.caches) {
        const cacheKeys = await window.caches.keys();
        await Promise.all(cacheKeys.map((key) => window.caches.delete(key)));
      }

      // Clear localStorage and sessionStorage
      localStorage.clear();
      sessionStorage.clear();

      // Then reload the page
      window.location.reload(true); // true forces reload from server, not cache
    } catch (error) {
      // console.error("Error clearing data:", error);
      // Fallback to simple reload if clearing fails
      window.location.reload(true);
    }
  };

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
        {loadingTime >= 30 && (
          <button className="btn btn-primary mt-3" onClick={handleRefresh}>
            Refresh Page
          </button>
        )}
      </div>
    );
  }

  return children;
};

export default ImageInitializer;
