import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Aos from "aos";
import "aos/dist/aos.css"; // Ensure AOS styles are imported
import "swiper/css";
import "swiper/css/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules"; // Import the navigation module
import { useDispatch, useSelector } from "react-redux";
import { faUser, faChild, faBed } from "@fortawesome/free-solid-svg-icons";
import {
  getBookingAvailabilityListData,
  getBusinessSourceListData,
} from "../../redux/reducers/Booking/bookingAvailability";
import { getSessionItem, setSessionItem } from "../../hooks/session";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";
import { faMinus, faMoon, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslation } from "react-i18next";
import moment from "moment";
import { getImageSrc } from "../../utils/bulkImageStorage";
import { Card, Placeholder } from "react-bootstrap";
import { currency } from "../../utils/data";
import { playSafeAudio } from "../../utils/commonFun";

const SelectRoomType = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const userData = getSessionItem("hotelKiosk");
  const userSession = userData
    ? JSON.parse(decodeURIComponent(escape(atob(userData))))
    : null;

  const roomTypeData = getSessionItem("roomTypeList");
  const roomTypeSession = roomTypeData
    ? JSON.parse(decodeURIComponent(escape(atob(roomTypeData))))
    : null;

  const { activeCurrencyList } = useSelector(
    ({ paymentMethod }) => paymentMethod
  );

  const currencySymbol = useMemo(() => {
    return activeCurrencyList?.find(
      (item) => item?.id === userSession?.hotel?.currency
    );
  }, [activeCurrencyList, userSession?.hotel?.currency]);

  const checkInDateNew = moment(
    userSession?.hotel?.current_business_date
  ).format("YYYY-MM-DD");

  const checkOutDateNew = new Date(
    new Date(checkInDateNew).setDate(new Date(checkInDateNew).getDate() + 1)
  )
    .toISOString()
    .split("T")[0];

  const nightsData = getSessionItem("nights");
  const checkin = getSessionItem("checkInDate");
  const checkout = getSessionItem("checkOutDate");
  const selfieGetData = getSessionItem("SelfieGetData");
  const customerData = JSON.parse(selfieGetData);

  const [isNightChangeLoading, setIsNightChangeLoading] = useState(false);
  const [checkInDate, setCheckInDate] = useState(checkin || checkInDateNew);
  const [checkOutDate, setCheckOutDate] = useState(checkout || checkOutDateNew);
  const [nights, setNights] = useState(nightsData || 1);
  const { bookingAvailabilityLoading, activeBookingAvailabilityList } =
    useSelector(({ bookingAvailability }) => bookingAvailability);

  const { activeBusinessSourceList } = useSelector(
    ({ bookingAvailability }) => bookingAvailability
  );

  const { activeHotelRoomTypeList } = useSelector(
    ({ hotelRoomType }) => hotelRoomType
  );

  const businessSourceId = activeBusinessSourceList?.length
    ? activeBusinessSourceList?.find((x) => x.code_name === "kiosk")?.id
    : null;

  const getRoomTypeImage = (roomTypeId) => {
    const roomType = roomTypeSession?.find((item) => item?.id === roomTypeId);

    if (roomType && roomType?.images && roomType?.images?.length > 0) {
      return roomType?.images[0];
    }

    return "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRYo2tDph-jY2opkOsUuhZBgMVg1S2KDSGLDQ&s";
  };

  const getBedTypeNames = (roomTypeId) => {
    const roomType = activeHotelRoomTypeList?.find(
      (item) => item?.id === roomTypeId
    );

    if (
      roomType &&
      roomType?.roomtype_beds &&
      roomType?.roomtype_beds?.length > 0
    ) {
      const bedNames = roomType?.roomtype_beds
        ?.map((bed) => bed?.bedtype_name)
        ?.filter((name) => name !== null && name !== undefined && name !== "");

      return bedNames.length > 0 ? bedNames.join(", ") : null;
    }

    return null;
  };

  useEffect(() => {
    if (activeBusinessSourceList?.length === 0) {
      dispatch(getBusinessSourceListData());
    }
    playSafeAudio("room_type_select");
  }, []);

  useEffect(() => {
    Aos.init({
      duration: 1000,
      once: true,
      easing: "ease-in-out",
    });
    // const params = {
    //   checkInDate,
    //   checkOutDate,
    // };
    if (activeBusinessSourceList?.length > 0) {
      const params = {
        start_date: checkInDate,
        end_date: checkOutDate,
        // "hr.id__exact": roomTypeId,
        max_adult: 0,
        max_children: 0,
        business_source_id: businessSourceId,
      };
      dispatch(getBookingAvailabilityListData(params));
      setSessionItem("checkInDate", checkInDateNew);
      setSessionItem("checkOutDate", checkOutDate);
      setSessionItem("checkInTime", userSession?.hotel?.check_in_time);
      setSessionItem("checkOutTime", userSession?.hotel?.check_out_time);
    }
  }, [checkInDate, checkOutDate, activeBusinessSourceList]);

  const handleDateChange = (e, type) => {
    const value = e.target.value;
    type === "checkIn" ? setCheckInDate(value) : setCheckOutDate(value);
  };

  // Calculate nights between two dates
  const calculateNights = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Update checkout date based on nights
  const updateCheckoutDate = (newNights) => {
    const checkIn = new Date(checkInDate);
    const newCheckOut = new Date(checkIn);
    newCheckOut.setDate(checkIn.getDate() + newNights);
    setCheckOutDate(newCheckOut.toISOString().split("T")[0]);
  };

  // Handle plus button click
  const handleIncreaseNights = () => {
    const newNights = nights + 1;
    setNights(newNights);
    updateCheckoutDate(newNights);
    setIsNightChangeLoading(true);
  };

  // Handle minus button click
  const handleDecreaseNights = () => {
    if (nights > 1) {
      const newNights = nights - 1;
      setNights(newNights);
      updateCheckoutDate(newNights);
      setIsNightChangeLoading(true);
    }
  };

  useEffect(() => {
    if (!bookingAvailabilityLoading) {
      setIsNightChangeLoading(false);
    }
  }, [bookingAvailabilityLoading]);

  // Update nights when dates change
  useEffect(() => {
    const calculatedNights = calculateNights(checkInDate, checkOutDate);
    setSessionItem("nights", calculatedNights);
    setNights(calculatedNights);
  }, [checkInDate, checkOutDate]);

  return (
    <div className="my-auto">
      <div
        className="d-flex align-items-end justify-content-between gap-5 mb-5"
        data-aos="fade-up"
        data-aos-delay="500"
      >
        <h1 className="heading-h1 max-500 mb-0">{t("Select_Room_and_Date")}</h1>
        <h3 className="heading-s3 max-500 mb-0">{t("Select_what_is_best")}</h3>
      </div>

      {/* Date Section */}
      <div
        className="custom-card mb-4"
        data-aos="fade-up"
        data-aos-delay="1000"
      >
        <div className="custom-card-wrap p-4">
          <div className="row justify-content-center">
            <div className="col">
              <div className="calender-box">
                <div className="d-flex align-items-center justify-content-between">
                  <img src={getImageSrc("calenderIcon")} alt="calender" />
                  <h5 className="mb-0">{t("checkIn")}</h5>
                </div>
                <div className="gray-border-bottom"></div>
                <input
                  type="date"
                  className="custom-date"
                  value={checkInDate}
                  onChange={(e) => handleDateChange(e, "checkIn")}
                  disabled={true}
                />
              </div>
            </div>
            <div className="col">
              <div className="calender-box">
                <div className="d-flex align-items-center justify-content-between">
                  <img src={getImageSrc("calenderIcon")} alt="calender" />
                  <h5 className="mb-0">{t("checkOut")}</h5>
                </div>
                <div className="gray-border-bottom"></div>
                <input
                  type="date"
                  className="custom-date"
                  value={checkOutDate}
                  onChange={(e) => handleDateChange(e, "checkOut")}
                  disabled={true}
                />
              </div>
            </div>
            <div className="col">
              <div className="calender-box">
                <div className="d-flex align-items-center justify-content-between">
                  <FontAwesomeIcon icon={faMoon} className="moon-icon" />
                  <h5 className="mb-0">{t("Night")}</h5>
                </div>
                <div className="gray-border-bottom"></div>
                <div className="d-flex align-items-center justify-content-between gap-2">
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleDecreaseNights}
                    disabled={nights <= 1}
                  >
                    <FontAwesomeIcon icon={faMinus} />
                  </button>
                  <input
                    type="number"
                    className="custom-date border border-2 border-dark rounded"
                    value={nights}
                    disabled
                  />
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={handleIncreaseNights}
                    disabled={nights == 10}
                  >
                    <FontAwesomeIcon icon={faPlus} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Swiper Section */}
      <div
        className="custom-card custom-carousel"
        data-aos="fade-up"
        data-aos-delay="1500"
      >
        <div className="custom-card-wrap cursor mb-5">
          <Swiper
            modules={[Navigation]} // Register the navigation module
            navigation={true} // Enable navigation
            spaceBetween={32}
            slidesPerView={2}
            className="p-4 booking-slider"
          >
            {bookingAvailabilityLoading && !isNightChangeLoading ? (
              <div className={`booking-room-loader `}>
                <Card className="w-100 h-10" data-bs-theme="dark">
                  <div
                    className="bg-secondary-subtle"
                    style={{
                      height: "200px",
                    }}
                  ></div>
                  <Card.Body>
                    <Placeholder as={Card.Title} animation="glow">
                      <Placeholder xs={6} />
                    </Placeholder>
                    <Placeholder as={Card.Text} animation="glow">
                      <Placeholder xs={7} /> <Placeholder xs={4} />{" "}
                      <Placeholder xs={4} /> <Placeholder xs={6} />{" "}
                      <Placeholder xs={8} />
                    </Placeholder>
                    <Placeholder.Button variant="primary" xs={6} />
                  </Card.Body>
                </Card>
              </div>
            ) : activeBookingAvailabilityList.length === 0 ? (
              <div>{t("No_data_found")}</div>
            ) : (
              activeBookingAvailabilityList
                .filter(
                  (roomType) =>
                    roomType.rate_details &&
                    roomType.rate_details[0] &&
                    roomType.rate_details[0].rate_room_type &&
                    roomType.rate_details[0].rate_room_type.length > 0
                )
                ?.map((roomType, index) => {
                  const roomImage = getRoomTypeImage(roomType.room_type_id);
                  const avgRate =
                    roomType?.rate_details?.[0]?.rate_room_type?.[0]
                      ?.rate_in_summary?.avg_rate_final;

                  const formattedRate =
                    avgRate != null && !isNaN(parseFloat(avgRate))
                      ? parseFloat(avgRate).toFixed(2)
                      : "0.00";

                  const availableRooms = roomType?.available_rooms;
                  const isSoldOut = availableRooms === 0;

                  const bedTypeNames = getBedTypeNames(roomType?.room_type_id);
                  return (
                    <SwiperSlide key={index}>
                      <div
                        className={`booking-room ${
                          isSoldOut ? "sold-out" : ""
                        }`}
                        onClick={() => {
                          if (!isSoldOut) {
                            setSessionItem(
                              "roomType",
                              JSON.stringify(roomType)
                            );
                            if (customerData) {
                              navigate("/check-in/early-checkin");
                            } else {
                              navigate("/check-in/scan-proof");
                            }
                          }
                        }}
                        style={{
                          opacity: isSoldOut ? 0.6 : 1,
                          cursor: isSoldOut ? "not-allowed" : "pointer",
                          pointerEvents: isSoldOut ? "none" : "auto",
                        }}
                      >
                        <div className="position-relative">
                          <LazyLoadImage
                            className="img-fluid"
                            src={roomImage}
                            alt={roomType.roomtype_name}
                            effect="blur"
                            width={"100%"}
                            height={"19.9375rem"}
                            style={{
                              filter: isSoldOut ? "grayscale(100%)" : "none",
                            }}
                          />
                          {isSoldOut && (
                            <div
                              style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                                backgroundColor: "rgba(220, 53, 69, 0.9)",
                                color: "white",
                                padding: "8px 16px",
                                borderRadius: "4px",
                                fontWeight: "bold",
                                fontSize: "14px",
                                textAlign: "center",
                                zIndex: 2,
                              }}
                            >
                              {t("Sold_Out") || "SOLD OUT"}
                            </div>
                          )}
                        </div>
                        <div className="text-start py-4 px-3 booking-room-content text-white">
                          {/* Header: Room Type Name on Right, Price on Left */}
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h3
                              className="fw-bold sky-font-color mb-0"
                              style={{ fontSize: "1.8rem" }}
                            >
                              {roomType.roomtype_name}
                            </h3>

                            {isSoldOut ? (
                              <h4 className="text-danger fw-bold mb-0">
                                {t("Sold_Out") || "SOLD OUT"}
                              </h4>
                            ) : isNightChangeLoading ? (
                              <Placeholder
                                as="h4"
                                animation="glow"
                                className="mb-0"
                              >
                                <Placeholder xs={5} />
                              </Placeholder>
                            ) : (
                              <h4
                                className="fw-bold mb-0"
                                style={{ fontSize: "1.6rem", color: "#00e676" }}
                              >
                                {currencySymbol?.symbola || currency}
                                {formattedRate}
                                <small
                                  className="text-white"
                                  style={{ fontSize: "1rem" }}
                                >
                                  {" "}
                                  / night
                                </small>
                              </h4>
                            )}
                          </div>

                          {/* Bed Info in Bordered Box */}
                          {isNightChangeLoading ? (
                            <Placeholder
                              as="div"
                              animation="glow"
                              className="mb-3"
                            >
                              <Placeholder xs={6} />
                            </Placeholder>
                          ) : (
                            bedTypeNames && (
                              <div
                                className="d-inline-flex align-items-center gap-2 mb-3"
                                style={{ fontSize: "1.5rem" }}
                              >
                                <FontAwesomeIcon
                                  icon={faBed}
                                  className="text-secondary"
                                />
                                <strong className="text-white">
                                  {bedTypeNames}
                                </strong>
                              </div>
                            )
                          )}

                          {/* Adults & Children in one line */}
                          {isNightChangeLoading ? (
                            <Placeholder as="div" animation="glow">
                              <Placeholder xs={4} className="me-3" />
                              <Placeholder xs={4} />
                            </Placeholder>
                          ) : (
                            <div
                              className="d-flex align-items-center gap-4 mb-2"
                              style={{ fontSize: "1.05rem" }}
                            >
                              <div className="d-flex align-items-center gap-2">
                                <FontAwesomeIcon
                                  icon={faUser}
                                  className="text-secondary"
                                />
                                {t("Adults")}:{" "}
                                <strong className="text-white">
                                  {roomType?.max_adult ?? "-"}
                                </strong>
                              </div>
                              <div className="d-flex align-items-center gap-2">
                                <FontAwesomeIcon
                                  icon={faChild}
                                  className="text-secondary"
                                />
                                {t("Children")}:{" "}
                                <strong className="text-white">
                                  {roomType?.max_children ?? "-"}
                                </strong>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </SwiperSlide>
                  );
                })
            )}
          </Swiper>
        </div>

        <div
          className="custom-card mb-4"
          data-aos="fade-up"
          data-aos-delay="1500"
        >
          <div className="custom-card-wrap fs-3 text-blue text-uppercase py-3 text-center">
            {t("Click_one_room_type_to_start")}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectRoomType;
