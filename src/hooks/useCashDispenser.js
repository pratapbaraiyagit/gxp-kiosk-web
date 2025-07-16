import { useState, useCallback, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getSessionItem } from "./session";

const useCashDispenser = () => {
  const dispatch = useDispatch();
  const mqttState = useSelector((state) => state.mqtt);

  const kioskData = getSessionItem("KioskConfig");
  const kioskSession = kioskData
    ? JSON.parse(decodeURIComponent(escape(atob(kioskData))))
    : null;

  const newKioskConfig = kioskSession?.[0];

  const [isDeviceStatusChecked, setIsDeviceStatusChecked] = useState(false);
  const [isCashDispenserLoading, setIsCashDispenserLoading] = useState(false);
  const [isCollectionStart, setIsCollectionStart] = useState(true);
  const [cashDispenserError, setCashDispenserError] = useState(null);
  const [cashDispenserPosition, setCashDispenserPosition] = useState(null);
  const [cashCollectData, setCashCollectData] = useState("");
  const [getBalanceData, setGetBalanceData] = useState("");
  const [cashPayoutData, setCashPayoutData] = useState("");
  const [payOutState, setPayOutState] = useState(false);

  const activeActions = useRef({});
  const loggedActions = useRef({});
  const messageHandlerRef = useRef(null);

  const executeCashDispenserAction = useCallback(
    (action, publishAction) => {
      return new Promise((resolve) => {
        if (activeActions.current[action] || !mqttState.isConnected) {
          return;
        }

        activeActions.current[action] = true;
        loggedActions.current[action] = false;
        setIsCashDispenserLoading(true);
        setCashDispenserError(null);

        const timeoutId = setTimeout(() => {
          setIsCashDispenserLoading(false);
          setCashDispenserError("Connection timeout");
          delete activeActions.current[action];
          delete loggedActions.current[action];
          resolve(false);
        }, 60000);

        // Define message handler
        messageHandlerRef.current = (message) => {
          try {
            const data = JSON.parse(message);
            if (!loggedActions.current[action]) {
              loggedActions.current[action] = true;
            }

            const collection_start = {
              transaction_status_update: {
                command: "transaction_status_update",
                command_result: "success",
                command_message: [`Transaction before balance updated.`],
              },
            };

            const isStartCollection =
              collection_start[data.command] &&
              data.command_result ===
                collection_start[data.command].command_result &&
              collection_start[data.command].command_message.includes(
                data.command_message
              );

            if (isStartCollection && action === "info_transaction") {
              setIsCollectionStart(false);
            }

            if (data?.command === action) {
              const successConditions = {
                info_dispensed: {
                  command: "info_dispensed",
                  command_result: "success",
                  command_message: [`Note dispensed.`],
                },
                info_transaction: {
                  command: "info_transaction",
                  command_result: "success",
                  command_message: [`Transaction complete.`],
                },
                get_current_balance: {
                  command: "get_current_balance",
                  command_result: "success",
                  command_message: [`get_current_balance_successfully`],
                },
              };

              const isSuccess =
                successConditions[data.command] &&
                data.command_result ===
                  successConditions[data.command].command_result &&
                successConditions[data.command].command_message.includes(
                  data.command_message
                );

              if (isSuccess) {
                if (data.command === "info_transaction" && isSuccess) {
                  setIsDeviceStatusChecked(true);
                  setCashCollectData(data?.command_data);
                  clearTimeout(timeoutId);
                  resolve(true);
                } else if (
                  data?.command === "get_current_balance" &&
                  isSuccess
                ) {
                  setGetBalanceData(data?.command_data);
                  if (data?.command_data) {
                    let balanceArray = JSON.parse(data?.command_data);
                    const abc = balanceArray.reduce(
                      (sum, item) => sum + item?.total,
                      0
                    );
                    cashPayout(abc);
                    setPayOutState(true);
                  }
                  clearTimeout(timeoutId);
                  resolve(true);
                } else if (data?.command === "info_dispensed" && isSuccess) {
                  setCashPayoutData(data?.command_data);
                  clearTimeout(timeoutId);
                  resolve(true);
                }
                setCashDispenserError(null);
              } else {
                setCashDispenserError(`Failed to ${action} Cash Dispenser`);
                clearTimeout(timeoutId);
                resolve(false);
              }

              delete activeActions.current[action];
              delete loggedActions.current[action];
            }
          } catch (err) {
            setCashDispenserError("Error processing cash dispenser response");
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

  // Watch for MQTT message changes
  useEffect(() => {
    if (mqttState.lastMessage && messageHandlerRef.current) {
      if (newKioskConfig?.cash_recycler) {
        messageHandlerRef.current(mqttState.lastMessage.message);
      }
    }
  }, [mqttState.lastMessage, newKioskConfig?.cash_recycler]);

  const cashPayout = useCallback(
    (data) => {
      if (!data) {
        return Promise.resolve(false);
      }
      return executeCashDispenserAction(
        `info_dispensed`,
        `{"cash_payout": "${data}"}`
      );
    },
    [executeCashDispenserAction]
  );

  const cashCollect = useCallback(() => {
    return executeCashDispenserAction(
      `info_transaction`,
      `{"cash_collect": "1"}`
    );
  }, [executeCashDispenserAction]);

  const getBalance = useCallback(() => {
    return executeCashDispenserAction(
      `get_current_balance`,
      `{"get_balance": ""}`
    );
  }, [executeCashDispenserAction]);

  useEffect(() => {
    return () => {
      activeActions.current = {};
      loggedActions.current = {};
    };
  }, []);

  return {
    isCashDispenserLoading,
    cashDispenserError,
    cashDispenserPosition,
    cashPayout,
    cashCollect,
    getBalance,
    setCashDispenserPosition,
    isDeviceStatusChecked,
    getBalanceData,
    isCollectionStart,
    payOutState,
    cashCollectData,
  };
};

export default useCashDispenser;
