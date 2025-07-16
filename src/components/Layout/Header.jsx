import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { getImageSrc } from "../../utils/bulkImageStorage";
import Swal from "sweetalert2";
import useIDScanner from "../../hooks/useIDScanner";
import { useTranslation } from "react-i18next";
import {
  getSessionItem,
  removeSessionItem,
  setSessionItem,
} from "../../hooks/session";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import {
  setIsActiveBookingList,
  setIsBookingNotFound,
} from "../../redux/reducers/Booking/booking";

const Header = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const { autoCaptureOff } = useIDScanner();

  const userData = getSessionItem("hotelKiosk");
  const userSession = userData
    ? JSON.parse(decodeURIComponent(escape(atob(userData))))
    : null;

  // Paths that should navigate directly without confirmation
  const excludedPaths = [
    "/login",
    "/setting",
    "/home",
    "/splash",
    "/check-in/terms-condition",
    "/pickup",
    "/pickup/selfie",
    "/near-by-place",
    "/near-by-place/details",
    "/hotel-map",
    "/hotel-info",
    "/hotel-info/details",
    "/feedback",
    "/flight-schedule",
  ];

  const handleHomeClick = () => {
    // Check if current path is in excluded paths
    if (excludedPaths.includes(location.pathname)) {
      navigate("/home");
    } else {
      Swal.fire({
        title: t("Confirmation"),
        html: `
          <div style="display: flex; flex-direction: column; align-items: center;">
            <p>${t("cancel_this_process")}</p>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: t("Yes"),
        cancelButtonText: t("No"),
        cancelButtonColor: "#d33",
        allowOutsideClick: false,
        allowEscapeKey: false,
        customClass: {
          confirmButton: "custom-swal-confirm",
          cancelButton: "custom-swal-cancel",
        },
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/home");
          autoCaptureOff();
        }
      });
    }
  };

  const handleLogoutClick = () => {
    Swal.fire({
      title: t("Confirmation"),
      html: `
        <div style="display: flex; flex-direction: column; align-items: center;">
          <p>${t("Are you sure you want to exit?")}</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: t("Yes"),
      cancelButtonText: t("No"),
      cancelButtonColor: "#d33",
      allowOutsideClick: false,
      allowEscapeKey: false,
      customClass: {
        confirmButton: "custom-swal-confirm",
        cancelButton: "custom-swal-cancel",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        setSessionItem("laneClose", "true");
        navigate("/selfie-splash");
        removedSessionData();
        autoCaptureOff();
      }
    });
  };

  const removedSessionData = () => {
    dispatch(setIsActiveBookingList([]));
    dispatch(setIsBookingNotFound(false));
    removeSessionItem("totalTax");
    removeSessionItem("selectedServices");
    removeSessionItem("selectedAddons");
    removeSessionItem("room_type");
    removeSessionItem("roomType");
    removeSessionItem("room");
    removeSessionItem("paymentMethod");
    removeSessionItem("finalTotal");
    removeSessionItem("paymentPayload");
    removeSessionItem("addonPayload");
    removeSessionItem("vehicalNum");
    removeSessionItem("bookingId");
    removeSessionItem("AgentGuestName");
    removeSessionItem("seqCode");
    // removeSessionItem("checkOutDate");
    // removeSessionItem("checkInDate");
    removeSessionItem("amountTotal");
    removeSessionItem("addonTotal");
    removeSessionItem("PaymentTime");
    removeSessionItem("userData");
    removeSessionItem("visit");
    removeSessionItem("parking");
    removeSessionItem("questionAnswers");
    removeSessionItem("addonState");
    removeSessionItem("contactData");
    removeSessionItem("addonState");
    removeSessionItem("document_type");
    removeSessionItem("terms_and_conditions");
    removeSessionItem("frontside_image");
    removeSessionItem("backside_image");
    removeSessionItem("vehicleNum");
    removeSessionItem("vehicleDetails");
    removeSessionItem("vehicalNumSubmitted");
    removeSessionItem("earlyCheckInAmount");
    removeSessionItem("frontUploadImage");
  };

  return (
    <header>
      <div className="header-section d-flex align-items-center justify-content-between">
        {userSession?.hotel?.logo ? (
          <div className="d-inline-block">
            <img
              src={userSession?.hotel?.logo}
              alt="big-logo"
              className="d-block mx-auto"
              width={200}
            />
            {/* <h2 className="text-end mb-0">{userSession?.hotel?.hotel_name}</h2> */}
          </div>
        ) : (
          <div className="d-inline-block">
            <img
              src={getImageSrc("Smallogo")}
              alt="big-logo"
              className="d-block mx-auto img-fluid"
              width={418}
              height={78}
            />
            {/* <h2 className="text-end mb-0">Hotel</h2> */}
          </div>
        )}

        <div className="d-flex align-items-center gap-5">
          <img
            src={getImageSrc("HomeIcon")}
            alt="home"
            className="cursor"
            onClick={handleHomeClick}
          />

          <FontAwesomeIcon
            icon={faArrowRightFromBracket}
            className="cursor text-light logout-icon"
            size="3x"
            onClick={handleLogoutClick}
          />
          {/* <div>
            {!loading ? (
              <img
                src={getImageSrc("RefreshIcon")}
                alt="refresh"
                className="cursor"
              />
            ) : (
              <div
                className="spinner-border refresh-width text-light"
                role="status"
              >
                <span className="visually-hidden">Loading...</span>
              </div>
            )}
          </div> */}
        </div>
      </div>
    </header>
  );
};

export default Header;
