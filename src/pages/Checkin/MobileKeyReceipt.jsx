import Aos from "aos";
import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getSessionItem } from "../../hooks/session";
import { useDispatch, useSelector } from "react-redux";
import { getImageSrc } from "../../utils/bulkImageStorage";
import useKeyDispenser from "../../hooks/useKeyDispenser";
import { keyDispenserAction } from "../../redux/reducers/MQTT/keyDispenser";
import Swal from "sweetalert2";
import { playBeep } from "../../utils/playBeep";
import moment from "moment/moment";
import { playSafeAudio } from "../../utils/commonFun";

const MobileKeyReceipt = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { key, keyData } = location.state || {};
  const { t } = useTranslation();

  const mqttState = useSelector((state) => state.mqtt);

  const { activeKioskDeviceList } = useSelector(
    ({ kioskDevice }) => kioskDevice
  );

  const { activeBookingList, referenceNumber } = useSelector(
    ({ booking }) => booking
  );

  const room = getSessionItem("room");
  const roomData = JSON.parse(room);

  // Destructure key dispenser hook data
  const { keyError, devicestatus, keyPosition, isDeviceStatusChecked } =
    useKeyDispenser();

  // Slider state (for the initial swipe UI)
  const [sliderValue, setSliderValue] = useState(0);

  // Process state management
  const [isInitializingDispenser, setIsInitializingDispenser] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [isDispensingKey, setIsDispensingKey] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [extraKeyButton, setExtraKeyButton] = useState(false);

  // NEW: Track if this is an extra key request
  const [isExtraKeyRequest, setIsExtraKeyRequest] = useState(false);
  const [keyCount, setKeyCount] = useState(1); // Track how many keys have been dispensed

  // Refs for tracking timeouts and preventing duplicate actions
  const timeoutRef = useRef(null);
  const responseTimeoutRef = useRef(null);
  const keyCommandSentRef = useRef(false);
  const autoSlideTimeoutRef = useRef(null);

  // Get user data for displaying name
  const userDetails = activeBookingList?.[0];
  const user_data = getSessionItem("userData");
  const userData = JSON.parse(user_data);

  const selectedSelfieBooking = getSessionItem("selectedSelfieBookingData");
  const selectedBookingForSelfie = JSON.parse(selectedSelfieBooking);
  const roomNumber = selectedBookingForSelfie?.booking_details?.[0]?.booking_room?.[0]?.rooms[0]?.room_number

  // Initialize AOS animations
  useEffect(() => {
    Aos.init({
      duration: 1000,
      once: true,
      easing: "ease-in-out",
    });
    playSafeAudio("key_dispensing");
  }, []);

  // Auto-slide functionality - triggers after 3 seconds
  useEffect(() => {
    if (!isInitializingDispenser) {
      // Clear any existing auto-slide timeout
      if (autoSlideTimeoutRef.current) {
        clearTimeout(autoSlideTimeoutRef.current);
      }

      // Set auto-slide timeout for 3 seconds
      autoSlideTimeoutRef.current = setTimeout(() => {
        // Animate slider to 100%
        const animateSlider = () => {
          let currentValue = 0;
          const targetValue = 100;
          const duration = 1000; // 1 second animation
          const steps = 50;
          const stepValue = targetValue / steps;
          const stepDuration = duration / steps;

          const slideInterval = setInterval(() => {
            currentValue += stepValue;
            if (currentValue >= targetValue) {
              currentValue = targetValue;
              clearInterval(slideInterval);
              // Trigger the dispenser initialization
              setSliderValue(100);
              setIsInitializingDispenser(true);
            } else {
              setSliderValue(Math.round(currentValue));
            }
          }, stepDuration);
        };

        animateSlider();
      }, 2000); // 2 seconds delay
    }

    // Cleanup function
    return () => {
      if (autoSlideTimeoutRef.current) {
        clearTimeout(autoSlideTimeoutRef.current);
      }
    };
  }, [isInitializingDispenser]);

  // Parse MQTT message
  const mqttData = mqttState?.lastMessage?.message
    ? JSON.parse(mqttState.lastMessage.message)
    : {};

  // Handle error response from MQTT
  useEffect(() => {
    let isMounted = true;

    if (mqttData?.response?.status === false && isMounted) {
      playBeep();
      Swal.fire({
        title: t("Alert"),
        html: `
          <div style="display: flex; flex-direction: column; align-items: center;">
            <p>${t("Unable_to_dispense_key")}</p>
          </div>
        `,
        showCancelButton: false,
        confirmButtonText: t("Continue"),
        cancelButtonColor: "#d33",
        allowOutsideClick: false,
        allowEscapeKey: false,
        customClass: {
          confirmButton: "custom-swal-confirm",
        },
      }).then((result) => {
        if (result.isConfirmed && isMounted) {
          navigate("/check-in/receipt-print");
        }
      });
    }

    // Process MQTT commands for different stages
    if (mqttData?.cmd === "ui_write" && mqttData?.response?.status === true) {
      setInitializing(false);
      setGenerating(true);

      // Clear the response timeout since we received a response
      if (responseTimeoutRef.current) {
        clearTimeout(responseTimeoutRef.current);
      }
    }
    // Process completion
    else if (
      mqttData?.cmd === "ui_front" &&
      mqttData?.response?.status === true
    ) {
      setGenerating(false);
      setIsDispensingKey(true);

      // Set timeout to navigate to receipt-print after completion
      setTimeout(() => {
        setIsDispensingKey(false);
        setCompleted(true);

        if (key === "pickup_check") {
          navigate("/home");
        } else {
          // console.log('Key dispensed successfully');
          setExtraKeyButton(true);
          setKeyCount(prev => prev + 1); // Increment key count
        }
      }, 2000);
    }

    // Cleanup function
    return () => {
      isMounted = false;
      // Close any open Swal alerts when navigating away
      Swal.close();
    };
  }, [mqttData, navigate, t, key]);

  // Set timeout for handling no response scenario
  useEffect(() => {
    if (isInitializingDispenser) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set a new timeout for 35 seconds
      timeoutRef.current = setTimeout(() => {
        // Check if we're still waiting for response
        if (!generating && !isDispensingKey && !completed) {
          playBeep();
          Swal.fire({
            title: t("Alert"),
            html: `
              <div style="display: flex; flex-direction: column; align-items: center;">
                <p>${t("Unable_to_dispense_key")}</p>
              </div>
            `,
            showCancelButton: false,
            confirmButtonText: t("Continue"),
            cancelButtonColor: "#d33",
            allowOutsideClick: false,
            allowEscapeKey: false,
            customClass: {
              confirmButton: "custom-swal-confirm",
            },
          }).then((result) => {
            if (result.isConfirmed) {
              // console.log('User confirmed after timeout');
            }
          });
        }
      }, 35000); // 35 seconds timeout
    }

    // Clean up the timeout when component unmounts or state changes
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [
    isInitializingDispenser,
    generating,
    isDispensingKey,
    completed,
    navigate,
    t,
  ]);

  // Initialize key dispenser when slider reaches 100%
  useEffect(() => {
    if (isInitializingDispenser && !keyCommandSentRef.current) {
      // Get device IDs
      const deviceIds =
        activeKioskDeviceList?.map((device) => device.id).filter(Boolean) || [];

      const check_In_Date = getSessionItem("checkInDate");
      const check_Out_Date = getSessionItem("checkOutDate");
      const check_In_Time = getSessionItem("checkInTime");
      const check_Out_Time = getSessionItem("checkOutTime");

      dispatch(
        keyDispenserAction({
          cmd: "issue_key",
          device_uuid_list: deviceIds,
          payload: {
            building: "1",
            building_lock_id: roomData?.building_lock_id || "1",
            floor: "1",
            floor_lock_id: roomData?.floor_lock_id || "1",
            room_no: roomData?.room_number || userDetails?.room_number || roomNumber,
            room_lock_id: roomData?.room_lock_id || "1",
            check_in_date: check_In_Date,
            check_in_time: moment(check_In_Time, "HH:mm:ss").format("HH:mm"),
            check_out_date: check_Out_Date,
            check_out_time: moment(check_Out_Time, "HH:mm:ss").format("HH:mm"),
            is_duplicate: key === "pickup_check" || isExtraKeyRequest ? true : false,
            meta: {
              extra_key: isExtraKeyRequest,
              key_number: keyCount
            },
          },
        })
      );

      keyCommandSentRef.current = true;

      // Fallback timer if move_reader command is not received in 15 seconds
      responseTimeoutRef.current = setTimeout(() => {
        if (initializing && !generating && !isDispensingKey) {
          setInitializing(false);
          setGenerating(true);
        }
      }, 15000);
    }

    return () => {
      if (responseTimeoutRef.current) {
        clearTimeout(responseTimeoutRef.current);
      }
    };
  }, [
    isInitializingDispenser,
    activeKioskDeviceList,
    dispatch,
    key,
    keyData,
    initializing,
    generating,
    isDispensingKey,
    isExtraKeyRequest,
    keyCount,
  ]);

  // Handle connection timeout error
  useEffect(() => {
    if (keyError === "Connection timeout") {
      setIsInitializingDispenser(false);
      setInitializing(true);
      setGenerating(false);
      setIsDispensingKey(false);
      setCompleted(false);
      setSliderValue(0);
      keyCommandSentRef.current = false;
      // Clear auto-slide timeout when there's an error
      if (autoSlideTimeoutRef.current) {
        clearTimeout(autoSlideTimeoutRef.current);
      }
    }
  }, [keyError]);

  // NEW: Function to handle extra key request
  const handleExtraKeyRequest = () => {
    // Reset all states to restart the process
    setIsExtraKeyRequest(true);
    setExtraKeyButton(false);
    setCompleted(false);
    setIsInitializingDispenser(false);
    setInitializing(true);
    setGenerating(false);
    setIsDispensingKey(false);
    setSliderValue(0);
    keyCommandSentRef.current = false;

    // Clear any existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (responseTimeoutRef.current) {
      clearTimeout(responseTimeoutRef.current);
    }
    if (autoSlideTimeoutRef.current) {
      clearTimeout(autoSlideTimeoutRef.current);
    }

    // Show confirmation dialog
    Swal.fire({
      title: t("Extra Key Request"),
      text: t("Do you want to dispense an extra key?"),
      icon: "question",
      showCancelButton: true,
      confirmButtonText: t("Yes, Dispense Extra Key"),
      cancelButtonText: t("Cancel"),
      allowOutsideClick: false,
      allowEscapeKey: false,
    }).then((result) => {
      if (result.isConfirmed) {
        // Start the auto-slide process for extra key
        playSafeAudio("key_dispensing");
        // The auto-slide effect will trigger automatically due to the useEffect
      } else {
        // User cancelled, reset the extra key request flag
        setIsExtraKeyRequest(false);
        setExtraKeyButton(true);
      }
    });
  };

  // Slider handlers
  const handleSliderChange = (event) => {
    event.preventDefault();
    return false;
  };

  const handleTouchStart = (event) => {
    event.preventDefault();
    return false;
  };

  const handleTouchEnd = (event) => {
    event.preventDefault();
    return false;
  };

  return (
    <>
      {!isInitializingDispenser ? (
        <div className="my-auto">
          <div
            className="substract-bg d-flex flex-column pb-5"
            data-aos="fade-down"
            data-aos-delay="500"
          >
            <div>
              <h1>
                {isExtraKeyRequest ? t("Extra Key Request") : t("All_Set")}, {userDetails?.first_name || userData?.firstName}{" "}
                {userDetails?.last_name || userData?.lastName}
              </h1>
              <h2>
                {isExtraKeyRequest
                  ? t("Preparing to dispense extra key")
                  : t("sent_your_digital_key")
                }
              </h2>
              <div className="custom-slide-unlock">
                <div className="slider-container">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderValue}
                    className="slider p-2"
                    onChange={handleSliderChange}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onMouseDown={handleTouchStart}
                    onMouseUp={handleTouchEnd}
                    disabled={true}
                    style={{ pointerEvents: "none", userSelect: "none" }}
                  />
                  <div className="slider-text">
                    {isExtraKeyRequest
                      ? t("Preparing extra key")
                      : t("Swipe_to_print_key")
                    }{" "}
                    <FontAwesomeIcon icon={faArrowRight} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="my-auto">
          <div className="substract-bg d-flex flex-column pb-5">
            <h1 className="mb-100 text-uppercase">
              {isExtraKeyRequest
                ? t("Dispensing Extra Key") + " #" + keyCount
                : t("Please_Wait")
              }....
            </h1>
            <div className="">
              {/* Initializing Dispenser Status */}
              <div>
                {initializing ? (
                  <div className="key-dispense active-progress d-flex align-items-center my-4">
                    <div className="spinner-border" role="status">
                      <span className="sr-only">Loading...</span>
                    </div>
                    <h2 className="mb-0">{t("Initializing_Dispenser")}</h2>
                  </div>
                ) : (
                  <div className="key-dispense active d-flex align-items-center my-4">
                    <div className="circle position-relative">
                      <img src={getImageSrc("CheckIcon")} alt="check" />
                    </div>
                    <h2 className="mb-0">{t("Initializing_Dispenser")}</h2>
                  </div>
                )}
              </div>

              {/* Generating Key Status */}
              <div>
                {generating ? (
                  <div className="key-dispense active-progress d-flex align-items-center my-4">
                    <div className="spinner-border" role="status">
                      <span className="sr-only">Loading...</span>
                    </div>
                    <h2 className="mb-0">
                      {isExtraKeyRequest
                        ? t("Generating Extra Key")
                        : t("Generating_Key")
                      }
                    </h2>
                  </div>
                ) : !initializing ? (
                  <div className="key-dispense active d-flex align-items-center my-4">
                    <div className="circle position-relative">
                      <img src={getImageSrc("CheckIcon")} alt="check" />
                    </div>
                    <h2 className="mb-0">
                      {isExtraKeyRequest
                        ? t("Generated Extra Key")
                        : t("Generated_Key")
                      }
                    </h2>
                  </div>
                ) : (
                  <div className="key-dispense d-flex align-items-center my-4">
                    <div className="circle position-relative"></div>
                    <h2 className="mb-0">
                      {isExtraKeyRequest
                        ? t("Generating Extra Key")
                        : t("Generating_Key")
                      }
                    </h2>
                  </div>
                )}
              </div>

              {/* Dispensing Key Status */}
              <div>
                {isDispensingKey ? (
                  <div className="key-dispense active-progress d-flex align-items-center">
                    <div className="spinner-border" role="status">
                      <span className="sr-only">Loading...</span>
                    </div>
                    <h2 className="mb-0">
                      {isExtraKeyRequest
                        ? t("Dispensing Extra Key Now")
                        : t("Dispensing_Key_Now")
                      }
                    </h2>
                  </div>
                ) : !generating && !initializing ? (
                  <div className="key-dispense active d-flex align-items-center">
                    <div className="circle position-relative">
                      <img src={getImageSrc("CheckIcon")} alt="check" />
                    </div>
                    <h2>
                      {isExtraKeyRequest
                        ? t("Dispensed Extra Key")
                        : t("Dispensed_Key")
                      }
                    </h2>
                  </div>
                ) : (
                  <div className="key-dispense d-flex align-items-center">
                    <div className="circle position-relative"></div>
                    <h2 className="mb-0">
                      {isExtraKeyRequest
                        ? t("Dispensing Extra Key Now")
                        : t("Dispensing_Key_Now")
                      }
                    </h2>
                  </div>
                )}
              </div>
            </div>

            {/* Show buttons only when process is complete */}
            {extraKeyButton && (
              <div
                className="d-flex align-items-center justify-content-between mt-auto"
                data-aos="fade-up"
                data-aos-delay="1500"
              >
                <button
                  className="common-btn black-btn"
                  onClick={handleExtraKeyRequest}
                >
                  TAP TO PRINT EXTRA KEY
                </button>
                <button
                  className="common-btn blue-btn"
                  onClick={() => {
                    navigate("/check-in/receipt-print");
                  }}
                >
                  <span>{t("Continue")}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default MobileKeyReceipt;