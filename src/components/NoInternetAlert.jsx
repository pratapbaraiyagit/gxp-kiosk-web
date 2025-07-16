import { useEffect, useRef, useCallback } from "react";
import Swal from "sweetalert2";
import { notification } from "../helpers/middleware";
import { useTranslation } from "react-i18next";
import { playBeep } from "../utils/playBeep";

const NoInternetAlert = () => {
  const { t } = useTranslation();
  const isCheckingRef = useRef(false);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Multiple endpoints to check for better reliability
  const connectivityEndpoints = [
    "https://www.google.com/generate_204",
    "https://httpbin.org/status/200",
    "https://jsonplaceholder.typicode.com/posts/1",
    "https://api.github.com",
    "https://www.cloudflare.com/cdn-cgi/trace",
  ];

  const checkRealInternetConnectivity = useCallback(async () => {
    if (isCheckingRef.current)
      return { hasConnection: true, hasInternet: true };

    isCheckingRef.current = true;

    try {
      // First check navigator.onLine for network connection
      const hasConnection = navigator.onLine;

      if (!hasConnection) {
        isCheckingRef.current = false;
        return { hasConnection: false, hasInternet: false };
      }

      // Test multiple endpoints to verify internet access
      const connectivityPromises = connectivityEndpoints?.map(
        async (url, index) => {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            let response;

            if (index === 0) {
              // Google's connectivity check endpoint
              response = await fetch(url, {
                method: "HEAD",
                mode: "no-cors",
                cache: "no-cache",
                signal: controller.signal,
              });
            } else if (index === 4) {
              // Cloudflare trace - returns text
              response = await fetch(url, {
                method: "GET",
                cache: "no-cache",
                signal: controller.signal,
              });
            } else {
              // Standard JSON endpoints
              response = await fetch(url, {
                method: "HEAD",
                cache: "no-cache",
                signal: controller.signal,
              });
            }

            clearTimeout(timeoutId);
            return response.ok || response.status === 0;
          } catch (error) {
            if (error.name === "AbortError") {
              // console.log(`Connectivity check timeout for ${url}`);
            }
            return false;
          }
        }
      );

      // Wait for at least one successful response
      const results = await Promise.allSettled(connectivityPromises);
      const hasInternet = results.some(
        (result) => result.status === "fulfilled" && result.value === true
      );

      isCheckingRef.current = false;
      return { hasConnection: true, hasInternet };
    } catch (error) {
      isCheckingRef.current = false;
      return { hasConnection: true, hasInternet: false };
    }
  }, []);

  // Show alert for no network connection (completely offline)
  const showNoConnectionAlert = useCallback(() => {
    if (Swal.isVisible()) return;

    playBeep();
    Swal.fire({
      html: `
        <div style="display: flex; flex-direction: column; align-items: center;">
          <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24">
	            <path fill="#11c9ea" d="m19.75 22.6l-9.4-9.45q-1.175.275-2.187.825T6.35 15.35l-2.1-2.15q.8-.8 1.725-1.4t1.975-1.05L5.7 8.5q-1.025.525-1.913 1.163T2.1 11.1L0 8.95q.8-.8 1.663-1.437T3.5 6.3L1.4 4.2l1.4-1.4l18.4 18.4zm-1.85-7.55l-.725-.725l-.725-.725l-3.6-3.6q2.025.2 3.787 1.025T19.75 13.2zm4-3.95q-1.925-1.925-4.462-3.012T12 7q-.525 0-1.012.038T10 7.15L7.45 4.6q1.1-.3 2.238-.45T12 4q3.55 0 6.625 1.325T24 8.95zM12 21l-3.525-3.55q.7-.7 1.613-1.075T12 16t1.913.375t1.612 1.075z" />
          </svg>
          <p style="margin-top: 16px; font-size: 16px; color: #666; font-weight: 600;"> 
            ${t("No_Network_Connection")}     
          </p>
          <p style="margin-top: 8px; font-size: 14px; color: #999;">
            ${t("Device_is_not_connected_to_any_network")}
          </p>
        </div>
      `,
      title: t("Offline"),
      confirmButtonText: t("Retry"),
      showCancelButton: true,
      cancelButtonText: t("Continue_Offline"),
      allowOutsideClick: false,
      allowEscapeKey: false,
      customClass: {
        popup: "no-connection-alert-popup",
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        await handleRetryConnection();
      }
    });
  }, [t]);

  // Show alert for connected but no internet data
  const showNoInternetAlert = useCallback(() => {
    if (Swal.isVisible()) return;

    playBeep();
    Swal.fire({
      html: `
        <div style="display: flex; flex-direction: column; align-items: center;">
          <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24">
            <path fill="#ffa726" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM13 17h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
          <p style="margin-top: 16px; font-size: 16px; color: #666; font-weight: 600;"> 
            ${t("Connected_But_No_Internet")}     
          </p>
          <p style="margin-top: 8px; font-size: 14px; color: #999;">
            ${t("You_are_connected_to_WiFi_but_have_no_internet_access")}
          </p>
          <p style="margin-top: 4px; font-size: 12px; color: #bbb;">
            ${t("Check_your_router_or_contact_your_ISP")}
          </p>
        </div>
      `,
      title: t("No_Internet_Access"),
      confirmButtonText: t("Retry"),
      showCancelButton: true,
      cancelButtonText: t("Continue_Offline"),
      allowOutsideClick: false,
      allowEscapeKey: false,
      customClass: {
        popup: "no-internet-alert-popup",
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        await handleRetryConnection();
      }
    });
  }, [t]);

  const handleRetryConnection = useCallback(async () => {
    retryCountRef.current++;

    // Show loading state during retry
    Swal.fire({
      title: t("Checking_Connection"),
      html: t("Please_wait_while_we_check_your_connection"),
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const { hasConnection, hasInternet } =
      await checkRealInternetConnectivity();

    if (hasConnection && hasInternet) {
      Swal.close();
      notification(t("back_online"), "success");
      retryCountRef.current = 0;
    } else {
      if (retryCountRef.current >= maxRetries) {
        const alertTitle = !hasConnection
          ? t("Still_No_Connection")
          : t("Still_No_Internet");
        const alertText = !hasConnection
          ? t("Device_still_not_connected_to_network")
          : t("Connected_but_still_no_internet_access");

        Swal.fire({
          icon: "warning",
          title: alertTitle,
          text: alertText,
          confirmButtonText: t("Continue_Offline"),
          allowOutsideClick: false,
          allowEscapeKey: false,
        });
        retryCountRef.current = 0;
      } else {
        // Show appropriate alert based on connection status
        if (!hasConnection) {
          showNoConnectionAlert();
        } else {
          showNoInternetAlert();
        }
      }
    }
  }, [
    t,
    checkRealInternetConnectivity,
    showNoConnectionAlert,
    showNoInternetAlert,
  ]);

  const handleConnectivityChange = useCallback(async () => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce connectivity checks
    timeoutRef.current = setTimeout(async () => {
      const { hasConnection, hasInternet } =
        await checkRealInternetConnectivity();

      if (!hasConnection) {
        showNoConnectionAlert();
      } else if (!hasInternet) {
        showNoInternetAlert();
      } else {
        // Close any existing offline alerts
        if (Swal.isVisible()) {
          Swal.close();
          notification(t("back_online"), "success");
        }
      }
    }, 1000); // 1 second debounce
  }, [
    checkRealInternetConnectivity,
    showNoConnectionAlert,
    showNoInternetAlert,
    t,
  ]);

  const startPeriodicCheck = useCallback(() => {
    // Check connectivity every 30 seconds when online
    intervalRef.current = setInterval(async () => {
      if (!Swal.isVisible()) {
        const { hasConnection, hasInternet } =
          await checkRealInternetConnectivity();

        if (!hasConnection) {
          showNoConnectionAlert();
        } else if (!hasInternet) {
          showNoInternetAlert();
        }
      }
    }, 30000);
  }, [
    checkRealInternetConnectivity,
    showNoConnectionAlert,
    showNoInternetAlert,
  ]);

  const stopPeriodicCheck = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Initial connectivity check
    const initialCheck = async () => {
      const { hasConnection, hasInternet } =
        await checkRealInternetConnectivity();

      if (!hasConnection) {
        showNoConnectionAlert();
      } else if (!hasInternet) {
        showNoInternetAlert();
      } else {
        startPeriodicCheck();
      }
    };

    initialCheck();

    // Listen to network events
    const handleOffline = () => {
      stopPeriodicCheck();
      handleConnectivityChange();
    };

    const handleOnline = () => {
      handleConnectivityChange();
      startPeriodicCheck();
    };

    // Listen to visibility change to check when user returns to app
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleConnectivityChange();
      }
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Start periodic checks
    startPeriodicCheck();

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      stopPeriodicCheck();

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      isCheckingRef.current = false;
    };
  }, []);

  return null;
};

export default NoInternetAlert;
