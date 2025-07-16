import { useState, useCallback, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { restartServiceStatus } from "../redux/reducers/MQTT/serviceStatus";
import { keyDispenserAction } from "../redux/reducers/MQTT/keyDispenser";
import { getSessionItem } from "./session";

const useKeyDispenser = () => {
  const dispatch = useDispatch();
  const mqttState = useSelector((state) => state.mqtt);
  const seqNumberRef = useRef(null);

  const kioskData = getSessionItem("KioskConfig");
  const kioskSession = kioskData
    ? JSON.parse(decodeURIComponent(escape(atob(kioskData))))
    : null;

  const newKioskConfig = kioskSession?.[0]?.mqtt_config?.subscribe_topics;

  const [isDeviceStatusChecked, setIsDeviceStatusChecked] = useState(false);
  const [isKeyDLoading, setIsKeyDLoading] = useState(false);
  const [keyError, setKeyError] = useState(null);
  const [keyPosition, setKeyPosition] = useState(null);

  const activeActions = useRef({});
  const loggedActions = useRef({});
  const messageHandlerRef = useRef(null);

  const { activeKioskDeviceList } = useSelector(
    ({ kioskDevice }) => kioskDevice
  );

  const { activeKeyDispenserList } = useSelector(
    ({ keyDispenserSlice }) => keyDispenserSlice
  );

  useEffect(() => {
    if (activeKeyDispenserList?.[0]?.seq) {
      seqNumberRef.current = activeKeyDispenserList?.[0].seq;
    }
  }, [activeKeyDispenserList]);

  const executeDispenserAction = useCallback(
    (action, publishAction) => {
      return new Promise((resolve) => {
        if (activeActions.current[action] || !mqttState.isConnected) {
          return;
        }

        activeActions.current[action] = true;
        loggedActions.current[action] = false;
        setIsKeyDLoading(true);
        setKeyError(null);

        const deviceIds =
          activeKioskDeviceList?.map((device) => device.id).filter(Boolean) ||
          [];

        if (publishAction === "restart") {
          dispatch(
            restartServiceStatus({
              cmd: "restart",
              payload: { service: "key_dispenser" },
              device_uuid_list: deviceIds,
            })
          );
        } else {
          dispatch(
            keyDispenserAction({
              cmd: publishAction, // enum ["connect", "disconnect", "get_status", "autocapture_on", "autocapture_off", "capture", "calibrate"]
              payload: {},
              device_uuid_list: deviceIds,
            })
          );
        }

        const timeoutId = setTimeout(() => {
          setIsKeyDLoading(false);
          setKeyError("Connection timeout");
          delete activeActions.current[action];
          delete loggedActions.current[action];
          resolve(false);
        }, 5000);

        messageHandlerRef.current = (message) => {
          try {
            const data = JSON.parse(message);

            if (!loggedActions.current[action]) {
              loggedActions.current[action] = true;
            }

            if (data?.cmd === "mqtt_connect") {
              // setIsDeviceStatusChecked(data?.response?.status);
              setIsKeyDLoading(false);
              delete activeActions.current[action];
              delete loggedActions.current[action];
              resolve(true);
            }

            if (data?.cmd === action) {
              setIsKeyDLoading(false);
              if (data?.seq === seqNumberRef.current) {
                const responseStatus = data?.response?.status;
                setIsDeviceStatusChecked(responseStatus);
                if (
                  data.cmd === "get_status" &&
                  data?.seq === seqNumberRef.current
                ) {
                  const dataNew = JSON.parse(
                    data?.response?.data?.device_status
                  );
                  setKeyPosition(dataNew?.card_position);
                  if (
                    data?.seq === seqNumberRef.current &&
                    (dataNew?.card_position === "FRONT" ||
                      dataNew?.card_position === "READER")
                  ) {
                    moveCapture();
                  }
                } else if (
                  data?.cmd === "move_front" &&
                  data?.seq === seqNumberRef.current
                ) {
                  setKeyPosition("FRONT");
                } else if (
                  data?.cmd === "move_reader" &&
                  data?.seq === seqNumberRef.current
                ) {
                  setKeyPosition("READER");
                } else if (
                  data?.cmd === "move_capture" &&
                  data?.seq === seqNumberRef.current
                ) {
                  setKeyPosition("FREE");
                }
                setKeyError(null);
                resolve(true);
              } else {
                setKeyError(`Failed to ${action} ID Key Dispenser`);
                resolve(false);
              }

              clearTimeout(timeoutId);
              delete activeActions.current[action];
              delete loggedActions.current[action];
            }
          } catch (err) {
            setKeyError("Error processing scanner response");
            delete activeActions.current[action];
            delete loggedActions.current[action];
            clearTimeout(timeoutId);
            resolve(false);
          }
        };
      });
    },
    [mqttState.isConnected]
  );

  useEffect(() => {
    if (mqttState.lastMessage && messageHandlerRef.current) {
      if (newKioskConfig?.key_dispenser) {
        messageHandlerRef.current(mqttState.lastMessage.message);
      }
    }
  }, [mqttState.lastMessage, newKioskConfig?.key_dispenser]);

  const connectKeyDispenser = useCallback(() => {
    return executeDispenserAction("connect", "connect");
  }, [executeDispenserAction]);

  const moveFront = useCallback(() => {
    return executeDispenserAction("move_front", "move_front");
  }, [executeDispenserAction]);

  const moveReader = useCallback(() => {
    return executeDispenserAction("move_reader", "move_reader");
  }, [executeDispenserAction]);

  const moveCapture = useCallback(() => {
    return executeDispenserAction("move_capture", "move_capture");
  }, [executeDispenserAction]);

  const getKeyStatus = useCallback(() => {
    return executeDispenserAction("get_key_status", "get_key_status");
  }, [executeDispenserAction]);

  const statusKeyDispenser = useCallback(() => {
    return executeDispenserAction("get_status", "get_status");
  }, [executeDispenserAction]);

  const acceptKeyDispneser = useCallback(() => {
    return executeDispenserAction("accecpt_key", "accecpt_key");
  }, [executeDispenserAction]);

  const issueKeyDispneser = useCallback(() => {
    return executeDispenserAction("issue_key", "issue_key");
  }, [executeDispenserAction]);

  const devicestatus = useCallback(() => {
    return executeDispenserAction("devicestatus", "devicestatus");
  }, [executeDispenserAction]);

  const disconnectKeyDispenser = useCallback(() => {
    // setIsConnected(false);
  }, []);

  const reConnectKeyDispenser = useCallback(() => {
    return executeDispenserAction("restart", "restart");
  }, [executeDispenserAction]);
  //   const deviceIds =
  //     activeKioskDeviceList?.map((device) => device.id).filter(Boolean) || [];
  //   return dispatch(
  //     restartServiceStatus({
  //       cmd: "restart",
  //       payload: { service: "key_dispenser" },
  //       device_uuid_list: deviceIds,
  //     })
  //   );
  // }, [activeKioskDeviceList, dispatch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      activeActions.current = {};
      loggedActions.current = {};
      messageHandlerRef.current = null;
    };
  }, []);

  return {
    isKeyDLoading,
    keyError,
    connectKeyDispenser,
    moveFront,
    moveReader,
    moveCapture,
    getKeyStatus,
    statusKeyDispenser,
    acceptKeyDispneser,
    issueKeyDispneser,
    devicestatus,
    keyPosition,
    setKeyPosition,
    isDeviceStatusChecked,
    disconnectKeyDispenser,
    reConnectKeyDispenser,
  };
};

export default useKeyDispenser;
