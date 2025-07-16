import React from "react";
import { getImageSrc } from "../../utils/bulkImageStorage";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();
  return (
    <>
      <footer className="mt-auto">
        <div className="d-flex align-items-center justify-content-center gap-3">
          <img
            src={getImageSrc("WhiteGxpLogo")}
            alt="gxp-white-logo"
            width={174}
            height={35}
            className="img-fluid"
          />
          <span className="powered-text">{t("Powered_by")}</span>
          <img
            src={getImageSrc("WhiteMctLogo")}
            alt="mct-white-logo"
            width={174}
            height={35}
            className="img-fluid"
          />
        </div>
      </footer>
    </>
  );
};

export default Footer;
