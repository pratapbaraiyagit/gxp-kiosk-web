import React, { useCallback, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCompress,
  faExpand,
  faPhone,
  faTimes,
  faVideo,
} from "@fortawesome/free-solid-svg-icons";
import { getSessionItem } from "../hooks/session";
import { useDispatch, useSelector } from "react-redux";
import { callMQTTAction } from "../redux/reducers/MQTT/callMQTT";

const SmallVideoCall = ({ connectVideoCall, liveNow }) => {
  const dispatch = useDispatch();
  const [callingAgent, setCallingAgent] = useState(false);
  const [videoOn, setVideoOn] = useState(false);
  const [meetConnection, setMeetConnection] = useState(null);
  const [videoSetting, setVideoSetting] = useState({
    mode: "monitor",
    is_calling: false,
    view: "min",
  });
  const [permissionStatus, setPermissionStatus] = useState({
    camera: null,
    microphone: null,
  });
  const [permissionError, setPermissionError] = useState(null);
  const [availableDevices, setAvailableDevices] = useState({
    audioInput: [],
    audioOutput: [],
    videoInput: [],
  });
  const [devicesInitialized, setDevicesInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // States for drag functionality
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 180 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [thumbnailRect, setThumbnailRect] = useState(null);
  const dragRef = useRef(null);

  const { activeKioskDeviceList } = useSelector(
    ({ kioskDevice }) => kioskDevice
  );
  const deviceIds =
    activeKioskDeviceList?.map((device) => device.id).filter(Boolean) || [];

  const kioskData = getSessionItem("KioskConfig");
  const kioskSession = kioskData
    ? JSON.parse(decodeURIComponent(escape(atob(kioskData))))
    : null;

  const newKioskConfig = kioskSession?.[0];

  const meetContainerRef = useRef(null);
  const watchedMessages = useSelector((state) => state.messages);
  const user = useSelector((state) => state.user);

  // Improved device enumeration with better error handling
  const enumerateDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();

      const audioInputs = devices.filter(
        (device) => device.kind === "audioinput"
      );
      const audioOutputs = devices.filter(
        (device) => device.kind === "audiooutput"
      );
      const videoInputs = devices.filter(
        (device) => device.kind === "videoinput"
      );

      setAvailableDevices({
        audioInput: audioInputs,
        audioOutput: audioOutputs,
        videoInput: videoInputs,
      });

      setDevicesInitialized(true);

      // Log device info for debugging
      // console.log("Available devices:", {
      //   audioInputs: audioInputs.length,
      //   audioOutputs: audioOutputs.length,
      //   videoInputs: videoInputs.length,
      // });

      return { audioInputs, audioOutputs, videoInputs };
    } catch (error) {
      setDevicesInitialized(false);
      return null;
    }
  };

  // Improved permission checking that doesn't create unnecessary streams
  const checkPermissions = async () => {
    try {
      // Try the permissions API first if available
      if (navigator.permissions) {
        try {
          const results = await Promise.all([
            navigator.permissions.query({ name: "camera" }),
            navigator.permissions.query({ name: "microphone" }),
          ]);

          const cameraPermission = results[0];
          const micPermission = results[1];

          setPermissionStatus({
            camera: cameraPermission.state,
            microphone: micPermission.state,
          });

          return {
            camera: cameraPermission.state === "granted",
            microphone: micPermission.state === "granted",
          };
        } catch (err) {
          // console.log("Permissions API not fully supported");
        }
      }

      // If permissions API is not available, check current status by enumerating devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCamera = devices.some(
        (device) => device.kind === "videoinput" && device.label
      );
      const hasMicrophone = devices.some(
        (device) => device.kind === "audioinput" && device.label
      );

      if (hasCamera && hasMicrophone) {
        setPermissionStatus({
          camera: "granted",
          microphone: "granted",
        });
        return { camera: true, microphone: true };
      }

      // Permissions not yet granted
      return { camera: false, microphone: false };
    } catch (error) {
      return { camera: false, microphone: false };
    }
  };

  // Request permissions with better error handling
  const requestPermissions = async () => {
    setPermissionError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // Important: Stop the stream immediately after getting permissions
      stream.getTracks().forEach((track) => track.stop());

      // Update permission status
      setPermissionStatus({
        camera: "granted",
        microphone: "granted",
      });

      // Re-enumerate devices now that we have permissions
      await enumerateDevices();

      return true;
    } catch (error) {
      let errorMessage = "Unable to access camera and microphone. ";

      switch (error.name) {
        case "NotAllowedError":
        case "PermissionDeniedError":
          errorMessage +=
            "Please allow camera and microphone access in your browser settings.";
          setPermissionStatus({
            camera: "denied",
            microphone: "denied",
          });
          break;
        case "NotFoundError":
          errorMessage +=
            "No camera or microphone found. Please connect a device.";
          break;
        case "NotReadableError":
          errorMessage +=
            "Camera or microphone is already in use by another application.";
          break;
        case "AbortError":
          errorMessage += "The request was aborted. Please try again.";
          break;
        default:
          errorMessage +=
            error.message || "Please check your device settings and try again.";
      }

      setPermissionError(errorMessage);
      return false;
    }
  };

  // Validate stored device IDs
  const getSelectedDevices = useCallback(() => {
    if (!devicesInitialized || !availableDevices) {
      return {
        audioInput: null,
        audioOutput: null,
        videoInput: null,
      };
    }

    const { audioInput, audioOutput, videoInput } = availableDevices;

    const storedAudioInput = getSessionItem("mic");
    const storedAudioOutput = getSessionItem("speaker");
    const storedVideoInput = getSessionItem("camera_1");

    // Find valid devices or use defaults
    const selectedDevices = {
      audioInput:
        audioInput.find((device) => device.deviceId === storedAudioInput)
          ?.deviceId || audioInput[0]?.deviceId,
      audioOutput:
        audioOutput.find((device) => device.deviceId === storedAudioOutput)
          ?.deviceId || audioOutput[0]?.deviceId,
      videoInput:
        videoInput.find((device) => device.deviceId === storedVideoInput)
          ?.deviceId || videoInput[0]?.deviceId,
    };

    // console.log("Selected devices:", selectedDevices);
    return selectedDevices;
  }, [availableDevices, devicesInitialized]);

  // Function to capture thumbnail position before going fullscreen
  const captureThumbnailPosition = useCallback(() => {
    if (dragRef.current) {
      const rect = dragRef.current.getBoundingClientRect();
      setThumbnailRect({
        x: rect.left + rect.width / 2, // Center X
        y: rect.top + rect.height / 2, // Center Y
        width: rect.width,
        height: rect.height,
      });
    }
  }, []);

  // Initialize devices and permissions on mount
  useEffect(() => {
    const initializeDevices = async () => {
      if (isInitializing) return;
      setIsInitializing(true);

      try {
        // First enumerate devices
        await enumerateDevices();

        // Then check current permission status
        const permissions = await checkPermissions();

        // Only show error if permissions are explicitly denied
        if (!permissions.camera || !permissions.microphone) {
          if (
            permissionStatus.camera === "denied" ||
            permissionStatus.microphone === "denied"
          ) {
            setPermissionError(
              "Camera or microphone access is required. Please grant permissions."
            );
          }
        }
      } catch (error) {
        // console.error("Error initializing devices:", error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeDevices();

    // Listen for device changes
    const handleDeviceChange = async () => {
      // console.log("Device change detected");
      await enumerateDevices();
    };

    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener(
        "devicechange",
        handleDeviceChange
      );
    };
  }, []);

  // Improved connectMeet function
  const connectMeet = useCallback(async () => {
    if (!window.JitsiMeetExternalAPI) {
      // console.error("JitsiMeetExternalAPI is not available.");
      setCallingAgent(false);
      return;
    }

    if (!meetContainerRef.current) {
      // console.error("Meet container is not available.");
      setCallingAgent(false);
      return;
    }

    // Check permissions first
    const permissions = await checkPermissions();

    if (!permissions.camera || !permissions.microphone) {
      const permissionsGranted = await requestPermissions();

      if (!permissionsGranted) {
        // console.error("Permissions not granted");
        setCallingAgent(false);
        return;
      }
    }

    // Get selected devices
    const selectedDevices = getSelectedDevices();

    if (!selectedDevices.videoInput || !selectedDevices.audioInput) {
      // console.error("No camera or microphone available");
      setPermissionError(
        "No camera or microphone found. Please connect a device and try again."
      );
      setCallingAgent(false);
      return;
    }

    // Configure Jitsi with improved settings
    const options = {
      roomName: `${newKioskConfig?.device_meet_token}/${newKioskConfig?.device_meet_id}`,
      parentNode: meetContainerRef.current,
      configOverwrite: {
        // Start with video unmuted
        startWithAudioMuted: false,
        startWithVideoMuted: false,

        // Enable prejoin for better device setup
        prejoinPageEnabled: false,

        // Specify exact devices
        defaultDevices: {
          audioInput: selectedDevices.audioInput,
          audioOutput: selectedDevices.audioOutput,
          videoInput: selectedDevices.videoInput,
        },

        // Minimal UI
        toolbarButtons: [],

        // Video constraints
        resolution: 360,
        constraints: {
          video: {
            height: { ideal: 360, max: 720 },
            width: { ideal: 640, max: 1280 },
            frameRate: { max: 30 },
          },
        },

        // Disable unnecessary features
        fileRecordingsEnabled: false,
        liveStreamingEnabled: false,
        disableModeratorIndicator: true,
        disableReactions: true,
        disablePolls: true,
        hideConferenceSubject: true,
        hideConferenceTimer: true,
        hideParticipantsStats: true,
        enableLayerSuspension: true,

        // Additional cleanup options
        disableThirdPartyRequests: true,
        disableLocalVideoFlip: true,
        disableBeforeUnloadHandlers: true,
        disableJoinLeaveSounds: true,
        enableNoAudioDetection: false,
        enableNoisyMicDetection: false,
        disableProfile: true,
        hideDisplayName: true,
        disableDeepLinking: true,
        disableShortcuts: true,
        disableRtx: false,
        analytics: {
          disabled: true,
        },
      },

      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        SHOW_BRAND_WATERMARK: false,
        TOOLBAR_ALWAYS_VISIBLE: false,
        HIDE_INVITE_MORE_HEADER: true,
        MOBILE_APP_PROMO: false,
        SHOW_CHROME_EXTENSION_BANNER: false,

        // Additional interface cleanup
        DISABLE_VIDEO_BACKGROUND: true,
        DISABLE_FOCUS_INDICATOR: true,
        DISABLE_DOMINANT_SPEAKER_INDICATOR: true,
        FILM_STRIP_MAX_HEIGHT: 0,
        INITIAL_TOOLBAR_TIMEOUT: 0,
        TOOLBAR_TIMEOUT: 0,
        SETTINGS_SECTIONS: [],
        HIDE_DEEP_LINKING_LOGO: true,
        PROVIDER_NAME: "",
        LANG_DETECTION: false,
        CONNECTION_INDICATOR_DISABLED: true,
      },

      // Ensure we join unmuted
      userInfo: {
        displayName: "User",
      },
    };

    try {
      const connection = new window.JitsiMeetExternalAPI("8x8.vc", options);
      setMeetConnection(connection);

      // Add event listeners
      connection.addListener("videoConferenceJoined", async () => {
        // console.log("Conference joined");

        // Set devices after joining
        try {
          if (selectedDevices.audioInput) {
            await connection.setAudioInputDevice(selectedDevices.audioInput);
          }
          if (selectedDevices.audioOutput) {
            await connection.setAudioOutputDevice(selectedDevices.audioOutput);
          }
          if (selectedDevices.videoInput) {
            await connection.setVideoInputDevice(selectedDevices.videoInput);
          }

          // Ensure video is unmuted
          connection.executeCommand("muteVideo", false);
        } catch (error) {
          // console.error("Error setting devices:", error);
        }

        setVideoOn(true);
        setCallingAgent(false);
      });

      connection.addListener("videoMuteStatusChanged", (status) => {
        // console.log("Video mute status:", status);
        if (status.muted && videoOn) {
          // Force unmute if we expect video to be on
          connection.executeCommand("muteVideo", false);
        }
      });

      connection.addListener("cameraError", (error) => {
        setPermissionError(
          "Camera error occurred. Please check your camera and try again."
        );
      });

      connection.addListener("micError", (error) => {
        // console.error("Microphone error:", error);
      });

      setTimeout(() => {
        setCallingAgent(false);
        setVideoSetting((prevState) => ({
          ...prevState,
          mode: "monitor",
          view: "min",
        }));
      }, 1000);
    } catch (error) {
      setCallingAgent(false);
      setPermissionError("Failed to connect to video call. Please try again.");
    }
  }, [newKioskConfig, getSelectedDevices]);

  // Rest of your component code (drag handlers, etc.) remains the same...
  const handleMouseDown = useCallback(
    (e) => {
      if (videoSetting.mode === "live" && videoSetting.view === "max") return;

      const element = dragRef.current;
      if (!element) return;

      const viewportWidth = window.innerWidth;
      const rect = element.getBoundingClientRect();

      const rightEdgeOfViewport = viewportWidth;
      const distanceFromRightEdge = rightEdgeOfViewport - e.clientX;

      setDragOffset({
        x: distanceFromRightEdge - position.x,
        y: e.clientY - rect.top,
      });

      setIsDragging(true);
      e.preventDefault();
    },
    [videoSetting, position]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging) return;

      e.preventDefault();

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const element = dragRef.current;
      if (!element) return;

      const elementWidth = element.offsetWidth;
      const elementHeight = element.offsetHeight;

      const rightEdgeOfViewport = viewportWidth;
      const distanceFromRightEdge = rightEdgeOfViewport - e.clientX;

      const newRightPos = distanceFromRightEdge - dragOffset.x;
      const newTopPos = e.clientY - dragOffset.y;

      const constrainedRight = Math.max(
        0,
        Math.min(newRightPos, viewportWidth - elementWidth)
      );
      const constrainedTop = Math.max(
        0,
        Math.min(newTopPos, viewportHeight - elementHeight)
      );

      setPosition({
        x: constrainedRight,
        y: constrainedTop,
      });
    },
    [isDragging, dragOffset]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback(
    (e) => {
      if (videoSetting.mode === "live" && videoSetting.view === "max") return;

      const element = dragRef.current;
      if (!element) return;

      const touch = e.touches[0];

      const viewportWidth = window.innerWidth;
      const rect = element.getBoundingClientRect();

      const rightEdgeOfViewport = viewportWidth;
      const distanceFromRightEdge = rightEdgeOfViewport - touch.clientX;

      setDragOffset({
        x: distanceFromRightEdge - position.x,
        y: touch.clientY - rect.top,
      });

      setIsDragging(true);
      e.preventDefault();
    },
    [videoSetting, position]
  );

  const handleTouchMove = useCallback(
    (e) => {
      if (!isDragging) return;

      const touch = e.touches[0];

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const element = dragRef.current;
      if (!element) return;

      const elementWidth = element.offsetWidth;
      const elementHeight = element.offsetHeight;

      const rightEdgeOfViewport = viewportWidth;
      const distanceFromRightEdge = rightEdgeOfViewport - touch.clientX;

      const newRightPos = distanceFromRightEdge - dragOffset.x;
      const newTopPos = touch.clientY - dragOffset.y;

      const constrainedRight = Math.max(
        0,
        Math.min(newRightPos, viewportWidth - elementWidth)
      );
      const constrainedTop = Math.max(
        0,
        Math.min(newTopPos, viewportHeight - elementHeight)
      );

      setPosition({
        x: constrainedRight,
        y: constrainedTop,
      });
    },
    [isDragging, dragOffset]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (watchedMessages) {
      const { topic, message } = watchedMessages;
      messageBasedActionTrigger(topic, message);
    }
  }, [watchedMessages]);

  const messageBasedActionTrigger = useCallback(
    (topic, msgObj) => {
      if (
        topic === newKioskConfig?.mqtt_config?.subscribe_topics?.agent_console
      ) {
        if (msgObj.Cmd === "videoMode" && msgObj.Data?.from === "agent") {
          setVideoSetting((prevState) => ({
            ...prevState,
            mode: msgObj.Data.mode ? "live" : "monitor",
          }));
          if (msgObj.Data.mode) {
            callFunc();
          }
          localStorage.setItem("selfVideoMode", msgObj.Data.mode);
        }
      }
    },
    [newKioskConfig]
  );

  const callFunc = useCallback(() => {
    setCallingAgent(true);
    if (meetConnection !== null) {
      setCallingAgent(false);
      setVideoSetting((prevState) => ({
        ...prevState,
        mode: "live",
        view: "max",
      }));
    } else {
      connectMeet();
    }
  }, [meetConnection, connectMeet]);

  // Modified initial connection to wait for permissions
  useEffect(() => {
    let mounted = true;

    const initializeConnection = async () => {
      // Wait for devices to be initialized
      if (!devicesInitialized) return;

      if (mounted) {
        await connectMeet();
      }
    };

    if (devicesInitialized) {
      initializeConnection();
    }

    return () => {
      mounted = false;
    };
  }, [devicesInitialized]);

  useEffect(() => {
    const checkbox = document.getElementById("video-toggle");
    if (checkbox) {
      if (liveNow === "full") {
        checkbox.checked = true;
        handleVideoClick();
      } else if (liveNow === "monitor") {
        checkbox.checked = false;
        handleMinimizeVideo();
      } else if (liveNow === "live") {
        handleMinVideoClick();
      }
    }
  }, [liveNow]);

  const handleVideoClick = useCallback(async () => {
    if (!meetConnection) {
      const permissions = await checkPermissions();

      if (!permissions.camera || !permissions.microphone) {
        const permissionsGranted = await requestPermissions();

        if (!permissionsGranted) {
          return;
        }
      }

      await connectMeet();
    } else {
      // If already connected, just show video
      meetConnection.executeCommand("muteVideo", false);
      setVideoSetting((prevState) => ({
        ...prevState,
        mode: "live",
        view: "max",
      }));
    }

    setVideoOn(true);

    const callMQTT = {
      cmd: "live",
      device_uuid_list: deviceIds,
      response: {
        status: true,
        message: "",
        data: {},
      },
    };
    dispatch(callMQTTAction(callMQTT));
  }, [connectMeet, deviceIds, meetConnection, dispatch]);

  
  const handleMinVideoClick = useCallback(() => {
    // Set to small rounded display in fullscreen
    setVideoSetting((prevState) => ({
      ...prevState,
      mode: "live",
      view: "small-round", // New view state for small rounded display
    }));

    // Keep video on for small rounded view
    setVideoOn(true);

    // Send live MQTT command
    const callMQTT = {
      cmd: "live",
      device_uuid_list: deviceIds,
      response: {
        status: true,
        message: "",
        data: {},
      },
    };
    dispatch(callMQTTAction(callMQTT));

    // Enter fullscreen with small rounded display
    // if (!document.fullscreenElement) {
    //   if (document.documentElement.requestFullscreen) {
    //     document.documentElement.requestFullscreen();
    //   }
    // }

    // Ensure video stays unmuted for small view
    if (meetConnection) {
      meetConnection.executeCommand("muteVideo", false);
    }
  }, [deviceIds, dispatch, meetConnection]);

  // Add new function to expand from small round to full screen
  const handleExpandToFullScreen = useCallback(() => {
    setVideoSetting((prevState) => ({
      ...prevState,
      mode: "live",
      view: "max",
    }));
  }, []);
  
  const handleEndCall = useCallback(() => {
    setVideoOn(false);
    const monitorMQTT = {
      cmd: "monitor",
      device_uuid_list: deviceIds,
      response: {
        status: true,
        message: "",
        data: {},
      },
    };
    dispatch(callMQTTAction(monitorMQTT));
    setVideoSetting((prevState) => ({
      ...prevState,
      mode: "monitor",
      view: "min",
    }));
    if (meetConnection) {
      meetConnection.executeCommand("hangup");

      setTimeout(() => {
        if (meetConnection) {
          meetConnection.dispose();
          setMeetConnection(null);
        }
      }, 500);
    }
  }, [meetConnection, deviceIds, dispatch]);

  const handleMinimizeVideo = useCallback(() => {
    setVideoOn(false);
    const monitorMQTT = {
      cmd: "monitor",
      device_uuid_list: deviceIds,
      response: {
        status: true,
        message: "",
        data: {},
      },
    };
    dispatch(callMQTTAction(monitorMQTT));
    setVideoSetting((prevState) => ({
      ...prevState,
      mode: "monitor",
      view: "min",
    }));
  }, [deviceIds, dispatch]);

  useEffect(() => {
    return () => {
      if (meetConnection) {
        meetConnection.dispose();
      }
    };
  }, [meetConnection]);

  const handleScreenMode = useCallback(() => {
    setVideoSetting((prevState) => ({
      ...prevState,
      mode: "live",
      view: "max",
    }));
    // if (document.documentElement.requestFullscreen) {
    //   document.documentElement.requestFullscreen();
    // }
  }, []);

  const handleExitFullscreen = useCallback(() => {
    // Update state first
    setVideoSetting((prevState) => ({
      ...prevState,
      mode: "monitor",
      view: "min",
    }));

    // Check if document is actually in fullscreen
    if (document.fullscreenElement) {
      document
        .exitFullscreen()
        .then(() => {
          // console.log("Successfully exited fullscreen");
        })
        .catch((err) => {
          // console.error("Error exiting fullscreen:", err);
        });
    }
  }, []);

  // Get dynamic transform origin based on current position
  const getTransformOrigin = () => {
    if (!dragRef.current) return "center center";

    const rect = dragRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const originX = (centerX / window.innerWidth) * 100;
    const originY = (centerY / window.innerHeight) * 100;

    return `${Math.max(0, Math.min(100, originX))}% ${Math.max(
      0,
      Math.min(100, originY)
    )}%`;
  };

  return (
    <div>
      {/* Show permission error only when needed */}
      {permissionError &&
        (permissionStatus.camera === "denied" ||
          permissionStatus.microphone === "denied") && (
          <div
            className="permission-error"
            style={{
              position: "fixed",
              top: "10px",
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: "#f44336",
              color: "white",
              padding: "10px 20px",
              borderRadius: "4px",
              zIndex: 9999,
              maxWidth: "400px",
              textAlign: "center",
            }}
          >
            <p style={{ margin: 0 }}>{permissionError}</p>
            <button
              onClick={() => {
                setPermissionError(null);
                requestPermissions();
              }}
              style={{
                marginTop: "10px",
                padding: "5px 15px",
                backgroundColor: "white",
                color: "#f44336",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Grant Permissions
            </button>
          </div>
        )}

      {/* Show loading state during initialization */}
      {(isInitializing || callingAgent) && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            color: "white",
            padding: "20px",
            borderRadius: "8px",
            zIndex: 10000,
          }}
        >
          {isInitializing ? "Initializing camera..." : "Connecting..."}
        </div>
      )}

      <div
        className="custom-video-call"
        ref={dragRef}
        style={{
          right: `${position.x}px`,
          top: `${position.y}px`,
          cursor: isDragging ? "grabbing" : "grab",
          display: "block",
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <nav
          className={
            videoSetting.mode === "live" && videoSetting.view === "max"
              ? "no-drag"
              : ""
          }
        >
          <input
            type="checkbox"
            id="video-toggle"
            checked={videoOn}
            onChange={() => {}}
          />
          <label htmlFor="video-toggle" id="video-menu-toggle">
            <FontAwesomeIcon icon={faVideo} onClick={handleMinVideoClick} />
          </label>
          <ul>
            <label htmlFor="video-toggle" id="video-menu-close">
              <FontAwesomeIcon icon={faPhone} onClick={handleMinimizeVideo} />
            </label>
            <FontAwesomeIcon
              icon={faExpand}
              className="expand-screen"
              onClick={handleScreenMode}
            />
          </ul>
        </nav>
        <div
          ref={meetContainerRef}
          id="meet"
          className={`video-call ${
            videoSetting.mode === "live"
              ? videoSetting.view === "small-round"
                ? "small-round-video"
                : "full-screen-video"
              : "small-screen-video"
          } ${videoOn ? "show" : ""}`}
          style={{
            display: videoOn ? "block" : "none",
            transformOrigin: getTransformOrigin(),
          }}
          onClick={
            videoSetting.view === "small-round"
              ? handleExpandToFullScreen
              : undefined
          }
        >
          {videoSetting.mode === "live" && videoSetting.view === "max" && (
            <div className="fixed-bottom text-white">
              <div className="d-flex align-items-center">
                <FontAwesomeIcon
                  icon={faCompress}
                  onClick={handleExitFullscreen}
                  className="fs-1 exit-full-screen cursor ms-3 mb-3"
                />
                <div className="end-call bg-danger p-3 rounded-circle mx-auto">
                  <FontAwesomeIcon
                    icon={faPhone}
                    onClick={() => {
                      handleExitFullscreen();
                      handleMinimizeVideo();
                    }}
                    className="fs-1 cursor"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmallVideoCall;