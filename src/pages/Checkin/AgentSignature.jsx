import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Aos from "aos";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import SignaturePad from "react-signature-canvas";
import { getSessionItem, removeSessionItem } from "../../hooks/session";
import Swal from "sweetalert2";
import TermsModal from "../../components/TermsModal";
import { playBeep } from "../../utils/playBeep";
import { agentUserMQTTAction } from "../../redux/reducers/MQTT/agentUserMQTT";

const AgentSignature = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [termModalShow, setTermModalShow] = React.useState(false);
  const [loading, setLoading] = useState(false);

  const { t } = useTranslation();
  const signaturePad = useRef(null);

  const [hasSignature, setHasSignature] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [error, setError] = useState("");

  const { activeKioskDeviceList } = useSelector(
    ({ kioskDevice }) => kioskDevice
  );
  const deviceIds =
    activeKioskDeviceList?.map((device) => device.id).filter(Boolean) || [];

  const seq_code = getSessionItem("seqCode");

  useEffect(() => {
    Aos.init({
      duration: 1000,
      once: true,
      easing: "ease-in-out",
    });
  }, []);

  const clearSignature = () => {
    if (signaturePad.current) {
      signaturePad.current.clear();
      setHasSignature(false);
      setError("");
    }
  };

  const handleSignatureChange = () => {
    if (signaturePad.current) {
      setHasSignature(!signaturePad.current.isEmpty());
      setError("");
    }
  };

  const handleTermsChange = (e) => {
    setTermsAccepted(e.target.checked);
    setError("");
  };

  const handleNext = async () => {
    if (!hasSignature) {
      playBeep();
      Swal.fire({
        // title: t("Please_enter_code"),
        text: t("Please_provide_signature"),
        icon: "error",
        confirmButtonText: t("Ok"),
        showClass: {
          popup: `
          animate__animated
          animate__fadeInUp
          animate__faster
        `,
        },
        hideClass: {
          popup: `
          animate__animated
          animate__fadeOutDown
          animate__faster
        `,
        },
      });
      return;
    }
    if (!termsAccepted) {
      playBeep();
      Swal.fire({
        // title: t("Please_enter_code"),
        text: t("Please_accept_terms_conditions"),
        icon: "error",
        confirmButtonText: t("Ok"),
        showClass: {
          popup: `
          animate__animated
          animate__fadeInUp
          animate__faster
        `,
        },
        hideClass: {
          popup: `
          animate__animated
          animate__fadeOutDown
          animate__faster
        `,
        },
      });
      return;
    }

    setLoading(true);

    // Get the signature as a base64 image URL
    const signatureImageBase64 = signaturePad.current
      .getTrimmedCanvas()
      .toDataURL("image/png");

    dispatch(
      agentUserMQTTAction({
        cmd: "draw_sign",
        device_uuid_list: deviceIds,
        response: {
          status: true,
          code: seq_code,
          message: "Signature applied.",
          data: {
            status_mode: "draw_sign",
            signature_image: signatureImageBase64, // Pass the signature base64 image URL
          },
        },
      })
    ).then(() => {
      setLoading(false);
      navigate("/home");
      removeSessionItem("seqCode");
    });
  };
  return (
    <>
      <div className="my-auto">
        <div
          className="d-flex align-items-end justify-content-between gap-5 mb-5"
          data-aos="fade-up"
          data-aos-delay="500"
        >
          <h1 className="heading-h1 max-500 mb-0">
            {t("Please_sign_and_agree")}
          </h1>
        </div>

        <div
          className="custom-card sign-section mb-4"
          data-aos="fade-up"
          data-aos-delay="1500"
        >
          <div className="custom-card-wrap p-4">
            <div className="position-relative before-box">
              <SignaturePad
                ref={signaturePad}
                canvasProps={{
                  className: "canvas-box signature-pad",
                  height: 250,
                }}
                onEnd={handleSignatureChange}
              />
              {hasSignature && !loading && (
                <button
                  className="delete-btn text-light"
                  onClick={clearSignature}
                  type="button"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="text-danger mb-3" data-aos="fade-up">
            {error}
          </div>
        )}

        <h3
          className="sign-text text-end"
          data-aos="fade-up"
          data-aos-delay="2000"
        >
          {t("By_signing_this")}
        </h3>

        <label
          className="custom-checkbox mb-3"
          data-aos="fade-up"
          data-aos-delay="2500"
        >
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={handleTermsChange}
            id="termsCheckbox"
            disabled={loading}
          />
          <span className="checkmark"></span>
          <span
            onClick={() => setTermModalShow(true)}
            className="text-decoration-underline"
          >
            {t("hotel_policies")}
          </span>
        </label>

        <div
          className="d-flex align-items-center justify-content-end"
          data-aos="fade-up"
          data-aos-delay="3000"
        >
          <button
            className="common-btn blue-btn"
            onClick={() => {
              handleNext();
            }}
            disabled={loading}
          >
            {loading ? (
              <span className="d-flex align-items-center">
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                />
                <span>{t("Submitting")}...</span>
              </span>
            ) : (
              <span>{t("Submit")}</span>
            )}
          </button>
        </div>
      </div>
      <TermsModal show={termModalShow} onHide={() => setTermModalShow(false)} />
    </>
  );
};

export default AgentSignature;
