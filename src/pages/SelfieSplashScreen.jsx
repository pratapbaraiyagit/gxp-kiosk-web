import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getImageSrc } from "../utils/bulkImageStorage";
import { getSessionItem, setSessionItem } from "../hooks/session";
import {
  addLoginSearchBooking,
  setGetLoginSearchBookingDetailsData,
  setIsLoginSearchBookingUpdate,
} from "../redux/reducers/Booking/loginSearchBooking";
import { useDispatch, useSelector } from "react-redux";
import {
  getGuestDetails,
  setIsGuestDetailsData,
  setIsGuestUpdate,
} from "../redux/reducers/Booking/guest";
import { playSafeAudio } from "../utils/commonFun";

const SelfieSplashScreen = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [showConsentScreen, setShowConsentScreen] = useState(false);
  const [consentChecked, setConsentChecked] = useState(true); // Default checked

  const [currentIndex, setCurrentIndex] = useState(0);
  const [hide, setHide] = useState(false);

  const sentences = [
    "Let's kick-start your experience.",
    "Start your check-in completely contactless.",
    "Check-in with just your smiley face ☺ It's fast, secure, and easy.",
    "No lines. No waiting. Just walk in and relax. Create a new booking in seconds.",
    "Forgot your key in room? Get your room key instantly with face ID.",
  ];

  const {
    loginSearchBookingLoading,
    isLoginSearchBookingUpdate,
    getLoginSearchBookingDetailsData,
  } = useSelector(({ loginSearchBooking }) => loginSearchBooking);

  const { guestLoading, isGuestUpdate, getGuestDetailsData } = useSelector(
    ({ guest }) => guest
  );

  const loading = loginSearchBookingLoading || guestLoading;

  const userData = getSessionItem("hotelKiosk");
  const userSession = userData
    ? JSON.parse(decodeURIComponent(escape(atob(userData))))
    : null;

  useEffect(() => {
    // Initialize AOS animations
    if (window.Aos) {
      window.Aos.init({
        duration: 1000,
        once: true,
        easing: "ease-in-out",
      });
    }
  }, []);

  const handleStartJourney = () => {
    if (!loading) {
      setShowConsentScreen(true);
      playSafeAudio("welcome_face_id");
    }
  };

  const handleBackToWelcome = () => {
    setShowConsentScreen(false);
  };

  const handleAgreeAndContinue = () => {
    // Store consent preference if needed
    setSessionItem("expressCheckInConsent", consentChecked);
    startCameraAndCapture();
  };

  const startCameraAndCapture = async () => {
    try {
      // Get camera stream
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user", // Front camera for selfie
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);

      // Create video element temporarily
      const video = videoRef.current;
      video.srcObject = mediaStream;

      // Wait for video to be ready
      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          video.play();
          resolve();
        };
      });

      // Wait a moment for camera to stabilize
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Capture the photo
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to base64 JPG
      const base64Image = canvas.toDataURL("image/jpeg", 0.8);
      const strippedBase64 = base64Image.replace(
        /^data:image\/jpeg;base64,/,
        ""
      );

      const payload = {
        search_mode: "face",
        face_images: strippedBase64,
      };
      const resultAction = dispatch(addLoginSearchBooking(payload));
      if (addLoginSearchBooking.fulfilled.match(resultAction)) {
        // Store in session
        setSessionItem("laneClose", "false");
        // Stop camera
        mediaStream.getTracks().forEach((track) => track.stop());
        setStream(null);

        // Navigate to home
        navigate("/home");
        setSessionItem("selfCheckIn", true);
      }
    } catch (error) {
      // Fallback - navigate without selfie
      setSessionItem("laneClose", "false");
      navigate("/home");
    }
  };

  useEffect(() => {
    if (isGuestUpdate) {
      setSessionItem("laneClose", "false");
      navigate("/home");
      setSessionItem("selfCheckIn", true);
      dispatch(setIsGuestDetailsData(null));
      dispatch(setIsGuestUpdate(false));
    }
  }, [dispatch, isGuestUpdate, navigate]);

  useEffect(() => {
    if (isLoginSearchBookingUpdate) {
      if (getLoginSearchBookingDetailsData?.guest_details?.guest_id) {
        dispatch(
          getGuestDetails(
            getLoginSearchBookingDetailsData?.guest_details?.guest_id
          )
        );
        dispatch(setGetLoginSearchBookingDetailsData(null));
      } else {
        setSessionItem("laneClose", "false");
        navigate("/home");
        setSessionItem("selfCheckIn", true);
        dispatch(setIsGuestDetailsData(null));
        dispatch(setIsGuestUpdate(false));
      }
      dispatch(setIsLoginSearchBookingUpdate(false));
    }
  }, [
    dispatch,
    getLoginSearchBookingDetailsData?.guest_details?.guest_id,
    isLoginSearchBookingUpdate,
    navigate,
  ]);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setHide(true); // trigger fade-out
    }, 5000); // show sentence for 2.5s

    const timer2 = setTimeout(() => {
      setCurrentIndex((prev) => (prev === sentences.length - 1 ? 0 : prev + 1));
      setHide(false); // reset for next sentence
    }, 6000); // switch after fade-out

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [currentIndex]);

  return (
    <>
      <div className="splash-bg d-flex flex-column justify-content-between">
        {/* Initial Welcome Screen */}
        {!showConsentScreen && (
          <>
            {/* <h1 className="mb-0" data-aos="fade-up" data-aos-delay="500">
              Let's <br />
              Kick Start <br />
              Your <br />
              Experience.
            </h1> */}

            <div
              key={currentIndex}
              data-aos="fade-up"
              className={`sentence ${hide ? "fade-down" : ""}`}
            >
              <h1>{sentences[currentIndex]}</h1>
            </div>

            <div className="d-flex align-items-center justify-content-between">
              <div
                className="flex-shrink-0"
                onClick={handleStartJourney}
                data-aos="fade-down"
                data-aos-delay="1000"
                style={{
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                <div className="rounded-pill position-relative">
                  <div className="animated-border-box-glow"></div>
                  <button className="btn splash-btn gap-3">
                    <span className="round-logo-bg">
                      <img
                        src={getImageSrc("RightLogoIcon") || "/placeholder.svg"}
                        alt="right-logo"
                      />
                    </span>
                    <span>
                      <span className="d-block text-start text-light fs-1 lh-1">
                        CLICK HERE TO{" "}
                      </span>
                      <span className="d-block text-start text-primary">
                        START JOURNEY
                      </span>
                    </span>
                  </button>
                </div>
              </div>
              <div
                className="logo-text"
                data-aos="fade-down"
                data-aos-delay="1500"
              >
                {userSession?.hotel?.logo ? (
                  <>
                    <img src={userSession?.hotel?.logo} alt="logo" />
                  </>
                ) : (
                  <>
                    <img src={getImageSrc("Smallogo")} alt="logo" />
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* Enhanced Consent Screen with Scrolling */}
        {showConsentScreen && (
          <div className="consent-screen-wrapper position-fixed top-0 start-0 w-100 h-100">
            {/* Back Button */}
            <div
              className="back-button-container position-absolute top-0 start-0 p-4"
              style={{ zIndex: 10 }}
            >
              <button
                className="btn btn-outline-light btn-lg back-btn"
                onClick={handleBackToWelcome}
                disabled={loading}
                data-aos="fade-in"
                data-aos-duration="500"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="me-2"
                >
                  <path d="M19 12H5"></path>
                  <path d="M12 19l-7-7 7-7"></path>
                </svg>
                Back
              </button>
            </div>

            {/* Scrollable Content Container */}
            <div className="consent-scroll-container h-100 overflow-auto">
              <div className="consent-content-wrapper d-flex align-items-center justify-content-center min-vh-100 p-4">
                <div className="consent-content text-center" data-aos="fade-up">
                  {/* Header Section */}
                  <div className="consent-header mb-5">
                    <div className="security-icon mb-4">
                      <svg
                        width="80"
                        height="80"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#007bff"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mx-auto"
                      >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        <path d="M9 12l2 2 4-4"></path>
                      </svg>
                    </div>
                    <h2 className="text-light mb-4 fw-bold">
                      Secure Identity Verification
                    </h2>
                    <p className="text-light fs-5 mb-0 opacity-90">
                      We prioritize your privacy and data security
                    </p>
                  </div>

                  {/* Information Cards */}
                  <div className="info-cards mb-5">
                    <div
                      className="info-card mb-4"
                      data-aos="fade-up"
                      data-aos-delay="100"
                    >
                      <div className="card-icon mb-3">
                        <svg
                          width="48"
                          height="48"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#28a745"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      </div>
                      <h4 className="text-light mb-2">Identity Verification</h4>
                      <p className="text-light opacity-80 mb-0">
                        Your selfie is used solely for secure identity
                        verification during check-in
                      </p>
                    </div>

                    <div
                      className="info-card mb-4"
                      data-aos="fade-up"
                      data-aos-delay="200"
                    >
                      <div className="card-icon mb-3">
                        <svg
                          width="48"
                          height="48"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#ffc107"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect
                            x="3"
                            y="11"
                            width="18"
                            height="11"
                            rx="2"
                            ry="2"
                          ></rect>
                          <circle cx="12" cy="16" r="1"></circle>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                      </div>
                      <h4 className="text-light mb-2">Data Protection</h4>
                      <p className="text-light opacity-80 mb-0">
                        Protected with industry-leading security standards and
                        encryption
                      </p>
                    </div>

                    <div
                      className="info-card mb-4"
                      data-aos="fade-up"
                      data-aos-delay="300"
                    >
                      <div className="card-icon mb-3">
                        <svg
                          width="48"
                          height="48"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#dc3545"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h18l-2 13H5L3 6z"></path>
                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </div>
                      <h4 className="text-light mb-2">Your Rights</h4>
                      <p className="text-light opacity-80 mb-0">
                        You can opt out and request data deletion at any time
                        per GDPR compliance
                      </p>
                    </div>
                  </div>

                  {/* Consent Section */}
                  <div
                    className="consent-section mb-5"
                    data-aos="fade-up"
                    data-aos-delay="400"
                  >
                    <div className="consent-box">
                      <h3 className="text-light mb-4 fw-bold">
                        Express Check-In Consent
                      </h3>
                      <p className="text-light mb-4 opacity-90">
                        By providing consent, you authorize us to securely store
                        your verified identity and payment information to enable
                        faster, streamlined check-in on future visits.
                      </p>

                      <div className="consent-checkbox-wrapper mb-4">
                        <div className="form-check d-flex align-items-center justify-content-center">
                          <input
                            className=" me-3 consent-checkbox"
                            type="checkbox"
                            id="consentCheckbox"
                            checked={consentChecked}
                            onChange={(e) =>
                              setConsentChecked(e.target.checked)
                            }
                          />
                          <label
                            className="form-check-label text-light fs-5"
                            htmlFor="consentCheckbox"
                          >
                            I consent to store my data for future express
                            check-in
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div
                    className="action-section"
                    data-aos="fade-up"
                    data-aos-delay="500"
                  >
                    <button
                      className="btn btn-primary btn-lg action-btn"
                      onClick={handleAgreeAndContinue}
                      disabled={loading || consentChecked === false}
                    >
                      {loading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Processing...
                        </>
                      ) : (
                        <>
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="me-2"
                          >
                            <path d="M20 6L9 17l-5-5"></path>
                          </svg>
                          Agree & Continue
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden video and canvas elements for capture */}
      <video
        ref={videoRef}
        style={{ display: "none" }}
        autoPlay
        playsInline
        muted
      />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Loading overlay */}
      {loading && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{
            backgroundColor: "rgba(0,0,0,0.7)",
            zIndex: 9999,
          }}
        >
          <div className="text-center text-white">
            <div
              className="spinner-border spinner-border-lg mb-3"
              role="status"
            >
              <span className="visually-hidden">Loading...</span>
            </div>
            <h4 className="fw-light">Preparing your experience...</h4>
          </div>
        </div>
      )}

      {/* Enhanced Custom Styles */}
      <style jsx>{`
        .consent-screen-wrapper {
          background: linear-gradient(
            135deg,
            rgba(0, 0, 0, 0.8) 0%,
            rgba(0, 0, 0, 0.9) 100%
          );
          backdrop-filter: blur(10px);
          z-index: 1000;
        }

        .back-btn {
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50px;
          padding: 12px 24px;
          font-weight: 600;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          background: rgba(255, 255, 255, 0.1);
        }

        .back-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.5);
          transform: translateY(-2px);
        }

        .consent-scroll-container {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
        }

        .consent-scroll-container::-webkit-scrollbar {
          width: 6px;
        }

        .consent-scroll-container::-webkit-scrollbar-track {
          background: transparent;
        }

        .consent-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }

        .consent-content {
          max-width: 800px;
          margin: 0 auto;
        }

        .consent-header .security-icon {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: rgba(0, 123, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          border: 2px solid rgba(0, 123, 255, 0.3);
        }

        .info-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
          margin-bottom: 3rem;
        }

        .info-card {
          background: rgba(255, 255, 255, 0.05);
          padding: 2rem;
          border-radius: 15px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(5px);
          transition: all 0.3s ease;
        }

        .info-card:hover {
          transform: translateY(-5px);
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .card-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
        }

        .consent-box {
          background: rgba(0, 123, 255, 0.1);
          padding: 2.5rem;
          border-radius: 20px;
          border: 2px solid rgba(0, 123, 255, 0.3);
          backdrop-filter: blur(10px);
        }

        .consent-checkbox-wrapper {
          background: rgba(255, 255, 255, 0.05);
          padding: 1.5rem;
          border-radius: 15px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .consent-checkbox {
          width: 24px;
          height: 24px;
          border: 2px solid #007bff;
          border-radius: 6px;
          background: transparent;
          transition: all 0.3s ease;
        }

        .consent-checkbox:checked {
          background: #007bff;
          border-color: #007bff;
        }

        .consent-checkbox:focus {
          box-shadow: 0 0 0 4px rgba(0, 123, 255, 0.25);
        }

        .action-btn {
          padding: 1rem 3rem;
          font-size: 1.25rem;
          font-weight: 600;
          border-radius: 50px;
          background: linear-gradient(45deg, #007bff, #0056b3);
          border: none;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
        }

        .action-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 123, 255, 0.4);
        }

        .action-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .info-cards {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .consent-box {
            padding: 1.5rem;
          }

          .consent-content {
            padding: 1rem;
          }
        }
      `}</style>
    </>
  );
};

export default SelfieSplashScreen;
