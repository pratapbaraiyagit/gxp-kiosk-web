import { useState, useEffect, useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { addConnect } from "../redux/reducers/IDScanner/IDScanner";
import { restartServiceStatus } from "../redux/reducers/MQTT/serviceStatus";
import { getSessionItem, setSessionItem } from "./session";
import { isWithinOneHour } from "../utils/commonFun";
import { useTranslation } from "react-i18next";
import { playBeep } from "../utils/playBeep";
import { UploadBase64ImageFile, UploadImageFile } from "../redux/reducers/ImageUploadFile/imageUploadFile";

const useIDScanner = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const mqttState = useSelector((state) => state.mqtt);
  const seqNumberRef = useRef(null);

  const hotelKiosk = getSessionItem("hotelKiosk");
  const userHotelSession = hotelKiosk
    ? JSON.parse(decodeURIComponent(escape(atob(hotelKiosk))))
    : null;

  const isRegisterOneHourGap = isWithinOneHour(
    userHotelSession?.hotel?.check_in_time
  );

  const termsConditions = getSessionItem("terms_and_conditions");

  const { activeConnectList } = useSelector(
    ({ idScannerSlice }) => idScannerSlice
  );

  const kioskData = getSessionItem("KioskConfig");
  const kioskSession = kioskData
    ? JSON.parse(decodeURIComponent(escape(atob(kioskData))))
    : null;

  const newKioskConfig = kioskSession?.[0]?.mqtt_config?.subscribe_topics;

  const { activeKioskDeviceList } = useSelector(
    ({ kioskDevice }) => kioskDevice
  );

  const [isConnected, setIsConnected] = useState(false);
  const [isSendOCR, setIsSendOCR] = useState(false);
  const [isFlip, setIsFlip] = useState(false);
  const [isOcrFound, setIsOcrFound] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ocrData, setOcrData] = useState(null);

  const activeActions = useRef({});
  const loggedActions = useRef({});
  const messageHandlerRef = useRef(null);

  const { t } = useTranslation();

  // Store activeConnectList seq in ref to prevent unnecessary re-renders
  // Use a stable comparison to avoid unnecessary effect triggers
  const activeConnectListSeq = activeConnectList?.[0]?.seq;
  useEffect(() => {
    if (activeConnectListSeq && seqNumberRef.current !== activeConnectListSeq) {
      seqNumberRef.current = activeConnectListSeq;
    }
  }, [activeConnectListSeq]);

  const executeScannerAction = useCallback(
    (action, publishAction) => {
      return new Promise((resolve) => {
        // Prevent duplicate actions or actions when disconnected
        if (activeActions.current[action] || !mqttState.isConnected) {
          resolve(false);
          return;
        }

        // Mark action as active
        activeActions.current[action] = true;
        loggedActions.current[action] = false;

        // Set initial loading state
        setIsLoading(true);
        setError(null);

        // Get device IDs
        const deviceIds =
          activeKioskDeviceList?.map((device) => device.id).filter(Boolean) ||
          [];

        if (publishAction === "restart") {
          dispatch(
            restartServiceStatus({
              cmd: "restart",
              payload: { service: "id_scanner" },
              device_uuid_list: deviceIds,
            })
          );
        } else {
          dispatch(
            addConnect({
              cmd: publishAction,
              payload: {},
              device_uuid_list: deviceIds,
            })
          );
        }

        // Set timeout for response
        const timeoutId = setTimeout(() => {
          // Clean up on timeout
          setIsLoading(false);
          setError("Connection timeout");
          delete activeActions.current[action];
          delete loggedActions.current[action];
          resolve(false);
        }, 5000);

        // Define message handler - using function declaration instead of arrow function
        // to help prevent potential closures causing memory leaks
        messageHandlerRef.current = function handleScannerMessage(message) {
          let data;

          try {
            data = JSON.parse(message);
          } catch (err) {
            setIsLoading(false);
            setError("Error processing scanner response");
            delete activeActions.current[action];
            delete loggedActions.current[action];
            clearTimeout(timeoutId);
            resolve(false);
            return;
          }

          if (data?.cmd === "mqtt_connect") {
            // setIsConnected(data?.response?.status);
            setError(null);
            delete activeActions.current[action];
            delete loggedActions.current[action];
            resolve(true);
          }

          // Make sure we're only processing this action once
          if (!loggedActions.current[action]) {
            loggedActions.current[action] = true;
          }

          // Check if this message is for our action
          const isRelevantMessage =
            data?.cmd === action ||
            (data?.cmd === "capture" && action === "autocapture_on");

          if (!isRelevantMessage) {
            return; // Not our message, ignore it
          }

          // Stop loading state in all cases
          setIsLoading(false);

          // Check if sequence number matches
          if (data?.seq !== seqNumberRef.current) {
            setIsConnected(false);
            setError(`Failed to ${action} ID Scanner - sequence mismatch`);
            clearTimeout(timeoutId);
            delete activeActions.current[action];
            delete loggedActions.current[action];
            resolve(false);
            return;
          }

          // Process response based on command
          clearTimeout(timeoutId);
          const responseStatus = data?.response?.status;

          if (data.cmd === "connect") {
            // Handle connect command
            setIsConnected(responseStatus);
            setError(null);
            delete activeActions.current[action];
            delete loggedActions.current[action];
            resolve(true);
          } else if (data.cmd === "autocapture_on") {
            // Handle capture command
            const processType = data?.response?.data?.process;

            if (data?.response?.data?.process === "front_image") {
              const dataProp = {
                media_type: "guest-front_image",
                base64_files: {
                  images: data?.response?.data?.base_image,
                },
              };
              dispatch(UploadBase64ImageFile(dataProp));
              setSessionItem(
                "frontside_image",
                data?.response?.data?.base_image
              );
            } else if (data?.response?.data?.process === "back_image") {
              const dataProp = {
                media_type: "guest-front_image",
                base64_files: {
                  images: data?.response?.data?.base_image,
                },
              };
              dispatch(UploadBase64ImageFile(dataProp));
              setSessionItem(
                "backside_image",
                data?.response?.data?.base_image
              );
            }
            if (data?.seq === seqNumberRef.current) {
              // Set OCR flag if sequence matches
              setIsSendOCR(true);
            }

            // Handle flip process
            if (data?.seq === seqNumberRef.current && processType === "flip") {
              setIsFlip(true);
            }

            // Handle OCR process
            if (processType === "ocr" && data?.seq === seqNumberRef.current) {
              // First cleanup to prevent potential state updates after unmount
              delete activeActions.current[action];
              delete loggedActions.current[action];

              // Batch state updates
              const ocrDataValue = data?.response?.data?.ocr;
              setOcrData(ocrDataValue);
              setIsOcrFound(true);

              // Use a micro-task to navigate after state updates complete
              Promise.resolve().then(() => {
                //  navigate("/check-in/early-checkin");
              });

              resolve(true);
            }
            // Handle error case
            else if (
              data?.seq === seqNumberRef.current &&
              responseStatus === false &&
              data?.response?.code === 404
            ) {
              // First cleanup to prevent potential state updates after unmount
              delete activeActions.current[action];
              delete loggedActions.current[action];

              setIsOcrFound(false);

              // Use promise to ensure state updates complete before navigation
              Promise.resolve().then(() => {
                playBeep();
                Swal.fire({
                  text: t("No_InterneNot_able_to_scan_your_idt_Connection"),
                  icon: "error",
                  confirmButtonText: "Ok",
                  showClass: {
                    popup:
                      "animate__animated animate__fadeInUp animate__faster",
                  },
                  hideClass: {
                    popup:
                      "animate__animated animate__fadeOutDown animate__faster",
                  },
                });
                navigate("/check-in/find-booking");
              });
              autoCaptureOff();
              resolve(false);
            } else {
              // Other capture responses
              delete activeActions.current[action];
              delete loggedActions.current[action];
              resolve(true);
            }
          } else {
            // Handle other commands
            setError(null);
            delete activeActions.current[action];
            delete loggedActions.current[action];
            resolve(true);
          }
        };
      });
    },
    [mqttState.isConnected, activeKioskDeviceList, dispatch, navigate]
  );

  // Store the last processed message to prevent duplicate processing
  const lastProcessedMessageRef = useRef(null);

  // Watch for MQTT message changes
  useEffect(() => {
    // Only process new messages and avoid reprocessing the same message
    if (
      mqttState.lastMessage &&
      messageHandlerRef.current &&
      newKioskConfig?.id_scanner &&
      mqttState.lastMessage.message !== lastProcessedMessageRef.current
    ) {
      lastProcessedMessageRef.current = mqttState.lastMessage.message;
      messageHandlerRef.current(mqttState.lastMessage.message);
    }
  }, [mqttState.lastMessage, newKioskConfig]);

  const connectScanner = useCallback(() => {
    return executeScannerAction("connect", "connect");
  }, [executeScannerAction]);

  const calibrateScanner = useCallback(() => {
    return executeScannerAction("calibrate", "calibrate");
  }, [executeScannerAction]);

  const autoCaptureOn = useCallback(() => {
    return executeScannerAction("autocapture_on", "autocapture_on");
  }, [executeScannerAction]);

  const autoCaptureOff = useCallback(() => {
    return executeScannerAction("autocapture_off", "autocapture_off");
  }, [executeScannerAction]);

  const statusScanner = useCallback(() => {
    return executeScannerAction("get_status", "get_status");
  }, [executeScannerAction]);

  const captureScanner = useCallback(() => {
    return executeScannerAction("capture", "capture");
  }, [executeScannerAction]);

  const disconnectScanner = useCallback(() => {
    setIsConnected(false);
  }, []);

  const reConnectIdScanner = useCallback(() => {
    return executeScannerAction("restart", "restart");
  }, [executeScannerAction]);
  //   const deviceIds =
  //     activeKioskDeviceList?.map((device) => device.id).filter(Boolean) || [];
  //   return dispatch(
  //     restartServiceStatus({
  //       cmd: "restart",
  //       payload: { service: "id_scanner" },
  //       device_uuid_list: deviceIds,
  //     })
  //   );
  // }, [activeKioskDeviceList, dispatch]);

  const scanID = useCallback(() => {
    if (!isConnected) {
      setError("Scanner is not connected");
      return;
    }
  }, [isConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      activeActions.current = {};
      loggedActions.current = {};
      messageHandlerRef.current = null;
    };
  }, []);

  return {
    isConnected,
    isLoading,
    error,
    connectScanner,
    statusScanner,
    calibrateScanner,
    captureScanner,
    disconnectScanner,
    scanID,
    autoCaptureOn,
    autoCaptureOff,
    isFlip,
    isSendOCR,
    isOcrFound,
    ocrData,
    reConnectIdScanner,
  };
};

export default useIDScanner;
