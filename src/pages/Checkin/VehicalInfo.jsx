import React, { useEffect, useRef, useState } from "react";
import PageInput from "../../components/PageInput";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ReactSimpleKeyboard from "../../components/keyboard/react-keyboard";
import Aos from "aos";
import { playBeep } from "../../utils/playBeep";
import Swal from "sweetalert2";
import { agentUserMQTTAction } from "../../redux/reducers/MQTT/agentUserMQTT";
import { useDispatch, useSelector } from "react-redux";
import { getSessionItem, removeSessionItem } from "../../hooks/session";
import { Modal } from "react-bootstrap";
import { playSafeAudio } from "../../utils/commonFun";

const VehicalInfo = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [numDigits] = useState(8);
  const [vehicleNum, setVehicleNum] = useState("");
  const [vehicleDetails, setVehicleDetails] = useState({
    make: "",
    model: "",
    color: "",
  });

  // Temporary state for modal inputs (prevents automatic saving)
  const [tempVehicleDetails, setTempVehicleDetails] = useState({
    make: "",
    model: "",
    color: "",
  });

  const [disabled, setDisabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [activeInput, setActiveInput] = useState("vehicleNum");
  const [colorDropdownOpen, setColorDropdownOpen] = useState(false);
  const [makeDropdownOpen, setMakeDropdownOpen] = useState(false);
  const [customMakeInput, setCustomMakeInput] = useState("");
  const [isCustomMake, setIsCustomMake] = useState(false);
  const [customColorInput, setCustomColorInput] = useState("");
  const [isCustomColor, setIsCustomColor] = useState(false);
  const [otherMakeModalShow, setOtherMakeModalShow] = React.useState(false);

  const keyboardRef = useRef(null);
  const modalKeyboardRef = useRef(null);
  const inputEnterRef = useRef();
  const colorDropdownRef = useRef(null);
  const makeDropdownRef = useRef(null);
  const seq_code = getSessionItem("seqCode");

  // Car brands array based on the image
  const mainBrands = [
    "Audi",
    "Bentley Motors",
    "BMW",
    "Buick",
    "Cadillac",
    "Chevrolet",
    "Chrysler",
    "Dodge",
    "Ford",
    "GMC",
    "Honda",
    "Jeep",
    "Lincoln",
    "Lucid Motors",
    "Mercedes-Benz",
    "Tesla",
    "Volkswagen",
  ].sort();

  const carBrands = [...mainBrands];

  // Color options array
  const mainColors = [
    { name: "White", hex: "#FFFFFF" },
    { name: "Black", hex: "#000000" },
    { name: "Silver", hex: "#C0C0C0" },
    { name: "Gray", hex: "#808080" },
    { name: "Blue", hex: "#0000FF" },
    { name: "Red", hex: "#FF0000" },
    { name: "Green", hex: "#008000" },
    { name: "Yellow", hex: "#FFFF00" },
    { name: "Brown", hex: "#8B4513" },
    { name: "Beige", hex: "#F5F5DC" },
    { name: "Gold", hex: "#FFD700" },
    { name: "Orange", hex: "#FFA500" },
    { name: "Maroon", hex: "#800000" },
    { name: "Burgundy", hex: "#800020" },
    { name: "Navy Blue", hex: "#000080" },
    { name: "Dark Green", hex: "#006400" },
    { name: "Light Blue", hex: "#ADD8E6" },
    { name: "Charcoal", hex: "#36454F" },
    { name: "Teal", hex: "#008080" },
    { name: "Purple", hex: "#800080" },
    { name: "Champagne", hex: "#F7E7CE" },
    { name: "Olive", hex: "#808000" },
    { name: "Cream", hex: "#FFFDD0" },
    { name: "Copper", hex: "#B87333" },
    { name: "Bronze", hex: "#CD7F32" },
  ];

  const colorOptions = [...mainColors];

  const { activeKioskDeviceList } = useSelector(
    ({ kioskDevice }) => kioskDevice
  );
  const deviceIds =
    activeKioskDeviceList?.map((device) => device.id).filter(Boolean) || [];

  useEffect(() => {
    Aos.init({
      duration: 1000,
      once: true,
      easing: "ease-in-out",
    });
    playSafeAudio("ask_vehicle");
  }, []);

  const handleInputChange = (index, digit, action = "input") => {
    setVehicleNum((prevCode) => {
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
  };

  const handleVehicleDetailChange = (field, value) => {
    setVehicleDetails((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const onKeyPress = (button) => {
    if (button === "{bksp}") {
      if (activeInput === "vehicleNum") {
        const lastNonEmptyIndex = vehicleNum
          .split("")
          .reverse()
          .findIndex((char) => char !== "");
        const indexToDelete =
          lastNonEmptyIndex === -1
            ? vehicleNum.length - 1
            : vehicleNum.length - 1 - lastNonEmptyIndex;
        handleInputChange(indexToDelete, "", "backspace");
      } else if (activeInput === "model") {
        const currentValue = vehicleDetails.model;
        const newValue = currentValue.slice(0, -1);
        handleVehicleDetailChange("model", newValue);
      }
    } else if (/^[A-Za-z0-9\s]$/.test(button)) {
      if (activeInput === "vehicleNum" && vehicleNum.length < numDigits) {
        handleInputChange(vehicleNum.length, button, "input");
      } else if (activeInput === "model") {
        const currentValue = vehicleDetails.model;
        const newValue = currentValue + button;
        handleVehicleDetailChange("model", newValue);
      }
    }
  };

  // Modal keyboard handler (for custom make and color inputs)
  const onModalKeyPress = (button) => {
    if (button === "{bksp}") {
      if (activeInput === "customMake" && isCustomMake) {
        const newValue = customMakeInput.slice(0, -1);
        setCustomMakeInput(newValue);
      } else if (activeInput === "customColor" && isCustomColor) {
        const newValue = customColorInput.slice(0, -1);
        setCustomColorInput(newValue);
      }
    } else if (/^[A-Za-z0-9\s]$/.test(button)) {
      if (activeInput === "customMake" && isCustomMake) {
        const newValue = customMakeInput + button;
        setCustomMakeInput(newValue);
      } else if (activeInput === "customColor" && isCustomColor) {
        const newValue = customColorInput + button;
        setCustomColorInput(newValue);
      }
    }
  };

  const handleNext = async () => {
    setLoading(true);

    const vehicleData = {
      status_mode: "ask_vehicle_no",
      vehicle_number: vehicleNum,
      ...(vehicleDetails.make && { vehicle_make: vehicleDetails.make }),
      ...(vehicleDetails.model && { vehicle_model: vehicleDetails.model }),
      ...(vehicleDetails.color && { vehicle_color: vehicleDetails.color }),
    };

    dispatch(
      agentUserMQTTAction({
        cmd: "ask_vehicle_no",
        device_uuid_list: deviceIds,
        response: {
          status: true,
          code: seq_code,
          message: "Vehicle information applied.",
          data: vehicleData,
        },
      })
    ).then(() => {
      setLoading(false);
      navigate("/home");
      removeSessionItem("seqCode");
    });
  };

  const handleInputFocus = (inputName) => {
    setActiveInput(inputName);
  };

  const handleColorSelect = (colorName) => {
    if (colorName === "") {
      setIsCustomColor(true);
      setCustomColorInput("");
      handleInputFocus("customColor");
    } else {
      setIsCustomColor(false);
      setCustomColorInput("");
      setTempVehicleDetails((prev) => ({ ...prev, color: colorName }));
      const finalDetails = { ...tempVehicleDetails, color: colorName };
      setVehicleDetails(finalDetails);
      setOtherMakeModalShow(false);
      setColorDropdownOpen(false);
      setMakeDropdownOpen(false);
      setActiveInput("vehicleNum");
    }
  };

  const toggleColorDropdown = () => {
    setOtherMakeModalShow(true);
    setColorDropdownOpen(true);
    setMakeDropdownOpen(false);
    // Don't set focus to "color" - this prevents unwanted keyboard behavior
    setActiveInput(""); // Clear active input to hide main keyboard
  };

  const handleMakeSelect = (make) => {
    if (make === "") {
      setIsCustomMake(true);
      setCustomMakeInput("");
      handleInputFocus("customMake");
    } else {
      setIsCustomMake(false);
      setCustomMakeInput("");
      setTempVehicleDetails((prev) => ({ ...prev, make: make }));
      const finalDetails = { ...tempVehicleDetails, make: make };
      setVehicleDetails(finalDetails);
      setOtherMakeModalShow(false);
      setColorDropdownOpen(false);
      setMakeDropdownOpen(false);
      setActiveInput("vehicleNum");
    }
  };

  const toggleMakeDropdown = () => {
    setOtherMakeModalShow(true);
    setMakeDropdownOpen(true);
    setColorDropdownOpen(false);
    // Don't set focus to "make" - this prevents unwanted keyboard behavior
    setActiveInput(""); // Clear active input to hide main keyboard
  };

  const getSelectedColorHex = () => {
    if (isCustomColor && vehicleDetails.color) {
      return "#6c757d";
    }
    const selectedColor = colorOptions.find(
      (color) => color.name === vehicleDetails.color
    );
    return selectedColor ? selectedColor.hex : null;
  };

  // Handle modal save
  const handleModalSave = () => {
    let finalDetails = { ...tempVehicleDetails };

    if (isCustomMake && customMakeInput.trim()) {
      finalDetails.make = customMakeInput.trim();
    }

    if (isCustomColor && customColorInput.trim()) {
      finalDetails.color = customColorInput.trim();
    }

    setVehicleDetails(finalDetails);
    setOtherMakeModalShow(false);
    setColorDropdownOpen(false);
    setMakeDropdownOpen(false);
    setIsCustomMake(false);
    setIsCustomColor(false);
    // Reset active input to show main keyboard again
    setActiveInput("vehicleNum");
  };

  // Handle modal close without saving
  const handleModalClose = () => {
    setOtherMakeModalShow(false);
    setColorDropdownOpen(false);
    setMakeDropdownOpen(false);
    setIsCustomMake(false);
    setIsCustomColor(false);
    setCustomMakeInput("");
    setCustomColorInput("");
    // Reset active input to show main keyboard again
    setActiveInput("vehicleNum");
  };

  return (
    <>
      <div className="align-center-page">
        <h1
          className="heading-h1 max-w-80"
          data-aos="fade-up"
          data-aos-delay="500"
        >
          {t("Enter_Vehicle_Information")}
        </h1>

        {/* Vehicle Number Input */}
        <div data-aos="fade-up" data-aos-delay="1000">
          <h3 className="text-start input-heading mb-1">
            {" "}
            {t("Vehicle_Number")}
          </h3>
          <div className="custom-card mb-5">
            <div className="custom-card-wrap py-3">
              <PageInput
                numDigits={numDigits}
                ref={inputEnterRef}
                value={vehicleNum}
                onChange={handleInputChange}
                warpperClass="circle-input"
                onFocus={() => handleInputFocus("vehicleNum")}
              />
            </div>
          </div>
        </div>

        {/* Optional Vehicle Details */}
        <div
          className="text-center my-4"
          data-aos="fade-up"
          data-aos-delay="1200"
        >
          <h5 className="text-white mb-3">{t("Vehicle_Details")}</h5>
        </div>

        <div
          className="small-black-bg form-input px-5 py-4 my-4"
          data-aos="fade-up"
          data-aos-delay="1400"
        >
          <div className="row g-3">
            <div className="col-md-6">
              <h3 className="input-heading mb-2 d-block">Make</h3>
              <div className="position-relative" ref={makeDropdownRef}>
                <div
                  className={`form-control d-flex align-items-center justify-content-between cursor ${
                    activeInput === "make" ? "focus-border" : ""
                  }`}
                  onClick={toggleMakeDropdown}
                  style={{ cursor: "pointer", outline: "none" }}
                >
                  <span
                    className="lh-base"
                    style={{ color: vehicleDetails.make ? "white" : "#6c757d" }}
                  >
                    {vehicleDetails.make || "Select Make"}
                  </span>
                  <div className="d-flex align-items-center">
                    <svg
                      width="12"
                      height="8"
                      viewBox="0 0 12 8"
                      fill="none"
                      style={{
                        transform: makeDropdownOpen
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                        transition: "transform 0.2s ease",
                      }}
                    >
                      <path
                        d="M1 1L6 6L11 1"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            {/* <div className="col-md-6">
              <h3 className="input-heading mb-2 d-block">Model</h3>
              <div className="position-relative">
                <input
                  type="text"
                  className={`form-control lh-base ${
                    activeInput === "model" ? "focus-border" : ""
                  }`}
                  value={vehicleDetails.model}
                  placeholder="e.g., Camry, Civic"
                  onFocus={() => handleInputFocus("model")}
                  onClick={() => handleInputFocus("model")}
                  onChange={(e) =>
                    handleVehicleDetailChange("model", e.target.value)
                  }
                  style={{
                    cursor: "pointer",
                    paddingRight: "40px",
                    outline: "none",
                  }}
                  readOnly
                />
              </div>
            </div> */}
            <div className="col-md-6">
              <h3 className="input-heading mb-2 d-block">{t("Color")}</h3>
              <div className="position-relative" ref={colorDropdownRef}>
                <div
                  className={`form-control d-flex align-items-center justify-content-between ${
                    activeInput === "color" ? "focus-border" : ""
                  }`}
                  style={{
                    cursor: "pointer",
                    minHeight: "38px",
                    outline: "none",
                  }}
                  onClick={toggleColorDropdown}
                >
                  <div className="d-flex align-items-center lh-base">
                    {vehicleDetails.color ? (
                      <>
                        <div
                          style={{
                            width: "20px",
                            height: "20px",
                            backgroundColor: getSelectedColorHex(),
                            borderRadius: "3px",
                            marginRight: "8px",
                            border: "1px solid #6c757d",
                          }}
                        ></div>
                        <span>{vehicleDetails.color}</span>
                      </>
                    ) : (
                      <span style={{ color: "#6c757d" }}>
                        {t("Select")} {t("Color")}
                      </span>
                    )}
                  </div>
                  <div className="d-flex align-items-center">
                    <svg
                      width="12"
                      height="8"
                      viewBox="0 0 12 8"
                      fill="none"
                      style={{
                        transform: colorDropdownOpen
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                        transition: "transform 0.2s ease",
                      }}
                    >
                      <path
                        d="M1 1L6 6L11 1"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="d-flex align-items-center justify-content-between"
          data-aos="fade-up"
          data-aos-delay="1500"
        >
          <button
            className="common-btn blue-btn"
            onClick={() => {
              handleNext();
            }}
            disabled={loading}
          >
            {loading ? (
              <span className="d-flex align-items-center">
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                />
                <span>{t("Submitting")}...</span>
              </span>
            ) : (
              <span>{t("Submit")}</span>
            )}
          </button>
        </div>
      </div>

      {/* Main Keyboard - Only show when modal is not open and activeInput is valid */}
      {!otherMakeModalShow && activeInput && (
        <div>
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
      )}

      <Modal
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        dialogClassName="dark-modal"
        show={otherMakeModalShow}
        onHide={handleModalClose}
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-vcenter">
            {makeDropdownOpen ? t("Make") : t("Color")} {t("Detail")}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="py-3">
            <h3 className="text-start input-heading mb-1">
              {makeDropdownOpen ? "Make" : "Color"}
            </h3>
            <div className="form-input">
              <div className="">
                {/* Custom Make Input */}
                {makeDropdownOpen && (
                  <>
                    <div className="position-relative">
                      <input
                        type="text"
                        className={`form-control ${
                          activeInput === "customMake" && isCustomMake
                            ? "focus-border"
                            : ""
                        }`}
                        value={customMakeInput}
                        placeholder="Enter custom make"
                        onFocus={() => handleInputFocus("customMake")}
                        onChange={(e) => setCustomMakeInput(e.target.value)}
                        onClick={() => {
                          setIsCustomMake(true);
                          handleInputFocus("customMake");
                          setTempVehicleDetails((prev) => ({
                            ...prev,
                            make: "",
                          }));
                        }}
                        style={{
                          cursor: "pointer",
                          paddingRight: "40px",
                          outline: "none",
                        }}
                        readOnly
                      />
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="edit-svg"
                        onClick={() => {
                          setIsCustomMake(true);
                          handleInputFocus("customMake");
                        }}
                      >
                        <path
                          d="M12 20h9M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>

                    <div className="w-100 small-black-bg p-4 border border-secondary fs-2 mt-3">
                      <div
                        style={{
                          maxHeight: "40vh",
                          overflowY: "auto",
                        }}
                      >
                        <div
                          className="p-3 rounded-4 cursor"
                          onClick={() => handleMakeSelect("")}
                          style={{ color: "#6c757d" }}
                        >
                          {t("Select")} {t("Make")}
                        </div>
                        {carBrands.map((brand, index) => (
                          <div
                            key={index}
                            className={`p-3 rounded-4 cursor ${
                              tempVehicleDetails.make === brand
                                ? "bg-theme-blue select-active"
                                : ""
                            }`}
                            onClick={() => handleMakeSelect(brand)}
                          >
                            {brand}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Custom Color Input */}
                {colorDropdownOpen && (
                  <>
                    <div className="position-relative">
                      <input
                        type="text"
                        className={`form-control ${
                          activeInput === "customColor" && isCustomColor
                            ? "focus-border"
                            : ""
                        }`}
                        value={customColorInput}
                        placeholder="Enter custom color"
                        onFocus={() => handleInputFocus("customColor")}
                        onChange={(e) => setCustomColorInput(e.target.value)}
                        onClick={() => {
                          setIsCustomColor(true);
                          handleInputFocus("customColor");
                          setTempVehicleDetails((prev) => ({
                            ...prev,
                            color: "",
                          }));
                        }}
                        style={{
                          cursor: "pointer",
                          paddingRight: "40px",
                          outline: "none",
                        }}
                        readOnly
                      />
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="edit-svg"
                        onClick={() => {
                          setIsCustomColor(true);
                          handleInputFocus("customColor");
                        }}
                      >
                        <path
                          d="M12 20h9M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>

                    <div className="w-100 small-black-bg p-4 border border-secondary fs-2 mt-3">
                      <div
                        style={{
                          maxHeight: "40vh",
                          overflowY: "auto",
                        }}
                      >
                        <div
                          className="p-3 rounded-4 cursor"
                          onClick={() => handleColorSelect("")}
                          style={{ color: "#6c757d" }}
                        >
                          {t("Select")} {t("Color")}
                        </div>
                        {colorOptions.map((color, index) => (
                          <div
                            key={index}
                            className={`d-flex align-items-center p-3 rounded-4 cursor ${
                              tempVehicleDetails.color === color.name
                                ? "bg-theme-blue select-active"
                                : ""
                            }`}
                            onClick={() => handleColorSelect(color.name)}
                          >
                            <div
                              className="rounded me-2 border border-secondary"
                              style={{
                                width: "20px",
                                height: "20px",
                                backgroundColor: color.hex,
                              }}
                            ></div>
                            {color.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Modal Keyboard - only shown when custom input is active */}
            {(isCustomMake || isCustomColor) && (
              <div className="text-dark mt-3">
                <ReactSimpleKeyboard
                  keyboardRef={(r) => (modalKeyboardRef.current = r)}
                  onKeyPress={onModalKeyPress}
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
            )}
          </div>
        </Modal.Body>
        {(isCustomMake || isCustomColor) && (
          <Modal.Footer>
            <button className="common-btn blue-btn" onClick={handleModalSave}>
              {t("Save")}
            </button>
          </Modal.Footer>
        )}
      </Modal>
    </>
  );
};

export default VehicalInfo;
