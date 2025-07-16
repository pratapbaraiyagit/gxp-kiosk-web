import Aos from "aos";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getSessionItem,
  removeSessionItem,
  setSessionItem,
} from "../hooks/session";
import { getImageSrc } from "../utils/bulkImageStorage";
import { useDispatch, useSelector } from "react-redux";
import { agentUserMQTTAction } from "../redux/reducers/MQTT/agentUserMQTT";
import { getKioskAudioListData } from "../redux/reducers/Booking/kioskAudio";

const SplashScreen = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hide, setHide] = useState(false);

  const sentences = [
    "Let's kick-start your experience.",
    "Start your check-in completely contactless.",
    "Check-in with just your smiley face ☺ It's fast, secure, and easy.",
    "No lines. No waiting. Just walk in and relax. Create a new booking in seconds.",
    "Forgot your key in room? Get your room key instantly with face ID.",
  ];

  const { activeKioskDeviceList } = useSelector(
    ({ kioskDevice }) => kioskDevice
  );

  const userData = getSessionItem("hotelKiosk");
  const userSession = userData
    ? JSON.parse(decodeURIComponent(escape(atob(userData))))
    : null;

  const deviceIds =
    activeKioskDeviceList?.map((device) => device.id).filter(Boolean) || [];

  useEffect(() => {
    Aos.init({
      duration: 1000,
      once: true,
      easing: "ease-in-out",
    });
    const payload = {
      params: {
        hotel_id: userSession?.hotel?.id,
        hack_ignore_pagination: true,
        "al.short_name": "en",
      },
    };
    dispatch(getKioskAudioListData(payload));
  }, []);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setHide(true); // trigger fade-out
    }, 5000); // show sentence for 2.5s

    const timer2 = setTimeout(() => {
      setCurrentIndex((prev) => (prev === sentences.length - 1 ? 0 : prev + 1));
      setHide(false); // reset for next sentence
    }, 6000); // switch after fade-out

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [currentIndex]);

  return (
    <>
      <div>
        <div className="splash-bg d-flex flex-column justify-content-between">
          {/* <h1 className="mb-0" data-aos="fade-up" data-aos-delay="500">
            Let's <br />
            Kick Start <br />
            Your <br />
            Experience.
          </h1> */}

          <div
            key={currentIndex}
            data-aos="fade-up"
            className={`sentence ${hide ? "fade-down" : ""}`}
          >
            <h1>{sentences[currentIndex]}</h1>
          </div>

          <div className="d-flex align-items-center justify-content-between">
            <div
              className="rounded-pill position-relative"
              data-aos="fade-down"
              data-aos-delay="1000"
            >
              <div class="animated-border-box-glow"></div>
              <button
                className="btn splash-btn gap-3"
                onClick={() => {
                  removeSessionItem("splash");
                  removeSessionItem("SelfieGetData");
                  navigate("/home");
                  setSessionItem("selfCheckIn", true);
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
                }}
              >
                <span className="round-logo-bg">
                  <img src={getImageSrc("RightLogoIcon")} alt="right-logo" />
                </span>
                <span>
                  <span className="d-block text-start text-light fs-1 lh-1">
                    CLICK HERE TO{" "}
                  </span>
                  <span className="d-block text-start text-primary">
                    START JOURNEY
                  </span>
                </span>
              </button>
            </div>
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

export default SplashScreen;
