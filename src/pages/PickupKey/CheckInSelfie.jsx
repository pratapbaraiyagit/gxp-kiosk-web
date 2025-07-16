import Aos from "aos";
import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { agentUserMQTTAction } from "../../redux/reducers/MQTT/agentUserMQTT";
import { getSessionItem, removeSessionItem } from "../../hooks/session";
import { t } from "i18next";
import { UploadImageFile } from "../../redux/reducers/ImageUploadFile/imageUploadFile";
import { playSafeAudio } from "../../utils/commonFun";

const CheckInSelfie = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [stream, setStream] = useState(null);
  const [isCountdownActive, setIsCountdownActive] = useState(false);
  const [countdown, setCountdown] = useState(8);

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

  // Countdown effect
  useEffect(() => {
    let timer;
    if (isCountdownActive && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (isCountdownActive && countdown === 0) {
      // Auto capture when countdown reaches 0
      const capturedImageData = captureImage();
      if (capturedImageData) {
        imageUpload(capturedImageData);
      }
      setIsCountdownActive(false);
      setCountdown(8); // Reset countdown
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isCountdownActive, countdown]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
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

    const context = canvas.getContext("2d");

    // Fix mirroring by flipping the canvas horizontally
    context.scale(-1, 1);
    context.translate(-canvas.width, 0);

    // Draw the current video frame to the canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Reset transformation for cropping
    context.setTransform(1, 0, 0, 1, 0, 0);

    // Create circular crop
    const croppedImageData = createCircularCrop(canvas, context);
    setCapturedImage(croppedImageData);
    return croppedImageData;
  };

  const createCircularCrop = (sourceCanvas, sourceContext) => {
    const previewCanvas = previewCanvasRef.current;
    const previewContext = previewCanvas.getContext("2d");

    // Define circular crop dimensions
    const cropSize = Math.min(sourceCanvas.width, sourceCanvas.height);
    const centerX = sourceCanvas.width / 2;
    const centerY = sourceCanvas.height / 2;
    const radius = cropSize / 2;

    // Set preview canvas to square dimensions
    previewCanvas.width = cropSize;
    previewCanvas.height = cropSize;

    // Clear the preview canvas with transparent background
    previewContext.clearRect(0, 0, cropSize, cropSize);

    // Create circular clipping path
    previewContext.beginPath();
    previewContext.arc(cropSize / 2, cropSize / 2, radius, 0, 2 * Math.PI);
    previewContext.clip();

    // Draw the cropped circular image
    previewContext.drawImage(
      sourceCanvas,
      centerX - radius, // source x
      centerY - radius, // source y
      cropSize, // source width
      cropSize, // source height
      0, // destination x
      0, // destination y
      cropSize, // destination width
      cropSize // destination height
    );

    // Convert to base64 with PNG to preserve transparency (circular shape)
    return previewCanvas.toDataURL("image/png", 1.0);
  };

  useEffect(() => {
    setIsCountdownActive(true);
    setCountdown(8);
  }, []);

  const handleSubmitWithImage = (imageData) => {
    // dispatch(
    //   agentUserMQTTAction({
    //     cmd: "capture_selfie",
    //     device_uuid_list: deviceIds,
    //     response: {
    //       status: true,
    //       code: seq_code,
    //       message: "Kiosk Agent Contact Information Status applied.",
    //       data: {
    //         status_mode: "capture_selfie",
    //         selfie_image: imageData,
    //       },
    //     },
    //   })
    // ).then(() => {
    //   removeSessionItem("seqCode");
    // });
  };

  const imageUpload = async (base64Image) => {
    // Convert Base64 to Blob
    const res = await fetch(base64Image);
    const blob = await res.blob();

    // Convert Blob to File - use PNG to preserve transparency
    const file = new File([blob], "guest.png", { type: "image/png" });

    // Prepare data
    const data = {
      media_type: "guest_profile_picture",
      file_type: "png", // Changed to PNG to preserve circular shape
      file, // <- real File object (now truly circular image with transparent background)
      fieldKeyName: "image",
    };

    // Dispatch
    dispatch(UploadImageFile(data));

    // Redirect
    navigate("/check-in/questions");
  };

  const cancelCountdown = () => {
    setIsCountdownActive(false);
    setCountdown(8);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setIsCountdownActive(true);
    setCountdown(8);
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
                      transform: "scaleX(-1)", // Mirror the video preview
                    }}
                  />
                  {/* Overlay guide circle */}
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      width: "80%",
                      height: "80%",
                      border: "3px solid rgba(17, 201, 234, 0.6)",
                      borderRadius: "50%",
                      pointerEvents: "none",
                    }}
                  />
                </div>
                <canvas ref={canvasRef} style={{ display: "none" }} />
                <canvas ref={previewCanvasRef} style={{ display: "none" }} />
                <h3 className="text-light mt-5">
                  {isCountdownActive
                    ? "Get ready! Capturing in..."
                    : "Position your face in the center"}
                </h3>

                {/* Cancel button during countdown */}
                {/* {isCountdownActive && (
                  <button
                    onClick={cancelCountdown}
                    className="btn btn-outline-light mt-3"
                  >
                    Cancel
                  </button>
                )} */}
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
                <p className="text-light mb-3 opacity-50 m-0">
                  Make sure your face is clearly visible, with no blur or glare.
                </p>

                {/* Action buttons */}
                <div className="mt-4">
                  <button
                    onClick={retakePhoto}
                    className="btn btn-outline-light me-3"
                  >
                    Retake
                  </button>
                  <button
                    onClick={() => imageUpload(capturedImage)}
                    className="btn btn-primary"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Countdown overlay */}
            {isCountdownActive && countdown > 0 && (
              <div
                className="countdown-overlay mt-5"
                style={{
                  position: "absolute",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  fontSize: "3rem",
                  fontWeight: "bold",
                  textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
                  zIndex: 10,
                  color: "#11c9ea",
                  background: "rgba(0,0,0,0.5)",
                  borderRadius: "50%",
                  width: "80px",
                  height: "80px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {countdown}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .camera-container {
          position: relative;
        }

        .circular-camera-frame,
        .circular-image-frame {
          width: 600px;
          height: 600px;
          margin: 0 auto;
          position: relative;
          overflow: hidden;
          border-radius: 50%;
          border: 4px solid #11c9ea;
          box-shadow: 0 0 20px rgba(17, 201, 234, 0.3);
        }

        @media (max-width: 768px) {
          .circular-camera-frame,
          .circular-image-frame {
            width: 250px;
            height: 250px;
          }
        }

        .countdown-overlay {
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0% {
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1);
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
          }
        }
      `}</style>
    </>
  );
};

export default CheckInSelfie;
