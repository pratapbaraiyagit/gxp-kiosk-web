import Aos from "aos";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Nav, Tab } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import moment from "moment";
import { useDispatch, useSelector } from "react-redux";
import {
  getBookingListData,
  setIsBookingUpdate,
  updateBookingDetails,
} from "../../redux/reducers/Booking/booking";
import { isWithinOneHour } from "../../utils/commonFun";
import { getSessionItem, setSessionItem } from "../../hooks/session";
import {
  getGuestListData,
  setIsGuestUpdate,
} from "../../redux/reducers/Booking/guest";
import useIDScanner from "../../hooks/useIDScanner";
import { getImageSrc } from "../../utils/bulkImageStorage";

const AgentScanProof = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dispatch = useDispatch();

  // const mqttClient = useMQTT();
  const timerRef = useRef(null);

  const [activeTab, setActiveTab] = useState("pills-front-view");
  const [timer, setTimer] = useState(15);
  const { activeBookingList, isBookingUpdate, bookingNotFound } = useSelector(
    ({ booking }) => booking
  );

  const { activeBookingStatusList } = useSelector(
    ({ bookingAvailability }) => bookingAvailability
  );

  const booking = activeBookingList?.[0];

  const hotelKiosk = getSessionItem("hotelKiosk");
  const userHotelSession = hotelKiosk
    ? JSON.parse(decodeURIComponent(escape(atob(hotelKiosk))))
    : null;

  const isOneHourGap = isWithinOneHour(booking?.check_in_time);

  const bookingStatusId = activeBookingStatusList?.length
    ? activeBookingStatusList?.find((x) => x.code_name === "checked_out")?.id
    : null;

  const checkInStatusId = activeBookingStatusList?.length
    ? activeBookingStatusList?.find((x) => x.code_name === "checked_in")?.id
    : null;

  const arrivalStatusId = activeBookingStatusList?.length
    ? activeBookingStatusList?.find((x) => x.code_name === "confirmed")?.id
    : null;

  const newStatusId = activeBookingStatusList?.length
    ? activeBookingStatusList?.find((x) => x.code_name === "new")?.id
    : null;

  const {
    isFlip,
    isOcrFound,
    ocrData,
    autoCaptureOn,
    autoCaptureOff,
  } = useIDScanner();

  const userData = getSessionItem("hotelKiosk");
  const userSession = userData
    ? JSON.parse(decodeURIComponent(escape(atob(userData))))
    : null;

  const checkInDate = moment(userSession?.hotel?.current_business_date).format(
    "YYYY-MM-DD"
  );

  const termsConditions = getSessionItem("terms_and_conditions");

  // Timer management
  useEffect(() => {
    // Clear existing timer when tab changes
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Set initial timer value based on active tab
    const initialTime = activeTab === "pills-front-view" ? 15 : 20;
    setTimer(initialTime);

    // Start new timer
    timerRef.current = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);

    // Cleanup timer on component unmount or tab change
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [activeTab]);

  useEffect(() => {
    if (bookingNotFound && termsConditions === "checkout") {
      navigate("/check-out/find-room");
    }
    if (bookingNotFound && termsConditions === "checkin") {
      navigate("/check-in/find-booking");
    }
  }, [bookingNotFound]);

  useEffect(() => {
    if (isOcrFound && termsConditions === "checkin") {
      handleOCRBooking();
    } else if (isOcrFound && termsConditions === "reservation") {
      handleOCRGuest();
    } else if (isOcrFound && termsConditions === "checkout") {
      handleCheckout();
    }
  }, [isOcrFound]);

  useEffect(() => {
    if (isBookingUpdate) {
      if (isOneHourGap) {
        navigate("/walk-in/review-confirmation");
      } else if (termsConditions === "reservation") {
        navigate("/check-in/early-checkin");
      } else if (termsConditions === "checkin") {
        if (
          booking?.status_id === newStatusId ||
          booking?.status_id === arrivalStatusId
        )
          navigate("/walk-in/review-confirmation");
        else navigate("/check-in/find-booking");
      }
      dispatch(setIsBookingUpdate(false));
    }
  }, [isBookingUpdate]);

  useEffect(() => {
    if (ocrData?.first_name && ocrData?.last_name) {
      dispatch(setIsGuestUpdate(false));
      autoCaptureOff();
      navigate("/home");
    }
  }, [ocrData?.first_name && ocrData?.last_name]);

  useEffect(() => {
    Aos.init({
      duration: 1000,
      once: true,
      easing: "ease-in-out",
    });

  }, []);

  const handleAutoCapture = async () => {
    try {
      // const auto_capture_on = await autoCaptureOff();
      // if (auto_capture_on) {
      const auto_capture_on = await autoCaptureOn();
      return auto_capture_on; // Return the result of turning auto-capture off
      // }
      // return false; // Return false if turning on auto-capture failed
    } catch (error) {
      return false;
    }
  };


  useEffect(() => {
    if (timer === 0) {
      navigate(-1);
      autoCaptureOff();
    }
  }, [timer]);

  useEffect(() => {
    if (isFlip) {
      setActiveTab("pills-back-view");
    } else {
      handleAutoCapture();
      setActiveTab("pills-front-view");
    }
  }, [isFlip]);

  const handleOCRBooking = () => {
    if (ocrData?.first_name && ocrData?.last_name) {
      const params = {
        checkInDate,
        firstName: ocrData?.first_name,
        lastName: ocrData?.last_name,
        BBStatusId: `${arrivalStatusId}`,
        doc_number: ocrData?.doc_number,
      };

      dispatch(getBookingListData(params));
    }
  };

  const handleOCRGuest = () => {
    if (ocrData?.first_name && ocrData?.last_name) {
      const params = {
        firstName: ocrData?.first_name,
        lastName: ocrData?.last_name,
      };
      setSessionItem("userData", JSON.stringify(params));
      dispatch(getGuestListData(params));
    }
  };

  const handleCheckout = () => {
    if (ocrData?.first_name && ocrData?.last_name) {
      const checkOutDate = moment().format("YYYY-MM-DD");
      const params = {
        checkOutDate,
        firstName: ocrData?.first_name,
        lastName: ocrData?.last_name,
        BBStatusId: checkInStatusId,
      };

      dispatch(getBookingListData(params));
      setSessionItem("userData", JSON.stringify(params));
    }
  };

  useEffect(() => {
    if (isBookingUpdate && termsConditions === "checkout") {
      if (checkInStatusId === booking?.status_id) {
        if (booking?.payment_type === "cash") {
          navigate("/check-out/payment");
          setSessionItem("paymentMethod", "cash");
        } else {
          const updatePayload = {
            booking: {
              id: booking?.id,
              status_id: bookingStatusId,
            },
          };
          dispatch(updateBookingDetails(updatePayload));
          navigate("/check-in/thank-you");
        }
      } else {
        navigate(-1);
        // dispatch(setIsBookingNotFound(true));
      }
      dispatch(setIsBookingUpdate(false));
    }
  }, [isBookingUpdate]);

  return (
    <>
      <div className="my-auto">
        <div
          className="d-flex align-items-end justify-content-between gap-5 mb-5"
          data-aos="fade-up"
          data-aos-delay="500"
        >
          <h1 className="heading-h1 mb-0">{t("scan_your_driver_liecense")}</h1>
          <h3 className="heading-s3 mb-0">{t("follow_instructions_below")}</h3>
        </div>

        <Tab.Container id="scan-view-tab" activeKey={activeTab}>
          <div
            className="custom-card id-scan-tab mb-5"
            data-aos="fade-up"
            data-aos-delay="1000"
          >
            <div className="custom-card-wrap p-4">
              <Nav variant="pills" defaultActiveKey="/home">
                <Nav.Item>
                  <Nav.Link
                    eventKey="pills-front-view"
                    className={
                      activeTab === "pills-front-view" && "success-button"
                    }
                  >
                    <img src={getImageSrc("FrontviewIcon")} alt="front-view" />
                    {t("Front_View")}
                  </Nav.Link>
                </Nav.Item>

                <Nav.Item>
                  <Nav.Link
                    eventKey="pills-back-view"
                    className={
                      activeTab === "pills-back-view" && "success-button"
                    }
                  >
                    <img src={getImageSrc("BackviewIcon")} alt="back-view" />
                    {t("Back_View")}
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </div>
          </div>

          <div
            className="custom-card mb-5"
            data-aos="fade-up"
            data-aos-delay="1500"
          >
            <div className="custom-card-wrap p-4">
              <Tab.Content>
                <Tab.Pane eventKey="pills-front-view">
                  <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="id-scan"
                  >
                    <source
                      src={getImageSrc("ScannerFrontVideo")}
                      type="video/mp4"
                    />
                  </video>
                </Tab.Pane>
                <Tab.Pane eventKey="pills-back-view">
                  <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="id-scan"
                  >
                    <source
                      src={getImageSrc("ScannerBackVideo")}
                      type="video/mp4"
                    />
                  </video>
                </Tab.Pane>
              </Tab.Content>
            </div>
          </div>
        </Tab.Container>
        <Tab.Container id="scan-view-tab" activeKey={activeTab}>
          <div
            className=" id-scan-tab mb-5"
            data-aos="fade-up"
            data-aos-delay="1000"
          >
            <div className="custom-card-wrap p-4">
              <Nav variant="pills" defaultActiveKey="/home">
                <Nav.Item>
                  <Nav.Link
                    eventKey={activeTab}
                    className="success-button d-flex justify-content-center"
                    style={{ width: "fit-content", margin: "0 auto" }}
                  >
                    {t("Please_Wait")}...{timer}
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </div>
          </div>
        </Tab.Container>
      </div>
    </>
  );
};

export default AgentScanProof;
