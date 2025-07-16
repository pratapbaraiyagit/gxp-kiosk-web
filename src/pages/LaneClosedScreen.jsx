import Aos from "aos";
import React, { useEffect } from "react";
import { getImageSrc } from "../utils/bulkImageStorage";
import { agentUserMQTTAction } from "../redux/reducers/MQTT/agentUserMQTT";
import { useDispatch, useSelector } from "react-redux";
import { getSessionItem, removeSessionItem } from "../hooks/session";
import { useTranslation } from "react-i18next";

const LaneClosedScreen = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const { activeKioskDeviceList } = useSelector(
    ({ kioskDevice }) => kioskDevice
  );
  const deviceIds =
    activeKioskDeviceList?.map((device) => device.id).filter(Boolean) || [];

  const mqttState = useSelector((state) => state.mqtt);

  const userData = getSessionItem("hotelKiosk");
  const userSession = userData
    ? JSON.parse(decodeURIComponent(escape(atob(userData))))
    : null;

  const data =
    mqttState?.lastMessage?.message &&
    JSON.parse(mqttState?.lastMessage?.message);

  useEffect(() => {
    Aos.init({
      duration: 1000,
      once: true,
      easing: "ease-in-out",
    });
  }, []);

  useEffect(() => {
    dispatch(
      agentUserMQTTAction({
        cmd: data?.cmd,
        device_uuid_list: deviceIds,
        response: {
          status: true,
          code: data?.seq,
          message: "Kiosk Lane Closed Status applied.",
          data: { status_mode: "close" },
        },
      })
    );
    return () => {
      removeSessionItem("splash");
      dispatch(
        agentUserMQTTAction({
          cmd: "kiosk_online",
          device_uuid_list: deviceIds,
          response: {
            status: true,
            message: "Kiosk Online Status applied.",
            data: { status_mode: "online" },
          },
        })
      );
    };
  }, []);

  return (
    <>
      <div>
        <div className="splash-bg d-flex flex-column justify-content-between">
          <h1 className="mb-0" data-aos="fade-up" data-aos-delay="500">
            {t("makeReservation")} <br />
            <span className="fs-1">
              {t("Please_contact_the_front_desk_staff")}
            </span>
          </h1>
          <div className="d-flex align-items-center justify-content-between">
            <div
              className="logo-text"
              data-aos="fade-down"
              data-aos-delay="1500"
            >
              {userSession?.hotel?.logo ? (
                <>
                  <img src={userSession?.hotel?.logo} alt="logo" />
                  {/* <h3 className="text-end mb-0">
                    {userSession?.hotel?.hotel_name}
                  </h3> */}
                </>
              ) : (
                <>
                  <img src={getImageSrc("Smallogo")} alt="logo" />
                  {/* <h3 className="text-end mb-0">Hotel</h3> */}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LaneClosedScreen;
