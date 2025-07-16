import Aos from "aos";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import successData from "../../assets/animations/success.json";
import Lottie from "lottie-react";
import { useTranslation } from "react-i18next";
import { getSessionItem, removeSessionItem } from "../../hooks/session";
import { playSuccess } from "../../utils/playBeep";
import { addRatingBooking } from "../../redux/reducers/Booking/ratingBooking";
import { useDispatch } from "react-redux";

const AgentThankYou = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThankYouMessage, setShowThankYouMessage] = useState(false);

  const agent_data = getSessionItem("AgentBookingDetails");
  const AgentBookingDetails = JSON.parse(agent_data);

  useEffect(() => {
    playSuccess();
    Aos.init({
      duration: 1000,
      once: true,
      easing: "ease-in-out",
    });

    setTimeout(() => {
      navigate("/home");
      removeSessionItem("AgentBookingDetails");
    }, 15000);
  }, []);

  // API call function to submit rating
  const submitRating = async (ratingValue) => {
    try {
      setIsSubmitting(true);

      const payload = {
        booking_id: AgentBookingDetails?.payload?.data?.booking?.id, // Adjust based on your booking object structure
        feedback_type: "checkin",
        rating_overall: ratingValue,
      };

      const resultAction = await dispatch(addRatingBooking(payload));

      if (addRatingBooking.fulfilled.match(resultAction)) {
        // Show thank you message
        setShowThankYouMessage(true);

        // Wait 5 seconds then navigate
        setTimeout(() => {
          navigate("/home");
          removeSessionItem("AgentBookingDetails");
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
          <h1 className="mb-3">{t("Your_Reservation_is_Successful")}</h1>
          <div className="list-section">
            <div className="d-flex align-items-center justify-content-between">
              <h3>{t("Ref_Number")}</h3>
              <h3 className="text-gray">
                {AgentBookingDetails?.payload?.data?.booking?.reference_no}
              </h3>
            </div>
            <div className="bottom-border-gray"></div>
            <div className="d-flex align-items-center justify-content-between">
              <h3>{t("Room_Type")}</h3>
              <h3 className="text-gray">
                {
                  AgentBookingDetails?.payload?.data?.booking_room?.[0]
                    ?.roomtype_name
                }
              </h3>
            </div>
            <div className="bottom-border-gray"></div>
            <div className="d-flex align-items-center justify-content-between">
              <h3>{t("Room")}</h3>
              <h3 className="text-gray">
                {
                  AgentBookingDetails?.payload?.data?.booking_room?.[0]
                    ?.rooms?.[0]?.room_number
                }
              </h3>
            </div>
            {/* {termsConditions && ( */}
            {/* <>
                <div className="bottom-border-gray"></div>
                <div className="d-flex align-items-center justify-content-between">
                  <h3>{t("Payment_Method")}</h3>
                  <h3 className="text-gray">
                    {paymentMethod === "cash" ? "Cash" : "Credit Card"}
                  </h3>
                </div>
              </> */}
            {/* )} */}
            <div className="bottom-border-gray"></div>
            <div className="d-flex align-items-center justify-content-between">
              <h3>{t("Total_Rooms")}</h3>
              <h3 className="text-gray">
                {
                  AgentBookingDetails?.payload?.data?.booking_room?.[0]?.rooms
                    ?.length
                }
              </h3>
            </div>
          </div>

          <div className="mt-auto mb-10">
            <h4 className={`thankyou-text my-auto"`}>
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

export default AgentThankYou;
