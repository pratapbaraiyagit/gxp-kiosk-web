import React, { useEffect } from "react";
import PageInput from "../../components/PageInput";
import { Link, useNavigate } from "react-router-dom";
import Aos from "aos";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { setIsBookingNotFound } from "../../redux/reducers/Booking/booking";
import Swal from "sweetalert2";
import useIDScanner from "../../hooks/useIDScanner";
import { getImageSrc } from "../../utils/bulkImageStorage";

const FindBooking = () => {
  const {
    isConnected,
    connectScanner,
    statusScanner,
    calibrateScanner,
    captureScanner,
  } = useIDScanner();

  // useEffect(() => {
  //   if (isConnected) {
  //     statusScanner();
  //   }
  // }, []);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { bookingNotFound } = useSelector(({ booking }) => booking);

  useEffect(() => {
    Aos.init({
      duration: 1000,
      once: true,
      easing: "ease-in-out",
    });
  }, []);

  useEffect(() => {
    if (bookingNotFound) {
      // Swal.fire({
      //   // title: t("Please_enter_code"),
      //   text: t("Booking_Not_Found"),
      //   icon: "error",
      //   confirmButtonText: t("Ok"),
      //   showClass: {
      //     popup: `
      //       animate__animated
      //       animate__fadeInUp
      //       animate__faster
      //     `,
      //   },
      //   hideClass: {
      //     popup: `
      //       animate__animated
      //       animate__fadeOutDown
      //       animate__faster
      //     `,
      //   },
      // });
      dispatch(setIsBookingNotFound(false));
    }
  }, [bookingNotFound]);

  return (
    <>
      <div className="my-auto">
        <h1 className="heading-h1" data-aos="fade-up" data-aos-delay="500">
          {t("FindReservation")}
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
          onClick={() => navigate("/check-in/confirmation-code")}
        >
          <div className="d-flex align-items-center gap-40">
            <img
              src={getImageSrc("refrenceCode")}
              alt="scan-img"
              className="rounded-5"
            />
            <div>
              <h2> {t("ConfirmationNumber")}</h2>
            </div>
          </div>
        </div>
        <h3
          className="reservation-text font-poppins mb-5"
          data-aos="fade-up"
          data-aos-delay="2000"
        >
          <p className="mb-0"> {t("Locate")}</p>
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
          <Link to="/check-in/scan-proof">
            <button
              className="black-small-btn"
              data-aos="fade-down"
              data-aos-delay="2700"
            >
              {t("Passport")}
            </button>
          </Link>
        </div>
      </div>
    </>
  );
};

export default FindBooking;
