import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import AOS from "aos";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  getSessionItem,
  removeSessionItem,
  setSessionItem,
} from "../hooks/session";
import { useDispatch, useSelector } from "react-redux";
import {
  checkoutBookingDetails,
  getBookingListData,
  setIsActiveBookingList,
  setIsBookingDetailsList,
  setIsBookingNotFound,
  setIsBookingUpdate,
} from "../redux/reducers/Booking/booking";
import moment from "moment";
import { getImageSrc } from "../utils/bulkImageStorage";
import useKeyDispenser from "../hooks/useKeyDispenser";
import { getHotelRoomTypeListData } from "../redux/reducers/Booking/hotelRoomType";
import { currency } from "../utils/data";
import "swiper/css";
import "swiper/css/pagination";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import { playSafeAudio } from "../utils/commonFun";
import { getBookingStatusListData } from "../redux/reducers/Booking/bookingAvailability";

const HomeScreen = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const [showBookingList, setShowBookingList] = useState(false);

  const mqttState = useSelector((state) => state.mqtt);
  const { acceptKeyDispneser, statusKeyDispenser } = useKeyDispenser();
  const { kioskAudioLoading } = useSelector(({ KioskAudio }) => KioskAudio);
  const { bookingLoading, checkOutBookingLoading, isBookingUpdate } = useSelector(({ booking }) => booking);

  const KioskDeviceInfo = getSessionItem("KioskDeviceInfo");
  const KioskDeviceInfoSession = KioskDeviceInfo
    ? JSON.parse(decodeURIComponent(escape(atob(KioskDeviceInfo))))
    : null;
  const newKioskDeviceMode = KioskDeviceInfoSession?.[0]?.mode;

  const kioskData = getSessionItem("KioskConfig");
  const kioskSession = kioskData
    ? JSON.parse(decodeURIComponent(escape(atob(kioskData))))
    : null;

  const hotelKioskConfig = kioskSession?.[0]?.hotel_kiosk_config;

  const selfieGetData = getSessionItem("SelfieGetData");
  const customerData = JSON.parse(selfieGetData);

  const selfieBooking = getSessionItem("selfieBookingData");
  const selfieBookingData = JSON.parse(selfieBooking);

  const selectedBooking = getSessionItem("selectedSelfieBookingData");
  const selectedBookingData = JSON.parse(selectedBooking);
  const roomNumber = selectedBookingData?.booking_details?.[0]?.booking_room?.[0]?.rooms[0]?.room_number

  const bookingStatus =
    selectedBookingData?.booking_details[0]?.booking?.booking_status?.code_name;

  const { activeHotelTermsConditionList } = useSelector(
    ({ hotelTermsCondition }) => hotelTermsCondition
  );

  const selfCheckIn = getSessionItem("selfCheckIn");
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

  const { activeBookingStatusList } = useSelector(
    ({ bookingAvailability }) => bookingAvailability
  );

  const checkInStatusId = activeBookingStatusList?.length
    ? activeBookingStatusList?.find((x) => x.code_name === "checked_in")?.id
    : null;

  // Check if we need to show booking list
  useEffect(() => {
    if (
      selfieBookingData &&
      selfieBookingData.booking_details &&
      selfieBookingData.booking_details.length > 0
    ) {
      setShowBookingList(true);
    }

    if (customerData && (bookingStatus !== "checked_in" &&
      bookingStatus !== "confirmed")) {
      // playSafeAudio("reservation");
      playSafeAudio("home");
    } else {
      playSafeAudio("home");
    }
  }, []);
  // }, [selfieBookingData]);

  const handleBookingSelection = (selectedBooking) => {
    playSafeAudio("home");
    // Store the selected booking in session
    const selectedBookingData = {
      ...selfieBookingData,
      booking_details: [selectedBooking],
    };
    setSessionItem(
      "selectedSelfieBookingData",
      JSON.stringify(selectedBookingData)
    );
    setShowBookingList(false);
  };

  useEffect(() => {
    if (selfCheckIn === "true") {
      dispatch(getBookingStatusListData())
      dispatch(statusKeyDispenser);
      dispatch(getHotelRoomTypeListData());
      dispatch(setIsBookingUpdate(false));
    }
  }, []);

  useEffect(() => {
    try {
      if (mqttState?.lastMessage?.message) {
        const data = JSON.parse(mqttState.lastMessage.message);
        if (data?.response?.data?.device_status?.card_position === "FRONT") {
          const timeoutId = setTimeout(() => {
            dispatch(acceptKeyDispneser);
          }, 20000);
          return () => clearTimeout(timeoutId);
        }
      }
    } catch (error) { }
  }, [mqttState.lastMessage, dispatch, acceptKeyDispneser]);

  const [currentTime, setCurrentTime] = useState("");
  const [temperature, setTemperature] = useState(null);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);

  const checkInDateNew = moment(
    userSession?.hotel?.current_business_date
  ).format("YYYY-MM-DD");

  const checkOutDateNew = new Date(
    new Date(checkInDateNew).setDate(new Date(checkInDateNew).getDate() + 1)
  )
    .toISOString()
    .split("T")[0];

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      easing: "ease-in-out",
    });
  }, []);

  // Initialize app data
  useEffect(() => {
    // dispatch(getBusinessSourceListData());
    // dispatch(getHotelTermsConditionListData());
    // dispatch(getCurrencyListData());
    setSessionItem("checkInDate", checkInDateNew);
    setSessionItem("checkOutDate", checkOutDateNew);
    setSessionItem("checkInTime", userSession?.hotel?.check_in_time);
    setSessionItem("checkOutTime", userSession?.hotel?.check_out_time);
    dispatch(setIsBookingDetailsList(""));
    dispatch(setIsActiveBookingList([]));
    dispatch(setIsBookingNotFound(false));
  }, []);

  // Store images in localStorage

  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString());
    }, 1000);

    let timeoutId;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (
          selfCheckIn === "true" &&
          hotelKioskConfig?.home_page?.selfie_capture
        ) {
          setSessionItem("laneClose", "true");
          navigate("/selfie-splash");
        }
      }, hotelKioskConfig?.home_page?.selfie_timeout_second || 15000);
    };

    // Initial start
    resetTimer();

    // Reset on user interaction
    const events = ['click', 'touchstart'];
    events.forEach(event =>
      window.addEventListener(event, resetTimer)
    );

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
      events.forEach(event =>
        window.removeEventListener(event, resetTimer)
      );
    };
  }, []);


  useEffect(() => {
    const getLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              lat: position.coords.latitude,
              lon: position.coords.longitude,
            });
          },
          (error) => {
            setError(
              "Unable to retrieve your location. Using default location."
            );
            setLocation({ lat: 28.6139, lon: 77.209 }); // Delhi coordinates
          }
        );
      } else {
        setError(
          "Geolocation is not supported by this browser. Using default location."
        );
        setLocation({ lat: 28.6139, lon: 77.209 }); // Delhi coordinates
      }
    };

    getLocation();
  }, []);

  useEffect(() => {
    const fetchTemperature = async () => {
      if (location) {
        try {
          const response = await axios.get(
            `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current_weather=true`
          );
          const temp = response.data.current_weather.temperature;
          setTemperature(temp);
          setError(null);
        } catch (error) {
          setError("Unable to fetch weather data. Please try again later.");
        }
      }
    };
    fetchTemperature();
  }, [location]);

  const removedSessionData = () => {
    dispatch(setIsActiveBookingList([]));
    dispatch(setIsBookingNotFound(false));
    removeSessionItem("totalTax");
    removeSessionItem("selectedServices");
    removeSessionItem("selectedAddons");
    removeSessionItem("room_type");
    removeSessionItem("roomType");
    removeSessionItem("room");
    removeSessionItem("paymentMethod");
    removeSessionItem("finalTotal");
    removeSessionItem("paymentPayload");
    removeSessionItem("addonPayload");
    removeSessionItem("vehicalNum");
    removeSessionItem("bookingId");
    removeSessionItem("AgentGuestName");
    removeSessionItem("seqCode");
    // removeSessionItem("checkOutDate");
    // removeSessionItem("checkInDate");
    removeSessionItem("amountTotal");
    removeSessionItem("addonTotal");
    removeSessionItem("PaymentTime");
    removeSessionItem("userData");
    removeSessionItem("visit");
    removeSessionItem("parking");
    removeSessionItem("questionAnswers");
    removeSessionItem("addonState");
    removeSessionItem("contactData");
    removeSessionItem("addonState");
    removeSessionItem("document_type");
    removeSessionItem("terms_and_conditions");
    removeSessionItem("frontside_image");
    removeSessionItem("backside_image");
    removeSessionItem("vehicleNum");
    removeSessionItem("vehicleDetails");
    removeSessionItem("vehicalNumSubmitted");
    removeSessionItem("earlyCheckInAmount");
    removeSessionItem("frontUploadImage");
  };

  useEffect(() => {
    removedSessionData();
  }, []);

  useEffect(() => {
    if (isBookingUpdate) {
      navigate("/check-in/thank-you");
      dispatch(setIsBookingUpdate(false));
    }
  }, [isBookingUpdate]);

  return (
    <>
      <div className="my-auto">
        <div className="main-title">
          <div
            className="d-flex align-items-center gap-3 mb-4"
            data-aos="fade-down"
            data-aos-delay="500"
          >
            <div className="clock-weathwe">
              <img
                src={getImageSrc("TimeIcon")}
                alt="time"
                className="d-block mx-auto"
                onClick={() => {
                  if (
                    selfCheckIn === "true" &&
                    hotelKioskConfig?.home_page?.selfie_capture
                  ) {
                    setSessionItem("laneClose", "true");
                    navigate("/selfie-splash");
                  }
                }}
              />
            </div>
            <h2 className="mb-0">{currentTime}</h2>
          </div>
          <div
            className="d-flex align-items-center gap-3"
            data-aos="fade-down"
            data-aos-delay="1000"
          >
            <div className="clock-weathwe">
              <img
                src={getImageSrc("WeatherIcon")}
                alt="weather"
                className="d-block mx-auto"
              />
            </div>
            <h2 className="mb-0">
              <span>
                {error
                  ? t("error")
                  : temperature !== null
                    ? `${temperature.toFixed(1)}°C`
                    : t("loading")}
              </span>
            </h2>
          </div>
          <h1 data-aos="fade-down" data-aos-delay="1500" className="mb-0">
            {t("welcome")}
          </h1>
          <div data-aos="fade-down" data-aos-delay="1800">
            <h3 className="guest-name">
              {customerData?.guest?.first_name?.toUpperCase()}{" "}
              {customerData?.guest?.last_name?.toUpperCase()}
            </h3>
          </div>
          {!showBookingList && selfCheckIn === "true" && (
            <div data-aos="fade-down" data-aos-delay="2000">
              <h3 className="text-s3">{t("selectOption")}</h3>
            </div>
          )}
        </div>

        {kioskAudioLoading && (
          <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{
              backgroundColor: "rgba(0,0,0,0.7)",
              zIndex: 999999999,
            }}
          >
            <div className="text-center text-white">
              <div className="spinner-border spinner-border-lg mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <h4 className="fw-light">Getting things ready in your language...</h4>
            </div>
          </div>
        )}
        {(bookingLoading || checkOutBookingLoading) && (
          <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{
              backgroundColor: "rgba(0,0,0,0.7)",
              zIndex: 999999999,
            }}
          >
            <div className="text-center text-white">
              <div className="spinner-border spinner-border-lg mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <h4 className="fw-light">Completing your booking checkout...</h4>
            </div>
          </div>
        )}

        {showBookingList ? (
          <>
            <div className="my-auto">
              <div data-aos="fade-down" data-aos-delay="2000" className="mb-4 d-flex justify-content-between align-items-center">
                <div>
                  <h3
                    className="text-white  mb-1"
                    style={{ fontSize: "1.8rem", fontWeight: "600" }}
                  >
                    Select Your Booking
                  </h3>
                </div>
                <div>
                  <div
                    className="custom-card home-box"
                    data-aos="fade-up"
                    data-aos-delay="1500"
                  >
                    <button
                      className="booking-common-btn blue-btn"
                      onClick={() => {
                        removedSessionData();
                        setSessionItem("terms_and_conditions", "reservation");
                        if (newKioskDeviceMode === "demo")
                          navigate("/check-in/terms-condition");
                        else if (
                          activeHotelTermsConditionList?.[0]?.terms_condition
                            ?.length
                        )
                          navigate("/check-in/terms-condition");
                        else navigate("/walk-in/room-type");
                      }}
                    >
                      <span>{t("makeReservation")}</span>
                    </button>
                  </div>
                </div>
              </div>
              <div data-aos="fade-up" data-aos-delay="1500">
                <Swiper
                  modules={[Pagination]}
                  pagination={{
                    clickable: true,
                  }}
                  spaceBetween={32}
                  slidesPerView={2}
                  className="p-4"
                >
                  {selfieBookingData.booking_details.length === 0 ? (
                    <div>{t("No_data_found")}</div>
                  ) : (
                    selfieBookingData.booking_details.map((booking, index) => (
                      <SwiperSlide key={index}>
                        <div className="custom-card custom-carousel booking-card text-light">
                          <div className="custom-card-wrap cursor mb-5">
                            <div
                              key={booking.booking.id}
                              data-aos="fade-up"
                              data-aos-delay={500 + index * 200}
                            >
                              <div className="overflow-hidden">
                                <div
                                  className="booking-card-inner p-3 d-flex flex-column h-100"
                                  onClick={() =>
                                    handleBookingSelection(booking)
                                  }
                                >
                                  {/* Header Section */}
                                  <div className="booking-header">
                                    <div className="d-flex justify-content-between align-items-center">
                                      <div>
                                        <h5 className="text-blue fw-normal fs-3 mb-0">
                                          {booking.booking.reference_no}
                                        </h5>
                                        <span className="text-light-gray fs-4">
                                          Booking Reference
                                        </span>
                                      </div>
                                      <span className="pulse-animation black-gradient-pill text-lime">
                                        {
                                          booking.booking.booking_status
                                            .status_name
                                        }
                                      </span>
                                    </div>
                                  </div>

                                  <hr className="divider3x" />

                                  {/* Main Content Section */}
                                  <div className="flex-grow-1">
                                    {/* Check-in/Check-out Row */}
                                    <div className="row">
                                      <div className="col-5">
                                        <div className="date-info rounded-4">
                                          <small className="d-block text-light-gray text-uppercase fs-5">
                                            Check-In
                                          </small>
                                          <div className="display-4 fw-bold text-white">
                                            {moment(
                                              booking.booking.check_in_date
                                            ).format("DD")}
                                          </div>
                                          <small className="d-block text-light-gray text-uppercase fs-5">
                                            {moment(
                                              booking.booking.check_in_date
                                            ).format("MMM YYYY")}
                                          </small>
                                        </div>
                                      </div>
                                      <div className="col-2 d-flex align-items-center justify-content-center">
                                        <div className="booking-arrow">
                                          {/* <i className="fas fa-arrow-right"></i> */}
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="173"
                                            height="50"
                                            viewBox="0 0 173 50"
                                            fill="none"
                                          >
                                            <path
                                              fill-rule="evenodd"
                                              clip-rule="evenodd"
                                              d="M163.112 23.1736L0.115078 22.8312L0 27.9681H161.962L143.796 46.0046L147.82 50L173 25.1139L172.885 24.9999L168.976 21.1185L147.82 0L143.796 3.99535L163.112 23.1736Z"
                                              fill="white"
                                            />
                                          </svg>
                                          <div className="fs-4 text-light text-uppercase">
                                            {moment(
                                              booking.booking.check_out_date
                                            ).diff(
                                              moment(
                                                booking.booking.check_in_date
                                              ),
                                              "days"
                                            )}{" "}
                                            Night
                                            {moment(
                                              booking.booking.check_out_date
                                            ).diff(
                                              moment(
                                                booking.booking.check_in_date
                                              ),
                                              "days"
                                            ) > 1
                                              ? "s"
                                              : ""}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="col-5">
                                        <div className="date-info rounded-4">
                                          <small className="d-block text-light-gray text-uppercase fs-5">
                                            Check-Out
                                          </small>
                                          <div className="display-4 fw-bold text-white">
                                            {moment(
                                              booking.booking.check_out_date
                                            ).format("DD")}
                                          </div>
                                          <small className="d-block text-light-gray text-uppercase fs-5">
                                            {moment(
                                              booking.booking.check_out_date
                                            ).format("MMM YYYY")}
                                          </small>
                                        </div>
                                      </div>
                                    </div>

                                    <hr className="divider3x" />

                                    {/* Room Information */}
                                    <div className="room-info d-flex align-items-center justify-content-between">
                                      <div>
                                        <div className="d-flex align-items-center gap-2">
                                          <i className="fas fa-bed fs-4 text-light"></i>
                                          <span className="fs-4 text-blue">
                                            {
                                              booking.booking_room[0]
                                                ?.roomtype_name
                                            }
                                          </span>
                                        </div>
                                        <div className="d-flex align-items-center gap-2">
                                          <i className="fas fa-door-open fs-4 text-light"></i>
                                          <small className="fs-4 text-light-gray">
                                            Room{" "}
                                            {
                                              booking.booking_room[0]?.rooms[0]
                                                ?.room_number
                                            }
                                          </small>
                                        </div>
                                      </div>
                                      <div>
                                        <span className="black-gradient-pill guest-badge d-flex align-items-center gap-2">
                                          <i className="fas fa-users fs-4 text-light-gray"></i>
                                          <span>
                                            {
                                              booking.booking_room[0]?.rooms[0]
                                                ?.adult_count
                                            }
                                            A
                                            {booking.booking_room[0]?.rooms[0]
                                              ?.child_count > 0 &&
                                              `+${booking.booking_room[0]?.rooms[0]?.child_count}C`}
                                          </span>
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <hr className="divider3x" />

                                  {/* Footer Section */}
                                  <div className="booking-footer">
                                    <div className="d-flex justify-content-between align-items-center">
                                      <div>
                                        <h4
                                          className="mb-1 fw-bold fs-4"
                                          style={{
                                            color: "#4BA469",
                                          }}
                                        >
                                          Total Charge :{" "}
                                          {currencySymbol?.symbol || currency}
                                          {(
                                            booking.booking.total_charge +
                                            booking.booking.total_tax
                                          )
                                            ?.toFixed(2)
                                            .toLocaleString()}
                                        </h4>
                                        {booking.booking.total_unpaid > 0 && (
                                          <small
                                            className="fw-semibold fs-5"
                                            style={{
                                              color: "#A4854B",
                                            }}
                                          >
                                            <i className="fas fa-exclamation-triangle me-2"></i>
                                            Due:{" "}
                                            {currencySymbol?.symbol || currency}
                                            {booking.booking.total_unpaid
                                              ?.toFixed(2)
                                              .toLocaleString()}
                                          </small>
                                        )}
                                        {booking.booking.total_unpaid === 0 && (
                                          <small
                                            className="mb-1 fw-bold fs-4"
                                            style={{
                                              color: "#4BA469",
                                            }}
                                          >
                                            <i className="fas fa-check-circle me-1"></i>
                                            Fully Paid
                                          </small>
                                        )}
                                      </div>
                                      <div className="select-arrow d-flex align-items-center">
                                        <span className="me-2 fs-4 text-uppercase">
                                          Select
                                        </span>
                                        <div className="arrow-circle d-flex align-items-center justify-content-center rounded-circle">
                                          <i className="fas fa-arrow-right  fs-4 text-white"></i>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </SwiperSlide>
                    ))
                  )}
                </Swiper>
              </div>
            </div>
          </>
        ) : selfCheckIn === "true" ? (
          <div className="mb-5">
            {(!customerData || bookingStatus === "checked_in") && (
              <div className="d-flex gap-68">
                <div
                  className="custom-card home-box"
                  data-aos="fade-up"
                  data-aos-delay="500"
                >
                  {bookingStatus === "checked_in" ? (
                    <div
                      className="custom-card-wrap hover d-flex align-items-center justify-content-between"
                      onClick={() => {
                        navigate("/check-in/key-receipt", {
                          state: {
                            key: "pickup_check",
                            keyData: selfieBookingData?.booking_details?.[0]?.booking,
                          },
                        });
                      }}
                    >
                      <img src={getImageSrc("CheckInIcon")} alt="pickup-key" />
                      <h3 className="mb-0">{t("Pickup_Key").toUpperCase()}</h3>
                    </div>
                  ) : (
                    <div
                      className="custom-card-wrap hover d-flex align-items-center justify-content-between"
                      onClick={() => {
                        removedSessionData();
                        setSessionItem("terms_and_conditions", "checkin");
                        navigate("/check-in/find-booking");
                      }}
                    >
                      <img src={getImageSrc("CheckInIcon")} alt="check-in" />
                      <h3 className="mb-0">{t("checkIn")}</h3>
                    </div>
                  )}
                </div>
                <div
                  className="custom-card home-box"
                  data-aos="fade-up"
                  data-aos-delay="1000"
                >
                  <div
                    className="custom-card-wrap hover d-flex align-items-center justify-content-between"
                    onClick={() => {
                      setSessionItem("terms_and_conditions", "checkout");
                      if (!selfieBookingData) {
                        removedSessionData();
                        navigate("/check-out/find-room");
                      } else {
                        const checkOutDate = moment().format("YYYY-MM-DD");
                        const params = {
                          checkOutDate,
                          roomNumber: roomNumber,
                          BBStatusId: checkInStatusId,
                        };
                        const updateData = {
                          booking: {
                            id: selfieBookingData?.booking_details?.[0]?.booking?.id,
                          },
                        };
                        dispatch(getBookingListData(params)).then(() => {
                          dispatch(checkoutBookingDetails(updateData));
                        });
                      }
                    }
                    }

                  >
                    <img src={getImageSrc("CheckOutIcon")} alt="check-out" />
                    <h3 className="mb-0">{t("checkOut")}</h3>
                  </div>
                </div>
              </div>
            )}

            {bookingStatus === "confirmed" && (
              <div
                className="custom-card home-box mt-5"
                data-aos="fade-up"
                data-aos-delay="1500"
              >
                <div
                  className="custom-card-wrap hover d-flex align-items-center justify-content-center gap-37"
                  onClick={() => {
                    // removedSessionData();
                    setSessionItem("terms_and_conditions", "checkin");
                    // navigate("/check-in/find-booking");
                    navigate("/walk-in/review-confirmation");
                  }}
                >
                  <img src={getImageSrc("CheckInIcon")} alt="check-in" />
                  <h3 className="mb-0">{t("checkIn")}</h3>
                </div>
              </div>
            )}

            {bookingStatus !== "checked_in" &&
              bookingStatus !== "confirmed" && (
                <div
                  className="custom-card home-box mt-5"
                  data-aos="fade-up"
                  data-aos-delay="1500"
                >
                  <div
                    className="custom-card-wrap hover d-flex align-items-center justify-content-center gap-37"
                    onClick={() => {
                      removedSessionData();
                      setSessionItem("terms_and_conditions", "reservation");
                      if (newKioskDeviceMode === "demo")
                        navigate("/check-in/terms-condition");
                      else if (
                        activeHotelTermsConditionList?.[0]?.terms_condition
                          ?.length
                      )
                        navigate("/check-in/terms-condition");
                      else navigate("/walk-in/room-type");
                    }}
                  >
                    <img src={getImageSrc("WalkinIcon")} alt="walkin" />
                    <h3 className="mb-0">{t("makeReservation")}</h3>
                  </div>
                </div>
              )}
          </div>
        ) : (
          <div className="mb-5" />
        )}
      </div>
    </>
  );
};

export default HomeScreen;
