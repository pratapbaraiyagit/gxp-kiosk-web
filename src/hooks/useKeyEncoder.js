import { useState, useCallback, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { keyEncoderAction } from "../redux/reducers/MQTT/keyEncoder";
import { restartServiceStatus } from "../redux/reducers/MQTT/serviceStatus";
import { getSessionItem } from "./session";
import { keyDispenserAction } from "../redux/reducers/MQTT/keyDispenser";

const useKeyEncoder = () => {
  const dispatch = useDispatch();
  const mqttState = useSelector((state) => state.mqtt);
  const seqKDNumberRef = useRef(null);
  const seqKENumberRef = useRef(null);

  const kioskData = getSessionItem("KioskConfig");
  const kioskSession = kioskData
    ? JSON.parse(decodeURIComponent(escape(atob(kioskData))))
    : null;

  const KioskDeviceInfo = getSessionItem("KioskDeviceInfo");
  const KioskDeviceInfoSession = KioskDeviceInfo
    ? JSON.parse(decodeURIComponent(escape(atob(KioskDeviceInfo))))
    : null;
  const newKioskDeviceMode = KioskDeviceInfoSession?.[0]?.mode;

  const newKioskConfig = kioskSession?.[0]?.mqtt_config?.subscribe_topics;

  const [isKEConnect, setIsKEConnect] = useState(false);
  const [isKeyELoading, setIsKeyELoading] = useState(false);
  const [keyError, setKeyError] = useState(null);
  const [keyPosition, setKeyPosition] = useState(null);

  const activeActions = useRef({});
  const loggedActions = useRef({});
  const messageHandlerRef = useRef(null);
  const keyDataRef = useRef(null);

  const { activeKeyEncoderList } = useSelector(
    ({ keyEncoderSlice }) => keyEncoderSlice
  );

  const { activeKeyDispenserList } = useSelector(
    ({ keyDispenserSlice }) => keyDispenserSlice
  );

  const { activeKioskDeviceList } = useSelector(
    ({ kioskDevice }) => kioskDevice
  );

  useEffect(() => {
    if (activeKeyDispenserList?.[0]?.seq) {
      seqKDNumberRef.current = activeKeyDispenserList?.[0].seq;
    }
  }, [activeKeyDispenserList]);

  useEffect(() => {
    if (activeKeyEncoderList?.[0]?.seq) {
      seqKENumberRef.current = activeKeyEncoderList[0].seq;
    }
  }, [activeKeyEncoderList]);

  const executeEncoderAction = useCallback(
    (action, publishAction) => {
      return new Promise((resolve) => {
        if (activeActions.current[action] || !mqttState.isConnected) {
          return;
        }

        activeActions.current[action] = true;
        loggedActions.current[action] = false;
        setIsKeyELoading(true);
        setKeyError(null);

        const deviceIds =
          activeKioskDeviceList?.map((device) => device.id).filter(Boolean) ||
          [];

        if (publishAction === "restart") {
          dispatch(
            restartServiceStatus({
              cmd: "restart",
              payload: { service: "key_encoder" },
              device_uuid_list: deviceIds,
            })
          );
        } else {
          let actionType;
          if (
            action === "connect" ||
            action === "write_key" ||
            action === "move_capture"
          ) {
            dispatch(
              keyEncoderAction({
                cmd: action,
                payload: typeof publishAction === "object" ? publishAction : {},
                device_uuid_list: deviceIds,
              })
            );
            actionType = "keyEncoder";
          } else {
            dispatch(
              keyDispenserAction({
                cmd: publishAction,
                payload: {},
                device_uuid_list: deviceIds,
              })
            );
            actionType = "keyDispenser";
          }
        }

        // Determine which action dispatcher to use and track the appropriate sequence number

        const timeoutId = setTimeout(() => {
          setIsKeyELoading(false);
          setKeyError("Connection timeout");
          delete activeActions.current[action];
          delete loggedActions.current[action];
          resolve(false);
        }, 15000);

        messageHandlerRef.current = (message) => {
          try {
            const data = JSON.parse(message);

            if (!loggedActions.current[action]) {
              loggedActions.current[action] = true;
            }

            if (data?.cmd === "mqtt_connect") {
              // setIsKEConnect(data?.response?.status);
              // delete activeActions.current[action];
              // delete loggedActions.current[action];
              // resolve(true);
            }

            // Determine which sequence number to check against based on the action type
            const expectedSeq =
              action === "move_capture"
                ? seqKENumberRef.current
                : seqKDNumberRef.current;

            const responseStatus = data?.response?.status;

            if (data.cmd === "connect") {
              setIsKEConnect(responseStatus);
            }

            if (data?.cmd === action) {
              if (data?.seq === expectedSeq) {
                const responseStatus = data?.response?.status;

                if (data.cmd === "connect") {
                  setIsKEConnect(responseStatus);
                }

                if (data.cmd === "get_status") {
                  setIsKEConnect(true);
                  const dataNew = data?.response?.data?.device_status;
                  setKeyPosition(dataNew?.card_position);

                  // Trigger next action based on card location
                  if (dataNew?.card_position === "FREE") {
                    moveReader();
                  } else if (dataNew?.card_position === "FRONT") {
                    moveCapture();
                  } else if (dataNew?.card_position === "READER") {
                    if (newKioskDeviceMode !== "live") {
                      moveFront();
                    } else {
                      write();
                    }
                  }
                } else if (data.cmd === "move_reader") {
                  setKeyPosition("READER");
                  if (newKioskDeviceMode !== "live") {
                    moveFront();
                  } else {
                    write();
                  }
                } else if (data.cmd === "move_capture") {
                  setKeyPosition("FREE");
                  moveReader();
                } else if (data.cmd === "write_key") {
                  moveFront();
                } else if (data.cmd === "move_front") {
                  setKeyPosition("FRONT");
                }

                setKeyError(null);
                resolve(true);
              } else {
                setKeyError(
                  `Failed to ${action} ID Key Encoder. Expected seq ${expectedSeq}, got ${data?.seq}`
                );
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
      if (newKioskConfig?.key_encoder) {
        messageHandlerRef.current(mqttState.lastMessage.message);
      }
    }
  }, [mqttState.lastMessage, newKioskConfig?.key_encoder]);

  const connectKeyEncoder = useCallback(() => {
    return executeEncoderAction("connect", "connect");
  }, [executeEncoderAction]);

  const moveFront = useCallback(() => {
    return executeEncoderAction("move_front", "move_front");
  }, [executeEncoderAction]);

  const moveReader = useCallback(() => {
    return executeEncoderAction("move_reader", "move_reader");
  }, [executeEncoderAction]);

  const write = useCallback(
    (keyData = null) => {
      const dataToWrite = keyData || keyDataRef.current || {};
      return executeEncoderAction("write_key", dataToWrite);
    },
    [executeEncoderAction]
  );

  const moveCapture = useCallback(() => {
    return executeEncoderAction("move_capture", "move_capture");
  }, [executeEncoderAction]);

  const devicestatus = useCallback(
    (keyData = {}) => {
      keyDataRef.current = keyData; // Store keyData
      return executeEncoderAction("get_status", "get_status");
    },
    [executeEncoderAction]
  );

  const reConnectKeyEncoder = useCallback(() => {
    return executeEncoderAction("restart", "restart");
  }, [executeEncoderAction]);
  //   const deviceIds =
  //     activeKioskDeviceList?.map((device) => device.id).filter(Boolean) || [];
  //   return dispatch(
  //     restartServiceStatus({
  //       cmd: "restart",
  //       payload: { service: "key_encoder" },
  //       device_uuid_list: deviceIds,
  //     })
  //   );
  // }, [activeKioskDeviceList, dispatch]);

  useEffect(() => {
    return () => {
      activeActions.current = {};
      loggedActions.current = {};
      messageHandlerRef.current = null;
      keyDataRef.current = null; // Clear keyData on unmount
    };
  }, []);

  return {
    isKeyELoading,
    keyError,
    connectKeyEncoder,
    moveFront,
    moveReader,
    write,
    moveCapture,
    devicestatus,
    keyPosition,
    setKeyPosition,
    isKEConnect,
    reConnectKeyEncoder,
  };
};

export default useKeyEncoder;
