import Aos from "aos";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import PageInput from "../../components/PageInput";
import { useDispatch, useSelector } from "react-redux";
import { getSessionItem, setSessionItem } from "../../hooks/session";
import {
  getBookingListData,
  setIsBookingCheckoutUpdate,
  setIsBookingNotFound,
  setIsBookingUpdate,
  updateBookingDetails,
} from "../../redux/reducers/Booking/booking";
import moment from "moment";
import { getBookingStatusListData } from "../../redux/reducers/Booking/bookingAvailability";
import Swal from "sweetalert2";
import ReactSimpleKeyboard from "../../components/keyboard/react-keyboard";
import { playBeep } from "../../utils/playBeep";

const RoomKey = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const keyboard = useRef();

  const dispatch = useDispatch();
  const [disabled, setDisabled] = useState(true);
  const [error, setError] = useState(false);

  const [numDigits] = useState(3);
  const [confirmCode, setConfirmCode] = useState("");
  const inputEnterRef = useRef();

  const termsAndConditions = getSessionItem("terms_and_conditions");

  const { activeBookingStatusList } = useSelector(
    ({ bookingAvailability }) => bookingAvailability
  );

  const bookingStatusId = activeBookingStatusList?.length
    ? activeBookingStatusList?.find((x) => x.code_name === "checked_out")?.id
    : null;

  const {
    isBookingUpdate,
    bookingLoading,
    bookingNotFound,
    activeBookingList,
  } = useSelector(({ booking }) => booking);

  const booking = activeBookingList?.[0];

  const checkInStatusId = activeBookingStatusList?.length
    ? activeBookingStatusList?.find((x) => x.code_name === "checked_in")?.id
    : null;

  const [layoutName, setLayoutName] = useState("numbers");

  const layouts = {
    numbers: {
      default: ["1 2 3", "4 5 6", "7 8 9", "0 {bksp}"],
    },
  };

  useEffect(() => {
    Aos.init({
      duration: 1000,
      once: true,
      easing: "ease-in-out",
    });
    dispatch(getBookingStatusListData());
  }, []);

  const handleInputChange = (index, digit, action = "input") => {
    setConfirmCode((prevCode) => {
      const newCode = prevCode.split("");
      if (action === "backspace") {
        if (newCode[index]) {
          newCode[index] = "";
        } else if (index > 0) {
          newCode[index - 1] = "";
        }
      } else {
        newCode[index] = digit;
      }
      const updatedCode = newCode.join("");
      setDisabled(updatedCode.length !== numDigits);
      if (error) setError(false);
      return updatedCode;
    });
  };

  const onKeyPress = (button) => {
    if (button === "{bksp}") {
      const lastNonEmptyIndex = confirmCode
        .split("")
        .reverse()
        .findIndex((char) => char !== "");
      const indexToDelete =
        lastNonEmptyIndex === -1
          ? confirmCode.length - 1
          : confirmCode.length - 1 - lastNonEmptyIndex;
      handleInputChange(indexToDelete, "", "backspace");
    } else if (/^[A-Za-z0-9]$/.test(button) && confirmCode.length < numDigits) {
      handleInputChange(confirmCode.length, button, "input");
    }
  };

  useEffect(() => {
    if (isBookingUpdate) {
      navigate("/check-in/thank-you");
      dispatch(setIsBookingUpdate(false));
    }
  }, [isBookingUpdate]);

  useEffect(() => {
    if (isBookingUpdate && termsAndConditions === "checkout") {
      if (checkInStatusId === booking?.status_id) {
        if (booking?.payment_type === "cash") {
          navigate("/check-out/payment");
          setSessionItem("paymentMethod", "cash");
        } else {
          const updatePayload = {
            booking: {
              id: booking?.id,
              status_id: bookingStatusId,
            },
          };
          dispatch(updateBookingDetails(updatePayload));
        }
      } else {
        navigate(-1);
        // dispatch(setIsBookingNotFound(true));
      }
      dispatch(setIsBookingUpdate(false));
    }
  }, [isBookingUpdate]);

  const handleCheckout = () => {
    const checkOutDate = moment().format("YYYY-MM-DD");
    if (confirmCode?.length < 3) {
      playBeep();
      Swal.fire({
        // title: t("Please_enter_code"),
        text: t("Please_provide_room_number"),
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
    if (confirmCode?.length === 3) {
      const params = {
        checkOutDate,
        roomNumber: confirmCode,
        BBStatusId: checkInStatusId,
      };
      dispatch(getBookingListData(params));
    }
  };

  useEffect(() => {
    if (bookingNotFound) {
      navigate("/check-out/find-room");
    }
  }, [bookingNotFound]);

  return (
    <>
      <div>
        <h1 className="heading-h1" data-aos="fade-up" data-aos-delay="500">
          {t("First_Name_and_Room_Number")}
        </h1>

        <div data-aos="fade-up" data-aos-delay="1000">
          <h3 className="text-start input-heading mb-1">{t("Room_Number")}</h3>
          <div className="small-black-bg px-5 py-4">
            <PageInput
              numDigits={numDigits}
              ref={inputEnterRef}
              value={confirmCode}
              onChange={handleInputChange}
              warpperClass="circle-input"
            />
          </div>
        </div>

        <div
          className="d-flex align-items-center justify-content-between mt-5"
          data-aos="fade-up"
          data-aos-delay="2000"
        >
          <button
            className="common-btn black-btn"
            onClick={() => {
              navigate("/check-out/find-room");
            }}
          >
            {t("Back")}
          </button>
          <button
            className="common-btn blue-btn lh-1"
            onClick={() => {
              handleCheckout();
            }}
            disabled={bookingLoading}
          >
            {bookingLoading ? (
              <span className="d-flex align-items-center">
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                />
                <span> {t("Continue")}...</span>
              </span>
            ) : (
              <span> {t("Continue")}</span>
            )}
          </button>
        </div>
      </div>

      <div
        className={`${
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
            "{space}": "SPACE",
          }}
          buttonTheme={[
            {
              class: "hg-red",
              buttons: "{bksp}",
            },
          ]}
        />
      </div>
    </>
  );
};

export default RoomKey;
