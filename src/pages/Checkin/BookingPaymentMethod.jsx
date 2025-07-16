import Aos from "aos";
import React, { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getSessionItem, setSessionItem } from "../../hooks/session";
import { useDispatch, useSelector } from "react-redux";
import { getPaymentMethodListData } from "../../redux/reducers/Booking/PaymentMethod";
import { getImageSrc } from "../../utils/bulkImageStorage";
import { addNewKioskAnswerItem } from "../../redux/reducers/Kiosk/KioskAnswer";
import { currency } from "../../utils/data";
import {
  ApplePay,
  GPay,
  MasterCard,
  USAPaymentMethod,
  AmericanExpress,
  VisaLogo,
} from "../../assets/image/Image";
import { playSafeAudio } from "../../utils/commonFun";

const BookingPaymentMethod = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const location = useLocation();
  const { key, keyData } = location.state || {};

  const hotelKiosk = getSessionItem("hotelKiosk");
  const userHotelSession = hotelKiosk
    ? JSON.parse(decodeURIComponent(escape(atob(hotelKiosk))))
    : null;

  const kioskData = getSessionItem("KioskConfig");
  const kioskSession = kioskData
    ? JSON.parse(decodeURIComponent(escape(atob(kioskData))))
    : null;

  const newKioskConfig = kioskSession?.[0];
  const bookingId = getSessionItem("bookingId");

  const { activeCurrencyList } = useSelector(
    ({ paymentMethod }) => paymentMethod
  );

  const currencySymbol = useMemo(() => {
    return activeCurrencyList?.find(
      (item) => item?.id === userHotelSession?.hotel?.currency
    );
  }, [activeCurrencyList, userHotelSession?.hotel?.currency]);

  const { activePaymentMethodList, appPaymentMethodLoading } = useSelector(
    ({ paymentMethod }) => paymentMethod
  );

  const amountTotal = getSessionItem("amountTotal");

  const cashPaymentId = activePaymentMethodList?.length
    ? activePaymentMethodList?.find((x) => x.code_name === "cash")?.id
    : null;

  const creditCardPaymentId = activePaymentMethodList?.length
    ? activePaymentMethodList?.find((x) => x.code_name === "credit_card")?.id
    : null;

  useEffect(() => {
    Aos.init({
      duration: 1000,
      once: true,
      easing: "ease-in-out",
    });
    playSafeAudio("select_payment");
  }, []);

  useEffect(() => {
    const paramData = {
      params: {
        code_name__in: "credit_card,debit_card,cash",
      },
    };
    dispatch(getPaymentMethodListData(paramData));

    if (bookingId) {
      // Get and parse questionAnswers - make sure it's an object
      let questionAnswers = getSessionItem("questionAnswers");

      // Check if the session data needs to be parsed
      if (typeof questionAnswers === "string") {
        try {
          questionAnswers = JSON.parse(questionAnswers);
        } catch (e) {
          // console.error("Error parsing questionAnswers:", e);
        }
      }

      if (questionAnswers && typeof questionAnswers === "object") {
        function transformData(sessionData, bookingId) {
          const kioskAnswers = Object.values(sessionData)
            .filter((item) => item && item.id && item.answer_id)
            .map((item) => ({
              question_id: item.id,
              question_options_id: item.answer_id,
            }));

          return {
            booking_id: bookingId,
            kiosk_answers: kioskAnswers,
          };
        }

        const transformedData = transformData(questionAnswers, bookingId);

        if (transformedData && transformedData.kiosk_answers.length > 0) {
          dispatch(addNewKioskAnswerItem({ payload: transformedData }));
        } else {
          // console.warn("No valid kiosk answers found, not dispatching");
        }
      } else {
        // console.warn("Invalid questionAnswers data:", questionAnswers);
      }
    }
  }, []);

  return (
    <>
      <div className="my-auto">
        <h1 data-aos="fade-up" data-aos-delay="500" className="heading-h1">
          {t("Select_a_Payment_Method")}
        </h1>

        <div
          className="custom-card cursor total-box-section mb-5"
          data-aos="fade-up"
          data-aos-delay="1000"
        >
          <div className="custom-card-wrap p-4">
            <div className="total-box d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-3">
                <img src={getImageSrc("AccountIcon")} alt="account" />
                <h2 className="mb-0">{t("Total_amount_due")}</h2>
              </div>
              <h2 className="blue-text mb-0">
                {currencySymbol?.symbol || currency}
                {amountTotal}{" "}
              </h2>
            </div>
          </div>
        </div>

        <div
          className="custom-card payment-card-section cursor mb-5"
          data-aos="fade-up"
          data-aos-delay="1500"
          onClick={() => {
            navigate("/check-in/payment", {
              state: {
                paymentId: creditCardPaymentId,
                keyData: keyData,
              },
            });
            setSessionItem("paymentMethod", "credit_card");
          }}
        >
          <div className="custom-card-wrap cursor">
            <div className="payment-card d-flex align-items-center">
              <img src={getImageSrc("CreditCard")} alt="credit-card" />
              <div>
                <h2>{t("CreditCard")}</h2>
                <h4>{t("We_accept_multiple_options")}</h4>
              </div>
            </div>
          </div>
        </div>
        {newKioskConfig?.cash_recycler_config && (
          <div
            className="custom-card payment-card-section cursor mb-5"
            data-aos="fade-up"
            data-aos-delay="2000"
            onClick={() => {
              navigate("/check-in/payment", {
                state: {
                  paymentId: cashPaymentId,
                  keyData: keyData,
                },
              });
              setSessionItem("paymentMethod", "cash");
            }}
          >
            <div className="custom-card-wrap cursor">
              <div className="payment-card d-flex align-items-center">
                <img src={getImageSrc("CashIcon")} alt="cash" />
                <div>
                  <h2>{t("Pay_with_Cash")}</h2>
                  <h4>{t("We_accept_multiple_options")}</h4>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div
        className="mb-4 mt-auto bg-transparent"
        data-aos="fade-up"
        data-aos-delay="2000"
      >
        <div className="supported-upi d-flex justify-content-center align-items-center gap-5 p-4">
          <img src={VisaLogo} alt="USAPaymentMethod" />
          <img src={MasterCard} alt="USAPaymentMethod" />
          <img src={AmericanExpress} alt="USAPaymentMethod" />
        </div>
      </div>

    </>
  );
};

export default BookingPaymentMethod;
