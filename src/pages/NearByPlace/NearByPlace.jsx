import React, { useEffect, useState } from "react";

import ServiceCard from "../../components/ServiceCard";
import { getImageSrc } from "../../utils/bulkImageStorage";
import { useTranslation } from "react-i18next";
import Aos from "aos";

const NearByPlace = () => {
  const { t } = useTranslation();
  useEffect(() => {
    Aos.init({
      duration: 1000,
      once: true,
      easing: "ease-in-out",
    });
  }, []);
  const nearPlacesData = [
    {
      image: getImageSrc("NearbyPlace1"),
      title: "National Historical Park",
      link: "/near-by-place/details",
    },
    {
      image: getImageSrc("NearbyPlace2"),
      title: "Ghost Tours",
      link: "/near-by-place/details",
    },
    {
      image: getImageSrc("NearbyPlace3"),
      title: "Hopscotch San Antonio",
      link: "/near-by-place/details",
    },
    {
      image: getImageSrc("NearbyPlace4"),
      title: "Art Museum",
      link: "/near-by-place/details",
    },
    {
      image: getImageSrc("NearbyPlace5"),
      title: "Golf Course",
      link: "/near-by-place/details",
    },
  ];

  return (
    <>
      <div className="my-auto">
        <h1 data-aos="fade-up" data-aos-delay="500" className="heading-h1">
          {t("Nearby_Places_to_visit")}
        </h1>
        <div className="service-scrollbar pe-2">
          <div className="row">
            {nearPlacesData?.map((item, index) => (
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

export default NearByPlace;
