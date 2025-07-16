import React, { useState, useRef, useEffect } from "react";
import Menu from "./Menu";
import { Modal } from "react-bootstrap";
import { notification } from "../../helpers/middleware";
import {
  getSessionItem,
  removeSessionItem,
  setSessionItem,
} from "../../hooks/session";
import { useNavigate } from "react-router-dom";
import { getImageSrc } from "../../utils/bulkImageStorage";
import { useDispatch, useSelector } from "react-redux";
import { agentUserMQTTAction } from "../../redux/reducers/MQTT/agentUserMQTT";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";
import {
  setIsActiveBookingList,
  setIsBookingNotFound,
} from "../../redux/reducers/Booking/booking";
import useIDScanner from "../../hooks/useIDScanner";

const MenuHeader = () => {
  const dispatch = useDispatch();
  const userData = getSessionItem("hotelKiosk");
  const { t } = useTranslation();
  const userSession = userData
    ? JSON.parse(decodeURIComponent(escape(atob(userData))))
    : null;
  const { autoCaptureOff } = useIDScanner();

  const { activeKioskDeviceList } = useSelector(
    ({ kioskDevice }) => kioskDevice
  );

  const deviceIds =
    activeKioskDeviceList?.map((device) => device.id).filter(Boolean) || [];

  const [showModal, setShowModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (showModal && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [showModal]);

  const handleLogoDoubleClick = () => {
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setVerificationCode(["", "", "", "", "", ""]);
  };

  const handleInputChange = (index, value) => {
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleLogout = () => {
    const code = verificationCode.join("");
    if (code === "936936") {
      dispatch(
        agentUserMQTTAction({
          cmd: "kiosk_online",
          device_uuid_list: deviceIds,
          response: {
            status: true,
            message: "Kiosk offline Status applied.",
            data: { status_mode: "offline" },
          },
        })
      );
      removeSessionItem("UserSessionKiosk");
      removeSessionItem("TokenKiosk");
      removeSessionItem("RefreshKiosk");
      removeSessionItem("splash");
      removeSessionItem("camera1");
      removeSessionItem("camera_1");
      removeSessionItem("hotelKiosk");
      removeSessionItem("mic");
      removeSessionItem("selected_audio_input");
      removeSessionItem("selected_audio_output");
      removeSessionItem("speaker");
      removeSessionItem("document_type");

      notification("Logout successfully!!", "success");

      navigate("/login");
      handleClose();
    } else {
      notification("Incorrect verification code", "error");
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
    <>
      {userSession?.hotel?.logo ? (
        <div className="hotel-logo">
          <img
            src={userSession?.hotel?.logo}
            alt="big-logo"
            onDoubleClick={handleLogoDoubleClick}
            width={200}
          />
          {/* <h2 className="text-end mb-0">{userSession?.hotel?.hotel_name}</h2> */}
          <FontAwesomeIcon
            icon={faArrowRightFromBracket}
            className="cursor text-light logout-icon"
            size="3x"
            onClick={handleLogoutClick}
          />
        </div>
      ) : (
        <div className="hotel-logo">
          <img
            src={getImageSrc("Biglogo")}
            alt="big-logo"
            onDoubleClick={handleLogoDoubleClick}
            width={200}
          />
          {/* <h2 className="text-end mb-0">Hotel</h2> */}
        </div>
      )}

      <Menu />
      <Modal
        show={showModal}
        onHide={handleClose}
        centered
        data-bs-theme="dark"
      >
        <Modal.Header closeButton data-bs-theme="dark">
          <Modal.Title className="text-white">
            Enter Verification Code
          </Modal.Title>
        </Modal.Header>
        <Modal.Body data-bs-theme="dark">
          <div
            className="input-group"
            compact
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "20px",
            }}
          >
            {verificationCode?.map((digit, index) => (
              <input
                className="form-control"
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                maxLength={1}
                style={{
                  width: "40px",
                  height: "40px",
                  textAlign: "center",
                  fontSize: "24px",
                  padding: "0",
                  margin: "0 5px",
                }}
                type="password"
              />
            ))}
          </div>
          <div className="text-center">
            <button className="btn btn-primary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default MenuHeader;
