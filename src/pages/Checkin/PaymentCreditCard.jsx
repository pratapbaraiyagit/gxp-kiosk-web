import Aos from "aos";
import React, { useEffect, useMemo, useState } from "react";
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
import axios from "axios";
import { notification } from "../../helpers/middleware";
import Lottie from "lottie-react";
import useCashDispenser from "../../hooks/useCashDispenser";
import { getPaymentListData } from "../../redux/reducers/Booking/Payment";
import { getCardTypeListData } from "../../redux/reducers/Booking/CardType";
import { getImageSrc } from "../../utils/bulkImageStorage";
import { cashRecyclerAction } from "../../redux/reducers/MQTT/cashRecycler";
import {
  addNewTerminalPayment,
  updatePaymentTerminalStatus,
} from "../../redux/reducers/Terminal/terminalCard";
import cashCollectNew from "../../assets/image/gif/cash_collect_new.gif";
import cashPayoutNew from "../../assets/image/gif/cash_payout_new.gif";
import CardInsertGif from "../../assets/image/gif/cc-insert.gif";
import { addGuestNewPayment } from "../../redux/reducers/Booking/GuestPayment";
import { currency } from "../../utils/data";
import { playSafeAudio } from "../../utils/commonFun";

const PaymentCreditCard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const location = useLocation();
  const { paymentId } = location.state || {};
  const { key, keyData } = location.state || {};

  const { lastMessage } = useSelector(({ mqtt }) => mqtt);

  // Parse the message outside of the derived paymentStatus
  const [message, setMessage] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(false);

  // Update message when lastMessage changes
  useEffect(() => {
    if (lastMessage && lastMessage.message) {
      try {
        const parsedMessage = JSON.parse(lastMessage.message);
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

  const { activeKioskDeviceList } = useSelector(
    ({ kioskDevice }) => kioskDevice
  );
  const deviceIds =
    activeKioskDeviceList?.map((device) => device.id).filter(Boolean) || [];

  const {
    cashDispenserError,
    cashPayout,
    cashCollect,
    getBalance,
    getBalanceData,
    payOutState,
  } = useCashDispenser();
  const amountTotal = getSessionItem("amountTotal");
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

  const kioskData = getSessionItem("KioskConfig");
  const kioskSession = kioskData
    ? JSON.parse(decodeURIComponent(escape(atob(kioskData))))
    : null;

  const newKioskConfig = kioskSession?.[0];

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

  const hotelKiosk = getSessionItem("hotelKiosk");
  const userHotelSession = hotelKiosk
    ? JSON.parse(decodeURIComponent(escape(atob(hotelKiosk))))
    : null;

  const [stateResponse, setStateResponse] = useState("");
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

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
        playSafeAudio("cc_failed")
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
    if (paymentMethod === "credit_card") {
      dispatch(getCardTypeListData());
    }
  }, []);

  useEffect(() => {
    if (cashDispenserError === "Connection timeout") {
      navigate(-1);
    }
  }, [cashDispenserError]);

  const Dispenser = async () => {
    try {
      if (
        location.pathname.includes("check-in") &&
        termsConditions === "reservation" &&
        newKioskConfig?.cash_recycler_config?.is_active
      ) {
        dispatch(
          cashRecyclerAction({
            cmd: "collection",
            device_uuid_list: deviceIds,
            payload: { total_amount: 1, booking_id: "" },
          })
        )
          .then((res) => {
            if (res) {
              if (
                message?.cmd === "transaction_operations" &&
                message?.payload?.command_result === "success"
              ) {
                setSessionItem(
                  "PaymentTime",
                  moment().format("DD MMMM YYYY, h:mm:ss A")
                );
                navigate("/check-in/key-receipt", {
                  state: {
                    paymentVerify: true,
                  },
                });
              }
            }
          })
          .catch((error) => {
            navigate(-1);
          });
      }
      if (
        location.pathname.includes("check-in") &&
        termsConditions === "checkin" &&
        newKioskConfig?.cash_recycler_config?.is_active
      ) {
        dispatch(
          cashRecyclerAction({
            cmd: "collection",
            device_uuid_list: deviceIds,
            payload: { total_amount: 1, booking_id: "" },
          })
        )
          .then((res) => {
            if (res) {
              if (
                message?.cmd === "transaction_operations" &&
                message?.payload?.command_result === "success"
              ) {
                setSessionItem(
                  "PaymentTime",
                  moment().format("DD MMMM YYYY, h:mm:ss A")
                );
                navigate("/check-in/key-receipt", {
                  state: {
                    paymentVerify: true,
                  },
                });
              }
            }
          })
          .catch((error) => {
            navigate(-1);
          });
      }
      if (location.pathname.includes("check-out")) {
        const getBalanceCheck = await getBalance();
        if (payOutState) {
        }
        // Only try to parse getBalanceData if getBalance was successful
        if (getBalanceCheck && getBalanceData) {
          try {
            const balanceArray = JSON.parse(getBalanceData);
            // Now do cash payout if needed
            const success = await cashPayout();
            if (success) {
              setSessionItem(
                "PaymentTime",
                moment().format("DD MMMM YYYY, h:mm:ss A")
              );
            } else {
              navigate(-1);
            }
          } catch (parseError) {
            navigate(-1);
          }
        } else {
          navigate(-1);
        }
      }
    } catch (error) {
      // console.error("Error in Dispenser function:", error);
    }
  };

  useEffect(() => {
    if (paymentMethod === "cash") {
      Dispenser();
    }
    if (paymentMethod === "credit_card") {
      setTimeout(() => {
        handleCreditCardTransaction();
      }, 1000);
    }

  }, []);

  useEffect(() => {
    if (!showSuccessAnimation)
      playSafeAudio("cc_payment");
  }, [showSuccessAnimation]);

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
        if (paymentMethod === "credit_card") {
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
        } else if (paymentMethod === "cash") {
          if (activePaymentList?.[0]?.id) {
            const paymentPayload = {
              payment_id: activePaymentList?.[0]?.id,
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
      }
      if (termsConditions === "checkin") {
        navigate("/check-in/key-receipt");
      }
      setSessionItem("PaymentTime", moment().format("DD MMMM YYYY, h:mm:ss A"));
      cashRecyclerAction({
        cmd: "disconnect",
        device_uuid_list: deviceIds,
        payload: { total_amount: 1, booking_id: "" },
      });
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
          {termsConditions === "checkout" ? (
            <h1 className="heading-h1 mb-0">{t("Collect_Deposit")}</h1>
          ) : paymentMethod === "credit_card" ? (
            <h1 className="heading-h1 mb-0">{t("Pay_by_Credit_Card")}</h1>
          ) : (
            <h1 className="heading-h1 mb-0">{t("Pay_with_Cash")}</h1>
          )}

          <h3 className="heading-s3 mb-0">{t("Follow_instructions_below")}</h3>
        </div>

        <div
          className="custom-card total-box-section mb-5"
          data-aos="fade-up"
          data-aos-delay="1000"
        >
          <div className="custom-card-wrap total-box d-flex align-items-center justify-content-between p-4">
            <div className="d-flex align-items-center gap-3">
              <img src={getImageSrc("AccountIcon")} alt="account" />
              <h2 className="mb-0">{t("Total_amount_due")}</h2>
            </div>
            <h2 className="blue-text mb-0">
              {currencySymbol?.symbol || currency}
              {amountTotal || booking?.total_charge}
            </h2>
          </div>
        </div>
        <div
          className={`${paymentMethod !== "credit_card" && "inser-cash-warpper"
            } bg-white  border-radius`}
          data-aos="fade-up"
          data-aos-delay="1500"
        >
          {!showSuccessAnimation && (
            <img
              src={
                paymentMethod === "credit_card"
                  ? CardInsertGif
                  : location.pathname.includes("check-in")
                    ? cashCollectNew
                    : cashPayoutNew
              }
              alt="cc-insert"
              className="cc-insert d-block mx-auto img-fluid"
            />
          )}
          {showSuccessAnimation && (
            <>
              {stateResponse === "Approved" ? (
                <div className="payment-success">
                  <Lottie
                    animationData={successData}
                    loop="20"
                    speed="0.5"
                    style={{ height: 300 }}
                    className="success-json"
                  />
                </div>
              ) : (
                <div className="payment-success">
                  <Lottie
                    animationData={errorData}
                    loop="20"
                    speed="0.5"
                    style={{ height: 300 }}
                    className="success-json"
                  />
                </div>
              )}
            </>
          )}
        </div>
        <div
          className="d-flex align-items-center justify-content-between mt-3"
          data-aos="fade-up"
          data-aos-delay="2500"
        >
          <button className="common-btn black-btn" onClick={() => navigate(-1)}>
            {t("Back")}
          </button>
          {paymentMethod === "credit_card" && (
            <button
              className="common-btn btn btn-danger"
              onClick={() => {
                handleCreditCardTransaction();
                setShowSuccessAnimation(false);
              }}
            >
              {transactionStatus?.isTerminalLoading ? (
                <span className="d-flex align-items-center">
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  />
                  <span> {t("Retry")}...</span>
                </span>
              ) : (
                <span> {t("Retry")}</span>
              )}
            </button>
          )}
          <button
            className="common-btn blue-btn"
            onClick={() => {
              continueProcess();
            }}
          >
            {t("Continue")}
          </button>
        </div>
      </div>
    </>
  );
};

export default PaymentCreditCard;
