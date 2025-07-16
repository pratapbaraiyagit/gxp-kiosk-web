import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState } from "react";
import { faBars, faTimes } from "@fortawesome/free-solid-svg-icons";
import {
  FeedbackIcon,
  FlightIcon,
  HotelInfoIcon,
  HotelMapIcon,
  PickupIcon,
  PlacesIcon,
} from "../../assets/image/Image";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Menu = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  const menuItems = [
    { icon: FlightIcon, label: t("Flight_Schedule"), link: "/flight-schedule" },
    { icon: FeedbackIcon, label: t("Feedback"), link: "/feedback" },
    { icon: HotelMapIcon, label: t("Hotel_Map"), link: "/hotel-map" },
    { icon: PlacesIcon, label: t("Places_Nearby"), link: "/near-by-place" },
    { icon: HotelInfoIcon, label: t("Hotel_Info"), link: "/hotel-info" },
    { icon: PickupIcon, label: t("Pickup_Key"), link: "/pickup" },
  ];

  const getPosition = (index) => {
    const radius = 500;
    const totalItems = menuItems.length;
    const angleSpacing = 85 / (totalItems - 1);
    const angle = index * angleSpacing * (Math.PI / 180);

    return {
      transform: isOpen
        ? `translate(${-Math.sin(angle) * radius - 20}px, ${
            Math.cos(angle) * radius
          }px)`
        : "translate(0, 0)",
      opacity: isOpen ? 1 : 0,
      transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
      transitionDelay: `${isOpen ? index * 50 : 0}ms`,
    };
  };

  return (
    <>
      <div className="custom-menu">
        <nav className={isOpen ? "nav-open" : null}>
          <ul className={isOpen ? "curvedBgOpen" : null}>
            {!isOpen ? (
              <label onClick={() => setIsOpen(true)} className="fs-4">
                <FontAwesomeIcon icon={faBars} />
              </label>
            ) : (
              <label onClick={() => setIsOpen(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </label>
            )}
            {menuItems?.map((item, index) => (
              <li
                className="circle-nav-item-2"
                key={index}
                style={{
                  ...getPosition(index),
                }}
              >
                <div onClick={() => navigate(item.link)}>
                  {item.icon}
                  <p className="mb-0">{item.label}</p>
                </div>
              </li>
            ))}
            {/* <li className="circle-nav-item-1">
              <div onClick={() => navigate("/pickup")}>
                {PickupIcon}
                <p className="mb-0">
                  Pickup <br />
                  Key
                </p>
              </div>
            </li>
            <li className="circle-nav-item-2">
              <div onClick={() => navigate("/near-by-place")}>
                {HotelInfoIcon}
                <p className="mb-0">
                  Hotel <br />
                  Info
                </p>
              </div>
            </li>
            <li className="circle-nav-item-3">
              <div onClick={() => navigate("/near-by-place")}>
                {PlacesIcon}
                <p className="mb-0">
                  Places <br />
                  Nearby
                </p>
              </div>
            </li>
            <li className="circle-nav-item-4">
              <div onClick={() => navigate("/hotel-map")}>
                {HotelMapIcon}
                <p className="mb-0">
                  Hotel <br />
                  Map
                </p>
              </div>
            </li>
            <li className="circle-nav-item-5">
              <div>
                {FeedbackIcon}
                <p className="mb-2">Feedback</p>
              </div>
            </li>
            <li className="circle-nav-item-6">
              <div>
                {FlightIcon}
                <p className="mb-0 text-cetner">
                  Flight <br />
                  Schedule
                </p>
              </div>
            </li> */}
          </ul>
        </nav>
      </div>
    </>
  );
};

export default Menu;
