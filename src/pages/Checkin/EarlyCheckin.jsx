import Aos from "aos";
import React, { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { getSessionItem, setSessionItem } from "../../hooks/session";
import { useSelector } from "react-redux";
import { currency } from "../../utils/data";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { playSafeAudio } from "../../utils/commonFun";

dayjs.extend(utc);
dayjs.extend(timezone);

const EarlyCheckin = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const termsConditions = getSessionItem("terms_and_conditions");

  const userData = getSessionItem("hotelKiosk");
  const userSession = userData
    ? JSON.parse(decodeURIComponent(escape(atob(userData))))
    : null;

  const { activeCurrencyList } = useSelector(
    ({ paymentMethod }) => paymentMethod
  );

  const { activeAddOnList } = useSelector(
      ({ addOn }) => addOn
    );

  const earlyCheckInData = activeAddOnList?.find((item) => item?.code_name === "early_check_in")

  const currencySymbol = useMemo(() => {
    return activeCurrencyList?.find(
      (item) => item?.id === userSession?.hotel?.currency
    );
  }, [activeCurrencyList, userSession?.hotel?.currency]);

  useEffect(() => {
    Aos.init({
      duration: 1000,
      once: true,
      easing: "ease-in-out",
    });
    playSafeAudio("early_check_in_request");
  }, []);

  const time = userSession?.hotel?.check_in_time; // "20:00:00"
  const earlyCheckInRaw = userSession?.hotel?.early_check_in_time; // "13:00:00"
  const timeZone = userSession?.hotel?.time_zone; // e.g., "America/New_York"

  const checkInTime = useMemo(() => {
    if (!time || !timeZone) return "11:00";
    const todayUTC = dayjs.utc().format("YYYY-MM-DD");
    const datetime = `${todayUTC}T${time}Z`;
    return dayjs.utc(datetime).tz(timeZone).format("HH:mm:ss");
  }, [time, timeZone]);

  const earlyCheckInTime = useMemo(() => {
    if (!earlyCheckInRaw || !timeZone) return null;
    const todayUTC = dayjs.utc().format("YYYY-MM-DD");
    const datetime = `${todayUTC}T${earlyCheckInRaw}Z`;
    return dayjs.utc(datetime).tz(timeZone).format("HH:mm:ss");
  }, [earlyCheckInRaw, timeZone]);

  return (
    <div className="my-auto">
      <h1
        className="heading-h1"
        data-aos="fade-up"
        data-aos-duration="1000"
        data-aos-delay="500"
      >
        {t("standard_checkin_time")}
      </h1>

      <div
        className="custom-card early-checkin-section mb-5"
        data-aos="fade-up"
        data-aos-delay="1000"
      >
        <div className="custom-card-wrap p-4">
          <div className="blur-bg">
            <h2>
              {t("standard_checkin_time_is_at")}
              <br />
              <span>{checkInTime}</span> <br />
                {t("Early_checkin_is_available")}
                <br />
              {t("for_an_additional_fee")}
            </h2>
            <div className="checkin-border-bottom"></div>
            <h2 className="fs-48 font-poppins">
              <strong>{currencySymbol?.symbol || currency} {earlyCheckInData?.total_amount || 0}</strong>{" "}
              {t("USD_Extra_Charge")}
            </h2>
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
          {t("Home")}
        </button>
        <button
          className="common-btn blue-btn"
          onClick={() => {
            setSessionItem("earlyCheckInAmount", earlyCheckInData?.total_amount);
            if (termsConditions === "reservation")
              navigate("/walk-in/review-confirmations");
            else if (termsConditions === "checkin")
              navigate("/walk-in/review-confirmation");
          }}
        >
          {t("Looks_Good")}
        </button>
      </div>
    </div>
  );
};

export default EarlyCheckin;
