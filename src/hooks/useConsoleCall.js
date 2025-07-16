import { useState, useEffect, useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getSessionItem } from "./session";
import { callMQTTAction } from "../redux/reducers/MQTT/callMQTT";

const useConsoleCall = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const mqttState = useSelector((state) => state.mqtt);
  const seqNumberRef = useRef(null);

  const hotelKiosk = getSessionItem("hotelKiosk");
  const userHotelSession = hotelKiosk
    ? JSON.parse(decodeURIComponent(escape(atob(hotelKiosk))))
    : null;

  const { activeCallMQTTList } = useSelector(({ callMQTT }) => callMQTT);

  const kioskData = getSessionItem("KioskConfig");
  const kioskSession = kioskData
    ? JSON.parse(decodeURIComponent(escape(atob(kioskData))))
    : null;

  const newKioskConfig = kioskSession?.[0]?.mqtt_config?.subscribe_topics;

  const { activeKioskDeviceList } = useSelector(
    ({ kioskDevice }) => kioskDevice
  );

  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const activeActions = useRef({});
  const loggedActions = useRef({});
  const messageHandlerRef = useRef(null);

  // Store activeCallMQTTList seq in ref to prevent unnecessary re-renders
  // Use a stable comparison to avoid unnecessary effect triggers
  const activeConnectListSeq = activeCallMQTTList?.[0]?.seq;
  useEffect(() => {
    if (activeConnectListSeq && seqNumberRef.current !== activeConnectListSeq) {
      seqNumberRef.current = activeConnectListSeq;
    }
  }, [activeConnectListSeq]);

  const executeCallAction = useCallback(
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

        // Dispatch the action
        dispatch(
          callMQTTAction({
            cmd: publishAction,
            response: {
              status: true,
              message: "",
              data: {},
            },
            device_uuid_list: deviceIds,
          })
        );

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
        messageHandlerRef.current = function handleCallMessage(message) {
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

          // Make sure we're only processing this action once
          if (!loggedActions.current[action]) {
            loggedActions.current[action] = true;
          }

          // Check if this message is for our action
          const isRelevantMessage = data?.cmd === action;

          if (!isRelevantMessage) {
            return; // Not our message, ignore it
          }

          // Stop loading state in all cases
          setIsLoading(false);

          // Check if sequence number matches
          if (data?.seq !== seqNumberRef.current) {
            setIsConnected(false);
            setError(`Failed to ${action} Video call - sequence mismatch`);
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
          } else if (data.cmd === "capture") {
            // Handle OCR process
            if (data?.seq === seqNumberRef.current) {
              // First cleanup to prevent potential state updates after unmount
              delete activeActions.current[action];
              delete loggedActions.current[action];

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

              monitorVideoCall();
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
      newKioskConfig?.console_call &&
      mqttState.lastMessage.message !== lastProcessedMessageRef.current
    ) {
      lastProcessedMessageRef.current = mqttState.lastMessage.message;
      messageHandlerRef.current(mqttState.lastMessage.message);
    }
  }, [mqttState.lastMessage, newKioskConfig]);

  const connectVideoCall = useCallback(() => {
    return executeCallAction("connect", "connect");
  }, [executeCallAction]);

  const disconnectVideoCall = useCallback(() => {
    return executeCallAction("disconnect", "disconnect");
  }, [executeCallAction]);

  const muteVideoCall = useCallback(() => {
    return executeCallAction("mute", "mute");
  }, [executeCallAction]);

  const unMuteVideoCall = useCallback(() => {
    return executeCallAction("unmute", "unmute");
  }, [executeCallAction]);

  const monitorVideoCall = useCallback(() => {
    return executeCallAction("monitor", "monitor");
  }, [executeCallAction]);

  const liveVideoCall = useCallback(() => {
    return executeCallAction("live", "live");
  }, [executeCallAction]);

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
    connectVideoCall,
    liveVideoCall,
    muteVideoCall,
    disconnectVideoCall,
    unMuteVideoCall,
    monitorVideoCall,
  };
};

export default useConsoleCall;
