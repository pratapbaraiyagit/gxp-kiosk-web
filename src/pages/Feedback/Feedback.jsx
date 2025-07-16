import Aos from "aos";
import React, { useEffect, useState, useRef } from "react";
import ReactSimpleKeyboard from "../../components/keyboard/react-keyboard";
import { useTranslation } from "react-i18next";

const Feedback = () => {
  const [formData, setFormData] = useState({
    name: "",
    roomNumber: "",
    overallRating: 0,
    feedback: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});
  const [inputName, setInputName] = useState("name"); // Active input field
  const keyboard = useRef(null);
  const { t } = useTranslation();

  // Define layouts for the keyboard
  const layouts = {
    default: {
      default: [
        "1 2 3 4 5 6 7 8 9 0",
        "q w e r t y u i o p",
        "a s d f g h j k l",
        "z x c v b n m",
        "{bksp} {space}",
      ],
      shift: [
        "! @ # $ % ^ & * ( )",
        "Q W E R T Y U I O P",
        "A S D F G H J K L",
        "Z X C V B N M",
        "{bksp} {space}",
      ],
    },
    email: {
      default: [
        "1 2 3 4 5 6 7 8 9 0",
        "q w e r t y u i o p",
        "a s d f g h j k l",
        "z x c v b n m . @",
        "{bksp} {space} {gmail} {yahoo} {hotmail}",
      ],
    },
  };

  // Define current layout
  const [layoutName, setLayoutName] = useState("default");

  useEffect(() => {
    Aos.init({
      duration: 1000,
      once: true,
      easing: "ease-in-out",
    });
  }, []);

  // Update form data when rating changes
  useEffect(() => {
    setFormData((prevState) => ({
      ...prevState,
      overallRating: rating,
    }));
  }, [rating]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));

    // Set active input for the keyboard
    setInputName(name);

    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Handle keyboard input
  const onKeyPress = (button) => {
    // Handle email domain buttons
    if (button === "{gmail}") {
      setFormData((prev) => ({
        ...prev,
        [inputName]: prev[inputName] + "@gmail.com",
      }));
      return;
    }

    if (button === "{yahoo}") {
      setFormData((prev) => ({
        ...prev,
        [inputName]: prev[inputName] + "@yahoo.com",
      }));
      return;
    }

    if (button === "{hotmail}") {
      setFormData((prev) => ({
        ...prev,
        [inputName]: prev[inputName] + "@hotmail.com",
      }));
      return;
    }

    // Handle backspace
    if (button === "{bksp}") {
      setFormData((prev) => ({
        ...prev,
        [inputName]: prev[inputName].slice(0, -1),
      }));
      return;
    }

    // Handle space
    if (button === "{space}") {
      setFormData((prev) => ({
        ...prev,
        [inputName]: prev[inputName] + " ",
      }));
      return;
    }

    // Handle regular keys
    setFormData((prev) => ({
      ...prev,
      [inputName]: prev[inputName] + button,
    }));
  };

  // Handle input focus to change the active field for the keyboard
  const handleFocus = (e) => {
    const { name } = e.target;
    setInputName(name);

    // Change layout for email fields if needed
    if (name === "email") {
      setLayoutName("email");
    } else {
      setLayoutName("default");
    }
  };

  const validateForm = () => {
    const errors = {};

    if (rating === 0) {
      errors.rating = "Please select your feedback rating";
    }

    // Add other validations as needed
    // if (!formData.name.trim()) {
    //   errors.name = "Please enter your name";
    // }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setSubmitted(true);

    setTimeout(() => {
      setSubmitted(false);
      // Reset form data including rating
      setFormData({
        name: "",
        roomNumber: "",
        overallRating: 0,
        feedback: "",
      });
      setRating(0); // Clear star rating
      setHover(0); // Reset hover state
    }, 3000);
  };

  return (
    <>
      <div className="mb-auto ">
        <h1 className="heading-h1">{t("How_was_your_stay")}</h1>
        <form onSubmit={handleSubmit} data-aos="fade-up" data-aos-delay="1000">
          <div className="custom-card form-input">
            <div className="custom-card-wrap p-4">
              <div className="fs-86">
                {[...Array(5)].map((_, index) => {
                  const starValue = index + 1;
                  return (
                    <span
                      key={starValue}
                      onClick={() => {
                        setValidationErrors({});
                        setRating(starValue);
                      }}
                      onMouseEnter={() => setHover(starValue)}
                      onMouseLeave={() => setHover(0)}
                      style={{
                        cursor: "pointer",
                        color:
                          starValue <= (hover || rating)
                            ? "#FFD700"
                            : "#E4E5E9",
                      }}
                    >
                      ★
                    </span>
                  );
                })}
              </div>

              {validationErrors.rating && (
                <div className="text-danger text-center mb-2 fs-4">
                  {validationErrors.rating}
                </div>
              )}

              <input
                type="text"
                className="form-control mb-4"
                placeholder={t("Your_Name")}
                name="name"
                value={formData.name}
                onChange={handleChange}
                onFocus={handleFocus}
                autoComplete="off"
              />
              {validationErrors.name && (
                <div className="text-danger mb-2">{validationErrors.name}</div>
              )}

              <textarea
                name="feedback"
                value={formData.feedback}
                onChange={handleChange}
                onFocus={handleFocus}
                className="form-control mb-4"
                rows="3"
                placeholder={t("Tell_us_about_your_experience")}
              ></textarea>

              <div className="text-end">
                <button type="submit" className="common-btn blue-btn">
                  {t("Submit_Feedback")}
                </button>
              </div>

              {submitted && (
                <div className="alert alert-success mt-3 text-center fs-3">
                  {t("Thank_you_for_your_feedback")}
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
      <div className="keyboard-container">
        <ReactSimpleKeyboard
          keyboardRef={(r) => (keyboard.current = r)}
          layoutName={layoutName}
          layout={layouts[layoutName]}
          onKeyPress={onKeyPress}
          inputName={inputName}
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

export default Feedback;
