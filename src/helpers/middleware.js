// Create a notification helper using React-Bootstrap Toast
import { Toast, ToastContainer } from "react-bootstrap";
import React, { useState, useEffect } from "react";
import Compressor from "compressorjs";

// Global notification state
let notificationApi = {
  showToast: null,
};

// Notification component to be used in your app
export const NotificationContainer = () => {
  const [toasts, setToasts] = useState([]);

  // Register the function to show toasts
  useEffect(() => {
    notificationApi.showToast = (message, type, duration = 2000) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type, duration }]);

      // Auto-dismiss after duration
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, duration);
    };

    return () => {
      notificationApi.showToast = null;
    };
  }, []);

  // Get appropriate variant based on type
  const getVariant = (type) => {
    switch (type) {
      case "success":
        return "success";
      case "error":
        return "danger";
      case "info":
        return "info";
      case "warn":
        return "warning";
      default:
        return "light";
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "info":
        return "ℹ️";
      case "warn":
      case "warning":
        return "⚠️";
      default:
        return "📌";
    }
  };

  return (
    <ToastContainer position="top-center" className="p-3">
      {toasts.map((toast) => (
        <Toast key={toast.id} bg={getVariant(toast.type)}>
          <Toast.Body
            className={
              toast.type === "success" || toast.type === "error"
                ? "text-white"
                : ""
            }
          >
            {getIcon(toast.type)} {toast.message}
          </Toast.Body>
        </Toast>
      ))}
    </ToastContainer>
  );
};

// Function to be exported and used throughout the app
export const notification = (message, type, duration = 2000) => {
  if (notificationApi.showToast) {
    notificationApi.showToast(message, type, duration);
  } else {
    // console.warn("Notification component not mounted");
  }
};

export  const compressImage = async(file) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/heic",
    "image/webp",
    "image/svg",
  ];

  if (!allowedTypes.includes(file.type)) {
    // notification(`Invalid file type for file: ${file.name}`, "warn");
    return null;
  }

  const compressImageFunc = (file) => {
    return new Promise((resolve, reject) => {
      new Compressor(file, {
        quality: 0.4,
        success: (result) => {
          const blobToFile = (blob, fileName) => {
            return new File([blob], fileName, { type: blob.type });
          };
          const compressedFile = blobToFile(result, file.name);
          resolve(compressedFile);
        },
        error: (err) => {
          reject(err);
        },
      });
    });
  };

  try {
    const compressedImage = await compressImageFunc(file);
    if (!compressedImage) {
      throw new Error("Image compression failed");
    }
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.readAsDataURL(compressedImage);
      reader.onload = (event) => {
        resolve({ compressedImage, dataUrl: event.target.result });
      };
      reader.onerror = (error) => {
        reject(error);
      };
    });
  } catch (error) {
    throw error;
  }
}