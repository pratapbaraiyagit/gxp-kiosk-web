import React, { useEffect, useRef, useState } from "react";
import PageInput from "../../components/PageInput";
import { useNavigate } from "react-router-dom";
import Aos from "aos";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import "react-simple-keyboard/build/css/index.css";
import ReactSimpleKeyboard from "../../components/keyboard/react-keyboard";
import { notification } from "../../helpers/middleware";
import { getSessionItem, setSessionItem } from "../../hooks/session";
import Swal from "sweetalert2";
import { playBeep } from "../../utils/playBeep";
import { getKioskQADeskListData } from "../../redux/reducers/Kiosk/KioskQADesk";
import { UploadImageFile } from "../../redux/reducers/ImageUploadFile/imageUploadFile";
import { playSafeAudio } from "../../utils/commonFun";

const ContactInformation = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const keyboard = useRef();

  const { activeBookingList } = useSelector(({ booking }) => booking);
  const userDetails = activeBookingList?.[0];

  const selfieGetData = getSessionItem("SelfieGetData");
  const customerData = JSON.parse(selfieGetData);
  const customer_data = userDetails || customerData;

  // Form states
  const [disabled, setDisabled] = useState(true);
  const [error, setError] = useState(false);
  const [activeInput, setActiveInput] = useState("phone");
  const [layoutName, setLayoutName] = useState("numbers");

  const [countryCode, setCountryCode] = useState("US");
  const [confirmCode, setConfirmCode] = useState(
    customerData?.guest_contact?.[0]?.phone_number || ""
  );
  const [email, setEmail] = useState(
    customerData?.guest_contact?.[0]?.email || ""
  );
  const [numDigits] = useState(10);

  const inputEnterRef = useRef();
  const emailInputRef = useRef();

  const user_data = getSessionItem("userData");
  const userData = JSON.parse(user_data);

  const document_type_p = getSessionItem("document_type");
  const document_type = JSON.parse(document_type_p);

  // Keyboard layouts with email domain buttons
  const layouts = {
    numbers: {
      default: ["1 2 3", "4 5 6", "7 8 9", "0 {bksp}"],
    },
    email: {
      default: [
        "1 2 3 4 5 6 7 8 9 0 {bksp}",
        "q w e r t y u i o p",
        "a s d f g h j k l",
        "z x c v b n m @ .",
        "{gmail} {hotmail} {yahoo} _",
      ],
    },
  };

  // Initialize AOS and load saved data
  useEffect(() => {
    Aos.init({
      duration: 1000,
      once: true,
      easing: "ease-in-out",
    });

    const savedData = getSessionItem("contactData");
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setCountryCode(parsedData.countryCode || "US");
        setConfirmCode(parsedData.phoneNumber || "");
        setEmail(parsedData.email || "");
        // setDisabled(!(parsedData.phoneNumber?.length === numDigits));
        // Set appropriate keyboard layout based on saved data
        if (parsedData.email) {
          setLayoutName("email");
          setActiveInput("email");
        }
      } catch (error) {
        // console.error("Error loading saved data:", error);
      }
    }
  }, [numDigits]);

  // Save data when it changes
  useEffect(() => {
    const contactData = {
      countryCode,
      phoneNumber: confirmCode,
      email,
    };
    setSessionItem("contactData", JSON.stringify(contactData));
  }, [countryCode, confirmCode, email]);

  // Update disabled state - MODIFIED FOR OR VALIDATION
  useEffect(() => {
    const isValidPhone = confirmCode && confirmCode.length === numDigits;
    const isValidEmail = email && email.trim().length > 0;

    // Enable submit if EITHER phone OR email is valid (not both required)
    setDisabled(!(isValidPhone || isValidEmail));
  }, [confirmCode, email, numDigits]);

  useEffect(() => {
    const paramData = {
      params: {
        "q.is_active": true,
      },
    };
    dispatch(getKioskQADeskListData(paramData));
    playSafeAudio("confirm_contact");
  }, []);

  // Update keyboard layout when it changes
  useEffect(() => {
    if (keyboard.current) {
      keyboard.current.setOptions({
        layout: layouts[layoutName],
      });
    }
  }, [layoutName, layouts]);

  // Handle phone input changes
  const handleInputChange = (index, digit, action = "input") => {
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
      const isComplete = updatedCode.length === numDigits;
      // setDisabled(!isComplete);

      // Auto focus to email when phone is complete
      if (isComplete && !email) {
        // This is the key part - focus on the email input when phone number is complete
        setTimeout(() => {
          emailInputRef.current?.focus();
          setActiveInput("email");
          setLayoutName("email");
        }, 100); // Small timeout to ensure UI updates properly
      }

      if (error) setError(false);
      return updatedCode;
    });
  };

  // Handle keyboard input
  const onKeyPress = (button) => {
    if (activeInput === "phone") {
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
      } else if (/^[0-9]$/.test(button) && confirmCode.length < numDigits) {
        handleInputChange(confirmCode.length, button, "input");
      }
    } else {
      // Email input handling
      if (button === "{bksp}") {
        setEmail((prev) => prev.slice(0, -1));
      } else if (button === "{space}") {
        setEmail((prev) => prev + " ");
      } else if (button === "{gmail}") {
        const emailName = email.split("@")[0];
        setEmail(emailName + "@gmail.com");
      } else if (button === "{hotmail}") {
        const emailName = email.split("@")[0];
        setEmail(emailName + "@hotmail.com");
      } else if (button === "{yahoo}") {
        const emailName = email.split("@")[0];
        setEmail(emailName + "@yahoo.com");
      } else {
        setEmail((prev) => {
          if (button === "@" && prev.includes("@")) {
            return prev;
          }
          return prev + button;
        });
      }
    }
  };

  const handleInputFocus = (inputType) => {
    setActiveInput(inputType);
    setLayoutName(inputType === "phone" ? "numbers" : "email");
  };

  // Form validation and submission
  const handleSubmit = () => {
    // if (document_type?.portrait_image) {
    //    imageUpload(document_type?.portrait_image);
    // }
    const isValidPhone = confirmCode;
    const isValidEmail = email && email.trim().length > 0;

    // Check if at least one contact method is provided
    if (!isValidPhone && !isValidEmail) {
      playBeep();
      Swal.fire({
        text:
          t("Please_provide_either_phone_number_or_email") ||
          "Please provide either a phone number or email address",
        icon: "warning",
        confirmButtonText: t("Ok"),
        showClass: {
          popup: `
            animate__animated
            animate__fadeInUp
            animate__faster
          `,
        },
        hideClass: {
          popup: `
            animate__animated
            animate__fadeOutDown
            animate__faster
          `,
        },
      });
      return;
    }

    // Validate phone number if provided
    // if (
    //   confirmCode &&
    //   confirmCode.length > 0
    // ) {
    //   playBeep();
    //   Swal.fire({
    //     text: t("Enter_10didgit_Phone_Number"),
    //     icon: "error",
    //     confirmButtonText: t("Ok"),
    //     showClass: {
    //       popup: `
    //         animate__animated
    //         animate__fadeInUp
    //         animate__faster
    //       `,
    //     },
    //     hideClass: {
    //       popup: `
    //         animate__animated
    //         animate__fadeOutDown
    //         animate__faster
    //       `,
    //     },
    //   });
    //   return;
    // }

    // Validate email if provided
    if (email && email.trim().length > 0) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        playBeep();
        Swal.fire({
          text: t("Enter_valid_email_address"),
          icon: "error",
          confirmButtonText: t("Ok"),
          showClass: {
            popup: `
              animate__animated
              animate__fadeInUp
              animate__faster
            `,
          },
          hideClass: {
            popup: `
              animate__animated
              animate__fadeOutDown
              animate__faster
            `,
          },
        });
        return;
      }
    }

    // Proceed to next step if validation passes
    if (customerData) {
      navigate("/check-in/questions");
    } else {
      navigate("/selfie");
    }
  };

  // const imageUpload = async (base64Image) => {

  //   const rawBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

  //   // Prepare data for upload
  //   const data = {
  //     media_type: "guest_profile_picture",
  //     file_type: "png",
  //     file: rawBase64,
  //     fieldKeyName: "image",
  //     ocrModule: true,
  //   };

  //   return dispatch(UploadImageFile(data));
  // };

  return (
    <>
      <div className="align-center-page">
        <div
          className="align-items-end justify-content-between gap-5 mb-5"
          data-aos="fade-up"
          data-aos-delay="500"
        >
          <h1 className="heading-h1 mb-3">
            {t("Hello")},
            <br />
            {customer_data?.guest?.first_name || userData?.firstName}{" "}
            {customer_data?.guest?.last_name || userData?.lastName}
          </h1>
          <h3 className="heading-s3 mb-0" style={{
            textAlign:"left"
          }}>
            {t("Please_provide_either_phone_number_or_email") ||
              t("Please_provide_your_contact_information")}
          </h3>
        </div>

        <div data-aos="fade-up" data-aos-delay="1000">
          <h3 className="text-start input-heading mb-1">{t("Phone_Number")}</h3>
          <div className="custom-card number-section mb-4">
            <div className="custom-card-wrap py-3">
              <div className="d-flex align-items-center">
                <select
                  className="select-country"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                >
                  <option value="US">US</option>
                  <option value="CA">CA</option>
                </select>
                <PageInput
                  numDigits={numDigits}
                  inputType="number"
                  ref={inputEnterRef}
                  value={confirmCode}
                  onChange={handleInputChange}
                  warpperClass="circle-input"
                  onFocus={() => handleInputFocus("phone")}
                />
              </div>
            </div>
          </div>
        </div>
        <div
          data-aos="fade-up"
          data-aos-delay="1500"
          className="text-center my-3 fw-bold text-start input-heading"
        >
          OR
        </div>
        <div data-aos="fade-up" data-aos-delay="1500">
          <h3 className="text-start input-heading">{t("Email_Address")}</h3>
          <div className="custom-card form-input mb-5">
            <div className="custom-card-wrap p-3">
              <input
                ref={emailInputRef}
                type="email"
                className="form-control text-lowercase"
                placeholder="youremail@domain.com"
                value={email}
                readOnly
                onFocus={() => handleInputFocus("email")}
                autoComplete="off"
              />
            </div>
          </div>
        </div>

        <div
          className="d-flex align-items-center justify-content-between"
          data-aos="fade-up"
          data-aos-delay="2000"
        >
          <button
            className="common-btn black-btn"
            onClick={() => {
              setSessionItem("contactData", "");
              navigate(-1);
            }}
          >
            {t("Back")}
          </button>
          <button className="common-btn blue-btn" onClick={handleSubmit}>
            {t("Confirm")}
          </button>
        </div>
      </div>

      <div
        className={`keyboard-container ${
          layoutName === "numbers" ? "numeric-keyboard" : ""
        }`}
      >
        <ReactSimpleKeyboard
          keyboardRef={(r) => (keyboard.current = r)}
          layoutName={layoutName}
          layout={layouts[layoutName]}
          onKeyPress={onKeyPress}
          display={{
            "{bksp}": "DEL",
            "{space}": "SPACE",
            "{gmail}": "@Gmail",
            "{yahoo}": "@Yahoo",
            "{hotmail}": "@Hotmail",
          }}
          buttonTheme={[
            {
              class: "hg-red",
              buttons: "{bksp}",
            },
            {
              class: "hg-email-domain",
              buttons: "{gmail} {hotmail} {yahoo}",
            },
          ]}
        />
      </div>
    </>
  );
};

export default ContactInformation;
