import Aos from "aos";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Line } from "../../assets/image/Image";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { getBookingRoomAvailableListData } from "../../redux/reducers/Booking/bookingAvailability";
import { getSessionItem, setSessionItem } from "../../hooks/session";
import Swal from "sweetalert2";
import { getImageSrc } from "../../utils/bulkImageStorage";
import { playBeep } from "../../utils/playBeep";
import { playSafeAudio } from "../../utils/commonFun";

const Room = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const checkInDate = getSessionItem("checkInDate");
  const checkOutDate = getSessionItem("checkOutDate");
  const room_type = getSessionItem("roomType");
  const roomTypeData = JSON.parse(room_type);

  const { activeBookingList, getBookingDetailsData } = useSelector(
    ({ booking }) => booking
  );
  const { bookingAvailabilityLoading, activeBookingRoomAvailableList } =
    useSelector(({ bookingAvailability }) => bookingAvailability);
  const booking = activeBookingList?.[0];

  const [selectedRoom, setSelectedRoom] = useState({ id: "", room_number: "" });

  useEffect(() => {
    Aos.init({
      duration: 1000,
      once: true,
      easing: "ease-in-out",
    });
    playSafeAudio("select_room");
  }, []);

  useEffect(() => {
    const paramDataCheck = {
      params: {
        roomtype_id: roomTypeData?.room_type_id
          ? roomTypeData?.room_type_id
          : getBookingDetailsData?.booking_room?.[0]?.roomtype_id,
        check_in_date: checkInDate
          ? checkInDate
          : getBookingDetailsData?.booking?.check_in_date,
        check_out_date: checkOutDate
          ? checkOutDate
          : getBookingDetailsData?.booking?.check_out_date,
      },
    };
    dispatch(getBookingRoomAvailableListData(paramDataCheck));
  }, []);

  useEffect(() => {
    setSelectedRoom({
      id: getBookingDetailsData?.booking_room?.[0]?.roomtype_id,
      room_number:
        getBookingDetailsData?.booking_room?.[0]?.rooms?.[0]?.room_number,
    });
  }, [getBookingDetailsData?.booking_room]);

  const selectRoom = (roomType, room) => {
    if (
      room.occupancy_status.code_name === "occupied" ||
      room.occupancy_status.code_name === "reserved"
    ) {
      return;
    }

    setSessionItem("room_type", JSON.stringify(roomType));
    setSessionItem("room", JSON.stringify(room));
    setSelectedRoom({
      id: roomType.roomtype_id,
      room_number: room.room_number,
    });
  };

  const getRoomStatusClass = (room) => {
    // Check if room matches either selected room or booking details room
    const bookingRoomNumber =
      getBookingDetailsData?.booking_room?.[0]?.rooms[0]?.room_number;

    if (
      selectedRoom.room_number === room.room_number ||
      bookingRoomNumber === room.room_number
    ) {
      return "active";
    }

    if (room?.occupancy_status?.code_name !== "vacant") {
      return "disabled";
    }

    return "";
  };

  const renderRooms = (roomType) => {
    const allRooms = roomType?.building_details?.flatMap((building) =>
      building?.floors?.flatMap((floor) =>
        floor?.rooms?.map((room) => ({
          ...room,
          building_short_name: building.building_short_name,
          floor_short_name: floor.floor_short_name,
        }))
      )
    );

    return (
      <div className="mb-4">
        <div className="mb-4">
          <div className="custom-card room-no-section">
            <div className="custom-card-wrap p-4">
              <div className="row room-no-scroll">
                {allRooms.map((room, index) => {
                  return (
                    <div key={index} className="col-md-3 mb-3">
                      <div
                        className={`room-no-card text-center position-relative ${getRoomStatusClass(
                          room
                        )}`}
                        onClick={() => selectRoom(roomType, room)}
                      >
                        <div>
                          <h2>{room.room_number}</h2>
                          <img src={Line} alt="line" className="w-100" />
                          <h4 className="mb-0">{roomType.roomtype_name}</h4>
                          <p
                            className={`mb-2 text-white ${selectedRoom.room_number === room.room_number
                                ? "opacity-75"
                                : "opacity-25"
                              } `}
                          >
                            {room.building_short_name} - {room.floor_short_name}
                          </p>
                        </div>
                        {selectedRoom.room_number === room.room_number && (
                          <img
                            src={getImageSrc("CheckIcon")}
                            alt="check"
                            className="check"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="my-auto">
        <h1 className="heading-h1" data-aos="fade-up" data-aos-delay="500">
          {t("Please_Select_Your_Room")}
        </h1>

        {bookingAvailabilityLoading ? (
          <div className="common-loader" v-if="addOnLoader">
            <div className="spinner-border" role="status">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        ) : activeBookingRoomAvailableList?.length === 0 ? (
          <>
            <div data-aos="fade-down" data-aos-delay="1000">
              <h3 className="text-s3 mb-5">
                {" "}
                {bookingAvailabilityLoading
                  ? "Loading..."
                  : `${t("No_Data_Found")}`}
              </h3>
            </div>
            <div data-aos="fade-down" data-aos-delay="1500">
              <button
                className="common-btn black-btn"
                onClick={() => navigate(-1)}
              >
                {t("Back")}
              </button>
            </div>
          </>
        ) : (
          activeBookingRoomAvailableList?.map((roomType) => (
            <>
              <div
                key={roomType.id}
                className="custom-card room-no-section"
                data-aos="fade-up"
                data-aos-delay="1000"
              >
                {renderRooms(roomType)}
              </div>
              <div
                className="d-flex align-items-center justify-content-center gap-4 my-5"
                data-aos="fade-up"
                data-aos-delay="1500"
              >
                <div className="room-status d-flex align-items-center">
                  <img src={getImageSrc("Available")} alt="available" />
                  <h5 className="mb-0">{t("Available")}</h5>
                </div>
                <div className="room-status d-flex align-items-center">
                  <img src={getImageSrc("Booked")} alt="booked" />
                  <h5 className="mb-0">{t("Booked")}</h5>
                </div>
                <div className="room-status d-flex align-items-center">
                  <img src={getImageSrc("Selected")} alt="selected" />
                  <h5 className="mb-0">{t("Selected")}</h5>
                </div>
              </div>
              <div
                className="d-flex align-items-center justify-content-between"
                data-aos="fade-up"
                data-aos-delay="2000"
              >
                <button
                  className="common-btn black-btn"
                  onClick={() => navigate(-1)}
                >
                  {t("Back")}
                </button>
                <button
                  className="common-btn blue-btn"
                  onClick={() => {
                    if (selectedRoom.id && selectedRoom.room_number) {
                      navigate("/check-in/signature");
                    } else {
                      playBeep();
                      Swal.fire({
                        // title: t("Invalid Phone Number"),
                        text: t("Please_select_room"),
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
                  }}
                >
                  {t("Continue")}
                </button>
              </div>
              {/* <div
                className="text-center mt-3"
                data-aos="fade-down"
                data-aos-delay="2000"
              >
                <button className="common-btn blue-btn">
                  UPGRADE ROOM AT $45.00
                </button>
              </div> */}
            </>
          ))
        )}
      </div>
    </>
  );
};

export default Room;
