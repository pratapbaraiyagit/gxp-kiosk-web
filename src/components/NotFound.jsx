import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [showClickMessage, setShowClickMessage] = useState(true);
  const [score, setScore] = useState(0);

  // Hide the click message after user's first interaction
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowClickMessage(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Random movement for the hotel key animation - much faster and more erratic movement
  useEffect(() => {
    const interval = setInterval(() => {
      setPosition({
        x: Math.max(5, Math.min(95, position.x + (Math.random() - 0.5) * 35)),
        y: Math.max(10, Math.min(90, position.y + (Math.random() - 0.5) * 35)),
      });
    }, 600);

    return () => clearInterval(interval);
  }, [position]);

  // Handle clicking on the bouncing 404
  const handleCatch = () => {
    setScore(score + 1);
    setShowClickMessage(false);
    setPosition({
      x: Math.max(10, Math.min(90, Math.random() * 80)),
      y: Math.max(15, Math.min(60, Math.random() * 50)),
    });
  };

  return (
    <div className="my-auto">
      <main className="d-flex flex-column align-items-center text-center w-100 py-4 flex-grow-1">
        <h1 className="display-3 fw-bold text-white mb-3">
          404 Page Not Found!
        </h1>

        <p className="fs-4 text-white-50 mb-4">
          Looks like this page has wandered off the map. Let us guide you back
          to your perfect destination!
        </p>

        <div className="text-white bg-info bg-opacity-50 px-3 py-2 rounded-pill fs-4 mb-3">
          Score: {score}
        </div>

        {/* Interactive Key Catching Game */}
        <div
          className="position-relative w-100 mb-5 p-2 border border-dashed border-opacity-50 rounded overflow-hidden"
          style={{ height: "320px" }}
        >
          {showClickMessage && (
            <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50 text-white fw-medium z-2">
              Try to catch the floating key!
            </div>
          )}

          <div
            className="position-absolute cursor-pointer z-1"
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              transform: "translate(-50%, -50%)",
            }}
            onClick={handleCatch}
          >
            <div className="p-2 bg-blue rounded-circle shadow">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
              </svg>
            </div>
          </div>
        </div>
        {/* Single Back to Home Button */}
        <button
          className="d-flex align-items-center gap-2 common-btn blue-btn"
          onClick={() => navigate("/home")}
        >
          Back to Home
        </button>

        {score > 5 && (
          <div data-bs-theme="dark" className="mt-5 alert alert-info">
            Great job catching the keys! Your room upgrade code: KEYMASTER
          </div>
        )}
      </main>
    </div>
  );
};

export default NotFound;
