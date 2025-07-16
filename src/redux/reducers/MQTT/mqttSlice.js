import { createSlice } from "@reduxjs/toolkit";
import mqtt from "mqtt";
import { notification } from "../../../helpers/middleware";
import { getSessionItem } from "../../../hooks/session";
import { callMQTTAction } from "./callMQTT";

const generateGUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const setLocalStorageItem = (key, value) => {
  localStorage.setItem(key, value);
};

const KioskDeviceInfo = getSessionItem("KioskDeviceInfo");
const KioskDeviceInfoSession = KioskDeviceInfo
  ? JSON.parse(decodeURIComponent(escape(atob(KioskDeviceInfo))))
  : null;
const newKioskDeviceInfo = KioskDeviceInfoSession?.[0]?.mode;

const kioskData = getSessionItem("KioskConfig");
const kioskSession = kioskData
  ? JSON.parse(decodeURIComponent(escape(atob(kioskData))))
  : null;

const newKioskConfig = kioskSession?.[0];

const userData = getSessionItem("UserSessionKiosk");
const userSession = userData
  ? JSON.parse(decodeURIComponent(escape(atob(userData))))
  : null;

const initialState = {
  client: null,
  isConnected: false,
  error: null,
  lastMessage: null,
};

const mqttSlice = createSlice({
  name: "mqtt",
  initialState,
  reducers: {
    setClient: (state, action) => {
      state.client = action.payload;
    },
    setConnected: (state, action) => {
      state.isConnected = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setLastMessage: (state, action) => {
      state.lastMessage = action.payload;
    },
    clearClient: (state) => {
      state.client = null;
      state.isConnected = false;
      state.error = null;
      state.lastMessage = null;
    },
  },
});

export const {
  setClient,
  setConnected,
  setError,
  setLastMessage,
  clearClient,
} = mqttSlice.actions;

export const initializeMQTT = (configPayload) => async (dispatch) => {
  try {
    const randomNumber = Math.floor(10000 + Math.random() * 90000);
    const clientId = `kiosk-${userSession?.email}-${randomNumber}`;

    const url = configPayload?.mqtt_config?.uri;

    if (!url) {
      dispatch(setError("MQTT URL not available"));
      return;
    }

    const options = {
      clean: true,
      connectTimeout: 4000,
      clientId: clientId || "kiosk_emqx_test",
      username: configPayload?.mqtt_config?.username,
      password: configPayload?.mqtt_config?.password,

      //add after not connected
      reconnectPeriod: 1000, // Add reconnection period
    };

    const client = mqtt.connect(url, options);

    client.on("connect", () => {
      if (newKioskDeviceInfo !== "live") {
        // notification("MQTT client connected successfully", "success");
      }
      dispatch(setConnected(true));

      if (configPayload?.mqtt_config?.subscribe_topics) {
        const topicsArray = Object.values(
          configPayload.mqtt_config.subscribe_topics
        );

        topicsArray.forEach((topic) => {
          client.subscribe(topic, { qos: 2 }, (error) => {
            if (error) {
              // console.error(`Error subscribing to ${topic}:`, error);
            } else {
            }
          });
        });
      }
    });

    client.on("reconnect", () => {
      if (newKioskDeviceInfo !== "live") {
        // notification("MQTT client reconnecting...", "warn");
      }
    });

    client.on("offline", () => {
      if (newKioskDeviceInfo !== "live") {
        // notification("MQTT client is offline", "warn");
      }
      dispatch(setConnected(false));
    });

    client.on("disconnect", () => {
      if (newKioskDeviceInfo !== "live") {
        // notification("Disconnected from MQTT server", "warn");
      }
      dispatch(setConnected(false));
    });

    client.on("error", (err) => {
      if (newKioskDeviceInfo !== "live") {
        // console.error("MQTT connection error:", err);
      }
      dispatch(setError(err.message));
    });

    client.on("message", (topic, message) => {
      try {
        const parsedMessage = JSON.parse(message.toString());

        // Compare the actual topic from the event with your configured topic
        if (
          topic === newKioskConfig?.mqtt_config?.subscribe_topics?.console_call
        ) {
          // Add a flag check to prevent multiple calls
          if (!window.isConnectActionDispatched) {
            window.isConnectActionDispatched = true;

            const callMQTT = {
              cmd: "connect",
              device_uuid_list: [newKioskConfig?.device_id],
              response: {
                status: true,
                message: "",
                data: {},
              },
            };
            dispatch(callMQTTAction(callMQTT));

            // Reset the flag after some time to allow future connections
            setTimeout(() => {
              window.isConnectActionDispatched = false;
            }, 5000); // 5 seconds cooldown
          }
        }

        dispatch(setLastMessage({ topic, message: message.toString() }));
      } catch (error) {
        // console.error("Error handling MQTT message:", error);
      }
    });

    dispatch(setClient(client));
  } catch (error) {
    dispatch(setError(error.message));
  }
};

export default mqttSlice.reducer;
