import Aos from "aos";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { getSessionItem } from "../../hooks/session";
import { useSelector } from "react-redux";
import { terms_condition } from "../../utils/data";

const TermsCondition = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const termsAndConditions = getSessionItem("terms_and_conditions");

  const { activeHotelTermsConditionList } = useSelector(
    ({ hotelTermsCondition }) => hotelTermsCondition
  );

  const KioskDeviceInfo = getSessionItem("KioskDeviceInfo");
  const KioskDeviceInfoSession = KioskDeviceInfo
    ? JSON.parse(decodeURIComponent(escape(atob(KioskDeviceInfo))))
    : null;
  const newKioskDeviceMode = KioskDeviceInfoSession?.[0]?.mode;
  
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
          {/* {{ textLabel?.terms_conditions }} */}
          {t("Terms")}
          <br />
          {t("Conditions")}
        </h1>

        <div
          className="custom-card mb-5"
          data-aos="fade-up"
          data-aos-delay="1000"
        >
          <div className="custom-card-wrap p-4">
            <div className="blur-bg">
              <div
                className="text-light"
                dangerouslySetInnerHTML={{
                  __html:
                    newKioskDeviceMode === "demo"
                      ? activeHotelTermsConditionList?.[0]?.terms_condition ||
                        terms_condition
                      : activeHotelTermsConditionList?.[0]?.terms_condition,
                }}
              />
            </div>
          </div>
        </div>
        <div
          className="d-flex align-items-center justify-content-between"
          data-aos="fade-up"
          data-aos-delay="1500"
        >
          <button
            className="common-btn black-btn"
            onClick={() => navigate("/home")}
          >
            {t("Reject")}
          </button>
          <button
            className="common-btn blue-btn"
            onClick={() => {
              if (termsAndConditions === "checkin") {
                navigate("/check-in/find-booking");
              } else if (termsAndConditions === "reservation") {
                navigate("/walk-in/room-type");
              }
            }}
          >
            {t("Accept")}
          </button>
        </div>
      </div>
    </>
  );
};

export default TermsCondition;
