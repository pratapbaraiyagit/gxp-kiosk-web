import Aos from "aos";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";

const FlightSchedule = () => {
  const { t } = useTranslation();

  useEffect(() => {
    Aos.init({
      duration: 1000,
      once: true,
      easing: "ease-in-out",
    });
  }, []);

  return (
    <>
      <div className="my-auto">
        <h1 className="heading-h1" data-aos="fade-up" data-aos-delay="500">
          {t("Flight_Schedule")}
        </h1>
        <div
          className="custom-card form-input mb-4"
          data-aos="fade-up"
          data-aos-delay="1000"
        >
          <div className="custom-card-wrap p-4">
            <div className="iframe-container">
              <iframe
                src={
                  "https://kitchen.screenfeed.com/flights/status-board/5c9mx8kzdqstm46p2ykng0qks8.html?flighttype=arrivals&sortby=City&pause=6&basecolor=%23353a40"
                }
                className="responsive-iframe w-100 h-100 border-0"
                title="Flight Status Board"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FlightSchedule;
