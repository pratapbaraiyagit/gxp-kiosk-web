import Aos from "aos";
import React, { useEffect } from "react";
import ServiceCard from "../../components/ServiceCard";
import { getImageSrc } from "../../utils/bulkImageStorage";
import { useTranslation } from "react-i18next";

const HotelInfo = () => {
  const { t } = useTranslation();
  useEffect(() => {
    Aos.init({
      duration: 1000,
      once: true,
      easing: "ease-in-out",
    });
  }, []);

  const serviceData = [
    {
      image: getImageSrc("FireSafetyImg"),
      title: "Fire Safety",
      link: "/hotel-info/details",
    },
    {
      image: getImageSrc("ACImg"),
      title: "Air-Conditioning",
      link: "/hotel-info/details",
    },
    {
      image: getImageSrc("ChargingImg"),
      title: "Charging Adaptor",
      link: "/hotel-info/details",
    },
    {
      image: getImageSrc("MiniBarImg"),
      title: "Mini Bar",
      link: "/hotel-info/details",
    },
    {
      image: getImageSrc("CarbonSafetyImg"),
      title: "Carbon Monoxide Saf",
      link: "/hotel-info/details",
    },
    {
      image: getImageSrc("IronImg"),
      title: "Iron Boards",
      link: "/hotel-info/details",
    },
    {
      image: getImageSrc("LaundryImg"),
      title: "Laundry",
      link: "/hotel-info/details",
    },
    {
      image: getImageSrc("AccessibleIcon"),
      title: "Accessibility",
      link: "/hotel-info/details",
    },
  ];

  return (
    <>
      <div className="my-auto">
        <h1 data-aos="fade-up" data-aos-delay="500" className="heading-h1">
          {t("Hotel_Information")}
        </h1>
        <div className="service-scrollbar pe-2">
          <div className="row">
            {serviceData?.map((item, index) => (
              <div className="col-md-6 mb-4">
                <ServiceCard
                  image={item.image}
                  title={item.title}
                  link={item.link}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default HotelInfo;
