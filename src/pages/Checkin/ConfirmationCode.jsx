import React, { useEffect, useMemo, useRef, useState } from "react";
import PageInput from "../../components/PageInput";
import { useNavigate } from "react-router-dom";
import Aos from "aos";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import {
  getBookingListData,
  setIsBookingNotFound,
  setIsBookingUpdate,
} from "../../redux/reducers/Booking/booking";
import { getBookingStatusListData } from "../../redux/reducers/Booking/bookingAvailability";
import { isWithinEarlyCheckIn } from "../../utils/commonFun";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { getSessionItem } from "../../hooks/session";
import ReactSimpleKeyboard from "../../components/keyboard/react-keyboard";
import { playBeep } from "../../utils/playBeep";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const ConfirmationCode = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const keyboardRef = useRef(null);

  const [disabled, setDisabled] = useState(true);
  const [error, setError] = useState(false);
  const [numDigits] = useState(8);
  const [confirmCode, setConfirmCode] = useState("");
  const inputEnterRef = useRef();

  const {
    bookingLoading,
    activeBookingList,
    bookingNotFound,
    isBookingUpdate,
  } = useSelector(({ booking }) => booking);

  const termsAndConditions = getSessionItem("terms_and_conditions");

  const booking = activeBookingList?.[0];

  const hotelKiosk = getSessionItem("hotelKiosk");
  const userHotelSession = hotelKiosk
    ? JSON.parse(decodeURIComponent(escape(atob(hotelKiosk))))
    : null;

  const time = userHotelSession?.hotel?.check_in_time; // "20:00:00"
  const earlyCheckInRaw = userHotelSession?.hotel?.early_check_in_time; // "13:00:00"
  const timeZone = userHotelSession?.hotel?.time_zone; // e.g., "America/New_York"

  const checkInTime = useMemo(() => {
    if (!time || !timeZone) return "11:00";
    const todayUTC = dayjs.utc().format("YYYY-MM-DD");
    const datetime = `${todayUTC}T${time}Z`;
    return dayjs.utc(datetime).tz(timeZone).format("HH:mm:ss");
  }, [time, timeZone]);

  const earlyCheckInTime = useMemo(() => {
    if (!earlyCheckInRaw || !timeZone) return null;
    const todayUTC = dayjs.utc().format("YYYY-MM-DD");
    const datetime = `${todayUTC}T${earlyCheckInRaw}Z`;
    return dayjs.utc(datetime).tz(timeZone).format("HH:mm:ss");
  }, [earlyCheckInRaw, timeZone]);

  // booking?.check_in_time
  const isOneHourGap = isWithinEarlyCheckIn(checkInTime, earlyCheckInTime, userHotelSession?.hotel?.time_zone);


  const { activeBookingStatusList } = useSelector(
    ({ bookingAvailability }) => bookingAvailability
  );

  const arrivalStatusId = activeBookingStatusList?.length
    ? activeBookingStatusList?.find((x) => x.code_name === "confirmed")?.id
    : null;

  const newStatusId = activeBookingStatusList?.length
    ? activeBookingStatusList?.find((x) => x.code_name === "new")?.id
    : null;

  // Get checked in status ID
  const checkedInStatusId = activeBookingStatusList?.length
    ? activeBookingStatusList?.find((x) => x.code_name === "checked_in")?.id
    : null;

  useEffect(() => {
    Aos.init({
      duration: 1000,
      once: true,
      easing: "ease-in-out",
    });
    dispatch(getBookingStatusListData());
  }, []);

  useEffect(() => {
    if (bookingNotFound) {
      navigate("/check-in/find-booking");
      dispatch(setIsBookingNotFound(false));
    }
  }, [bookingNotFound]);

  useEffect(() => {
    if (bookingNotFound) {
      playBeep();
      Swal.fire({
        // title: t("Please_enter_code"),
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
      dispatch(setIsBookingUpdate(false));
      // Only proceed if we have a booking
      if (activeBookingList.length > 0) {
        // Check if already checked in
        if (booking?.status_id === checkedInStatusId) {
          playBeep();
          Swal.fire({
            title: t("Already_Checked_In"),
            text: t("checked_in_for_this_booking"),
            icon: "info",
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
          }).then(() => {
            // Navigate back to find booking screen after user dismisses the notification
            navigate("/check-in/find-booking");
          });
        } else if (isOneHourGap) {
          navigate("/walk-in/review-confirmation");
        } else if (termsAndConditions === "reservation") {
          navigate("/check-in/early-checkin");
        } else if (termsAndConditions === "checkin") {
          if (
            booking?.status_id === newStatusId ||
            booking?.status_id === arrivalStatusId
          )
            navigate("/walk-in/review-confirmation");
          else navigate("/check-in/find-booking");
        }
      }
    }
  }, [isBookingUpdate, activeBookingList]);

  const handleBooking = () => {
    if (confirmCode.length < 8) {
      playBeep();
      Swal.fire({
        // title: t("Please_enter_code"),
        text: t("Please_enter_code"),
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
      return; // Add return to prevent further execution
    }
    if (confirmCode.length === 8) {
      // const checkInDate = moment().format("YYYY-MM-DD");
      const params = {
        // checkInDate,
        confirmCode,
        // BBStatusId: `${arrivalStatusId},${newStatusId}`,
      };
      dispatch(getBookingListData(params));
    }
  };

  return (
    <>
      <div className="my-auto">
        <h1
          className="heading-h1 max-w-80"
          data-aos="fade-up"
          data-aos-delay="500"
        >
          {t("Please_enter_code")}
        </h1>

        <div
          className="small-black-bg px-5 py-4 my-5"
          data-aos="fade-up"
          data-aos-delay="1000"
        >
          <PageInput
            numDigits={numDigits}
            ref={inputEnterRef}
            value={confirmCode}
            onChange={handleInputChange}
            warpperClass="circle-input"
          />
        </div>

        <div
          className="d-flex align-items-center justify-content-between"
          data-aos="fade-up"
          data-aos-delay="1500"
        >
          <button className="common-btn black-btn" onClick={() => navigate(-1)}>
            {t("Back")}
          </button>
          <button
            className="common-btn blue-btn"
            onClick={() => {
              handleBooking();
            }}
          // disabled={bookingLoading || disabled}
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

      <div>
        <ReactSimpleKeyboard
          keyboardRef={(r) => (keyboardRef.current = r)}
          onKeyPress={onKeyPress}
          display={{
            "{bksp}": "DEL",
          }}
          layout={{
            default: [
              "1 2 3 4 5 6 7 8 9 0 {bksp}",
              "Q W E R T Y U I O P",
              "A S D F G H J K L",
              "Z X C V B N M",
            ],
          }}
        />
      </div>
    </>
  );
};

export default ConfirmationCode;
