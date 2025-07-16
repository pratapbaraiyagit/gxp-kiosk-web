import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const ServiceCard = (props) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="service-card shadow">
        <div className="position-relative overflow-hidden">
          <img src={props.image} alt="Fire Safety" />
          <div className="card-overlay">
            <h3>{props.title}</h3>
            <Link to={props.link} className="know-more">
              {t("KNOW_MORE")}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default ServiceCard;
