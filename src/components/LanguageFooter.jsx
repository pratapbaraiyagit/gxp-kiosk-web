import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Aos from "aos";
import "swiper/css";
import "swiper/css/pagination";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import { getSessionItem } from "../hooks/session";
import { getKioskAudioListData, setIsKioskAudioUpdate } from "../redux/reducers/Booking/kioskAudio";
import { useDispatch, useSelector } from "react-redux";
import { playSafeAudio } from "../utils/commonFun";

const LanguageFooter = () => {
  const { i18n, t } = useTranslation();
  const dispatch = useDispatch();

  const { isKioskAudioUpdate } = useSelector(({ KioskAudio }) => KioskAudio);

  const hotelData = getSessionItem("hotelKiosk");
  const hotelSession = hotelData
    ? JSON.parse(decodeURIComponent(escape(atob(hotelData))))
    : null;

  const kioskData = getSessionItem("KioskConfig");
  const kioskSession = kioskData
    ? JSON.parse(decodeURIComponent(escape(atob(kioskData))))
    : null;

  const [playWelcomeAudio, setPlayWelcomeAudio] = useState(false);
  const hotelKioskConfig = kioskSession?.[0]?.hotel_kiosk_config;

  const userLanguages = hotelKioskConfig?.home_page?.language_short_name || [];
  // Default flag mapping for languages without country_name
  const defaultFlagMapping = {
    ar: "sa", // Saudi Arabia for Arabic
    zh: "cn", // China for Chinese
    fr: "fr", // France for French
    hi: "in", // India for Hindi
    ja: "jp", // Japan for Japanese
    en: "us", // US for English (fallback)
  };

  useEffect(() => {
    if (isKioskAudioUpdate && playWelcomeAudio) {
      playSafeAudio("select_language")
      dispatch(setIsKioskAudioUpdate(false));
      setPlayWelcomeAudio(false);
    }
  }, [isKioskAudioUpdate])

  const changeLanguage = (lng) => {
    const payload = {
      params: {
        hotel_id: hotelSession?.hotel?.id,
        hack_ignore_pagination: true,
        "al.short_name": lng
      }
    }
    dispatch(getKioskAudioListData(payload));
    i18n.changeLanguage(lng);
    setPlayWelcomeAudio(true)
  };

  // useEffect(() => {
  //   const fetchAudioList = () => {
  //     const payload = {
  //       params: {
  //         hotel_id: hotelSession?.hotel?.id,
  //         hack_ignore_pagination: true,
  //         "al.short_name": i18n.language,
  //       },
  //     };
  //     dispatch(getKioskAudioListData(payload));
  //   };

  //   fetchAudioList(); // initial call

  //   const intervalId = setInterval(() => {
  //     fetchAudioList();
  //   }, 50 * 60 * 1000); // 50 minutes in milliseconds

  //   return () => clearInterval(intervalId); // cleanup on unmount
  // }, [dispatch, i18n.language]);

  const getFlagUrl = (language) => {
    const countryCode = language.country_name
      ? language.country_name.toLowerCase()
      : defaultFlagMapping[language.short_name] || "us";

    return `https://flagcdn.com/48x36/${countryCode}.png`;
  };

  const getFlagSrcSet = (language) => {
    const countryCode = language.country_name
      ? language.country_name.toLowerCase()
      : defaultFlagMapping[language.short_name] || "us";

    return `https://flagcdn.com/32x24/${countryCode}.png 2x, https://flagcdn.com/48x36/${countryCode}.png 3x`;
  };

  useEffect(() => {
    if (!i18n.language || i18n.language === "" || i18n.language === "en-GB") {
      i18n.changeLanguage("en");
    }
  }, [i18n]);

  useEffect(() => {
    Aos.init({
      duration: 1000,
      once: true,
      easing: "ease-in-out",
    });
  }, []);

  return (
    <>
      <div
        className="language-section text-center w-100 mb-4"
        data-aos="fade-up"
        data-aos-delay="1500"
      >
        <h3 className="heading-s3 text-center mb-5">{t("chooseLanguage")}</h3>
        <Swiper
          modules={[Pagination]}
          pagination={{
            clickable: true,
          }}
          spaceBetween={32}
          slidesPerView={4}
          className="p-4 pb-5 language-slider"
        >
          {userLanguages.map((language, index) => (
            <SwiperSlide
              key={`${language.short_name}-${index}`}
              className={`language-box d-flex align-items-center gap-3 ${i18n.language === language.short_name ? "active" : ""
                }`}
              onClick={() => changeLanguage(language.short_name)}
            >
              <img
                src={getFlagUrl(language)}
                srcSet={getFlagSrcSet(language)}
                alt={`${language.full_name} flag`}
                className="country-flag"
                // width={50}
                // height={50}
                loading="lazy"
              />
              <h4 className="mb-0 text-capitalize">{language?.display_name}</h4>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </>
  );
};

export default LanguageFooter;
