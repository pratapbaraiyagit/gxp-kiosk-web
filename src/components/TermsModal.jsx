import { Modal } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { terms_condition } from "../utils/data";
import { getSessionItem } from "../hooks/session";

const TermsModal = (props) => {
  const { t } = useTranslation();

  const { activeHotelTermsConditionList } = useSelector(
    ({ hotelTermsCondition }) => hotelTermsCondition
  );

  const KioskDeviceInfo = getSessionItem("KioskDeviceInfo");
  const KioskDeviceInfoSession = KioskDeviceInfo
    ? JSON.parse(decodeURIComponent(escape(atob(KioskDeviceInfo))))
    : null;
  const newKioskDeviceMode = KioskDeviceInfoSession?.[0]?.mode;

  return (
    <>
      <Modal
        {...props}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        dialogClassName="dark-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-vcenter">
            {t("Terms")} {t("Conditions")}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="blur-bg">
            <div
              className="text-light"
              dangerouslySetInnerHTML={{
                __html:
                  newKioskDeviceMode === "demo"
                    ? activeHotelTermsConditionList?.[0]?.terms_condition ||
                      terms_condition
                    : activeHotelTermsConditionList?.[0]?.terms_condition,
              }}
            />
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default TermsModal;
