import Aos from "aos";
import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { getSessionItem, setSessionItem } from "../../hooks/session";
import moment from "moment";
import { getBookingDetails } from "../../redux/reducers/Booking/booking";
import { getImageSrc } from "../../utils/bulkImageStorage";
import { currency } from "../../utils/data";
import { playSafeAudio } from "../../utils/commonFun";

const ReviewConfirmation = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const { bookingLoading, activeBookingList, getBookingDetailsData } =
    useSelector(({ booking }) => booking);

  const selectedBooking = getSessionItem("selectedSelfieBookingData");
  const selectedBookingData = JSON.parse(selectedBooking);

  const activeBookingsList = activeBookingList?.length
    ? activeBookingList
    : selectedBookingData?.booking_details;

  const booking = selectedBookingData?.booking_details
    ? activeBookingsList?.[0]?.booking
    : activeBookingsList?.[0] || null;

  const earlyCharge = getSessionItem("earlyCheckInAmount");
  const showSelfie = getSessionItem("setShowSelfie");
  const userData = getSessionItem("hotelKiosk");
  const userSession = userData
    ? JSON.parse(decodeURIComponent(escape(atob(userData))))
    : null;

  const { activeCurrencyList } = useSelector(
    ({ paymentMethod }) => paymentMethod
  );

  const currencySymbol = useMemo(() => {
    return activeCurrencyList?.find(
      (item) => item?.id === userSession?.hotel?.currency
    );
  }, [activeCurrencyList, userSession?.hotel?.currency]);

  useEffect(() => {
    if (booking?.id) dispatch(getBookingDetails(booking?.id));
  }, [booking?.id]);

  useEffect(() => {
    Aos.init({
      duration: 1000,
      once: true,
      easing: "ease-in-out",
    });
    playSafeAudio("confirm_reservation");
  }, []);

  // Check if activeBookingsList is empty or undefined
  if (!activeBookingsList || activeBookingsList?.length === 0) {
    return bookingLoading ? (
      <div className="common-loader">
        <div className="spinner-border">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    ) : (
      <div className="my-auto">
        <h1 className="heading-h1" data-aos="fade-up" data-aos-delay="500">
          {t("No_active_bookings_found")}
        </h1>

        <button
          className="common-btn black-btn"
          onClick={() => navigate("/check-in/find-booking")}
        >
          {t("Start_Over")}
        </button>
      </div>
    );
  }

  // Get the first booking from the list

  // Calculate the number of nights
  const checkInDate = new Date(booking.check_in_date);
  const checkOutDate = new Date(booking.check_out_date);
  const nights = Math.ceil(
    (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)
  );

  // Calculate the price per night
  const pricePerNight = parseFloat(booking.total_charge) / nights;
  const totalTax = parseFloat(booking.total_tax) || 0;

  const totalAmount = parseFloat(booking.total_charge) + parseFloat(totalTax);
  const displayTotalAmount = totalAmount + earlyCharge;

  return (
    <>
      <div className="my-auto">
        <h1 className="heading-h1" data-aos="fade-up" data-aos-delay="500">
          {t("Review_and")}
          <br />
          {t("Confirm_Reservation")}
        </h1>

        <div
          className="custom-card mb-5"
          data-aos="fade-up"
          data-aos-delay="1000"
        >
          <div className="custom-card-wrap p-3">
            <div className="revirew-box p-4">
              <h2 className="font-poppins">
                {`${moment(booking?.check_in_date).format(
                  "MMM D, YYYY"
                )} - ${moment(booking?.check_out_date).format(
                  "MMM D, YYYY"
                )} (${moment(booking?.check_out_date).diff(
                  moment(booking?.check_in_date),
                  "days"
                )} Nights)`}{" "}
                <br />
                {booking.type_name}
              </h2>
              <div className="black-border-bottom"></div>
              {[...Array(nights)]?.map((_, index) => {
                const date = new Date(checkInDate);
                date.setDate(date.getDate() + index);
                return (
                  <div
                    key={index}
                    className="d-flex align-items-center justify-content-between"
                  >
                    <h2>{date.toDateString()}</h2>
                    <h2 className="white-text">
                      {currencySymbol?.symbol || currency}{" "}
                      {pricePerNight.toFixed(2)}{" "}
                      {currencySymbol?.code_name?.toUpperCase()}
                    </h2>
                  </div>
                );
              })}

              <div className="d-flex align-items-center justify-content-between">
                <h2 className="mb-0">{t("Taxes_and_Fees")}</h2>
                <h2 className="white-text mb-0">
                  {currencySymbol?.symbol || currency}{" "}
                  {parseFloat(totalTax).toFixed(2)}{" "}
                  {currencySymbol?.code_name?.toUpperCase()}
                </h2>
              </div>
            </div>
          </div>
        </div>

        <div
          className="custom-card mb-4"
          data-aos="fade-up"
          data-aos-delay="1500"
        >
          <div className="custom-card-wrap fs-3 text-yellow text-uppercase py-3 text-center">
            {t("Early_checkin_extra")}{" "}
            <strong>
              {currencySymbol?.symbol || currency} {earlyCharge || 0}
            </strong>{" "}
            {currencySymbol?.code_name?.toUpperCase()}
          </div>
        </div>

        <div
          className="custom-card total-box-section mb-5"
          data-aos="fade-up"
          data-aos-delay="1500"
        >
          <div className="custom-card-wrap p-3">
            <div className="total-box d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-3">
                <img src={getImageSrc("AccountIcon")} alt="account" />
                <h2 className="mb-0"> {t("Total")} </h2>
              </div>
              <h2 className="blue-text mb-0">
                {currencySymbol?.symbol || currency}{" "}
                {displayTotalAmount.toFixed(2)}{" "}
                {currencySymbol?.code_name?.toUpperCase()}
              </h2>
            </div>
          </div>
        </div>
        <div
          className="d-flex align-items-center justify-content-between"
          data-aos="fade-up"
          data-aos-delay="2000"
        >
          <button className="common-btn black-btn" onClick={() => navigate(-1)}>
            {t("Back")}
          </button>
          <button
            className="common-btn blue-btn"
            onClick={() => {
              setSessionItem("amountTotal", parseFloat(totalAmount).toFixed(2));
              setSessionItem("totalTax", parseFloat(totalTax).toFixed(2));
              if (
                getBookingDetailsData?.guest_primary?.guest?.email_details
                  ?.length < 0 ||
                getBookingDetailsData?.guest_primary?.guest?.phone_details
                  ?.length < 0
              ) {
                navigate("/check-in/contact-information");
              } else {
                if (showSelfie) {
                  navigate("/selfie");
                } else {
                  navigate("/check-in/questions");
                }
              }
            }}
          >
            {t("Continue")}
          </button>
        </div>
      </div>
    </>
  );
};

export default ReviewConfirmation;
