import { useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const useInactivityTimeout = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const timeoutRef = useRef(null);
  const countdownRef = useRef(null);
  const isPopupOpenRef = useRef(false);

  // Routes to exclude from inactivity timeout
  const excludedRoutes = [
    "/login",
    "/setting",
    "/home",
    "/splash",
    "/selfie-splash",
    "/lane-closed",
  ];

  const shouldApplyTimeout = useCallback(() => {
    return !excludedRoutes.includes(location.pathname);
  }, [location.pathname]);

  const showCountdownPopup = useCallback(() => {
    if (isPopupOpenRef.current) return;

    isPopupOpenRef.current = true;
    let countdownSeconds = 20;

    const updatePopupContent = () => {
      return `
        <div style="text-align: center;">
          <h2 style="color: #333; margin-bottom: 20px;"> ${t(
            "Session_Timeout_Warning"
          )}</h2>
          <p style="font-size: 16px; color: #666; margin-bottom: 20px;">
           ${t("Due_to_inactivity_you_will_be_redirected_to_the_home_page_in")}:
          </p>
          <div style="font-size: 48px; font-weight: bold; color: #e74c3c; margin: 20px 0;">
            ${countdownSeconds}
          </div>
          <p style="font-size: 14px; color: #999;">
             ${t("Click_Stay_on_Page_to_continue_your_session")}
          </p>
        </div>
      `;
    };

    Swal.fire({
      html: updatePopupContent(),
      icon: "warning",
      showCancelButton: false,
      confirmButtonText: t("Stay_on_Page"),
      confirmButtonColor: "#3085d6",
      allowOutsideClick: false,
      allowEscapeKey: false,
      timer: 20000,
      timerProgressBar: true,
      didOpen: () => {
        const popup = Swal.getPopup();

        countdownRef.current = setInterval(() => {
          countdownSeconds--;

          if (countdownSeconds > 0) {
            popup.querySelector(".swal2-html-container").innerHTML =
              updatePopupContent();
          } else {
            clearInterval(countdownRef.current);
          }
        }, 1000);
      },
      willClose: () => {
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
        }
        isPopupOpenRef.current = false;
      },
    }).then((result) => {
      isPopupOpenRef.current = false;

      if (result.isConfirmed) {
        // User clicked "Stay on Page" - restart the inactivity timer
        resetInactivityTimer();
      } else {
        // Timer expired or popup was dismissed - navigate to home
        navigate("/home");
      }
    });
  }, [navigate]);

  const resetInactivityTimer = useCallback(() => {
    if (!shouldApplyTimeout()) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for 1 minute (60000ms)
    timeoutRef.current = setTimeout(() => {
      showCountdownPopup();
    }, 60000);
  }, [shouldApplyTimeout, showCountdownPopup]);

  const handleUserActivity = useCallback(() => {
    if (!isPopupOpenRef.current && shouldApplyTimeout()) {
      resetInactivityTimer();
    }
  }, [resetInactivityTimer, shouldApplyTimeout]);

  useEffect(() => {
    if (!shouldApplyTimeout()) {
      // Clear timeout if on excluded route
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      return;
    }

    // Activity events to listen for
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleUserActivity, true);
    });

    // Start the initial timer
    resetInactivityTimer();

    // Cleanup function
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleUserActivity, true);
      });

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [
    location.pathname,
    handleUserActivity,
    resetInactivityTimer,
    shouldApplyTimeout,
  ]);

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
      if (isPopupOpenRef.current) {
        Swal.close();
      }
    };
  }, []);
};

export default useInactivityTimeout;
