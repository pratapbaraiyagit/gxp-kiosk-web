import React, { useEffect, useRef, useState } from "react";
import Input from "../../components/Input";
import { Col, Row, Spinner } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import {
  authFingerPrintnAction,
  authFingerPrintResetAction,
  loginAction,
} from "../../redux/reducers/UserLoginAndProfile/auth";
import ReactSimpleKeyboard from "../../components/keyboard/react-keyboard";
import { getImageSrc } from "../../utils/bulkImageStorage";
import packageJson from "../../../package.json";
import { getCurrentBrowserFingerPrint } from "@rajesh896/broprint.js";

const Login = () => {
  const dispatch = useDispatch();
  const keyboardRef = useRef(null);

  const [disabled, setDisabled] = useState(true);
  const [error, setError] = useState(false);
  const [numDigits] = useState(8);
  const [confirmCode, setConfirmCode] = useState("");
  const [fpLoaded, setFpLoaded] = useState(false);

  const { loginLoading, getFingerPrintDetails } = useSelector(
    ({ auth }) => auth
  );

  const inputEnterRef = useRef();

  useEffect(() => {
    checkCamera();
    getFingerPrintData();
  }, []);

  useEffect(() => {
    // Add paste event listener
    const handlePaste = (e) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData("text");
      handlePastedCode(pastedData);
    };

    document.addEventListener("paste", handlePaste);

    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [numDigits]);

  const getFingerPrintData = async () => {
    // Implementation remains the same
  };

  const handlePastedCode = (pastedText) => {
    // Clean the pasted text - remove spaces, special characters
    const cleanedCode = pastedText.trim().replace(/[^A-Za-z0-9]/g, "");

    // Check if the pasted code is valid
    if (cleanedCode.length > 0) {
      // Take only the required number of digits
      const codeToUse = cleanedCode.slice(0, numDigits);

      // Update the confirm code
      setConfirmCode(codeToUse);

      // Update disabled state
      setDisabled(codeToUse.length !== numDigits);

      // Clear any previous errors
      if (error) setError(false);

      // If the pasted code is complete, you can optionally auto-submit
      if (codeToUse.length === numDigits) {
        // Optional: Auto-submit the form
        // confirmationInput(codeToUse);
      }
    }
  };

  useEffect(() => {
    if (confirmCode.length === numDigits) {
      confirmationInput(confirmCode);
    }
  }, [confirmCode]);

  useEffect(() => {
    getCurrentBrowserFingerPrint().then((fingerprint) => {
      const loginData = {
        device_data: { id: fingerprint },
      };
      dispatch(authFingerPrintnAction(loginData)).finally(() => {
        setFpLoaded(true); // Mark fingerprint load complete
      });
    });
  }, []);

  const confirmationInput = async (data) => {
    let visitorId = "";
    await getCurrentBrowserFingerPrint().then((fingerprint) => {
      visitorId = fingerprint;
    });
    if (data.length === numDigits) {
      const loginData = {
        platform: "KIOSK-Web",
        login_code: data,
        device_data: { id: visitorId },
      };
      dispatch(loginAction(loginData));
    } else {
      setError(true);
    }
  };

  const handleInputChange = (index, digit, action = "input") => {
    if (!getFingerPrintDetails?.device_name) {
      setConfirmCode((prevCode) => {
        const newCode = prevCode.split("");
        if (action === "backspace") {
          if (newCode[index]) {
            newCode[index] = "";
          } else if (index > 0) {
            newCode[index - 1] = "";
          }
        } else {
          newCode[index] = digit;
        }
        const updatedCode = newCode.join("");
        setDisabled(updatedCode.length !== numDigits);
        if (error) setError(false);
        return updatedCode;
      });
    }
  };

  const onKeyPress = (button) => {
    if (button === "{bksp}") {
      const lastNonEmptyIndex = confirmCode
        .split("")
        .reverse()
        .findIndex((char) => char !== "");
      const indexToDelete =
        lastNonEmptyIndex === -1
          ? confirmCode.length - 1
          : confirmCode.length - 1 - lastNonEmptyIndex;
      handleInputChange(indexToDelete, "", "backspace");
    } else if (/^[A-Za-z0-9]$/.test(button) && confirmCode.length < numDigits) {
      handleInputChange(confirmCode.length, button, "input");
    }
  };

  const checkCamera = () => {
    // Camera check logic remains the same
  };

  // Handle keyboard shortcuts (Ctrl+V or Cmd+V)
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "v") {
      // The paste event will be triggered automatically
      // This is just to ensure the input is focused
      if (inputEnterRef.current) {
        inputEnterRef.current.focus();
      }
    }
  };

  const handlePasteButtonClick = async () => {
    try {
      // Check if the browser supports the Clipboard API
      if (navigator.clipboard && navigator.clipboard.readText) {
        // Request clipboard permission and read text
        const text = await navigator.clipboard.readText();

        if (text && text.trim()) {
          handlePastedCode(text);
          // Optional: Show success feedback
        } else {
          // No text in clipboard
          setError(true);
          alert(
            "No text found in clipboard. Please copy an activation code first."
          );
          setTimeout(() => setError(false), 3000);
        }
      } else {
        // Fallback method for browsers that don't support Clipboard API
        // Create a temporary textarea
        const textarea = document.createElement("textarea");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        textarea.style.top = "0";
        textarea.style.left = "0";
        document.body.appendChild(textarea);

        // Focus and attempt to paste
        textarea.focus();

        // Try to execute paste command
        const successful = document.execCommand("paste");

        if (successful && textarea.value) {
          handlePastedCode(textarea.value);
        } else {
          // If paste didn't work, prompt user to paste manually
          textarea.style.opacity = "1";
          textarea.style.width = "300px";
          textarea.style.height = "100px";
          textarea.placeholder =
            "Please paste your activation code here (Ctrl+V or Cmd+V)";

          // Listen for paste event on the textarea
          textarea.addEventListener("paste", (e) => {
            setTimeout(() => {
              if (textarea.value) {
                handlePastedCode(textarea.value);
                document.body.removeChild(textarea);
              }
            }, 100);
          });

          // Remove textarea after 10 seconds if nothing happens
          setTimeout(() => {
            if (document.body.contains(textarea)) {
              document.body.removeChild(textarea);
            }
          }, 10000);
        }

        // Clean up if immediate paste was successful
        if (successful && textarea.value) {
          document.body.removeChild(textarea);
        }
      }
    } catch (err) {
      // Different error messages based on the error type
      if (err.name === "NotAllowedError") {
        alert(
          "Clipboard access denied. Please allow clipboard permissions or paste manually using Ctrl+V."
        );
      } else {
        alert(
          "Unable to paste. Please try using Ctrl+V (or Cmd+V on Mac) instead."
        );
      }

      setError(true);
      setTimeout(() => setError(false), 3000);
    }
  };

  // New function to handle clearing all input
  const handleClearAllClick = () => {
    setConfirmCode("");
    setDisabled(true);
    if (error) setError(false);

    // Focus back to the input after clearing
    if (inputEnterRef.current) {
      inputEnterRef.current.focus();
    }
  };

  return (
    <>
      <div className="d-flex flex-column min-vh-100" onKeyDown={handleKeyDown}>
        <div className="my-auto menu-box px-4">
          <Row className="justify-content-center">
            <Col xs={12} md={12} lg={10}>
              <div className="text-center rounded bg-body-secondary shadow p-5">
                <h1 className="mb-3">
                  <img
                    src={getImageSrc("logo")}
                    alt="gxp-logo"
                    className="login-logo"
                  />
                </h1>
                <h2 className="mb-3">Kiosk Activation Code</h2>
                {!fpLoaded ? (
                  <div className="text-center py-5">
                    {/* Checking device status... */}
                    <Spinner
                      animation="border"
                      variant="primary"
                      role="status"
                      size="lg"
                    >
                      <span className="visually-hidden">Loading...</span>
                    </Spinner>
                  </div>
                ) : !getFingerPrintDetails?.device_name ? (
                  <>
                    <Input
                      numDigits={numDigits}
                      ref={inputEnterRef}
                      value={confirmCode}
                      onChange={handleInputChange}
                    />

                    <button
                      className="btn main-btn mt-4"
                      onClick={() => confirmationInput(confirmCode)}
                      disabled={disabled || loginLoading}
                    >
                      {loginLoading ? (
                        <span className="d-flex align-items-center">
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          />
                          <span>Activating...</span>
                        </span>
                      ) : (
                        "Activate"
                      )}
                    </button>

                    {/* Paste and Clear buttons */}
                    <div className="mt-3">
                      <p className="text-center text-muted mb-2 small">
                        You can paste the activation code using Ctrl+V (or Cmd+V
                        on Mac)
                      </p>
                      <div className="d-flex justify-content-center gap-2 flex-wrap">
                        <button
                          className="btn btn-outline-primary btn-sm"
                          onClick={handlePasteButtonClick}
                          type="button"
                        >
                          <i className="bi bi-clipboard"></i> Paste Code
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={handleClearAllClick}
                          type="button"
                          disabled={confirmCode.length === 0}
                        >
                          <i className="bi bi-x-circle"></i> Clear All
                        </button>
                      </div>
                    </div>

                    {/* it is for developement mode only */}
                    <div>
                      <p className="text-center mb-0 mt-3">
                        Version {packageJson.version}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center">
                      <h3 className="mb-2 text-primary text-uppercase fw-bold">
                        <i className="bi bi-building me-2"></i>
                        {getFingerPrintDetails?.hotel_name}
                      </h3>
                      <h5 className="mb-0 text-secondary text-capitalize">
                        <i className="bi bi-hdd-network me-2"></i>
                        {getFingerPrintDetails?.device_name}
                      </h5>
                    </div>
                    <button
                      className="btn main-btn mt-4"
                      onClick={() => {
                        getCurrentBrowserFingerPrint().then((fingerprint) => {
                          const loginData = {
                            platform: "KIOSK-Web",
                            device_data: { id: fingerprint },
                          };
                          dispatch(loginAction(loginData));
                        });
                      }}
                      disabled={loginLoading}
                    >
                      {loginLoading ? (
                        <span className="d-flex align-items-center">
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          />
                          <span>CONTINUE...</span>
                        </span>
                      ) : (
                        "CONTINUE"
                      )}
                    </button>

                    <div>
                      <p
                        className="text-center text-primary mb-0 mt-3 cursor"
                        onClick={() => {
                          getCurrentBrowserFingerPrint().then((fingerprint) => {
                            const loginData = {
                              device_id: getFingerPrintDetails?.id,
                              device_data: { id: fingerprint },
                            };
                            dispatch(
                              authFingerPrintResetAction(loginData)
                            ).then(() => {
                              getCurrentBrowserFingerPrint().then(
                                (fingerprint) => {
                                  const loginData = {
                                    device_data: { id: fingerprint },
                                  };
                                  dispatch(authFingerPrintnAction(loginData));
                                }
                              );
                            });
                          });
                        }}
                      >
                        Reset Kiosk
                      </p>
                    </div>
                  </>
                )}

                {error && (
                  <p className="mt-3 mb-0 text-danger">
                    Please enter a valid activation code.
                  </p>
                )}

                <p className="text-center mb-0 mt-3">
                  <a
                    href="https://www.guestxp.com/home"
                    className="text-primary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    www.guestxp.com
                  </a>
                </p>
              </div>
            </Col>
          </Row>
          <div>
            <div className="d-flex align-items-center justify-content-center flex-wrap my-2">
              <a
                className="text-decoration-none text-secondary fw-500 font-size-14"
                href="https://cloudext.com/privacy/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </a>
              <div className="fw-600 text-secondary mx-3 mx-md-4">•</div>
              <a
                className="text-decoration-none text-secondary fw-500 font-size-14"
                href="https://cloudext.com/terms/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms & Condition
              </a>
              <div className="fw-600 text-secondary mx-3 mx-md-4">•</div>
              <p className="text-secondary fw-500 font-size-14 mb-0">
                Copyright © {new Date().getFullYear()}
                <a
                  className="text-decoration-none text-secondary fw-500"
                  href="https://cloudext.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  CloudExt
                </a>
                , All rights reserved.
              </p>
            </div>
          </div>
        </div>

        <div className="login-keyboard">
          <ReactSimpleKeyboard
            keyboardRef={(r) => (keyboardRef.current = r)}
            onKeyPress={onKeyPress}
            display={{
              "{bksp}": "DEL",
            }}
            layout={{
              default: [
                "1 2 3 4 5 6 7 8 9 0 {bksp}",
                "Q W E R T Y U I O P",
                "A S D F G H J K L",
                "Z X C V B N M",
              ],
            }}
          />
        </div>
      </div>
    </>
  );
};

export default Login;
