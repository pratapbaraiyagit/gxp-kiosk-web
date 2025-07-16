import React, { useEffect, useRef, useState, useCallback } from "react";
import { Col, Nav, Row, Tab } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {
  getSessionItem,
  removeSessionItem,
  setSessionItem,
} from "../../hooks/session";
import { notification } from "../../helpers/middleware";
import audioSrc from "../../assets/sound/testing.mp3";
import useIDScanner from "../../hooks/useIDScanner";
import AudioVisualizer from "./AudioVisualizer";
import SpeakerVisualizer from "./SpeakerVisualizer ";
import useKeyDispenser from "../../hooks/useKeyDispenser";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import useKeyEncoder from "../../hooks/useKeyEncoder";
import { updatePaymentTerminalStatus } from "../../redux/reducers/Terminal/terminalCard";
import moment from "moment";

const Setting = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux state
  const { isLoginStatus } = useSelector(({ auth }) => auth);
  const mqttState = useSelector((state) => state.mqtt);

  // Audio context refs
  const audioContextRef = useRef(null);
  const sourceRef = useRef(null);
  const analyserRef = useRef(null);

  // Get session data
  const hotelKiosk = getSessionItem("hotelKiosk");
  const userHotelSession = hotelKiosk
    ? JSON.parse(decodeURIComponent(escape(atob(hotelKiosk))))
    : null;

  const kioskData = getSessionItem("KioskConfig");
  const kioskSession = kioskData
    ? JSON.parse(decodeURIComponent(escape(atob(kioskData))))
    : null;

  const KioskDeviceInfo = getSessionItem("KioskDeviceInfo");
  const KioskDeviceInfoSession = KioskDeviceInfo
    ? JSON.parse(decodeURIComponent(escape(atob(KioskDeviceInfo))))
    : null;
  const terminalID = KioskDeviceInfoSession?.[0]?.terminal_id;

  // Get stored device selections
  const selectedAudioInput = getSessionItem("selected_audio_input");
  const selectedAudioOutput = getSessionItem("selected_audio_output");
  const selectedCamera1 = getSessionItem("camera1");
  const storedMicId = getSessionItem("mic") || "";
  const storedSpeakerId = getSessionItem("speaker") || "";
  const storedCameraId = getSessionItem("camera_1") || "select";

  // Media states
  const [micMedia, setMicMedia] = useState(null);
  const [speakerMedia, setSpeakerMedia] = useState(null);

  // Camera states
  const [cameras, setCameras] = useState([]);
  const [selectedCameraForVideo, setSelectedCameraForVideo] =
    useState(storedCameraId);
  const [camera1Status, setCamera1Status] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const videoStreamRef = useRef(null); // Track current video stream

  // Audio device states
  const [audioInputs, setAudioInputs] = useState([]);
  const [audioOutputs, setAudioOutputs] = useState([]);
  const [selectedMic, setSelectedMic] = useState(storedMicId || "");
  const [selectedSpeaker, setSelectedSpeaker] = useState(storedSpeakerId || "");
  const [isMicTesting, setIsMicTesting] = useState(false);
  const [isSpeakerTesting, setIsSpeakerTesting] = useState(false);

  // Combined timer state management
  const [timerStates, setTimerStates] = useState({
    scanner: {
      timerExpired: false,
      errorMessage: "",
      connectionOnClick: false,
      showCountdown: false,
      countdown: 30,
    },
    dispenser: {
      timerExpired: false,
      errorMessage: "",
      connectionOnClick: false,
      showCountdown: false,
      countdown: 45,
    },
    encoder: {
      timerExpired: false,
      errorMessage: "",
      connectionOnClick: false,
      showCountdown: false,
      countdown: 20,
    },
  });

  const timerRefs = useRef({
    scanner: null,
    dispenser: null,
    encoder: null,
  });

  const requestTimedOutRefs = useRef({
    scanner: false,
    dispenser: false,
    encoder: false,
  });

  // Tab states
  const [activeTab, setActiveTab] = useState("general");
  const [generalSettingStatus, setGeneralSettingStatus] = useState(false);
  const [videoCallSettingStatus, setVideoCallSettingStatus] = useState(false);
  const [connectIdScannerSettingStatus, setConnectIdScannerSettingStatus] =
    useState(false);
  const [creditCardSettingStatus, setCreditCardSettingStatus] = useState(false);
  const [keyEncoderSettingStatus, setKeyEncoderSettingStatus] = useState(false);
  const [keyDispenserSettingStatus, setKeyDispenserSettingStatus] =
    useState(false);

  const [isBtnLoading, setIsBtnLoading] = useState(false);
  const [fireCommand, setFireCommand] = useState("");

  // Refs
  const micRef = useRef(null);
  const speakerRef = useRef(null);
  const micStreamRef = useRef(null); // Track current mic stream

  // Custom hooks
  const {
    isConnected,
    isLoading,
    connectScanner,
    statusScanner,
    calibrateScanner,
    disconnectScanner,
    reConnectIdScanner,
  } = useIDScanner();

  const {
    isKeyDLoading,
    isDeviceStatusChecked,
    connectKeyDispenser,
    reConnectKeyDispenser,
  } = useKeyDispenser();

  const { isKeyELoading, isKEConnect, connectKeyEncoder, reConnectKeyEncoder } =
    useKeyEncoder();

  // Tab order configuration
  const tabOrder = [
    "general",
    "videoCall",
    "scanner",
    "creditCard",
    "keyEncoder",
    "keyDispenser",
  ];

  const logOutUse = () => {
    disconnectScanner();
    cleanupAllResources();
    removeSessionItem("UserSessionKiosk");
    removeSessionItem("TokenKiosk");
    removeSessionItem("RefreshKiosk");
    removeSessionItem("splash");
    removeSessionItem("camera1");
    removeSessionItem("camera_1");
    removeSessionItem("hotelKiosk");
    removeSessionItem("mic");
    removeSessionItem("selected_audio_input");
    removeSessionItem("selected_audio_output");
    removeSessionItem("speaker");
    localStorage.clear();
    sessionStorage.clear();
    notification("Logout successfully!!", "success");
    navigate("/login");
  };

  // Cleanup all resources
  const cleanupAllResources = useCallback(() => {
    cleanupCamera();
    cleanupMicrophone();
    cleanupAudioContext();
    clearAllTimers();
  }, []);

  // Clean up camera resources
  const cleanupCamera = useCallback(() => {
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      videoStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCamera1Status(false);
  }, []);

  // Clean up microphone resources
  const cleanupMicrophone = useCallback(() => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      micStreamRef.current = null;
    }

    if (micRef.current) {
      micRef.current.srcObject = null;
    }

    setMicMedia(null);
    setIsMicTesting(false);
  }, []);

  // Clean up audio context
  const cleanupAudioContext = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    if (analyserRef.current) {
      analyserRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (speakerRef.current) {
      speakerRef.current.pause();
      speakerRef.current.currentTime = 0;
    }

    setSpeakerMedia(null);
    setIsSpeakerTesting(false);
  }, []);

  // Clear all timers
  const clearAllTimers = useCallback(() => {
    Object.keys(timerRefs.current).forEach((key) => {
      if (timerRefs.current[key]) {
        clearInterval(timerRefs.current[key]);
        timerRefs.current[key] = null;
      }
    });
  }, []);

  // Request camera permission
  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      // Stop the tracks immediately after getting permission
      stream.getTracks().forEach((track) => track.stop());

      return { success: true, error: null };
    } catch (error) {
      let errorMessage;
      switch (error.name) {
        case "NotAllowedError":
          errorMessage =
            "Camera access was denied. Please enable camera permissions.";
          break;
        case "NotFoundError":
          errorMessage = "No camera device found. Please connect a camera.";
          break;
        case "OverconstrainedError":
          errorMessage =
            "The camera does not support the requested resolution.";
          break;
        default:
          errorMessage = "Unable to access camera. Please check permissions.";
      }

      return { success: false, error: errorMessage };
    }
  };

  // Initialize devices with proper error handling
  const initializeDevices = async () => {
    try {
      setCameraLoading(true);
      setCameraError(null);

      // Request permissions first
      const cameraResult = await requestCameraPermission();
      if (!cameraResult.success) {
        setCameraError(cameraResult.error);
        return;
      }

      // Request audio permission
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        audioStream.getTracks().forEach((track) => track.stop());
      } catch (audioError) {
        // console.error("Audio permission error:", audioError);
      }

      // Enumerate devices
      const devices = await navigator.mediaDevices.enumerateDevices();

      // Handle video devices
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );
      const cameraList = videoDevices.map((device, index) => ({
        value: device.deviceId,
        label: device.label || `Camera ${index + 1}`,
      }));
      setCameras(cameraList);

      // Handle audio devices
      const audioInputDevices = devices.filter(
        (device) => device.kind === "audioinput"
      );
      const audioOutputDevices = devices.filter(
        (device) => device.kind === "audiooutput"
      );

      setAudioInputs(
        audioInputDevices.map((device, index) => ({
          value: device.deviceId,
          label: device.label || `Microphone ${index + 1}`,
        }))
      );

      setAudioOutputs(
        audioOutputDevices.map((device, index) => ({
          value: device.deviceId,
          label: device.label || `Speaker ${index + 1}`,
        }))
      );

      // Set default selections if none exist
      if (!selectedMic && audioInputDevices.length > 0) {
        setSelectedMic(audioInputDevices[0].deviceId);
      }
      if (!selectedSpeaker && audioOutputDevices.length > 0) {
        setSelectedSpeaker(audioOutputDevices[0].deviceId);
      }

      notification("Devices initialized successfully", "success");
    } catch (error) {
      setCameraError("Failed to initialize devices. Please check permissions.");
      notification("Error initializing devices", "error");
    } finally {
      setCameraLoading(false);
    }
  };

  // Start camera stream with proper error handling
  const startVideoStream = async (deviceId) => {
    if (!deviceId || deviceId === "select") {
      return;
    }

    try {
      // Clean up any existing stream
      cleanupCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoStreamRef.current = stream;
        setCamera1Status(true);
        setCameraError(null);

        setSessionItem("camera1", JSON.stringify({ status: true }));
        setSessionItem("camera_1", deviceId);
      }
    } catch (error) {
      switch (error.name) {
        case "NotAllowedError":
          setCameraError("Camera access was denied. Please check permissions.");
          break;
        case "NotFoundError":
          setCameraError("Selected camera device not found.");
          break;
        case "OverconstrainedError":
          setCameraError("Camera does not support the requested settings.");
          break;
        default:
          setCameraError("Failed to start camera stream. Please try again.");
      }

      setCamera1Status(false);
      throw error;
    }
  };

  // Handle camera selection change
  const handleCameraChange = async (e) => {
    const newDeviceId = e.target.value;
    setCameraError(null);
    cleanupCamera();

    if (newDeviceId && newDeviceId !== "select") {
      try {
        setSelectedCameraForVideo(newDeviceId);
        await startVideoStream(newDeviceId);
      } catch (error) {
        setSelectedCameraForVideo("select");
      }
    } else {
      setSelectedCameraForVideo("select");
    }
  };

  // Microphone testing with proper cleanup
  const micTest = async () => {
    try {
      cleanupMicrophone();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: selectedMic ? { exact: selectedMic } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      if (micRef.current) {
        micRef.current.srcObject = stream;
        micStreamRef.current = stream;
        setMicMedia(stream);
        setIsMicTesting(true);
        notification("Microphone test started", "success");
      }
    } catch (error) {
      notification("Error accessing microphone", "error");
    }
  };

  const stopMicTest = () => {
    cleanupMicrophone();
  };

  // Speaker testing with proper cleanup
  const speakerTest = async () => {
    try {
      if (speakerRef.current) {
        speakerRef.current.src = audioSrc;

        if (
          typeof speakerRef.current.setSinkId !== "undefined" &&
          selectedSpeaker
        ) {
          try {
            await speakerRef.current.setSinkId(selectedSpeaker);
          } catch (error) {
            // console.warn("Error setting speaker device:", error);
          }
        }

        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext ||
            window.webkitAudioContext)();
        }

        if (sourceRef.current) {
          sourceRef.current.disconnect();
        }

        sourceRef.current = audioContextRef.current.createMediaElementSource(
          speakerRef.current
        );
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 128;

        sourceRef.current.connect(analyserRef.current);
        sourceRef.current.connect(audioContextRef.current.destination);

        const dummyStream = new MediaStream();
        setSpeakerMedia({ stream: dummyStream, analyser: analyserRef.current });

        await speakerRef.current.play();
        setIsSpeakerTesting(true);
        notification("Speaker test started", "success");
      }
    } catch (error) {
      setIsSpeakerTesting(false);
      notification("Error testing speaker", "error");
    }
  };

  const stopSpeakerTest = () => {
    cleanupAudioContext();
  };

  const handleGeneralContinue = () => {
    stopMicTest();
    stopSpeakerTest();

    setSessionItem("selected_audio_input", JSON.stringify({ status: true }));
    setSessionItem("mic", selectedMic);
    setSessionItem("selected_audio_output", JSON.stringify({ status: true }));
    setSessionItem("speaker", selectedSpeaker);

    updateSettings("general");
  };

  // Generic timer management
  const startCountdownTimer = (type, initialCount, timeoutMessage) => {
    if (timerRefs.current[type]) {
      clearInterval(timerRefs.current[type]);
    }

    setTimerStates((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        timerExpired: false,
        errorMessage: "",
        countdown: initialCount,
        showCountdown: true,
        connectionOnClick: true,
      },
    }));

    requestTimedOutRefs.current[type] = false;

    timerRefs.current[type] = setInterval(() => {
      setTimerStates((prev) => {
        const currentCount = prev[type].countdown;

        if (currentCount <= 1) {
          clearInterval(timerRefs.current[type]);
          requestTimedOutRefs.current[type] = true;

          return {
            ...prev,
            [type]: {
              ...prev[type],
              timerExpired: true,
              connectionOnClick: false,
              errorMessage: timeoutMessage,
              countdown: 0,
              showCountdown: false,
            },
          };
        }

        return {
          ...prev,
          [type]: {
            ...prev[type],
            countdown: currentCount - 1,
          },
        };
      });
    }, 1000);
  };

  // Scanner connection with improved timer management
  const checkIdScannerStatus = async () => {
    startCountdownTimer(
      "scanner",
      30,
      "Scanner connection timed out. Please try again."
    );
    await connectScanner();
  };

  const checkReStartIdScannerStatus = async () => {
    startCountdownTimer("scanner", 10, "Scanner Disconnected");
    await reConnectIdScanner();
  };

  const checkReStartEncoderStatus = async () => {
    startCountdownTimer("encoder", 8, "");
    await reConnectKeyEncoder();
  };

  const checkReStartDispenserStatus = async () => {
    startCountdownTimer("dispenser", 8, "");
    await reConnectKeyDispenser();
  };

  // Dispenser connection with improved timer management
  const checkDispenserStatus = async () => {
    startCountdownTimer(
      "dispenser",
      45,
      "Connection timed out. Please try again."
    );
    await connectKeyDispenser();
  };

  // Encoder connection with improved timer management
  const checkEncoderStatus = async () => {
    startCountdownTimer(
      "encoder",
      20,
      "Connection timed out. Please try again."
    );
    await connectKeyEncoder();
  };

  // Handle scanner connection state
  useEffect(() => {
    if (isConnected && timerRefs.current.scanner) {
      clearInterval(timerRefs.current.scanner);
      setTimerStates((prev) => ({
        ...prev,
        scanner: {
          ...prev.scanner,
          showCountdown: false,
          connectionOnClick: false,
          timerExpired: false,
          errorMessage: "",
        },
      }));
    }
  }, [isConnected]);

  // Handle dispenser connection state
  useEffect(() => {
    if (isDeviceStatusChecked && !requestTimedOutRefs.current.dispenser) {
      if (timerRefs.current.dispenser) {
        clearInterval(timerRefs.current.dispenser);
      }
      setTimerStates((prev) => ({
        ...prev,
        dispenser: {
          ...prev.dispenser,
          connectionOnClick: false,
          showCountdown: false,
          timerExpired: false,
          errorMessage: "",
        },
      }));
    }
  }, [isDeviceStatusChecked]);

  // Handle encoder connection state
  useEffect(() => {
    if (isKEConnect && !requestTimedOutRefs.current.encoder) {
      if (timerRefs.current.encoder) {
        clearInterval(timerRefs.current.encoder);
      }
      setTimerStates((prev) => ({
        ...prev,
        encoder: {
          ...prev.encoder,
          connectionOnClick: false,
          showCountdown: false,
          timerExpired: false,
          errorMessage: "",
        },
      }));
    }
  }, [isKEConnect]);

  // Clean up timers when changing tabs
  useEffect(() => {
    return () => {
      if (timerRefs.current[activeTab]) {
        clearInterval(timerRefs.current[activeTab]);
        setTimerStates((prev) => ({
          ...prev,
          [activeTab]: {
            ...prev[activeTab],
            showCountdown: false,
          },
        }));
      }
    };
  }, [activeTab]);

  // Update settings status
  useEffect(() => {
    const audioInput = getSessionItem("selected_audio_input");
    const audioOutput = getSessionItem("selected_audio_output");

    if (audioInput && audioOutput) {
      try {
        const inputData = JSON.parse(audioInput);
        const outputData = JSON.parse(audioOutput);

        if (inputData?.status && outputData?.status) {
          setGeneralSettingStatus(true);
        }
      } catch (error) {
        // console.error("Error parsing session data:", error);
      }
    }

    // Also check if stored devices are available in the current device list
    if (audioInputs.length > 0 && storedMicId) {
      const micExists = audioInputs.find(
        (input) => input.value === storedMicId
      );
      if (!micExists && audioInputs.length > 0) {
        // If stored mic doesn't exist, select the first available
        setSelectedMic(audioInputs[0].value);
      }
    }

    if (audioOutputs.length > 0 && storedSpeakerId) {
      const speakerExists = audioOutputs.find(
        (output) => output.value === storedSpeakerId
      );
      if (!speakerExists && audioOutputs.length > 0) {
        // If stored speaker doesn't exist, select the first available
        setSelectedSpeaker(audioOutputs[0].value);
      }
    }
  }, [
    selectedAudioInput,
    selectedAudioOutput,
    audioInputs,
    audioOutputs,
    storedMicId,
    storedSpeakerId,
  ]);

  useEffect(() => {
    const camera1 = getSessionItem("camera1");
    if (camera1) {
      try {
        const cameraData = JSON.parse(camera1);
        if (cameraData?.status) {
          setVideoCallSettingStatus(true);
        }
      } catch (error) {
        // console.error("Error parsing camera data:", error);
      }
    }
  }, [selectedCamera1]);

  // Handle settings updates
  const updateSettings = (currentTab) => {
    switch (currentTab) {
      case "general":
        setGeneralSettingStatus(true);
        notification("General Setting Updated Successfully", "success");
        break;
      case "videoCall":
        setVideoCallSettingStatus(true);
        notification("Video Call Setting Updated Successfully", "success");
        break;
      case "scanner":
        setConnectIdScannerSettingStatus(true);
        notification("ID Scanner Setting Updated Successfully", "success");
        break;
      case "creditCard":
        setCreditCardSettingStatus(true);
        notification("Credit Card Setting Updated Successfully", "success");
        break;
      case "keyEncoder":
        setKeyEncoderSettingStatus(true);
        notification("Key Encoder Setting Updated Successfully", "success");
        break;
      case "keyDispenser":
        setKeyDispenserSettingStatus(true);
        notification("Key Dispenser Setting Updated Successfully", "success");
        navigate("/splash");
        return;
      default:
        break;
    }

    // Find the next available tab
    const currentIndex = tabOrder.indexOf(currentTab);
    if (currentIndex < tabOrder.length - 1) {
      let nextIndex = currentIndex + 1;
      let nextTab = tabOrder[nextIndex];

      // Skip inactive device tabs
      while (
        nextIndex < tabOrder.length - 1 &&
        ((nextTab === "scanner" &&
          !kioskSession?.[0]?.id_scanner_config?.is_active) ||
          (nextTab === "keyEncoder" &&
            !kioskSession?.[0]?.key_encoder_config?.is_active) ||
          (nextTab === "keyDispenser" &&
            !kioskSession?.[0]?.key_dispenser_config?.is_active))
      ) {
        nextIndex++;
        nextTab = tabOrder[nextIndex];
      }

      // Check if the final tab is inactive
      if (
        (nextTab === "scanner" &&
          !kioskSession?.[0]?.id_scanner_config?.is_active) ||
        (nextTab === "keyEncoder" &&
          !kioskSession?.[0]?.key_encoder_config?.is_active) ||
        (nextTab === "keyDispenser" &&
          !kioskSession?.[0]?.key_dispenser_config?.is_active)
      ) {
        navigate("/splash");
      } else {
        setActiveTab(nextTab);
      }
    }
  };

  // ID Scanner Commands
  const handleCalibrate = async (cmd) => {
    setIsBtnLoading(true);
    setFireCommand(cmd);

    try {
      let success;

      if (cmd === "calibrate") {
        success = await calibrateScanner();
        if (success) {
          notification("Successfully calibrated scanner", "success");
        }
      }
      if (cmd === "status") {
        success = await statusScanner();
        if (success) {
          notification("Successfully got scanner status", "success");
        }
      }
    } catch (error) {
      // console.error(`Error executing ${cmd} command:`, error);
    } finally {
      setTimeout(() => {
        setIsBtnLoading(false);
        setFireCommand("");
      }, 3000);
    }
  };

  // Credit Card Terminal
  const [transactionStatus, setTransactionStatus] = useState({
    isTerminalLoading: false,
    errorTerminal: null,
    successTerminal: false,
  });

  const handleCreditCardTransaction = async () => {
    setTransactionStatus({
      isTerminalLoading: true,
      errorTerminal: null,
      successTerminal: false,
    });
    try {
      const resultAction = await dispatch(
        updatePaymentTerminalStatus({
          data: {
            terminal_id: terminalID,
          },
        })
      );
      if (updatePaymentTerminalStatus.fulfilled.match(resultAction)) {
        setTransactionStatus((prev) => ({
          ...prev,
          isTerminalLoading: false,
          successTerminal: true,
        }));
      } else {
        throw new Error("Failed to update terminal status");
      }
    } catch (error) {
      setTransactionStatus((prev) => ({
        ...prev,
        isTerminalLoading: false,
        errorTerminal: error,
      }));
    }
  };

  const cancelTransaction = () => {
    setTransactionStatus({
      isTerminalLoading: false,
      errorTerminal: null,
      successTerminal: false,
    });
    notification("Transaction cancelled", "info");
  };

  // Initialize on mount
  useEffect(() => {
    // Initial device enumeration attempt
    const initializeAndListen = async () => {
      // Try to enumerate devices first (without permissions)
      try {
        const initialDevices = await navigator.mediaDevices.enumerateDevices();

        // Process initial devices even without full permissions
        const videoDevices = initialDevices.filter(
          (d) => d.kind === "videoinput"
        );
        const audioInputs = initialDevices.filter(
          (d) => d.kind === "audioinput"
        );
        const audioOutputs = initialDevices.filter(
          (d) => d.kind === "audiooutput"
        );

        if (videoDevices.length > 0) {
          setCameras(
            videoDevices.map((device, index) => ({
              value: device.deviceId,
              label: device.label || `Camera ${index + 1}`,
            }))
          );
        }

        if (audioInputs.length > 0) {
          setAudioInputs(
            audioInputs.map((device, index) => ({
              value: device.deviceId,
              label: device.label || `Microphone ${index + 1}`,
            }))
          );
        }

        if (audioOutputs.length > 0) {
          setAudioOutputs(
            audioOutputs.map((device, index) => ({
              value: device.deviceId,
              label: device.label || `Speaker ${index + 1}`,
            }))
          );
        }
      } catch (error) {
        // console.warn("Initial device enumeration failed:", error);
      }

      // Then initialize with permissions
      await initializeDevices();
    };

    initializeAndListen();

    // Listen for device changes
    const handleDeviceChange = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();

        // Update video devices
        const videoDevices = devices.filter((d) => d.kind === "videoinput");
        setCameras(
          videoDevices.map((device, index) => ({
            value: device.deviceId,
            label: device.label || `Camera ${index + 1}`,
          }))
        );

        // Update audio inputs
        const audioInputs = devices.filter((d) => d.kind === "audioinput");
        setAudioInputs(
          audioInputs.map((device, index) => ({
            value: device.deviceId,
            label: device.label || `Microphone ${index + 1}`,
          }))
        );

        // Update audio outputs
        const audioOutputs = devices.filter((d) => d.kind === "audiooutput");
        setAudioOutputs(
          audioOutputs.map((device, index) => ({
            value: device.deviceId,
            label: device.label || `Speaker ${index + 1}`,
          }))
        );
      } catch (error) {
        // console.error("Error handling device change:", error);
      }
    };

    navigator?.mediaDevices?.addEventListener(
      "devicechange",
      handleDeviceChange
    );

    // Cleanup function
    return () => {
      cleanupAllResources();
      navigator?.mediaDevices?.removeEventListener(
        "devicechange",
        handleDeviceChange
      );
    };
  }, []);

  // Clean up resources when changing tabs
  useEffect(() => {
    const previousTab = activeTab;

    return () => {
      // Clean up resources when leaving video call tab
      if (previousTab === "videoCall") {
        cleanupCamera();
      }
      // Clean up timers
      if (timerRefs.current[previousTab]) {
        clearInterval(timerRefs.current[previousTab]);
      }
    };
  }, [activeTab]);

  return (
    <>
      <div className="container-fluid mt-3">
        <div className="row align-items-center mb-4">
          <div className="col-md-2">
            <button className="btn btn-danger setting-btn" onClick={logOutUse}>
              Log Out
            </button>
          </div>
          <div className="col-md-8">
            <h4 className="font-weight-600 mb-0 text-center montserrat-font">
              Kiosk Setting -
              <span className="text-capitalize">
                {userHotelSession?.user?.first_name +
                  " " +
                  userHotelSession?.user?.last_name}
              </span>
            </h4>
          </div>
          <div className="col-md-2">
            <button
              className="btn btn-success setting-btn float-end"
              onClick={() => navigate("/splash")}
            >
              Home
            </button>
          </div>
        </div>

        <Tab.Container
          id="left-tabs-example"
          defaultActiveKey="first"
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
        >
          <Row className="setting-page">
            <Col sm={4} md={3}>
              <Nav variant="pills" className="flex-column">
                {/* General Setting */}
                <Nav.Item>
                  <Nav.Link eventKey="general">
                    <label
                      htmlFor="checkbox-1"
                      className="index-checkbox checkbox mb-0"
                    >
                      <input
                        id="checkbox-1"
                        name="checkbox-group"
                        type="checkbox"
                        checked={generalSettingStatus}
                        readOnly
                      />
                      General
                      <span
                        className={`checkbox-mark ${
                          generalSettingStatus ? "checkbox-mark-green" : ""
                        }`}
                      >
                        <svg
                          width="25"
                          height="18"
                          viewBox="0 0 25 18"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M9.13449 12.7269L22.2809 0L25 2.64085L9.13449 18L0 9.15702L2.71912 6.51624L9.13449 12.7269Z"
                          />
                        </svg>
                      </span>
                    </label>
                  </Nav.Link>
                </Nav.Item>
                {/* Video calling camera */}
                <Nav.Item>
                  <Nav.Link eventKey="videoCall">
                    <label
                      htmlFor="checkbox-2"
                      className="index-checkbox checkbox mb-0"
                    >
                      <input
                        type="checkbox"
                        checked={videoCallSettingStatus}
                        readOnly
                      />
                      Video Calling Web Cam
                      <span
                        className={`checkbox-mark   ${
                          videoCallSettingStatus ? "checkbox-mark-green" : ""
                        }`}
                      >
                        <svg
                          width="25"
                          height="18"
                          viewBox="0 0 25 18"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M9.13449 12.7269L22.2809 0L25 2.64085L9.13449 18L0 9.15702L2.71912 6.51624L9.13449 12.7269Z"
                          />
                        </svg>
                      </span>
                    </label>
                  </Nav.Link>
                </Nav.Item>
                {/* Connect id scanner  */}
                {!kioskSession?.[0]?.id_scanner_config?.is_active ? (
                  <Nav.Item>
                    <Nav.Link
                      eventKey="scanner"
                      disabled
                      className="opacity-25"
                    >
                      <label
                        htmlFor="checkbox-4"
                        className="index-checkbox checkbox mb-0"
                      >
                        ID Scanner (Unavailable)
                      </label>
                    </Nav.Link>
                  </Nav.Item>
                ) : (
                  <Nav.Item>
                    <Nav.Link eventKey="scanner">
                      <label
                        htmlFor="checkbox-4"
                        className="index-checkbox checkbox mb-0"
                      >
                        <input
                          id="checkbox-4"
                          name="checkbox-group"
                          type="checkbox"
                          checked={connectIdScannerSettingStatus}
                          readOnly
                        />
                        ID Scanner
                        <span
                          className={`checkbox-mark   ${
                            connectIdScannerSettingStatus
                              ? "checkbox-mark-green"
                              : ""
                          }`}
                        >
                          <svg
                            width="25"
                            height="18"
                            viewBox="0 0 25 18"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M9.13449 12.7269L22.2809 0L25 2.64085L9.13449 18L0 9.15702L2.71912 6.51624L9.13449 12.7269Z"
                            />
                          </svg>
                        </span>
                      </label>
                    </Nav.Link>
                  </Nav.Item>
                )}
                {/* Connect credit card terminal  */}
                <Nav.Item>
                  <Nav.Link eventKey="creditCard">
                    <label
                      htmlFor="checkbox-5"
                      className="index-checkbox checkbox mb-0"
                    >
                      <input
                        id="checkbox-5"
                        name="checkbox-group"
                        type="checkbox"
                        checked={creditCardSettingStatus}
                        readOnly
                      />
                      Credit Card Terminal
                      <span
                        className={`checkbox-mark   ${
                          creditCardSettingStatus ? "checkbox-mark-green" : ""
                        }`}
                      >
                        <svg
                          width="25"
                          height="18"
                          viewBox="0 0 25 18"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M9.13449 12.7269L22.2809 0L25 2.64085L9.13449 18L0 9.15702L2.71912 6.51624L9.13449 12.7269Z"
                          />
                        </svg>
                      </span>
                    </label>
                  </Nav.Link>
                </Nav.Item>

                {/* Connect key encoder */}
                {!kioskSession?.[0]?.key_encoder_config?.is_active ? (
                  <Nav.Item>
                    <Nav.Link
                      eventKey="keyEncoder"
                      disabled
                      className="opacity-25"
                    >
                      <label
                        htmlFor="checkbox-6"
                        className="index-checkbox checkbox mb-0"
                      >
                        Key Encoder (Unavailable)
                      </label>
                    </Nav.Link>
                  </Nav.Item>
                ) : (
                  <Nav.Item>
                    <Nav.Link eventKey="keyEncoder">
                      <label
                        htmlFor="checkbox-6"
                        className="index-checkbox checkbox mb-0"
                      >
                        <input
                          id="checkbox-6"
                          name="checkbox-group"
                          type="checkbox"
                          checked={keyEncoderSettingStatus}
                          readOnly
                        />
                        Key Encoder
                        <span
                          className={`checkbox-mark   ${
                            keyEncoderSettingStatus ? "checkbox-mark-green" : ""
                          }`}
                        >
                          <svg
                            width="25"
                            height="18"
                            viewBox="0 0 25 18"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M9.13449 12.7269L22.2809 0L25 2.64085L9.13449 18L0 9.15702L2.71912 6.51624L9.13449 12.7269Z"
                            />
                          </svg>
                        </span>
                      </label>
                    </Nav.Link>
                  </Nav.Item>
                )}

                {/* Connect key dispenser */}
                {!kioskSession?.[0]?.key_dispenser_config?.is_active ? (
                  <Nav.Item>
                    <Nav.Link
                      eventKey="keyDispenser"
                      disabled
                      className="opacity-25"
                    >
                      <label
                        htmlFor="checkbox-7"
                        className="index-checkbox checkbox mb-0"
                      >
                        Key Dispenser (Unavailable)
                      </label>
                    </Nav.Link>
                  </Nav.Item>
                ) : (
                  <Nav.Item>
                    <Nav.Link eventKey="keyDispenser">
                      <label
                        htmlFor="checkbox-7"
                        className="index-checkbox checkbox mb-0"
                      >
                        <input
                          id="checkbox-7"
                          name="checkbox-group"
                          type="checkbox"
                          checked={keyDispenserSettingStatus}
                          readOnly
                        />
                        Key Dispenser
                        <span
                          className={`checkbox-mark   ${
                            keyDispenserSettingStatus
                              ? "checkbox-mark-green"
                              : ""
                          }`}
                        >
                          <svg
                            width="25"
                            height="18"
                            viewBox="0 0 25 18"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M9.13449 12.7269L22.2809 0L25 2.64085L9.13449 18L0 9.15702L2.71912 6.51624L9.13449 12.7269Z"
                            />
                          </svg>
                        </span>
                      </label>
                    </Nav.Link>
                  </Nav.Item>
                )}
              </Nav>
            </Col>
            <Col sm={8} md={9}>
              <Tab.Content>
                {/* General Setting  */}
                <Tab.Pane eventKey="general">
                  <div className="setting-background d-flex flex-column">
                    <div className="d-flex align-items-center kiosk-name-text mb-3">
                      <h5 className="montserrat-font font-weight-600 mb-0">
                        Kiosk Name
                      </h5>
                      <span className="mx-3">:</span>
                      <p className="mb-0">
                        {userHotelSession?.user?.first_name +
                          " " +
                          userHotelSession?.user?.last_name}
                      </p>
                    </div>
                    <div className="d-flex align-items-center kiosk-name-text mb-3">
                      <h5 className="montserrat-font font-weight-600 mb-0">
                        Property
                      </h5>
                      <span className="mx-3">:</span>
                      <p className="mb-0">
                        {userHotelSession?.hotel?.hotel_name}
                      </p>
                    </div>
                    <div className="d-flex align-items-center kiosk-name-text mb-3">
                      <h5 className="montserrat-font font-weight-600 mb-0">
                        Activation Date
                      </h5>
                      <span className="mx-3">:</span>
                      <p className="mb-0">
                        {moment(
                          KioskDeviceInfoSession?.[0]?.activation_at
                        )?.format("YYYY-MM-DD")}
                      </p>
                    </div>

                    {/* Microphone Test Section */}
                    <div className="mt-5">
                      <div className="row align-items-center">
                        <div className="col-xxl-2 col-lg-3">
                          <button
                            className="btn btn-info w-100 setting-btn"
                            onClick={isMicTesting ? stopMicTest : micTest}
                            disabled={!selectedMic || selectedMic === ""}
                          >
                            {isMicTesting ? "STOP MIC TEST" : "TEST MIC"}
                          </button>
                        </div>
                        <div className="col-xxl-6 col-lg-4 speaker-text">
                          {isMicTesting ? (
                            <AudioVisualizer
                              media={micMedia}
                              lineColor="#00ff00"
                              frequLnum={60}
                            />
                          ) : (
                            <div
                              style={{
                                width: "100%",
                                height: "100px",
                                background: "#ffffff",
                                borderRadius: "8px",
                                border: "1px solid rgba(0,0,0,0.1)",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#666",
                                fontSize: "14px",
                              }}
                            >
                              {selectedMic
                                ? "Click 'TEST MIC' to start"
                                : "Select a microphone first"}
                            </div>
                          )}
                          <audio ref={micRef} className="d-none" />
                        </div>
                        <div className="col-xxl-4 col-lg-5">
                          <select
                            className="form-select"
                            aria-label="Microphone select"
                            id="micAudioSource"
                            value={selectedMic}
                            onChange={(e) => setSelectedMic(e.target.value)}
                            disabled={isMicTesting}
                          >
                            <option value="">Select Microphone</option>
                            {audioInputs?.map((input) => (
                              <option key={input.value} value={input.value}>
                                {input.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Speaker Test Section */}
                    <div className="row align-items-center mt-4">
                      <div className="col-xxl-2 col-lg-3">
                        <button
                          className="btn btn-primary w-100 setting-btn px-3"
                          onClick={
                            isSpeakerTesting ? stopSpeakerTest : speakerTest
                          }
                          disabled={!selectedSpeaker || selectedSpeaker === ""}
                        >
                          {isSpeakerTesting
                            ? "STOP SPEAKER TEST"
                            : "TEST SPEAKER"}
                        </button>
                      </div>
                      <div className="col-xxl-6 col-lg-4 speaker-text">
                        {isSpeakerTesting ? (
                          <SpeakerVisualizer
                            media={speakerMedia}
                            lineColor="#0d6efd"
                            frequLnum={60}
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "100px",
                              background: "#ffffff",
                              borderRadius: "8px",
                              border: "1px solid rgba(0,0,0,0.1)",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#666",
                              fontSize: "14px",
                            }}
                          >
                            {selectedSpeaker
                              ? "Click 'TEST SPEAKER' to start"
                              : "Select a speaker first"}
                          </div>
                        )}
                        <audio
                          ref={speakerRef}
                          src={audioSrc}
                          className="d-none"
                        />
                      </div>
                      <div className="col-xxl-4 col-lg-5">
                        <select
                          className="form-select"
                          aria-label="Speaker select"
                          id="speakerAudioSource"
                          value={selectedSpeaker}
                          onChange={(e) => setSelectedSpeaker(e.target.value)}
                          disabled={isSpeakerTesting}
                        >
                          <option value="">Select Speaker</option>
                          {audioOutputs?.map((output) => (
                            <option key={output.value} value={output.value}>
                              {output.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Footer Section */}
                    <div className="mt-auto text-center">
                      <div className="text-primary font-weight-500 time-zone-text mb-3">
                        Kiosk Timezone : {userHotelSession?.hotel?.time_zone},
                        Current Time : {new Date().toLocaleTimeString()}
                      </div>
                      <button
                        className="btn btn-success bg-gradient btn-continue"
                        onClick={handleGeneralContinue}
                        disabled={!selectedMic || !selectedSpeaker}
                      >
                        CONTINUE
                      </button>
                    </div>
                  </div>
                </Tab.Pane>

                {/* Video calling camera */}
                <Tab.Pane eventKey="videoCall">
                  <div className="setting-background">
                    <div className="row justify-content-center">
                      <div className="col-xxl-4 col-xl-6 col-md-8 text-center">
                        <h5 className="text-primary">
                          Select Video Calling Camera
                        </h5>
                        {cameraLoading && !selectedCameraForVideo ? (
                          <div className="text-center mt-3">
                            <div
                              className="spinner-border text-primary"
                              role="status"
                            >
                              <span className="visually-hidden">
                                Loading cameras...
                              </span>
                            </div>
                          </div>
                        ) : (
                          <select
                            className="form-select"
                            aria-label="Camera select"
                            value={selectedCameraForVideo}
                            onChange={handleCameraChange}
                            id="videoCallingCameraSource"
                            disabled={cameraLoading}
                          >
                            <option value="select">
                              Select Camera for Video Call
                            </option>
                            {cameras?.map((camera) => (
                              <option key={camera.value} value={camera.value}>
                                {camera.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                    <div className="row mt-3">
                      <div className="col-md-10 mx-auto text-center">
                        {cameraError ? (
                          <div className="alert alert-danger d-flex justify-content-between align-items-center">
                            <span>{cameraError}</span>
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={initializeDevices}
                            >
                              Retry Setup
                            </button>
                          </div>
                        ) : selectedCameraForVideo === "select" ? (
                          <div
                            className="bg-light rounded d-flex align-items-center justify-content-center"
                            style={{ height: "380px" }}
                          >
                            <p className="text-muted">
                              Please select a camera to start video preview
                            </p>
                          </div>
                        ) : (
                          <div className="position-relative">
                            <video
                              ref={videoRef}
                              className="video-camera w-100"
                              autoPlay
                              playsInline
                              muted
                              id="videoCallingCamera"
                            />
                            {cameraLoading && (
                              <div
                                className="position-absolute top-50 start-50 translate-middle"
                                style={{
                                  zIndex: 1,
                                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                                  padding: "1rem",
                                  borderRadius: "0.5rem",
                                }}
                              >
                                <div
                                  className="spinner-border text-primary"
                                  role="status"
                                >
                                  <span className="visually-hidden">
                                    Loading...
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-center mt-2">
                      <button
                        className="btn btn-success bg-gradient btn-continue mb-0 mt-3"
                        onClick={() => {
                          setSessionItem(
                            "camera1",
                            JSON.stringify({ status: true })
                          );
                          setSessionItem("camera_1", selectedCameraForVideo);
                          updateSettings("videoCall");
                        }}
                        disabled={!camera1Status || cameraLoading}
                      >
                        {cameraLoading ? "Initializing..." : "CONTINUE"}
                      </button>
                    </div>
                  </div>
                </Tab.Pane>

                {/* Connect id scanner */}
                {kioskSession?.[0]?.id_scanner_config?.is_active && (
                  <Tab.Pane eventKey="scanner">
                    <div className="setting-background">
                      <div className="row justify-content-center">
                        <div className="col-lg-9 col-md-10">
                          <div className="text-center min-h-486">
                            <h5 className="text-primary">Connect Id Scanner</h5>
                            {(!isConnected ||
                              timerStates.scanner.timerExpired) && (
                              <button
                                className={`btn btn-success bg-gradient setting-btn mt-3 ${
                                  (isLoading ||
                                    timerStates.scanner.connectionOnClick) &&
                                  !timerStates.scanner.timerExpired
                                    ? "disabled"
                                    : ""
                                }`}
                                onClick={checkIdScannerStatus}
                              >
                                {(isLoading ||
                                  timerStates.scanner.connectionOnClick) &&
                                !timerStates.scanner.timerExpired ? (
                                  <span
                                    className="spinner-border spinner-border-sm me-2"
                                    role="status"
                                    aria-hidden="true"
                                  ></span>
                                ) : (
                                  ""
                                )}
                                Connect Scanner
                              </button>
                            )}
                            <div
                              className="my-2"
                              style={{
                                height: "320px",
                                backgroundColor: "#f0f0f0",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexDirection: "column",
                                gap: "10px",
                              }}
                            >
                              {isLoading ||
                              timerStates.scanner.connectionOnClick ? (
                                <>
                                  <div
                                    className="spinner-border text-primary"
                                    role="status"
                                  >
                                    <span className="visually-hidden">
                                      Loading...
                                    </span>
                                  </div>
                                  <span>
                                    {isConnected
                                      ? "Scanner Connected"
                                      : "Waiting for ID scanner..."}
                                  </span>
                                  {timerStates.scanner.showCountdown &&
                                    !isConnected && (
                                      <span className="text-muted">
                                        Timeout in{" "}
                                        {timerStates.scanner.countdown}s
                                      </span>
                                    )}
                                </>
                              ) : timerStates.scanner.timerExpired ? (
                                <div className="text-danger">
                                  {timerStates.scanner.errorMessage}
                                </div>
                              ) : (
                                <span>
                                  {isConnected
                                    ? "Scanner Connected"
                                    : "Scanner Disconnected"}
                                </span>
                              )}
                            </div>
                            <span
                              className={`d-block mb-2 ${
                                isConnected ? "text-success" : "text-danger"
                              }`}
                            >
                              {isLoading ||
                              timerStates.scanner.connectionOnClick
                                ? "Connecting..."
                                : isConnected
                                ? "Online"
                                : "Offline"}
                            </span>
                          </div>
                          <button
                            className={`btn btn-success bg-gradient d-block mx-auto setting-btn ${
                              !isConnected ? "disabled" : ""
                            }`}
                            onClick={() => updateSettings("scanner")}
                          >
                            CONTINUE
                          </button>
                        </div>
                        <div className="col-lg-3 col-md-2">
                          <div className="d-flex flex-column gap-3">
                            {["status", "calibrate"].map((cmd) => (
                              <button
                                key={cmd}
                                className="btn btn-primary setting-btn mx-auto min-w-160"
                                onClick={() => {
                                  handleCalibrate(cmd);
                                }}
                                disabled={isBtnLoading || !isConnected}
                              >
                                {isBtnLoading && fireCommand === cmd && (
                                  <span
                                    className="spinner-border spinner-border-sm me-2"
                                    role="status"
                                    aria-hidden="true"
                                  ></span>
                                )}
                                {cmd.charAt(0).toUpperCase() + cmd.slice(1)}
                              </button>
                            ))}
                            <button
                              className={`btn btn-primary setting-btn mx-auto min-w-160 ${
                                (isLoading ||
                                  timerStates.scanner.connectionOnClick) &&
                                !timerStates.scanner.timerExpired
                                  ? "disabled"
                                  : ""
                              }`}
                              onClick={checkReStartIdScannerStatus}
                            >
                              {(isLoading ||
                                timerStates.scanner.connectionOnClick) &&
                              !timerStates.scanner.timerExpired ? (
                                <span
                                  className="spinner-border spinner-border-sm"
                                  role="status"
                                  aria-hidden="true"
                                ></span>
                              ) : (
                                ""
                              )}
                              Restart
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Tab.Pane>
                )}

                {/* Connect credit card terminal  */}
                <Tab.Pane eventKey="creditCard">
                  <div className="setting-background">
                    <div className="row justify-content-center">
                      <div className="col-12">
                        <div className="text-center">
                          <h5 className="text-primary">
                            Test Credit Card Terminal
                          </h5>
                          <div className="bg-yellow rounded p-2">
                            <span className="fw-bold">Note:</span>
                            <br />
                            <span className="font-size-15">
                              For testing, we need you to tap your Credit card
                              on Machine
                              <br />
                              will be $0 value transaction testing.
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="col-xxl-4 col-md-8">
                        <div className="d-flex align-items-center justify-content-center gap-3 mt-3">
                          <button
                            className={`btn btn-success bg-gradient setting-btn ${
                              transactionStatus.isTerminalLoading
                                ? "disabled"
                                : ""
                            }`}
                            onClick={handleCreditCardTransaction}
                            disabled={transactionStatus.isTerminalLoading}
                          >
                            {transactionStatus.isTerminalLoading ? (
                              <>
                                <span
                                  className="spinner-border spinner-border-sm me-2"
                                  role="status"
                                  aria-hidden="true"
                                />
                                Processing...
                              </>
                            ) : (
                              "Send Test Transaction Request"
                            )}
                          </button>
                          <button
                            className="btn btn-danger bg-gradient setting-btn"
                            onClick={cancelTransaction}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="text-center mt-2">
                      <button
                        className="btn btn-success bg-gradient btn-continue"
                        onClick={() => updateSettings("creditCard")}
                      >
                        CONTINUE
                      </button>
                    </div>
                  </div>
                </Tab.Pane>
                {/* Connect key encoder  */}
                {kioskSession?.[0]?.key_encoder_config?.is_active && (
                  <Tab.Pane eventKey="keyEncoder">
                    <div className="setting-background">
                      <div className="row justify-content-center">
                        <div className="col-lg-9 col-md-8 text-center">
                          <h5 className="text-primary">Key Encoder</h5>

                          {(!isKEConnect ||
                            timerStates.encoder.timerExpired) && (
                            <button
                              className={`btn btn-success bg-gradient setting-btn mt-3 ${
                                (isKeyELoading ||
                                  timerStates.encoder.connectionOnClick) &&
                                !timerStates.encoder.timerExpired
                                  ? "disabled"
                                  : ""
                              }`}
                              onClick={checkEncoderStatus}
                              disabled={
                                (isKeyELoading ||
                                  timerStates.encoder.connectionOnClick) &&
                                !timerStates.encoder.timerExpired
                              }
                            >
                              {timerStates.encoder.connectionOnClick &&
                              !timerStates.encoder.timerExpired ? (
                                <span
                                  className="spinner-border spinner-border-sm"
                                  role="status"
                                  aria-hidden="true"
                                ></span>
                              ) : (
                                "Send Key Encoder Request"
                              )}
                            </button>
                          )}
                          <div className="my-4 flex items-center text-center justify-center">
                            {isKEConnect ? (
                              <div className="text-green-500 text-lg">
                                ✓ Connection Successful
                              </div>
                            ) : timerStates.encoder.timerExpired ? (
                              <div className="text-danger">
                                {timerStates.encoder.errorMessage}
                              </div>
                            ) : (
                              timerStates.encoder.connectionOnClick && (
                                <div className="text-gray-400">
                                  Waiting for connection...{" "}
                                  {timerStates.encoder.showCountdown &&
                                    `(${timerStates.encoder.countdown}s)`}
                                </div>
                              )
                            )}
                          </div>
                          <div className="text-center mt-2">
                            <button
                              className="btn btn-success bg-gradient btn-continue"
                              disabled={!isKEConnect}
                              onClick={() => updateSettings("keyEncoder")}
                            >
                              CONTINUE
                            </button>
                          </div>
                        </div>
                        <div className="col-lg-3 col-md-4">
                          <div className="d-flex flex-column gap-3">
                            <button
                              className={`btn btn-primary setting-btn mx-auto min-w-160 ${
                                timerStates.encoder.connectionOnClick &&
                                !timerStates.encoder.timerExpired
                                  ? "disabled"
                                  : ""
                              }`}
                              onClick={checkReStartEncoderStatus}
                            >
                              {timerStates.encoder.connectionOnClick &&
                              !timerStates.encoder.timerExpired ? (
                                <span
                                  className="spinner-border spinner-border-sm"
                                  role="status"
                                  aria-hidden="true"
                                ></span>
                              ) : (
                                ""
                              )}
                              {/* className="btn btn-primary setting-btn mx-auto
                               btn-continue" onClick={reConnectKeyEncoder}> */}
                              Restart
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Tab.Pane>
                )}
                {/* Connect key dispenser  */}
                {kioskSession?.[0]?.key_dispenser_config?.is_active && (
                  <Tab.Pane eventKey="keyDispenser">
                    <div className="setting-background">
                      <div className="row justify-content-center">
                        <div className="col-lg-9 col-md-8 text-center">
                          <h5 className="text-primary">Key Dispenser</h5>
                          {(!isDeviceStatusChecked ||
                            timerStates.dispenser.timerExpired) && (
                            <button
                              className={`btn btn-success bg-gradient setting-btn mt-3 ${
                                (isKeyDLoading ||
                                  timerStates.dispenser.connectionOnClick) &&
                                !timerStates.dispenser.timerExpired
                                  ? "disabled"
                                  : ""
                              }`}
                              onClick={checkDispenserStatus}
                              disabled={
                                (isKeyDLoading ||
                                  timerStates.dispenser.connectionOnClick) &&
                                !timerStates.dispenser.timerExpired
                              }
                            >
                              {timerStates.dispenser.connectionOnClick &&
                              !timerStates.dispenser.timerExpired ? (
                                <span
                                  className="spinner-border spinner-border-sm"
                                  role="status"
                                  aria-hidden="true"
                                ></span>
                              ) : (
                                "Send Key Dispenser Request"
                              )}
                            </button>
                          )}

                          <div className="my-4 flex items-center text-center justify-center">
                            {isDeviceStatusChecked ? (
                              <div className="text-green-500 text-lg">
                                ✓ Connection Successful
                              </div>
                            ) : timerStates.dispenser.timerExpired ? (
                              <div className="text-danger">
                                {timerStates.dispenser.errorMessage}
                              </div>
                            ) : (
                              timerStates.dispenser.connectionOnClick && (
                                <div className="text-gray-400">
                                  Waiting for connection...{" "}
                                  {timerStates.dispenser.showCountdown &&
                                    `(${timerStates.dispenser.countdown}s)`}
                                </div>
                              )
                            )}
                          </div>
                          <div className="text-center mt-2">
                            <button
                              className="btn btn-success bg-gradient btn-continue"
                              disabled={!isDeviceStatusChecked}
                              onClick={() => updateSettings("keyDispenser")}
                            >
                              CONTINUE
                            </button>
                          </div>
                        </div>
                        <div className="col-lg-3 col-md-4">
                          <div className="d-flex flex-column gap-3">
                            <button
                              className={`btn btn-primary setting-btn mx-auto min-w-160 ${
                                (isKeyDLoading ||
                                  timerStates.dispenser.connectionOnClick) &&
                                !timerStates.dispenser.timerExpired
                                  ? "disabled"
                                  : ""
                              }`}
                              onClick={checkReStartDispenserStatus}
                            >
                              {(isKeyDLoading ||
                                timerStates.dispenser.connectionOnClick) &&
                              !timerStates.dispenser.timerExpired ? (
                                <span
                                  className="spinner-border spinner-border-sm"
                                  role="status"
                                  aria-hidden="true"
                                ></span>
                              ) : (
                                ""
                              )}
                              {/* className="btn btn-primary setting-btn mx-auto
                              btn-continue" // onClick={reConnectKeyDispenser}> */}
                              Restart
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Tab.Pane>
                )}
              </Tab.Content>
            </Col>
          </Row>
        </Tab.Container>
      </div>
    </>
  );
};

export default Setting;
