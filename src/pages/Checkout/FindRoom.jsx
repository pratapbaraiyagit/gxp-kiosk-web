import Aos from "aos";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import PageInput from "../../components/PageInput";
import Swal from "sweetalert2";
import { useDispatch, useSelector } from "react-redux";
import { getSessionItem } from "../../hooks/session";
import {
  setIsBookingNotFound,
  setIsActiveBookingList,
} from "../../redux/reducers/Booking/booking";
import useIDScanner from "../../hooks/useIDScanner";
import { getImageSrc } from "../../utils/bulkImageStorage";
import { playBeep } from "../../utils/playBeep";

const FindRoom = () => {
  const {
    isConnected,
    connectScanner,
    statusScanner,
    calibrateScanner,
    captureScanner,
  } = useIDScanner();

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const termsAndConditions = getSessionItem("terms_and_conditions");

  const { activeBookingList, bookingNotFound } = useSelector(
    ({ booking }) => booking
  );

  const { activeBookingStatusList } = useSelector(
    ({ bookingAvailability }) => bookingAvailability
  );

  const checkInStatusId = activeBookingStatusList?.length
    ? activeBookingStatusList?.find((x) => x.code_name === "checked_in")?.id
    : null;

  const booking = activeBookingList?.[0];

  useEffect(() => {
    Aos.init({
      duration: 1000,
      once: true,
      easing: "ease-in-out",
    });
  }, []);

  useEffect(() => {
    if (
      checkInStatusId !== booking?.status_id &&
      termsAndConditions === "checkout" &&
      bookingNotFound
    ) {
      dispatch(setIsBookingNotFound(false));
      dispatch(setIsActiveBookingList([]));
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
      return;
    }
  }, [bookingNotFound]);

  return (
    <>
      <div className="my-auto">
        <h1 className="heading-h1" data-aos="fade-up" data-aos-delay="500">
          {t("Check_out_option")}
        </h1>

        <div
          className="md-black-bg driving-license mb-5 cursor"
          data-aos="fade-up"
          data-aos-delay="1000"
          onClick={() => (!isConnected ? navigate("/check-in/scan-proof") : "")}
        >
          <div className="d-flex align-items-center gap-40">
            <img
              src={getImageSrc("LicenseImg")}
              alt="scan-img"
              className="rounded-5"
            />
            <div>
              <h2>{t("ScanLicense")}</h2>
              <h4 className="mb-0">{t("AnotherID")}</h4>
            </div>
          </div>
        </div>
        <div
          className="md-black-bg driving-license mb-5 cursor"
          data-aos="fade-up"
          data-aos-delay="1000"
          onClick={() => navigate("/check-out/room-key")}
        >
          <div className="d-flex align-items-center gap-40">
            <img
              src={getImageSrc("roomNumber")}
              alt="scan-img"
              className="rounded-5"
            />
            <div>
              <h2>{t("EnterRoomNumber")}</h2>
            </div>
          </div>
        </div>
        {/* <div
          className="md-black-bg common-input-number-section mb-5 cursor"
          data-aos="fade-up"
          data-aos-delay="1500"
          onClick={() => navigate("/check-out/room-key")}
        >
          <PageInput
            numDigits={4}
            onClick={() => navigate("/check-out/room-key")}
            warpperClass="squre-input"
          />
          <h3 className="font-poppins mb-0 lh-1">{t("EnterRoomNumber")}</h3>
        </div> */}

        <h3
          className="reservation-text font-poppins mb-5"
          data-aos="fade-up"
          data-aos-delay="2000"
        >
          <p className="mb-0"> {t("Or_checkout_with")}</p>
        </h3>

        <div className="d-flex align-items-center justify-content-center gap-4">
          <Link to="/check-in/guest-name">
            <button
              className="black-small-btn"
              data-aos="fade-down"
              data-aos-delay="2500"
            >
              {t("FirstName_LastName")}
            </button>
          </Link>
        </div>
      </div>
    </>
  );
};

export default FindRoom;
