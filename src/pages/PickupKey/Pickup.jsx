// Pickup.js (with fixes)
import Aos from "aos";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageInput from "../../components/PageInput";
import { useTranslation } from "react-i18next";
import ReactSimpleKeyboard from "../../components/keyboard/react-keyboard";
import Swal from "sweetalert2";
import { useDispatch, useSelector } from "react-redux";
import {
  getBookingListData,
  setIsBookingNotFound,
} from "../../redux/reducers/Booking/booking";
import { playBeep } from "../../utils/playBeep";

const Pickup = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const keyboard = useRef();

  const { bookingNotFound, bookingLoading } = useSelector(
    ({ booking }) => booking
  );

  const [disabled, setDisabled] = useState(true);
  const [error, setError] = useState(false);
  const [activeInput, setActiveInput] = useState("phone");
  const [layoutName, setLayoutName] = useState("numbers");

  // Added to control kiosk keypad
  const [showKeyboard, setShowKeyboard] = useState(true);

  const [countryCode, setCountryCode] = useState("US");
  const [confirmCode, setConfirmCode] = useState("");
  const [numDigits] = useState(10);

  const [roomCode, setRoomCode] = useState("");
  const [roomNumDigits] = useState(3);

  const inputEnterRef = useRef();
  const inputEnterRoomRef = useRef();

  // Add a ref for tracking initial render
  const isInitialRender = useRef(true);

  useEffect(() => {
    Aos.init({
      duration: 1000,
      once: true,
      easing: "ease-in-out",
    });

    // Disable kiosk keypad by adding an invisible overlay when the component mounts
    const disableKioskKeypad = () => {
      // Create an overlay element to capture and prevent kiosk keyboard interactions
      const overlay = document.createElement("div");
      overlay.id = "kiosk-keyboard-overlay";
      overlay.style.position = "fixed";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.width = "100vw";
      overlay.style.height = "100vh";
      overlay.style.zIndex = "9999";
      overlay.style.opacity = "0";
      overlay.style.pointerEvents = "none";

      // Add some JavaScript to handle any kiosk keyboard events
      overlay.addEventListener(
        "touchstart",
        (e) => {
          // Only prevent default for kiosk keyboard touches
          const target = e.target;
          if (
            target.classList.contains("kiosk-key") ||
            target.closest(".kiosk-keyboard")
          ) {
            e.preventDefault();
            e.stopPropagation();
          }
        },
        true
      );

      document.body.appendChild(overlay);
    };

    disableKioskKeypad();

    // Cleanup function
    return () => {
      const overlay = document.getElementById("kiosk-keyboard-overlay");
      if (overlay) {
        document.body.removeChild(overlay);
      }
    };
  }, [numDigits]);

  // Focus on phone input field on initial render
  useEffect(() => {
    if (isInitialRender.current) {
      // Force focus on the phone input
      setTimeout(() => {
        if (inputEnterRef.current) {
          inputEnterRef.current.focusInput(0);
          setActiveInput("phone");
        }
      }, 500); // Small delay to ensure component is fully rendered

      isInitialRender.current = false;
    }
  }, []);

  // Modified useEffect for auto-focus - only switch to room input when phone is complete
  useEffect(() => {
    if (confirmCode.length === numDigits) {
      // Only change focus to room input when phone number is complete
      setActiveInput("room");

      // Focus on room input
      setTimeout(() => {
        if (inputEnterRoomRef.current) {
          inputEnterRoomRef.current.focusInput(0);
        }
      }, 100);

      // Optional: scroll room input into view if needed
      const roomInput = document.querySelector(".common-input-number-section");
      if (roomInput) {
        roomInput.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [confirmCode, numDigits]);

  const layouts = {
    numbers: {
      default: ["1 2 3", "4 5 6", "7 8 9", "0 {bksp}"],
    },
  };

  const handleInputChange = (index, digit, action = "input") => {
    const updateValue = (prevValue, maxLength) => {
      const newValue = prevValue.split("");
      if (action === "backspace") {
        if (newValue[index]) {
          newValue[index] = "";
        } else if (index > 0) {
          newValue[index - 1] = "";
        }
      } else {
        newValue[index] = digit;
      }
      return newValue.join("");
    };

    if (activeInput === "phone") {
      setConfirmCode((prevCode) => {
        const updatedCode = updateValue(prevCode, numDigits);
        setDisabled(updatedCode.length !== numDigits);
        if (error) setError(false);
        return updatedCode;
      });
    } else if (activeInput === "room") {
      setRoomCode((prevCode) => {
        const updatedCode = updateValue(prevCode, roomNumDigits);
        if (error) setError(false);
        return updatedCode;
      });
    }
  };

  // Handle keyboard input
  const onKeyPress = (button) => {
    const currentValue = activeInput === "phone" ? confirmCode : roomCode;
    const maxLength = activeInput === "phone" ? numDigits : roomNumDigits;

    if (button === "{bksp}") {
      const lastNonEmptyIndex = currentValue
        .split("")
        .reverse()
        .findIndex((char) => char !== "");
      const indexToDelete =
        lastNonEmptyIndex === -1
          ? currentValue.length - 1
          : currentValue.length - 1 - lastNonEmptyIndex;
      handleInputChange(indexToDelete, "", "backspace");
    } else if (/^[0-9]$/.test(button) && currentValue.length < maxLength) {
      handleInputChange(currentValue.length, button, "input");
    }
  };

  // Modified handleInputFocus to maintain proper focus state
  const handleInputFocus = (inputType) => {
    setActiveInput(inputType);
    setLayoutName("numbers");

    // Show our keyboard when an input is focused
    setShowKeyboard(true);
  };

  useEffect(() => {
    if (bookingNotFound) {
      playBeep();
      Swal.fire({
        text: t("Booking_Not_Found"),
        icon: "error",
        confirmButtonText: t("Ok"),
        showClass: {
          popup: `
              animate__animated
              animate__fadeInUp
              animate__faster
            `,
        },
        hideClass: {
          popup: `
              animate__animated
              animate__fadeOutDown
              animate__faster
            `,
        },
      });
      dispatch(setIsBookingNotFound(false));
    }
  }, [bookingNotFound]);

  // Form validation and submission
  const handleSubmit = async () => {
    // if (confirmCode.length !== 10) {
    //   playBeep();
    //   Swal.fire({
    //     text: t("Enter_10didgit_Phone_Number"),
    //     icon: "error",
    //     confirmButtonText: t("Ok"),
    //     showClass: {
    //       popup: `
    //         animate__animated
    //         animate__fadeInUp
    //         animate__faster
    //       `,
    //     },
    //     hideClass: {
    //       popup: `
    //         animate__animated
    //         animate__fadeOutDown
    //         animate__faster
    //       `,
    //     },
    //   });
    //   return;
    // }

    if (roomCode.length !== 3) {
      playBeep();
      Swal.fire({
        text: t("EnterRoomNumber"),
        icon: "error",
        confirmButtonText: t("Ok"),
        showClass: {
          popup: `
            animate__animated
            animate__fadeInUp
            animate__faster
          `,
        },
        hideClass: {
          popup: `
            animate__animated
            animate__fadeOutDown
            animate__faster
          `,
        },
      });
      return;
    }

    const params = {
      roomNumber: roomCode,
      BSCodeName: "checked_in",
    };

    const resultAction = await dispatch(getBookingListData(params));

    if (getBookingListData.fulfilled.match(resultAction)) {
      const newBookingData = resultAction?.payload?.[0];

      navigate("/check-in/key-receipt", {
        state: {
          key: "pickup_check",
          keyData: newBookingData,
        },
      });
    }
  };

  return (
    <>
      <div className="">
        <h1 className="heading-h1" data-aos="fade-up" data-aos-delay="500">
          {t("Issue_Room_Key")}
        </h1>

        <div data-aos="fade-up" data-aos-delay="1000" className="mb-5">
          <h3 className="text-start input-heading mb-1">{t("Phone_Number")}</h3>
          <div className="custom-card number-section mb-4">
            <div className="custom-card-wrap py-3">
              <div className="d-flex align-items-center">
                <select
                  className="select-country"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                >
                  <option value="US">US</option>
                  <option value="CA">CA</option>
                </select>
                <PageInput
                  numDigits={numDigits}
                  inputType="number"
                  ref={inputEnterRef}
                  value={confirmCode}
                  onChange={handleInputChange}
                  warpperClass="circle-input"
                  onFocus={() => handleInputFocus("phone")}
                  autoFocus={true} // Add autoFocus prop
                />
              </div>
            </div>
          </div>
        </div>

        <div
          className="md-black-bg common-input-number-section mb-5 cursor"
          data-aos="fade-up"
          data-aos-delay="1500"
        >
          <PageInput
            numDigits={roomNumDigits}
            inputType="number"
            ref={inputEnterRoomRef}
            value={roomCode}
            onChange={handleInputChange}
            onFocus={() => handleInputFocus("room")}
            warpperClass="squre-input"
            autoFocus={false} // Explicitly set autoFocus to false
          />
          <h3 className="font-poppins mb-0 lh-1">{t("EnterRoomNumber")}</h3>
        </div>

        <div
          className="d-flex align-items-center justify-content-between"
          data-aos="fade-up"
          data-aos-delay="2000"
        >
          <button
            className="common-btn black-btn"
            onClick={() => {
              navigate(-1);
            }}
          >
            {t("Back")}
          </button>
          <button
            className="common-btn blue-btn"
            onClick={handleSubmit}
            disabled={bookingLoading}
          >
            {bookingLoading ? (
              <span className="d-flex align-items-center">
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                />
                <span> {t("Confirm")}...</span>
              </span>
            ) : (
              <span> {t("Confirm")}</span>
            )}
          </button>
        </div>
      </div>

      {showKeyboard && (
        <div
          className={`keyboard-container ${
            layoutName === "numbers" ? "numeric-keyboard" : ""
          }`}
        >
          <ReactSimpleKeyboard
            keyboardRef={(r) => (keyboard.current = r)}
            layoutName={layoutName}
            layout={layouts[layoutName]}
            onKeyPress={onKeyPress}
            display={{
              "{bksp}": "DEL",
            }}
            buttonTheme={[
              {
                class: "hg-red",
                buttons: "{bksp}",
              },
            ]}
          />
        </div>
      )}
    </>
  );
};

export default Pickup;
