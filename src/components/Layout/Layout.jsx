import React, { useEffect, useRef, useState, useCallback } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import SmallVideoCall from "../SmallVideoCall";
import Footer from "./Footer";
import LanguageFooter from "../LanguageFooter";
import Input from "../Input";
import { Modal } from "react-bootstrap";
import MenuHeader from "./MenuHeader";
import Header from "./Header";
import { useDispatch, useSelector } from "react-redux";
import { getSessionItem, setSessionItem } from "../../hooks/session";
import { getImageSrc } from "../../utils/bulkImageStorage";
import { getCurrencyListData } from "../../redux/reducers/Booking/PaymentMethod";
import { getBusinessSourceListData } from "../../redux/reducers/Booking/bookingAvailability";
import { getHotelTermsConditionListData } from "../../redux/reducers/Booking/hotelTermsCondition";
import { getAddOnListData } from "../../redux/reducers/Booking/AddOn";
import { agentUserMQTTAction } from "../../redux/reducers/MQTT/agentUserMQTT";
import { playSafeAudio } from "../../utils/commonFun";

const Layout = ({ children }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [fullscreenRequest, setFullscreenRequest] = useState(null);
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false);

  const userData = getSessionItem("hotelKiosk");
  const userSession = userData
    ? JSON.parse(decodeURIComponent(escape(atob(userData))))
    : null;
  const HeroImage = userSession?.hotel?.images?.[0];

  const kioskData = getSessionItem("KioskConfig");
  const kioskSession = kioskData
    ? JSON.parse(decodeURIComponent(escape(atob(kioskData))))
    : null;

  const newKioskConfig = kioskSession?.[0];

  const { lastMessage } = useSelector(({ mqtt }) => mqtt);

  let message = null;
  try {
    message = lastMessage?.message ? JSON.parse(lastMessage.message) : null;
  } catch (e) {
    // console.error("Failed to parse MQTT message:", e);
  }

  const { activeKioskDeviceList } = useSelector(
    ({ kioskDevice }) => kioskDevice
  );
  const deviceIds =
    activeKioskDeviceList?.map((device) => device.id).filter(Boolean) || [];

  useEffect(() => {
    setTimeout(() => {
      if (userSession?.user?.user_type === "hotel_admin") {
        dispatch(getBusinessSourceListData());
        const param = {
          params: {
            is_active: true,
          },
        };
        dispatch(getHotelTermsConditionListData(param));
        dispatch(getAddOnListData(param));
        dispatch(getCurrencyListData({ params: { page_size: 100 } }));
      }
    }, 500);
  }, [dispatch, userSession?.user?.user_type]);

  const connectVideoCall =
    message?.topic ===
    newKioskConfig?.mqtt_config?.subscribe_topics?.console_call;

  const [videoCall, setVideoCall] = useState(false);

  useEffect(() => {
    if (message?.cmd === "connect" && connectVideoCall) {
      setVideoCall(true);
      playSafeAudio("connect_agent");
    } else if (message?.cmd === "disconnect" && connectVideoCall) {
      setVideoCall(false);
    }
  }, [connectVideoCall, message, message?.cmd]);

  // Chrome-friendly fullscreen functions
  const enterFullScreen = useCallback(() => {
    const elem = containerRef.current;
    if (!elem) {
      return Promise.reject(new Error("Container ref not available"));
    }

    // Check if already in fullscreen
    if (document.fullscreenElement) {
      setIsFullscreen(true);
      return Promise.resolve();
    }

    // Use the Fullscreen API with proper error handling
    if (elem.requestFullscreen) {
      return elem
        .requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
        })
        .catch((err) => {
          // In Chrome, if user gesture is required, we'll show a prompt
          if (err.name === "NotAllowedError" || err.name === "TypeError") {
            setFullscreenRequest("enter");
            setShowFullscreenPrompt(true);
          }
          throw err;
        });
    } else {
      return Promise.reject(new Error("Fullscreen API not supported"));
    }
  }, []);

  const exitFullScreen = useCallback(() => {
    if (!document.fullscreenElement) {
      setIsFullscreen(false);
      return Promise.resolve();
    }

    if (document.exitFullscreen) {
      return document
        .exitFullscreen()
        .then(() => {
          setIsFullscreen(false);
        })
        .catch((err) => {
          throw err;
        });
    } else {
      return Promise.reject(new Error("Exit fullscreen not supported"));
    }
  }, []);

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      const inFullscreen = !!document.fullscreenElement;
      setIsFullscreen(inFullscreen);

      // Hide prompt if fullscreen state matches request
      if (
        (inFullscreen && fullscreenRequest === "enter") ||
        (!inFullscreen && fullscreenRequest === "exit")
      ) {
        setShowFullscreenPrompt(false);
        setFullscreenRequest(null);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("fullscreenerror", (e) => {
      setShowFullscreenPrompt(true);
    });

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("fullscreenerror", () => {});
    };
  }, [fullscreenRequest]);

  // Handle MQTT messages
  useEffect(() => {
    if (!message || !message.cmd) {
      return;
    }

    // Handle screen_mode command
    if (message.cmd === "screen_mode") {
      const statusMode = message.payload?.status_mode;

      if (statusMode === "full_screen") {
        enterFullScreen()
          .then(() => {
            dispatch(
              agentUserMQTTAction({
                cmd: message?.cmd,
                device_uuid_list: deviceIds,
                response: {
                  status: true,
                  code: message?.seq,
                  message: "MQTT fullscreen successful",
                  data: { status_mode: "full_screen" },
                },
              })
            );
          })
          .catch((err) => {
            // console.error("MQTT fullscreen request failed:", err);
          });
      } else if (statusMode === "normal_screen") {
        exitFullScreen()
          .then(() => {
            dispatch(
              agentUserMQTTAction({
                cmd: message?.cmd,
                device_uuid_list: deviceIds,
                response: {
                  status: true,
                  code: message?.seq,
                  message: "MQTT exit fullscreen successful",
                  data: { status_mode: "normal_screen" },
                },
              })
            );
          })
          .catch((err) => {
            // console.error("MQTT exit fullscreen failed:", err);
          });
      }
    }
  }, [message, enterFullScreen, exitFullScreen]);

  // Handle user interaction for fullscreen
  const handleFullscreenClick = useCallback(() => {
    if (fullscreenRequest === "enter") {
      enterFullScreen()
        .then(() => {
          setShowFullscreenPrompt(false);
          setFullscreenRequest(null);
        })
        .catch(console.error);
    } else if (fullscreenRequest === "exit") {
      exitFullScreen()
        .then(() => {
          setShowFullscreenPrompt(false);
          setFullscreenRequest(null);
        })
        .catch(console.error);
    }
  }, [fullscreenRequest, enterFullScreen, exitFullScreen]);

  // Toggle fullscreen for testing
  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      exitFullScreen();
    } else {
      enterFullScreen();
    }
  }, [isFullscreen, enterFullScreen, exitFullScreen]);

  // Auto-click workaround for Chrome (use with caution)
  useEffect(() => {
    if (showFullscreenPrompt && fullscreenRequest) {
      // Create a hidden button and trigger a click
      const hiddenButton = document.createElement("button");
      hiddenButton.style.position = "fixed";
      hiddenButton.style.top = "50%";
      hiddenButton.style.left = "50%";
      hiddenButton.style.transform = "translate(-50%, -50%)";
      hiddenButton.style.opacity = "0";
      hiddenButton.style.pointerEvents = "none";
      document.body.appendChild(hiddenButton);

      hiddenButton.addEventListener("click", handleFullscreenClick);

      // Try to trigger automatic click (may not work in all Chrome versions)
      setTimeout(() => {
        hiddenButton.click();
        setTimeout(() => {
          document.body.removeChild(hiddenButton);
        }, 100);
      }, 100);
    }
  }, [showFullscreenPrompt, fullscreenRequest, handleFullscreenClick]);

  return (
    <div ref={containerRef} style={{ position: "relative", height: "100%" }}>
      {/* Fullscreen prompt for Chrome */}
      {showFullscreenPrompt && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.8)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
          onClick={handleFullscreenClick}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "10px",
              textAlign: "center",
              maxWidth: "400px",
            }}
          >
            <h2 style={{ marginBottom: "20px", color: "#333" }}>
              {fullscreenRequest === "enter"
                ? "Enter Fullscreen"
                : "Exit Fullscreen"}
            </h2>
            <p style={{ marginBottom: "20px", color: "#666" }}>
              Chrome requires user interaction for fullscreen mode. Please click
              anywhere to continue.
            </p>
            <button
              onClick={handleFullscreenClick}
              style={{
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                padding: "10px 30px",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              {fullscreenRequest === "enter"
                ? "Go Fullscreen"
                : "Exit Fullscreen"}
            </button>
          </div>
        </div>
      )}

      <div className="bg-img">
        <div className="height-100 d-flex flex-column align-items-start justify-content-between">
          <div className="w-100">
            <div className="hotel-img">
              <img
                src={HeroImage ? HeroImage : getImageSrc("Hotel")}
                alt="hotel"
                className="w-100"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = getImageSrc("Hotel");
                }}
              />
            </div>
            {location.pathname === "/home" ? <MenuHeader /> : <Header />}
            {videoCall && <SmallVideoCall liveNow={message?.cmd} />}
          </div>
          <div className="wrapper w-100 d-flex flex-column">
            {children || <Outlet />}
            {location.pathname === "/home" && <LanguageFooter />}
            <Footer />
          </div>
        </div>
      </div>

      {/* Modal is for logout */}
      <button
        type="button"
        className="d-none"
        data-bs-toggle="modal"
        data-bs-target="#logoutModal"
        onClick={() => setShowLogoutModal(true)}
      >
        Logout
      </button>

      <Modal
        size="lg"
        className="modal fade"
        id="logoutModal"
        tabIndex="-1"
        aria-labelledby="logoutModalLabel"
        aria-hidden="true"
        show={showLogoutModal}
        onHide={() => setShowLogoutModal(false)}
      >
        <div>
          <Modal.Header closeButton>
            <Modal.Title id="example-modal-sizes-title-sm">
              Enter Verification Code
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <form>
              <div className="row">
                <div className="col-md-12">
                  <div className="form-group text-center">
                    <Input className="common-input modal-input gap-4" />
                    <span className="text-danger">
                      Invalid Verification Code
                    </span>
                  </div>
                </div>
              </div>
              <button
                className="d-block mx-auto btn btn-lg btn-primary mt-4"
                type="submit"
              >
                <span className="d-flex align-items-center">
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  />
                  Logging Out...
                </span>
              </button>
            </form>
          </Modal.Body>
        </div>
      </Modal>
    </div>
  );
};

export default Layout;
