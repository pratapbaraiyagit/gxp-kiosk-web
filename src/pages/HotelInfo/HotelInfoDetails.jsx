import React, { useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import Aos from "aos";
import { getImageSrc } from "../../utils/bulkImageStorage";

const HotelInfoDetails = () => {
  useEffect(() => {
    Aos.init({
      duration: 1000,
      once: true,
      easing: "ease-in-out",
    });
  }, []);

  return (
    <div className="my-auto">
      <h1 data-aos="fade-up" data-aos-delay="500" className="heading-h1">
        Fire Safety
      </h1>
      <div data-aos="fade-up" data-aos-delay="1000">
        <Swiper
          loop={true}
          autoplay={{
            delay: 2500,
            disableOnInteraction: false,
          }}
          pagination={{
            clickable: true,
          }}
          modules={[Autoplay, Pagination]}
          className="details-slider"
        >
          <SwiperSlide>
            <img src={getImageSrc("FireSafetyImg")} alt="FireSafetyImg" />
          </SwiperSlide>
          <SwiperSlide>
            <img src={getImageSrc("FireSafetyImg")} alt="FireSafetyImg" />
          </SwiperSlide>
          <SwiperSlide>
            <img src={getImageSrc("FireSafetyImg")} alt="FireSafetyImg" />
          </SwiperSlide>
        </Swiper>
      </div>
      <div
        className="custom-card my-5"
        data-aos="fade-up"
        data-aos-delay="1500"
      >
        <div className="custom-card-wrap p-4">
          <div className="blur-bg">
            <h4 className="mb-0">
              Fire safety in hotels is essential to protect guests, staff, and
              property. It involves implementing preventive measures such as
              smoke detectors, fire extinguishers, and sprinkler systems, as
              well as clear emergency exits and escape routes. Regular fire
              drills, staff training, and proper signage help ensure everyone
              knows how to respond in an emergency. By maintaining safety
              equipment and following fire safety protocols, hotels can minimize
              risks and provide a safer environment for all.
            </h4>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelInfoDetails;
