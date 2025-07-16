import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const SlideToUnlock = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);
  const { t } = useTranslation();

  const handleSliderChange = (event) => {
    const value = parseInt(event.target.value, 10);
    setSliderValue(value);

    if (value === 100) {
      setIsUnlocked(true);
    }
  };

  const handleTouchStart = (event) => {
    event.target.classList.add("active");
  };

  const handleTouchEnd = (event) => {
    event.target.classList.remove("active");
    if (sliderValue < 100) {
      setSliderValue(0);
    }
  };
  return (
    <>
      {!isUnlocked ? (
        <div className="slider-container">
          <input
            type="range"
            min="0"
            max="100"
            value={sliderValue}
            className="slider p-2"
            onChange={handleSliderChange}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleTouchStart}
            onMouseUp={handleTouchEnd}
          />
          <div className="slider-text">
            {t("Swipe_to_print_key")} <FontAwesomeIcon icon={faArrowRight} />
          </div>
        </div>
      ) : (
        <div className="slider-container">
          <div className="slider-text green-success">{t("Print_your_key")}</div>
        </div>
      )}
    </>
  );
};

export default SlideToUnlock;
