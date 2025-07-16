import Aos from "aos";
import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { getImageSrc } from "../../utils/bulkImageStorage";
import useKeyDispenser from "../../hooks/useKeyDispenser";
import { keyDispenserAction } from "../../redux/reducers/MQTT/keyDispenser";
import Swal from "sweetalert2";
import { playBeep } from "../../utils/playBeep";
import { agentUserMQTTAction } from "../../redux/reducers/MQTT/agentUserMQTT";
import { getSessionItem } from "../../hooks/session";

const AgentMobileKeyReceipt = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { key, keyData } = location.state || {};
  const { t } = useTranslation();

  const mqttState = useSelector((state) => state.mqtt);

  const seqCode = getSessionItem("seqCode");

  const { activeKioskDeviceList } = useSelector(
    ({ kioskDevice }) => kioskDevice
  );

  const kioskData = getSessionItem("KioskConfig");
  const kioskSession = kioskData
    ? JSON.parse(decodeURIComponent(escape(atob(kioskData))))
    : null;

  const consoleActionTopic =
    kioskSession?.[0]?.mqtt_config?.subscribe_topics?.console_action;
  const keyDispenserTopic =
    kioskSession?.[0]?.mqtt_config?.subscribe_topics?.key_dispenser;
  const keyEncoderTopic =
    kioskSession?.[0]?.mqtt_config?.subscribe_topics?.key_encopder;

  const { keyError, devicestatus, keyPosition, isDeviceStatusChecked } =
    useKeyDispenser();

  // State management for the key dispensing process
  const [initializing, setInitializing] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [isDispensingKey, setIsDispensingKey] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Refs to track timeouts and prevent duplicate actions
  const timeoutRef = useRef(null);
  const responseTimeoutRef = useRef(null);
  const keyCommandSentRef = useRef(false);
  const navigationTimeoutRef = useRef(null);

  useEffect(() => {
    Aos.init({
      duration: 1000,
      once: true,
      easing: "ease-in-out",
    });
  }, []);

  // Parse MQTT message
  const mqttData = mqttState?.lastMessage?.message
    ? JSON.parse(mqttState.lastMessage.message)
    : {};

  useEffect(() => {
    if (
      mqttData?.cmd === "issue_key" &&
      mqttData?.topic === keyDispenserTopic &&
      mqttData?.seq === seqCode
    ) {
      setIsDispensingKey(false);
      setCompleted(true);

      dispatch(
        agentUserMQTTAction({
          cmd: "issue_key",
          device_uuid_list: deviceIds,
          response: {
            status: true,
            code: seqCode,
            message: "Key issued successfully",
            data: { status_mode: "issue_key" },
          },
        })
      );
      navigate("/home");
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Handle error response
    if (mqttData?.response?.status === false && isMounted) {
      dispatch(
        agentUserMQTTAction({
          cmd: "issue_key",
          device_uuid_list: deviceIds,
          response: {
            status: false,
            code: seqCode,
            message: "The issue key is not appearing from the machine",
            data: { status_mode: "issue_key" },
          },
        })
      );
      navigate("/home");
    }

    if (
      mqttData?.cmd === "ui_write" &&
      mqttData?.response?.status === true &&
      // mqttData?.topic === keyDispenserTopic &&
      isMounted
    ) {
      setInitializing(false);
      setGenerating(true);

      // Clear the response timeout since we received a response
      if (responseTimeoutRef.current) {
        clearTimeout(responseTimeoutRef.current);
      }
    }
    // Process issue_key command - transition to dispensing state
    else if (
      mqttData?.cmd === "ui_front" &&
      mqttData?.response?.status === true &&
      // mqttData?.topic === keyDispenserTopic &&
      isMounted
    ) {
      setGenerating(false);
      setIsDispensingKey(true);

      // Clear any existing navigation timeout
      // if (navigationTimeoutRef.current) {
      //   clearTimeout(navigationTimeoutRef.current);
      // }

      // Show success notification

      // Set timeout to navigate home after 1 second
      navigationTimeoutRef.current = setTimeout(() => {
        setIsDispensingKey(false);
        setCompleted(true);

        dispatch(
          agentUserMQTTAction({
            cmd: "issue_key",
            device_uuid_list: deviceIds,
            response: {
              status: true,
              code: seqCode,
              message: "Key issued successfully",
              data: { status_mode: "issue_key" },
            },
          })
        );
        navigate("/home");
      }, 1000);
    }

    // Cleanup function
    return () => {
      isMounted = false;
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
      Swal.close();
    };
  }, [mqttData, navigate, t]);

  // Set timeout for handling no response scenario
  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set a new timeout for 35 seconds
    timeoutRef.current = setTimeout(() => {
      // Only show alert if we're still in process (not completed)
      if (!completed) {
        playBeep();
        Swal.fire({
          title: t("Alert"),
          html: `
            <div style="display: flex; flex-direction: column; align-items: center;">
              <p>${t("Unable_to_dispense_key")}</p>
            </div>
          `,
          showCancelButton: false,
          confirmButtonText: t("Continue"),
          cancelButtonColor: "#d33",
          allowOutsideClick: false,
          allowEscapeKey: false,
          customClass: {
            confirmButton: "custom-swal-confirm",
          },
        }).then((result) => {
          if (result.isConfirmed) {
            navigate("/home");
          }
        });
      }
    }, 35000); // 35 seconds timeout

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [completed, navigate, t]);

  const deviceIds =
    activeKioskDeviceList?.map((device) => device.id).filter(Boolean) || [];

  // Initial dispatch of key dispenser action
  useEffect(() => {
    if (!keyCommandSentRef.current) {
      // Dispatch key dispenser action to initialize the process
      if (deviceIds.length > 0 && key && keyData) {
        dispatch(
          keyDispenserAction({
            deviceIds,
            key,
            keyData,
          })
        );
        keyCommandSentRef.current = true;
      }

      // Fallback timer if move_reader command is not received
      responseTimeoutRef.current = setTimeout(() => {
        if (!generating && !isDispensingKey) {
          setInitializing(false);
          setGenerating(true);
        }
      }, 15000);

      return () => {
        if (responseTimeoutRef.current) {
          clearTimeout(responseTimeoutRef.current);
        }
      };
    }
  }, [
    activeKioskDeviceList,
    dispatch,
    key,
    keyData,
    generating,
    isDispensingKey,
  ]);

  // Handle connection timeout error
  useEffect(() => {
    if (keyError === "Connection timeout") {
      setInitializing(false);
      setGenerating(false);
      setIsDispensingKey(false);
      setCompleted(false);
    }
  }, [keyError]);

  return (
    <>
      <div className="my-auto">
        <div className="substract-bg d-flex flex-column pb-5">
          <h1 className="mb-100 text-uppercase"> {t("Please_Wait")}....</h1>
          <div className="">
            {/* Initializing Dispenser Status */}
            <div>
              {initializing ? (
                <div className="key-dispense active-progress d-flex align-items-center my-4">
                  <div className="spinner-border" role="status">
                    <span className="sr-only">Loading...</span>
                  </div>
                  <h2 className="mb-0">{t("Initializing_Dispenser")}</h2>
                </div>
              ) : (
                <div className="key-dispense active d-flex align-items-center my-4">
                  <div className="circle position-relative">
                    <img src={getImageSrc("CheckIcon")} alt="check" />
                  </div>
                  <h2 className="mb-0">{t("Initializing_Dispenser")}</h2>
                </div>
              )}
            </div>

            {/* Generating Key Status */}
            <div>
              {generating ? (
                <div className="key-dispense active-progress d-flex align-items-center my-4">
                  <div className="spinner-border" role="status">
                    <span className="sr-only">Loading...</span>
                  </div>
                  <h2 className="mb-0">{t("Generating_Key")}</h2>
                </div>
              ) : !initializing ? (
                <div className="key-dispense active d-flex align-items-center my-4">
                  <div className="circle position-relative">
                    <img src={getImageSrc("CheckIcon")} alt="check" />
                  </div>
                  <h2 className="mb-0">{t("Generated_Key")}</h2>
                </div>
              ) : (
                <div className="key-dispense d-flex align-items-center my-4">
                  <div className="circle position-relative"></div>
                  <h2 className="mb-0">{t("Generating_Key")}</h2>
                </div>
              )}
            </div>

            {/* Dispensing Key Status */}
            <div>
              {isDispensingKey ? (
                <div className="key-dispense active-progress d-flex align-items-center">
                  <div className="spinner-border" role="status">
                    <span className="sr-only">Loading...</span>
                  </div>
                  <h2 className="mb-0">{t("Dispensing_Key_Now")}</h2>
                </div>
              ) : !generating && !initializing ? (
                <div className="key-dispense active d-flex align-items-center">
                  <div className="circle position-relative">
                    <img src={getImageSrc("CheckIcon")} alt="check" />
                  </div>
                  <h2>{t("Dispensed_Key")}</h2>
                </div>
              ) : (
                <div className="key-dispense d-flex align-items-center">
                  <div className="circle position-relative"></div>
                  <h2 className="mb-0">{t("Dispensing_Key_Now")}</h2>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AgentMobileKeyReceipt;
