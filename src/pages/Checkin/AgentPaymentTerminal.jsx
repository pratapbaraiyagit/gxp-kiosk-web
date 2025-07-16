import Aos from "aos";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import successData from "../../assets/animations/success.json";
import errorData from "../../assets/animations/error.json";
import { getSessionItem, setSessionItem } from "../../hooks/session";
import moment from "moment";
import { useDispatch, useSelector } from "react-redux";
import { getBookingStatusListData } from "../../redux/reducers/Booking/bookingAvailability";
import {
  getBookingDetails,
  updateBookingDetails,
} from "../../redux/reducers/Booking/booking";
import Lottie from "lottie-react";
import { getPaymentListData } from "../../redux/reducers/Booking/Payment";
import { getCardTypeListData } from "../../redux/reducers/Booking/CardType";
import { getImageSrc } from "../../utils/bulkImageStorage";
import { addNewTerminalPayment } from "../../redux/reducers/Terminal/terminalCard";
import Proccess from "../../assets/image/gif/cc_insert.gif";
import { addGuestNewPayment } from "../../redux/reducers/Booking/GuestPayment";
import Swal from "sweetalert2";
import { playBeep, playSuccess } from "../../utils/playBeep";
import { currency } from "../../utils/data";

const AgentPaymentTerminal = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const location = useLocation();
  const { paymentId } = location.state || {};

  const { lastMessage } = useSelector(({ mqtt }) => mqtt);

  const kioskData = getSessionItem("KioskConfig");
  const kioskSession = kioskData
    ? JSON.parse(decodeURIComponent(escape(atob(kioskData))))
    : null;

  // Parse the message outside of the derived paymentStatus
  const [message, setMessage] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(false);

  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [stateResponse, setStateResponse] = useState("");
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  // Update message when lastMessage changes
  useEffect(() => {
    if (lastMessage && lastMessage.message) {
      try {
        const parsedMessage = JSON.parse(lastMessage.message);
        if (parsedMessage?.payload?.command === "info_reject") {
          playBeep();
          Swal.fire({
            text: parsedMessage?.payload?.command_message,
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

        setMessage(parsedMessage);
        // Update paymentStatus separately
        setPaymentStatus(parsedMessage?.cmd === "payment_status");
      } catch (error) {
        // console.error("Error parsing MQTT message:", error);
      }
    }
  }, [lastMessage]);

  const paymentMethod = getSessionItem("paymentMethod");

  const KioskDeviceInfo = getSessionItem("KioskDeviceInfo");
  const KioskDeviceInfoSession = KioskDeviceInfo
    ? JSON.parse(decodeURIComponent(escape(atob(KioskDeviceInfo))))
    : null;
  const terminalID = KioskDeviceInfoSession?.[0]?.terminal_id;

  const collectAmount = getSessionItem("collect_amount") || 50;
  const termsConditions = getSessionItem("terms_and_conditions");

  const { activeBookingList, getBookingDetailsData } = useSelector(
    ({ booking }) => booking
  );
  const { activeCardTypeList } = useSelector(({ cardType }) => cardType);
  const { activePaymentList } = useSelector(({ payment }) => payment);

  const userData = getSessionItem("hotelKiosk");
  const bookingId = getSessionItem("bookingId");

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

  const booking = activeBookingList?.[0];
  const { activeBookingStatusList } = useSelector(
    ({ bookingAvailability }) => bookingAvailability
  );

  const bookingStatusId = activeBookingStatusList?.length
    ? activeBookingStatusList?.find((x) => x.code_name === "checked_out")?.id
    : null;

  const [transactionStatus, setTransactionStatus] = useState({
    isTerminalLoading: false,
    errorTerminal: null,
    successTerminal: false,
  });

  useEffect(() => {
    if (bookingId) {
      dispatch(getBookingDetails(bookingId));
    }
  }, [bookingId]);

  const handleCreditCardTransaction = async () => {
    setTransactionStatus({
      isTerminalLoading: true,
      errorTerminal: null,
      successTerminal: false,
    });

    try {
      const payload = {
        terminal_id: terminalID,
        booking_id: bookingId,
      };
      const resultAction = await dispatch(addNewTerminalPayment(payload));
      if (addNewTerminalPayment.fulfilled.match(resultAction)) {
        // Payment request initiated successfully
        // Status will be updated by the MQTT paymentStatus effect
      } else {
        throw new Error("Failed to update terminal status");
      }
    } catch (error) {
      setTransactionStatus((prev) => ({
        ...prev,
        isTerminalLoading: false,
        errorTerminal: error,
      }));
    }
  };

  // This effect now depends on paymentStatus which is a state variable
  // that gets properly updated when a new message comes in
  useEffect(() => {
    if (paymentStatus && message) {
      if (message?.response?.status === "Approved") {
        setTransactionStatus((prev) => ({
          ...prev,
          isTerminalLoading: false,
          successTerminal: true,
        }));
        setShowSuccessAnimation(true);
        setStateResponse(message?.response?.status);
      } else {
        setTransactionStatus((prev) => ({
          ...prev,
          isTerminalLoading: false,
          errorTerminal: "error",
        }));
        setShowSuccessAnimation(true);
        setStateResponse(message?.response?.status);
      }
    }
  }, [paymentStatus, message]);

  useEffect(() => {
    Aos.init({
      duration: 1000,
      once: true,
      easing: "ease-in-out",
    });
    dispatch(getBookingStatusListData());
    const data = {
      params: {
        "apm.id": paymentId,
      },
    };
    dispatch(getPaymentListData(data));
    dispatch(getCardTypeListData());
  }, []);

  useEffect(() => {
    setTimeout(() => {
      // handleCreditCardTransaction();
    }, 1000);
    setTimeout(() => {
      navigate("/home");
    }, 10000);
  }, []);

  const continueProcess = () => {
    if (termsConditions === "checkout") {
      const updatePayload = {
        booking: {
          id: booking?.id,
          status_id: bookingStatusId,
        },
      };
      dispatch(updateBookingDetails(updatePayload));
      navigate("/check-in/thank-you");
    } else {
      if (termsConditions === "reservation") {
        navigate("/check-in/key-receipt");
        if (activePaymentList?.[0]?.id || activeCardTypeList?.[0]?.id) {
          const paymentPayload = {
            payment_id: activePaymentList?.[0]?.id,
            card_type_id: activeCardTypeList?.[0]?.id,
            is_primary: true,
            is_active: true,
          };
          const updatedPaymentPayload = {
            ...paymentPayload,
            guest_id: getBookingDetailsData?.guest_primary?.guest_id,
          };
          dispatch(addGuestNewPayment(updatedPaymentPayload));
        }
      }
      if (termsConditions === "checkin") {
        navigate("/check-in/key-receipt");
      }
      setSessionItem("PaymentTime", moment().format("DD MMMM YYYY, h:mm:ss A"));
    }
  };

  return (
    <>
      <div className="my-auto">
        <div
          className="d-flex align-items-end justify-content-between gap-5 mb-5"
          data-aos="fade-up"
          data-aos-delay="500"
        >
          <h1 className="heading-h1 mb-0">{t("Pay_by_Credit_Card")}</h1>
          <h3 className="heading-s3 mb-0">{t("Follow_instructions_below")}</h3>
        </div>

        <div
          className="custom-card total-box-section mb-5"
          data-aos="fade-up"
          data-aos-delay="1000"
        >
          <div className="custom-card-wrap total-box p-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-3">
                <img src={getImageSrc("AccountIcon")} alt="account" />
                <h2 className="mb-0">{t("Total_amount_due")}</h2>
              </div>
              <h2 className="blue-text mb-0">
                {currencySymbol?.symbol || currency}
                {collectAmount}
              </h2>
            </div>
          </div>
        </div>

        <div
          className={`${
            !paymentProcessing && "inser-cash-warpper"
          } border-radius`}
          data-aos="fade-up"
          data-aos-delay="1500"
        >
          {!showSuccessAnimation && (
            <img
              src={Proccess}
              alt="cc-insert"
              className="cc-insert d-block mx-auto img-fluid"
            />
          )}
          {showSuccessAnimation && (
            <>
              {stateResponse === "Approved" ? (
                <>
                  {playSuccess()}
                  <div className="payment-success">
                    <Lottie
                      animationData={successData}
                      loop="20"
                      speed="0.5"
                      style={{ height: 300 }}
                      className="success-json"
                    />
                  </div>
                </>
              ) : (
                <>
                  {playBeep()}
                  <div className="payment-success">
                    <Lottie
                      animationData={errorData}
                      loop="20"
                      speed="0.5"
                      style={{ height: 300 }}
                      className="success-json"
                    />
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default AgentPaymentTerminal;
