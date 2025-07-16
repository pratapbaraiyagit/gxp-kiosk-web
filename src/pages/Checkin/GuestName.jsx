import Aos from "aos";
import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import ReactSimpleKeyboard from "../../components/keyboard/react-keyboard";
import moment from "moment/moment";
import {
  getBookingListData,
  setIsBookingNotFound,
  setIsBookingUpdate,
  updateBookingDetails,
} from "../../redux/reducers/Booking/booking";
import { isWithinEarlyCheckIn } from "../../utils/commonFun";
import { useTranslation } from "react-i18next";
import { getSessionItem, setSessionItem } from "../../hooks/session";
import Swal from "sweetalert2";
import { getBookingStatusListData } from "../../redux/reducers/Booking/bookingAvailability";
import { playBeep } from "../../utils/playBeep";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const inputHighlightStyle = {
  focusedInput: {
    borderColor: "#11c9ea",
    boxShadow: "0 0 0 0.2rem rgba(0, 123, 255, 0.25)",
    borderWidth: "2px",
  },
};

const GuestName = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const firstNameInputRef = useRef(null); // Add ref for firstName input

  const [inputs, setInputs] = useState({
    firstName: "",
    lastName: "",
  });
  const [activeInput, setActiveInput] = useState("firstName");
  const keyboardRef = useRef(null);

  const {
    bookingLoading,
    activeBookingList,
    bookingNotFound,
    isBookingUpdate,
  } = useSelector(({ booking }) => booking);

  const { activeBookingStatusList } = useSelector(
    ({ bookingAvailability }) => bookingAvailability
  );

  const checkInStatusId = activeBookingStatusList?.length
    ? activeBookingStatusList?.find((x) => x.code_name === "checked_in")?.id
    : null;

  const confirmedStatusId = activeBookingStatusList?.length
    ? activeBookingStatusList?.find((x) => x.code_name === "confirmed")?.id
    : null;

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
    

  const termsAndConditions = getSessionItem("terms_and_conditions");

  const bookingStatusId = activeBookingStatusList?.length
    ? activeBookingStatusList?.find((x) => x.code_name === "checked_out")?.id
    : null;

  const arrivalStatusId = activeBookingStatusList?.length
    ? activeBookingStatusList?.find((x) => x.code_name === "checked_in")?.id
    : null;

  const newStatusId = activeBookingStatusList?.length
    ? activeBookingStatusList?.find((x) => x.code_name === "new")?.id
    : null;

  useEffect(() => {
    Aos.init({
      duration: 1000,
      once: true,
      easing: "ease-in-out",
    });
    dispatch(getBookingStatusListData());

    // Auto-focus the firstName input when component mounts
    if (firstNameInputRef.current) {
      setTimeout(() => {
        firstNameInputRef.current.focus();
        handleInputFocus("firstName");
      }, 100);
    }
  }, []);

  const onChangeAll = (inputName, value) => {
    setInputs((prev) => ({ ...prev, [inputName]: value }));
  };

  const handleInputFocus = (inputName) => {
    setActiveInput(inputName);
    if (keyboardRef.current) {
      keyboardRef.current.setOptions({
        inputName: inputName,
      });
    }
  };

  const onKeyPress = (button) => {
    if (button === "{shift}" || button === "{lock}") return;

    let updatedValue;
    if (button === "{bksp}") {
      updatedValue = inputs[activeInput].slice(0, -1);
    } else if (button === "{space}") {
      updatedValue = inputs[activeInput] + " ";
    } else {
      updatedValue = inputs[activeInput] + button;
    }

    onChangeAll(activeInput, updatedValue);
  };

  const handlePhysicalKeyboardInput = (e) => {
    const { name, value } = e.target;
    onChangeAll(name, value);
    if (keyboardRef.current) {
      keyboardRef.current.setInput(value);
    }
  };

  useEffect(() => {
    if (bookingNotFound && termsAndConditions === "checkout") {
      navigate("/check-out/find-room");
      dispatch(setIsBookingNotFound(false));
    }
    if (bookingNotFound && termsAndConditions === "checkin") {
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

  useEffect(() => {
    if (isBookingUpdate && termsAndConditions !== "checkout") {
      if (isOneHourGap) {
        navigate("/walk-in/review-confirmation");
      } else if (termsAndConditions === "reservation") {
        navigate("/check-in/early-checkin");
      } else if (termsAndConditions === "checkin") {
        if (
          booking?.status_id === newStatusId ||
          booking?.status_id === confirmedStatusId
        )
          navigate("/walk-in/review-confirmation");
        else navigate("/check-in/find-booking");
      }
      dispatch(setIsBookingUpdate(false));
    } else if (isBookingUpdate && termsAndConditions === "checkout") {
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
          navigate("/check-in/thank-you");
        }
      } else {
        navigate(-1);
        // dispatch(setIsBookingNotFound(true));
      }
      dispatch(setIsBookingUpdate(false));
    }
  }, [isBookingUpdate]);

  const handleBooking = () => {
    const { firstName, lastName } = inputs;

    if (!firstName.trim() && !lastName.trim()) {
      playBeep();
      Swal.fire({
        // title: "",
        text: t("Please_enter_both_name"),
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

    // Check if first name is empty
    if (!firstName.trim()) {
      playBeep();
      Swal.fire({
        // title: ,
        text: t("Please_enter_fname"),
        icon: "warning",
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

    // Check if last name is empty
    if (!lastName.trim()) {
      playBeep();
      Swal.fire({
        // title: ,
        text: t("Please_enter_lname"),
        icon: "warning",
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

    if (firstName && lastName) {
      if (termsAndConditions === "checkout") {
        const checkOutDate = moment().format("YYYY-MM-DD");
        const params = {
          checkOutDate,
          firstName,
          lastName,
          BBStatusId: checkInStatusId,
        };
        dispatch(getBookingListData(params));
      } else {
        const checkInDate = moment().format("YYYY-MM-DD");
        const params = {
          checkInDate,
          firstName,
          lastName,
          arrivalStatusId,
          BBStatusId: `${confirmedStatusId}`,
        };
        dispatch(getBookingListData(params));
      }
    }
  };

  // Function to determine if input should show active style
  const getInputStyle = (inputName) => {
    return activeInput === inputName ? inputHighlightStyle.focusedInput : {};
  };

  return (
    <>
      <div className="align-center-page">
        <h1 className="heading-h1" data-aos="fade-up" data-aos-delay="500">
          {t("Please_enter_first_name")}
        </h1>

        <div
          className="custom-card form-input mb-5"
          data-aos="fade-up"
          data-aos-delay="1000"
        >
          <div className="custom-card-wrap p-3">
            <input
              type="text"
              className="form-control"
              placeholder={t("FirstName")}
              name="firstName"
              value={inputs.firstName}
              onChange={handlePhysicalKeyboardInput}
              onFocus={() => handleInputFocus("firstName")}
              autoComplete="off"
              ref={firstNameInputRef}
              style={getInputStyle("firstName")}
            />
          </div>
        </div>
        <div
          className="custom-card form-input mb-5"
          data-aos="fade-up"
          data-aos-delay="1500"
        >
          <div className="custom-card-wrap p-3">
            <input
              type="text"
              className="form-control"
              placeholder={t("LastName")}
              name="lastName"
              value={inputs.lastName}
              onChange={handlePhysicalKeyboardInput}
              onFocus={() => handleInputFocus("lastName")}
              autoComplete="off"
              style={getInputStyle("lastName")}
            />
          </div>
        </div>

        <div
          className="d-flex align-items-center justify-content-between"
          data-aos="fade-up"
          data-aos-delay="2000"
        >
          <button className="common-btn black-btn" onClick={() => navigate(-1)}>
            {t("Start_Over")}
          </button>

          <button
            className="common-btn blue-btn"
            onClick={() => {
              handleBooking();
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

      <div>
        <ReactSimpleKeyboard
          keyboardRef={(r) => (keyboardRef.current = r)}
          onKeyPress={onKeyPress}
          inputName={activeInput}
          display={{
            "{bksp}": "DEL",
            "{space}": "SPACE",
          }}
          layout={{
            default: [
              "1 2 3 4 5 6 7 8 9 0 {bksp}",
              "Q W E R T Y U I O P",
              "A S D F G H J K L",
              "Z X C V B N M",
              "{space}",
            ],
          }}
        />
      </div>
    </>
  );
};

export default GuestName;
