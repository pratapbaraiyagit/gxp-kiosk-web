import Aos from "aos";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import successData from "../../assets/animations/success.json";
import Lottie from "lottie-react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import {
  getSessionItem,
  removeSessionItem,
  setSessionItem,
} from "../../hooks/session";
import { playSuccess } from "../../utils/playBeep";
import { addRatingBooking } from "../../redux/reducers/Booking/ratingBooking";
import { playSafeAudio } from "../../utils/commonFun";

const ThankYou = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThankYouMessage, setShowThankYouMessage] = useState(false);

  const selectedBooking = getSessionItem("selectedSelfieBookingData");
  const selectedBookingData = JSON.parse(selectedBooking);

  const { activeBookingList, referenceNumber } = useSelector(
    ({ booking }) => booking
  );
  const booking =
    activeBookingList?.[0] ||
    selectedBookingData?.booking_details?.[0]?.booking;

  const bookingId = getSessionItem("bookingId");
  const paymentMethod = getSessionItem("paymentMethod");
  const PaymentTime = getSessionItem("PaymentTime");
  const termsConditions = getSessionItem("terms_and_conditions");
  const user_data = getSessionItem("userData");
  const userData = JSON.parse(user_data);

  useEffect(() => {
    playSuccess();
    Aos.init({
      duration: 1000,
      once: true,
      easing: "ease-in-out",
    });
    setTimeout(() => {
      removeSessionItem("SelfieGetData");
      removeSessionItem("userData");
      removeSessionItem("profile_picture");
      removeSessionItem("setShowSelfie");
      removeSessionItem("selectedSelfieBookingData");
      removeSessionItem("selfieBookingData");
      navigate("/selfie-splash");
      setSessionItem("laneClose", "true");
    }, 15000);
    playSafeAudio("check_in_rateing");
  }, []);

  // API call function to submit rating
  const submitRating = async (ratingValue) => {
    try {
      setIsSubmitting(true);

      const payload = {
        booking_id: bookingId, // Adjust based on your booking object structure
        feedback_type: termsConditions === "checkout" ? "checkout" : "checkin",
        rating_overall: ratingValue,
      };

      const resultAction = await dispatch(addRatingBooking(payload));

      if (addRatingBooking.fulfilled.match(resultAction)) {
        // Show thank you message
        setShowThankYouMessage(true);

        // Wait 5 seconds then navigate
        setTimeout(() => {
          removeSessionItem("SelfieGetData");
          removeSessionItem("userData");
          removeSessionItem("profile_picture");
          removeSessionItem("setShowSelfie");
          removeSessionItem("selectedSelfieBookingData");
          removeSessionItem("selfieBookingData");
          navigate("/selfie-splash");
          setSessionItem("laneClose", "true");
        }, 5000);
      } else {
        console.error("Failed to submit rating");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      setIsSubmitting(false);
    }
  };

  const handleStarClick = (starValue) => {
    if (!isSubmitting && !showThankYouMessage) {
      setRating(starValue);
      submitRating(starValue);
    }
  };

  const now = new Date();
  const currentTime = now.toLocaleTimeString();
  const currentDate = now.toLocaleDateString();

  return (
    <>
      <div className="my-auto">
        <div
          className="substract-bg thank-you-section d-flex flex-column"
          data-aos="fade-down"
          data-aos-delay="500"
        >
          <Lottie
            animationData={successData}
            loop="2"
            speed="0.5"
            style={{ height: 200 }}
            className="success-json"
          />
          <h1 className="mb-3">
            {termsConditions === "checkout"
              ? t("Checkout_success")
              : t("Your_Reservation_is_Successful")}
          </h1>
          {termsConditions === "checkout" ? (
            <div className="list-section">
              <div className="d-flex align-items-center justify-content-between">
                <h3>{t("Ref_Number")}</h3>
                <h3 className="text-gray">
                  {booking?.reference_no || referenceNumber}
                </h3>
              </div>
              <div className="bottom-border-gray"></div>
              <div className="d-flex align-items-center justify-content-between">
                <h3>Room: </h3>
                <h3 className="text-gray">{booking?.room_number}</h3>
              </div>
              <div className="bottom-border-gray"></div>
              <div className="d-flex align-items-center justify-content-between">
                <h3>Date: </h3>
                <h3 className="text-gray">{currentDate}</h3>
              </div>
              <div className="bottom-border-gray"></div>
              <div className="d-flex align-items-center justify-content-between">
                <h3>Time: </h3>
                <h3 className="text-gray">{currentTime}</h3>
              </div>
              <div className="bottom-border-gray"></div>
            </div>
          ) : (
            <div className="list-section">
              <div className="d-flex align-items-center justify-content-between">
                <h3>{t("Ref_Number")}</h3>
                <h3 className="text-gray">
                  {booking?.reference_no || referenceNumber}
                </h3>
              </div>
              <div className="bottom-border-gray"></div>
              <div className="d-flex align-items-center justify-content-between">
                <h3>{t("Payment_time")}</h3>
                <h3 className="text-gray">{PaymentTime}</h3>
              </div>
              {termsConditions && (
                <>
                  <div className="bottom-border-gray"></div>
                  <div className="d-flex align-items-center justify-content-between">
                    <h3>{t("Payment_Method")}</h3>
                    <h3 className="text-gray">
                      {paymentMethod === "cash" ? "Cash" : "Credit Card"}
                    </h3>
                  </div>
                </>
              )}
              <div className="bottom-border-gray"></div>
              <div className="d-flex align-items-center justify-content-between">
                <h3>{t("Total_Rooms")}</h3>
                <h3 className="text-gray">01</h3>
              </div>
            </div>
          )}

          <div className="mt-auto mb-10">
            <h4
              className={`thankyou-text ${
                termsConditions === "checkout" ? "my-5" : "my-5"
              }`}
            >
              {t("Thank_you_nice_day")}
            </h4>

            <div className="fs-86">
              {[...Array(5)].map((_, index) => {
                const starValue = index + 1;
                return (
                  <span
                    key={starValue}
                    onClick={() => handleStarClick(starValue)}
                    onMouseEnter={() =>
                      !isSubmitting &&
                      !showThankYouMessage &&
                      setHover(starValue)
                    }
                    onMouseLeave={() =>
                      !isSubmitting && !showThankYouMessage && setHover(0)
                    }
                    style={{
                      cursor:
                        isSubmitting || showThankYouMessage
                          ? "default"
                          : "pointer",
                      color:
                        starValue <= (hover || rating) ? "#FFCC00" : "#E4E5E9",
                      opacity: isSubmitting || showThankYouMessage ? 0.7 : 1,
                    }}
                  >
                    ★
                  </span>
                );
              })}
            </div>

            {isSubmitting && (
              <p className="fs-3 text-center" style={{ color: "#FFA500" }}>
                Submitting your rating...
              </p>
            )}

            {!isSubmitting && !showThankYouMessage && (
              <p className="fs-3 text-center" style={{ color: "#FFCC00" }}>
                {t("Your_review_help_us")}
              </p>
            )}

            {showThankYouMessage && (
              <p className="fs-3 text-center" style={{ color: "#5EEA02" }}>
                {t("Thank_you_for_your_rating")}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ThankYou;
