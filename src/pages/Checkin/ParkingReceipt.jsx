import Aos from "aos";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getSessionItem } from "../../hooks/session";
import moment from "moment";
import { playSafeAudio } from "../../utils/commonFun";

const ParkingReceipt = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const selectedBooking = getSessionItem("selectedSelfieBookingData");
  const selectedBookingData = JSON.parse(selectedBooking);
  
  const { activeBookingList, referenceNumber } = useSelector(
    ({ booking }) => booking
  );
  const booking = activeBookingList?.[0] || selectedBookingData?.booking_details?.[0]?.booking;
  const roomtype = getSessionItem("room_type");
  const roomTypeData = JSON.parse(roomtype);

  const check_In_Date = getSessionItem("checkInDate");
  const check_Out_Date = getSessionItem("checkOutDate");
  const checkInDate = booking?.check_in_date
    ? moment(booking?.check_in_date)
    : moment(check_In_Date);
  const checkOutDate = booking?.check_out_date
    ? moment(booking?.check_out_date)
    : moment(check_Out_Date);

  useEffect(() => {
    Aos.init({
      duration: 1000,
      once: true,
      easing: "ease-in-out",
    });
    playSafeAudio("print_parking_rec");
  }, []);

  return (
    <>
      <div className="my-auto">
        <div className="d-flex align-items-center justify-content-center gap-3 mb-5">
          <div className="spinner-border spinner-border-blue" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <h3 className="fs-52 text-center mb-0">
            {t("Printing_parking_pass_now")}
          </h3>
        </div>

        <div
          className="substract-bg thank-you-section d-flex flex-column pb-5"
          data-aos="fade-down"
          data-aos-delay="1000"
        >
          <div className="list-section">
            <div className="d-flex align-items-center justify-content-between">
              <h3>{t("Ref_Number")}</h3>
              <h3 className="text-gray">
                {booking?.reference_no || referenceNumber}
              </h3>
            </div>
            <div className="bottom-border-gray"></div>
            <div className="d-flex align-items-center justify-content-between">
              <h3>{t("Room_Type")}</h3>
              <h3 className="text-gray">
                {roomTypeData?.roomtype_name ||
                  selectedBookingData?.booking_details?.[0]?.booking_room[0]
                    ?.roomtype_name}
              </h3>
            </div>
            <div className="bottom-border-gray"></div>
            <div className="d-flex align-items-center justify-content-between">
              <h3>{t("Checkin_date")}</h3>
              <h3 className="text-gray">
                {checkInDate?.format("DD MMMM YYYY")}
              </h3>
            </div>
            <div className="bottom-border-gray"></div>
            <div className="d-flex align-items-center justify-content-between">
              <h3>{t("Checkout_date")}</h3>
              <h3 className="text-gray">
                {checkOutDate?.format("DD MMMM YYYY")}
              </h3>
            </div>
            <div className="bottom-border-gray"></div>
            <h3 className="d-flex align-items-center justify-content-center text-center mb-0">
              <span className="me-3">{t("Parking_pass_number")}</span>
              <span className="fs-86">
                {Math.floor(10000 + Math.random() * 90000)}
              </span>
            </h3>
          </div>
          <h4 className="thankyou-text">
            {t("Parking_pass_vehicle_dashboard")}
          </h4>
          <div className="text-end mt-auto">
            <button
              className="common-btn blue-btn lh-1"
              onClick={() => navigate("/check-in/thank-you")}
            >
              {t("Next")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ParkingReceipt;
