import "bootstrap/dist/css/bootstrap.min.css";
import "simple-keyboard/build/css/index.css";
import "aos/dist/aos.css";
import "sweetalert2/dist/sweetalert2.min.css";
import "animate.css";
import "react-phone-input-2/lib/style.css";
import "./assets/sass/style.scss";
import Routes from "./router/index";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import {
  setIsLoader,
  setIsLoginStatus,
} from "./redux/reducers/UserLoginAndProfile/auth";
import {
  getSessionItem,
  removeSessionItem,
  setSessionItem,
} from "./hooks/session";
import axios from "axios";
import setupInterceptors from "./utils/axios-interceptors.js";
import { initializeMQTT } from "./redux/reducers/MQTT/mqttSlice.js";
import { NotificationContainer } from "./helpers/middleware.js";
import {
  getKioskDeviceDetails,
  getKioskDeviceListData,
} from "./redux/reducers/Kiosk/KioskDevice.js";
import { getKioskDeviceConfigListData } from "./redux/reducers/Kiosk/KioskDeviceConfig.js";
import NoInternetAlert from "./components/NoInternetAlert.jsx";
import { agentUserMQTTAction } from "./redux/reducers/MQTT/agentUserMQTT.js";
import { kioskAgentMQTTAction } from "./redux/reducers/MQTT/kioskAgentMQTT.js";
import html2canvas from "html2canvas";
import { keyDispenserAction } from "./redux/reducers/MQTT/keyDispenser.js";

axios.defaults.baseURL = process.env.REACT_APP_API_URL;

function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const autoRefreshCleanupRef = useRef(null);

  const { isLoader, isLoginStatus } = useSelector(({ auth }) => auth);
  const mqttState = useSelector((state) => state.mqtt);
  const selfCheckIn = getSessionItem("selfCheckIn");
  const kioskData = getSessionItem("KioskConfig");
  const kioskSession = kioskData
    ? JSON.parse(decodeURIComponent(escape(atob(kioskData))))
    : null;

  const keyDispenserTopic =
    kioskSession?.[0]?.mqtt_config?.subscribe_topics?.key_dispenser;
  const consoleActionTopic =
    kioskSession?.[0]?.mqtt_config?.subscribe_topics?.console_action;
  const consoleAgentTopic =
    kioskSession?.[0]?.mqtt_config?.subscribe_topics?.console_agent;
  const cashRecyclerTopic =
    kioskSession?.[0]?.mqtt_config?.subscribe_topics?.cash_recycler;

  const touchDisabled = getSessionItem("touchDisabled") === "true";
  const { activeKioskDeviceList } = useSelector(
    ({ kioskDevice }) => kioskDevice
  );
  const deviceIds =
    activeKioskDeviceList?.map((device) => device.id).filter(Boolean) || [];

  const captureScreen = async () => {
    try {
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: document.documentElement.offsetWidth,
        windowHeight: document.documentElement.offsetHeight,
        scale: 1,
      });

      const base64Image = canvas.toDataURL("image/jpeg", 0.9);

      return base64Image;
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    const { responseInterceptor } = setupInterceptors({ navigate, dispatch }); // Use setupInterceptors here
    return () => {
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [navigate]);

  useEffect(() => {
    if (mqttState?.lastMessage?.message) {
      const data = JSON.parse(mqttState.lastMessage.message);
      if (data?.cmd === "kiosk_online" && data?.topic === consoleActionTopic) {
        removeSessionItem("splash");
        dispatch(
          agentUserMQTTAction({
            cmd: "kiosk_online",
            device_uuid_list: deviceIds,
            response: {
              status: true,
              message: "Kiosk Online Status applied.",
              data: { status_mode: "online" },
            },
          })
        );
      }
      if (data?.cmd === "kiosk_close") {
        setSessionItem("laneClose", "true");
      } else if (data?.cmd === "kiosk_self" || data?.cmd === "kiosk_agent") {
        setSessionItem("laneClose", "false");
      }
      if (data?.cmd === "kiosk_close") setSessionItem("selfCheckIn", "false");
      if (data?.cmd === "kiosk_agent") setSessionItem("selfCheckIn", "false");
      if (data?.cmd === "kiosk_self") setSessionItem("selfCheckIn", "true");
      if (
        (data?.cmd === "kiosk_agent" || data?.cmd === "kiosk_close") &&
        data?.topic === consoleActionTopic
      ) {
        setSessionItem("touchDisabled", true);
        if (data?.cmd === "kiosk_close") {
          navigate("/lane-closed");
        } else if (data?.cmd === "kiosk_agent") {
          navigate("/home");
          dispatch(
            agentUserMQTTAction({
              cmd: data?.cmd,
              device_uuid_list: deviceIds,
              response: {
                status: true,
                code: data?.seq,
                message: "Kiosk Agent Status applied.",
                data: { status_mode: "agent" },
              },
            })
          );
        }
      } else if (
        data?.cmd === "kiosk_self" &&
        data?.topic === consoleActionTopic
      ) {
        setSessionItem("touchDisabled", false);
        navigate("/home");
        dispatch(
          agentUserMQTTAction({
            cmd: data?.cmd,
            device_uuid_list: deviceIds,
            response: {
              status: true,
              code: data?.seq,
              message: "Kiosk Self CheckIn Status applied.",
              data: { status_mode: "self" },
            },
          })
        );
      }
      if (
        data?.cmd === "screen_capture" &&
        data?.topic === consoleActionTopic
      ) {
        captureScreen().then((base64Image) => {
          if (base64Image) {
            dispatch(
              agentUserMQTTAction({
                cmd: data?.cmd,
                device_uuid_list: deviceIds,
                response: {
                  status: true,
                  code: data?.seq,
                  message: "Screen capture successful",
                  data: {
                    image: base64Image,
                    status_mode: "close",
                    timestamp: new Date().toISOString(),
                  },
                },
              })
            );
          }
        });
      }
      if (data?.cmd === "issue_key" && data?.topic === consoleActionTopic) {
        dispatch(
          keyDispenserAction({
            cmd: "issue_key",
            device_uuid_list: deviceIds,
            payload: data?.payload,
          })
        );
        navigate("/agent-check-in/key-receipt");
        setSessionItem("seqCode", data?.seq);
      }
      if (data?.cmd === "refresh" && data?.topic === consoleActionTopic) {
        dispatch(
          agentUserMQTTAction({
            cmd: data?.cmd,
            device_uuid_list: deviceIds,
            response: {
              status: true,
              code: data?.seq,
              message: "Refresh page applied.",
              data: { status_mode: "refresh" },
            },
          })
        );
        window.location.reload();
      }
      if (data?.cmd === "move_home" && data?.topic === consoleActionTopic) {
        dispatch(
          agentUserMQTTAction({
            cmd: data?.cmd,
            device_uuid_list: deviceIds,
            response: {
              status: true,
              code: data?.seq,
              message: "Move to home page applied.",
              data: { status_mode: "close" },
            },
          })
        );
        navigate("/home");
      }
      if (data?.cmd === "draw_sign" && data?.topic === consoleActionTopic) {
        navigate("/agent-check-in/signature");
        setSessionItem("seqCode", data?.seq);
      }
      if (
        data?.cmd === "capture_selfie" &&
        data?.topic === consoleActionTopic
      ) {
        navigate("/agent-selfie");
        setSessionItem("seqCode", data?.seq);
      }
      if (data?.cmd === "ask_email_mob" && data?.topic === consoleActionTopic) {
        navigate("/agent-check-in/contact-information");
        setSessionItem("AgentGuestName", data?.payload?.data?.name);
        setSessionItem("seqCode", data?.seq);
      }
      if (data?.cmd === "check_in" && data?.topic === consoleActionTopic) {
        navigate("/agent/check-in/thank-you");
        setSessionItem("AgentBookingDetails", JSON.stringify(data));
      }
      if (
        data?.cmd === "transaction_operations" &&
        data?.topic === cashRecyclerTopic
      ) {
        if (
          data?.payload?.command_data?.transaction_type === "collection" &&
          selfCheckIn === "false"
        ) {
          navigate("/agent-check-in/payment");
          setSessionItem(
            "collect_amount",
            data?.payload?.command_data?.transaction_amount
          );
          setSessionItem("collect_type", "collection");
          setSessionItem("seqCode", data?.seq);
        } else if (data?.payload?.command_data?.transaction_type === "refund") {
          navigate("/agent-check-out/payment");
          setSessionItem(
            "collect_amount",
            data?.payload?.command_data?.transaction_amount
          );
          setSessionItem("collect_type", "refund");
          setSessionItem("seqCode", data?.seq);
        }
      }
      if (
        data?.cmd === "ask_vehicle_no" &&
        data?.topic === consoleActionTopic
      ) {
        navigate("/agent-check-in/vehical");
        setSessionItem("AgentGuestName", data?.payload?.data?.name);
        setSessionItem("seqCode", data?.seq);
      }
      if (data?.cmd === "scan_id" && data?.topic === consoleActionTopic) {
        dispatch(
          agentUserMQTTAction({
            cmd: data?.cmd,
            device_uuid_list: deviceIds,
            response: {
              status: true,
              code: data?.seq,
              message: "Scan ID Status applied.",
              data: { status_mode: "scan_id" },
            },
          })
        );
        navigate("/agent-check-in/scan-proof");
      }
      if (
        data?.cmd === "request_terminal" &&
        data?.topic === consoleActionTopic
      ) {
        dispatch(
          agentUserMQTTAction({
            cmd: data?.cmd,
            device_uuid_list: deviceIds,
            response: {
              status: true,
              code: data?.seq,
              message: "Credit card Terminal processing...",
              data: { status_mode: "terminal" },
            },
          })
        );
        setSessionItem("paymentMethod", "credit_card");
        navigate("/agent-terminal/payment");
      }
      if (data?.cmd === "re_connect" && data?.topic === consoleAgentTopic) {
        if (data?.payload?.data?.re_connect_status) {
          const previousUserId = getSessionItem("agent_user_id");
          dispatch(
            kioskAgentMQTTAction({
              cmd: "disconnect",
              device_uuid_list: deviceIds,
              response: {
                status: true,
                code: data?.seq,
                message: "Kiosk Agent Disconnect Status applied.",
                data: { status_mode: "disconnect", userId: previousUserId },
              },
            })
          ).then(() => {
            dispatch(
              kioskAgentMQTTAction({
                cmd: "re_connect",
                device_uuid_list: deviceIds,
                response: {
                  status: true,
                  code: data?.seq,
                  message: "Kiosk Agent Reconnect Status applied.",
                  data: {
                    status_mode: "re_connect_agent",
                    userId: data?.payload?.agent_user_id,
                  },
                },
              })
            );
            setSessionItem("agent_user_id", data?.payload?.agent_user_id || "");
          });
        }
      }
      if (data?.cmd === "connect" && data?.topic === consoleAgentTopic) {
        const previousUserId = getSessionItem("agent_user_id");
        if (previousUserId === null) {
          dispatch(
            kioskAgentMQTTAction({
              cmd: data?.cmd,
              device_uuid_list: deviceIds,
              response: {
                status: true,
                code: data?.seq,
                message: "Kiosk Agent Status applied.",
                data: { status_mode: "connect_agent" },
              },
            })
          );
          setSessionItem("agent_user_id", data?.payload?.agent_user_id || "");
          return;
        } else if (previousUserId !== data?.payload?.agent_user_id) {
          dispatch(
            kioskAgentMQTTAction({
              cmd: data?.cmd,
              device_uuid_list: deviceIds,
              response: {
                status: false,
                code: data?.seq,
                message: "Already connected to another agent.",
                data: {
                  status_mode: "already_connect_agent",
                  userId: data?.payload?.agent_user_id,
                },
              },
            })
          );

          return;
        } else if (previousUserId === data?.payload?.agent_user_id) {
          return;
        }
      }
    }
  }, [mqttState?.lastMessage?.message]);

  useEffect(() => {
    dispatch(setIsLoader(true));
    const values = getSessionItem("TokenKiosk");
    if (values) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${atob(values)}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
      navigate("/login");
    }
    dispatch(setIsLoader(false));
  }, [dispatch, navigate]);

  useEffect(() => {
    dispatch(setIsLoginStatus(false));
    const userData = getSessionItem("UserSessionKiosk");
    if (userData) {
      dispatch(getKioskDeviceListData())
        .unwrap()
        .then((listData) => {
          if (listData?.data && listData?.data?.length > 0) {
            dispatch(getKioskDeviceDetails(listData?.data?.[0]?.id));
            dispatch(
              getKioskDeviceConfigListData({
                params: { device_id: listData?.data?.[0]?.id },
              })
            ).then((configData) => {
              dispatch(initializeMQTT(configData?.payload?.data?.[0]));
            });
          }
        })
        .catch((error) => {
          // console.error("Failed to fetch kiosk device list:", error);
        });
    }
  }, [dispatch]);

  return (
    <>
      <Routes />
      <NotificationContainer />
      <NoInternetAlert />

      {/* <UiBlocker active={touchDisabled} /> */}
    </>
  );
}

export default App;
