import Aos from "aos";
import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { agentUserMQTTAction } from "../../redux/reducers/MQTT/agentUserMQTT";
import { getSessionItem, removeSessionItem } from "../../hooks/session";
import { playSafeAudio } from "../../utils/commonFun";

const Selfie = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [stream, setStream] = useState(null);

  const { activeKioskDeviceList } = useSelector(
    ({ kioskDevice }) => kioskDevice
  );
  const deviceIds =
    activeKioskDeviceList?.map((device) => device.id).filter(Boolean) || [];
  const seq_code = getSessionItem("seqCode");

  const mqttState = useSelector((state) => state.mqtt);

  const kioskData = getSessionItem("KioskConfig");
  const kioskSession = kioskData
    ? JSON.parse(decodeURIComponent(escape(atob(kioskData))))
    : null;
  const consoleActionTopic =
    kioskSession?.[0]?.mqtt_config?.subscribe_topics?.console_action;

  // Initialize animations
  useEffect(() => {
    Aos.init({
      duration: 1000,
      once: true,
      easing: "ease-in-out",
    });
    playSafeAudio("take_selfie");
    startCamera();

    // Cleanup function to ensure camera is stopped when component unmounts
    return () => {
      if (stream) {
        stopCamera();
      }
    };
    
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      alert(
        "Unable to access camera. Please make sure you've granted camera permissions."
      );
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  const captureImage = () => {
    if (!videoRef.current) return null;

    const canvas = canvasRef.current;
    const video = videoRef.current;

    // Set canvas size to match video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame to the canvas
    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert the canvas to base64 image
    const imageBase64 = canvas.toDataURL("image/jpeg");
    setCapturedImage(imageBase64);
    return imageBase64;
  };

  useEffect(() => {
    if (mqttState?.lastMessage?.message) {
      const data = JSON.parse(mqttState.lastMessage.message);
      if (
        data?.cmd === "capture_selfie" &&
        data?.topic === consoleActionTopic
      ) {
        if (data?.payload?.action === "capture_selfie") {
          const capturedImageData = captureImage();
          if (capturedImageData) {
            handleSubmitWithImage(capturedImageData);
          }
        }
      }
    }
  }, [mqttState?.lastMessage?.message]);

  const handleSubmit = () => {
    if (capturedImage) {
      handleSubmitWithImage(capturedImage);
    } else {
      alert("No image captured. Please take a selfie first.");
    }
  };

  const handleSubmitWithImage = (imageData) => {
    dispatch(
      agentUserMQTTAction({
        cmd: "capture_selfie",
        device_uuid_list: deviceIds,
        response: {
          status: true,
          code: seq_code,
          message: "Kiosk Agent Contact Information Status applied.",
          data: {
            status_mode: "capture_selfie",
            selfie_image: imageData,
          },
        },
      })
    ).then(() => {
      removeSessionItem("seqCode");
      navigate("/home");
    });
  };

  return (
    <>
      <div className="my-auto">
        <h1 className="heading-h1" data-aos="fade-up" data-aos-delay="500">
          Let's take a Selfie!
        </h1>

        <div
          data-aos="fade-up"
          data-aos-delay="1000"
          className="p-3 mt-2 w-100"
        >
          <div className="text-center">
            {!capturedImage ? (
              // Camera View
              <div className="camera-container">
                <div className="circular-camera-frame">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "50%",
                    }}
                  />
                </div>
                <canvas ref={canvasRef} style={{ display: "none" }} />
                <h3 className="text-light mt-5">
                  Position your face in the center
                </h3>
              </div>
            ) : false && (
              // Preview Captured Image
              <div className="captured-image-preview">
                <div className="circular-image-frame">
                  <img
                    src={capturedImage}
                    alt="Captured selfie"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "50%",
                    }}
                  />
                </div>
                <h3 className="text-light mt-3">Check quality</h3>
                <p className="text-light opacity-50 m-0">
                  Make sure your face is clearly visible, with no blur or glare.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Selfie;
