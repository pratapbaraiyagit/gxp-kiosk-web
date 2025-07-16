import Aos from "aos";
import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getSessionItem, setSessionItem } from "../../hooks/session";
import { getImageSrc } from "../../utils/bulkImageStorage";
import { useSelector } from "react-redux";
import { currency } from "../../utils/data";
import { playSafeAudio } from "../../utils/commonFun";

const ReviewConfirmations = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const earlyCharge = getSessionItem("earlyCheckInAmount");
  const check_In_Date = getSessionItem("checkInDate");
  const check_Out_Date = getSessionItem("checkOutDate");
  const room_type_Data = getSessionItem("roomType");
  const roomTypeData = JSON.parse(room_type_Data);

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

  const totalCharge = parseFloat(
    roomTypeData?.rate_details?.[0]?.rate_room_type?.[0]?.rate_in_summary
      ?.avg_rate_final || 0
  );
  const total_Tax = parseFloat(
    roomTypeData?.rate_details?.[0]?.rate_room_type?.[0]?.rate_in_summary
      ?.avg_tax_amount || 0
  );

  useEffect(() => {
    Aos.init({
      duration: 1000,
      once: true,
      easing: "ease-in-out",
    });
    playSafeAudio("confirm_reservation");
  }, []);

  // Calculate the number of nights - include both check-in and check-out dates
  const checkInDate = new Date(check_In_Date);
  const checkOutDate = new Date(check_Out_Date);
  const nights = Math.ceil(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Calculate the price per night
  const totalTax = parseFloat(total_Tax) * nights || 0;

  // const totalAmount = totalCharge * nights + totalTax;
  const totalAmount = parseFloat(
    roomTypeData?.rate_details?.[0]?.rate_room_type?.[0]?.rate_in_summary
      ?.total_final_amount || 0
  );

  const displayTotalAmount =
    parseFloat(totalAmount) + parseFloat(earlyCharge || 0);

  const capitalizeFirstLetter = (str) =>
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

  // Function to format the date with only the first letter of month capitalized
  const formatDate = (date) => {
    const options = { day: "numeric", month: "short", year: "numeric" };
    const [month, day, year] = date
      .toLocaleDateString("en-US", options)
      .split(" ");

    return `${capitalizeFirstLetter(month)} ${day} ${year}`;
  };

  // Function to format the date with weekday and month capitalized correctly
  const formatSecondDate = (date) => {
    const options = {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    };
    const [weekday, month, day, year] = date
      .toLocaleDateString("en-US", options)
      .split(" ");

    return `${capitalizeFirstLetter(weekday)} ${capitalizeFirstLetter(
      month
    )} ${day} ${year}`;
  };

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
                {`${formatDate(checkInDate)} - ${formatDate(
                  checkOutDate
                )} (${nights} Nights)`}{" "}
                <br />
                {roomTypeData?.roomtype_name}
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
                    <h2>{formatSecondDate(date)}</h2>
                    <h2 className="white-text">
                      {currencySymbol?.symbol || currency}{" "}
                      {totalCharge.toFixed(2)}{" "}
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
              navigate("/check-in/contact-information");
            }}
          >
            {t("Continue")}
          </button>
        </div>
      </div>
    </>
  );
};

export default ReviewConfirmations;
