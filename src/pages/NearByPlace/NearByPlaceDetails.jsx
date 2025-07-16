import React, { useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import Aos from "aos";
import { getImageSrc } from "../../utils/bulkImageStorage";

const NearByPlaceDetails = () => {
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
        <h1 data-aos="fade-up" data-aos-delay="500" className="heading-h1">
          National Historical Park
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
              <img src={getImageSrc("NearbyPlace1")} alt="FireSafetyImg" />
            </SwiperSlide>
            <SwiperSlide>
              <img src={getImageSrc("NearbyPlace2")} alt="FireSafetyImg" />
            </SwiperSlide>
            <SwiperSlide>
              <img src={getImageSrc("NearbyPlace3")} alt="FireSafetyImg" />
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
                San Antonio Missions National Historical Park is a National
                Historical Park and part of a UNESCO World Heritage Site
                preserving four of the five Spanish frontier missions in San
                Antonio, Texas, US. These outposts were established by Catholic
                religious orders to spread Christianity among the local natives
              </h4>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NearByPlaceDetails;
