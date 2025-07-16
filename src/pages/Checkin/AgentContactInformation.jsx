import React, { useEffect, useRef, useState } from "react";
import PhoneInput from "react-phone-input-2";
import { useNavigate } from "react-router-dom";
import Aos from "aos";
import { useTranslation } from "react-i18next";
import ReactSimpleKeyboard from "../../components/keyboard/react-keyboard";
import { notification } from "../../helpers/middleware";
import {
  getSessionItem,
  removeSessionItem,
  setSessionItem,
} from "../../hooks/session";
import Swal from "sweetalert2";
import { playBeep } from "../../utils/playBeep";
import { useDispatch, useSelector } from "react-redux";
import { agentUserMQTTAction } from "../../redux/reducers/MQTT/agentUserMQTT";
import { getCountryCodeFromName } from "../../utils/phoneNumberDial";
import PageInput from "../../components/PageInput";
import { playSafeAudio } from "../../utils/commonFun";

const AgentContactInformation = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const keyboard = useRef();
  const [numDigits] = useState(10);
  const [confirmCode, setConfirmCode] = useState("");

  const { activeKioskDeviceList } = useSelector(
    ({ kioskDevice }) => kioskDevice
  );
  const deviceIds =
    activeKioskDeviceList?.map((device) => device.id).filter(Boolean) || [];

  // Form states
  const [disabled, setDisabled] = useState(true);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeInput, setActiveInput] = useState("phone");
  const [layoutName, setLayoutName] = useState("numbers");

  // Separate states for dial code and phone number
  const [selectedCountry, setSelectedCountry] = useState({});
  const [phoneNumber, setPhoneNumber] = useState(""); // This will be just the number part
  const [email, setEmail] = useState("");

  const phoneInputRef = useRef();
  const inputEnterRef = useRef();
  const emailInputRef = useRef();

  const rawGuestName = getSessionItem("AgentGuestName");
  const guestName = rawGuestName && rawGuestName !== "null" ? rawGuestName : "";

  const seq_code = getSessionItem("seqCode");

  const userData = getSessionItem("hotelKiosk");
  const userSession = userData
    ? JSON.parse(decodeURIComponent(escape(atob(userData))))
    : null;

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

  // Helper function to get default country code by hotel location
  const getDefaultCountryCode = (hotelCountry) => {
    return getCountryCodeFromName(hotelCountry);
  };

  // Helper function to get dial code for country code
  const getDialCodeForCountry = (countryCode) => {
    const dialCodes = {
      // North America
      us: "1",
      ca: "1",

      // Europe
      gb: "44",
      de: "49",
      fr: "33",
      it: "39",
      es: "34",
      nl: "31",
      be: "32",
      at: "43",
      ch: "41",
      pt: "351",
      pl: "48",
      cz: "420",
      hu: "36",
      ro: "40",
      bg: "359",
      hr: "385",
      si: "386",
      sk: "421",
      lt: "370",
      lv: "371",
      ee: "372",
      fi: "358",
      se: "46",
      no: "47",
      dk: "45",
      is: "354",
      ie: "353",
      gr: "30",
      cy: "357",
      mt: "356",
      lu: "352",

      // Asia
      in: "91",
      cn: "86",
      jp: "81",
      kr: "82",
      th: "66",
      vn: "84",
      sg: "65",
      my: "60",
      id: "62",
      ph: "63",
      tw: "886",
      hk: "852",
      mo: "853",
      lk: "94",
      bd: "880",
      pk: "92",
      np: "977",
      bt: "975",
      mv: "960",
      mm: "95",
      kh: "855",
      la: "856",
      bn: "673",
      mn: "976",
      kz: "7",
      uz: "998",
      kg: "996",
      tj: "992",
      tm: "993",
      af: "93",

      // Middle East
      ae: "971",
      sa: "966",
      qa: "974",
      kw: "965",
      bh: "973",
      om: "968",
      ye: "967",
      iq: "964",
      ir: "98",
      tr: "90",
      il: "972",
      ps: "970",
      jo: "962",
      lb: "961",
      sy: "963",

      // Africa
      za: "27",
      eg: "20",
      ma: "212",
      tn: "216",
      dz: "213",
      ly: "218",
      sd: "249",
      et: "251",
      ke: "254",
      ug: "256",
      tz: "255",
      rw: "250",
      bi: "257",
      mg: "261",
      mu: "230",
      sc: "248",
      ng: "234",
      gh: "233",
      ci: "225",
      sn: "221",
      ml: "223",
      bf: "226",
      ne: "227",
      td: "235",
      cm: "237",
      cf: "236",
      cd: "243",
      cg: "242",
      ga: "241",
      gq: "240",
      st: "239",
      cv: "238",
      gw: "245",
      gn: "224",
      sl: "232",
      lr: "231",
      tg: "228",
      bj: "229",
      na: "264",
      bw: "267",
      zw: "263",
      zm: "260",
      mw: "265",
      mz: "258",
      ao: "244",
      ls: "266",
      sz: "268",

      // Oceania
      au: "61",
      nz: "64",
      fj: "679",
      pg: "675",
      sb: "677",
      vu: "678",
      nc: "687",
      pf: "689",
      ws: "685",
      to: "676",
      ki: "686",
      tv: "688",
      nr: "674",
      pw: "680",
      mh: "692",
      fm: "691",

      // South America
      br: "55",
      ar: "54",
      cl: "56",
      pe: "51",
      co: "57",
      ve: "58",
      ec: "593",
      bo: "591",
      py: "595",
      uy: "598",
      gy: "592",
      sr: "597",
      gf: "594",

      // Central America & Caribbean
      mx: "52",
      gt: "502",
      bz: "501",
      sv: "503",
      hn: "504",
      ni: "505",
      cr: "506",
      pa: "507",
      cu: "53",
      jm: "1",
      ht: "509",
      do: "1",
      pr: "1",
      tt: "1",
      bb: "1",
      bs: "1",
      ag: "1",
      kn: "1",
      dm: "1",
      lc: "1",
      vc: "1",
      gd: "1",
    };

    return dialCodes[countryCode.toLowerCase()] || "1";
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
        setPhoneNumber(parsedData.phoneNumber || "");
        if (
          parsedData.countryInfo &&
          Object.keys(parsedData.countryInfo).length > 0
        ) {
          setSelectedCountry(parsedData.countryInfo);
        }
        setEmail(parsedData.email || "");
        setConfirmCode(parsedData.phoneNumber || "");

        // Set appropriate keyboard layout based on saved data
        if (parsedData.email) {
          setLayoutName("email");
          setActiveInput("email");
        }
      } catch (error) {
        // console.error("Error loading saved data:", error);
      }
    }
    playSafeAudio("confirm_contact");
  }, []);

  // Set default country when component mounts or when no country is selected
  useEffect(() => {
    if (!selectedCountry.countryCode && userSession?.hotel?.country) {
      const defaultCountryCode = getDefaultCountryCode(
        userSession.hotel.country
      );
      if (defaultCountryCode) {
        // Get the proper dial code for the country
        const dialCode = getDialCodeForCountry(defaultCountryCode);
        const defaultCountryInfo = {
          countryCode: defaultCountryCode,
          dialCode: dialCode,
          name: userSession.hotel.country,
        };
        setSelectedCountry(defaultCountryInfo);
      }
    }
  }, [userSession?.hotel?.country, selectedCountry.countryCode]);

  // Save data when it changes
  useEffect(() => {
    const contactData = {
      phoneNumber: phoneNumber,
      fullPhoneNumber: selectedCountry.dialCode
        ? `${selectedCountry.dialCode}${phoneNumber}`
        : phoneNumber,
      countryInfo: selectedCountry,
      email,
    };
    setSessionItem("contactData", JSON.stringify(contactData));
  }, [phoneNumber, selectedCountry, email]);

  // Update disabled state when phone number or email changes
  useEffect(() => {
    const isValidPhone = phoneNumber && phoneNumber.length >= 7;
    const isValidEmail = email && email.trim().length > 0;

    // Enable submit if EITHER phone OR email is valid (not both required)
    setDisabled(!(isValidPhone || isValidEmail));
  }, [phoneNumber, email]);

  // Update keyboard layout when it changes
  useEffect(() => {
    if (keyboard.current) {
      keyboard.current.setOptions({
        layout: layouts[layoutName],
      });
    }
  }, [layoutName, layouts]);

  // Handle country selection (only for dial code)
  const handleCountryChange = (value, country) => {
    setSelectedCountry(country);
    if (error) setError(false);
  };

  // Handle phone number change from PageInput
  const handlePhoneNumberChange = (value) => {
    setPhoneNumber(value);
    setConfirmCode(value);

    // Auto focus to email when phone seems complete (optional - reduced threshold)
    if (value.length >= 10 && !email) {
      setTimeout(() => {
        emailInputRef.current?.focus();
        setActiveInput("email");
        setLayoutName("email");
      }, 100);
    }

    if (error) setError(false);
  };

  // Handle keyboard input
  const onKeyPress = (button) => {
    if (activeInput === "phone") {
      // Handle phone number input
      if (button === "{bksp}") {
        const newValue = confirmCode.slice(0, -1);
        setConfirmCode(newValue);
        setPhoneNumber(newValue);
      } else if (/^[0-9]$/.test(button)) {
        const newValue = confirmCode + button;
        setConfirmCode(newValue);
        setPhoneNumber(newValue);
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
    // Validate phone number and email
    const isValidPhone = phoneNumber && phoneNumber.length >= 7;
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
    if (phoneNumber && phoneNumber.length > 0 && phoneNumber.length < 7) {
      playBeep();
      Swal.fire({
        text: t("Enter_valid_Phone_Number"),
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

    setLoading(true);

    // Combine dial code and phone number for full phone
    const fullPhoneNumber = phoneNumber
      ? `${selectedCountry.dialCode}${phoneNumber}`
      : "";

    dispatch(
      agentUserMQTTAction({
        cmd: "ask_email_mob",
        device_uuid_list: deviceIds,
        response: {
          status: true,
          code: seq_code,
          message: "Kiosk Agent Contact Information Status applied.",
          data: {
            status_mode: "ask_email_mob",
            phone: phoneNumber, // Just the number part
            full_phone: `+${fullPhoneNumber}`, // Dial code + number
            country_code: selectedCountry.countryCode?.toUpperCase(),
            dial_code: selectedCountry.dialCode,
            email: email,
          },
        },
      })
    ).then(() => {
      setLoading(false);
      removeSessionItem("AgentGuestName");
      removeSessionItem("seqCode");
      navigate("/home");
    });
  };

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
            {guestName}
          </h1>
          <h3
            className="heading-s3 mb-0"
            style={{
              textAlign: "left",
            }}
          >
            {t("Please_provide_either_phone_number_or_email") ||
              t("Please_provide_your_contact_information")}
          </h3>
        </div>

        <div
          data-aos="fade-up"
          data-aos-delay="1000"
          className="position-relative z-3"
        >
          <h3 className="text-start input-heading mb-1">{t("Phone_Number")}</h3>
          <div className="custom-card z-5 number-section mb-4">
            <div className="custom-card-wrap p-3">
              <div className="d-inline-flex align-items-center">
                {/* PhoneInput for country/dial code selection only */}
                <PhoneInput
                  ref={phoneInputRef}
                  country={getDefaultCountryCode(userSession?.hotel?.country)}
                  value={selectedCountry.dialCode || ""}
                  onChange={handleCountryChange}
                  inputClass="d-none w-100"
                  inputProps={{
                    name: "country",
                    required: false,
                    autoFocus: false,
                    readOnly: true,
                  }}
                  containerClass="custom-phone-input"
                  buttonClass="custom-flag-btn"
                  dropdownClass="small-black-bg text-light rounded-4"
                  dropdownStyle={{
                    maxHeight: "30vh",
                  }}
                  disableDropdown={false}
                />

                {/* PageInput for phone number only */}
                <PageInput
                  numDigits={numDigits}
                  inputType="number"
                  ref={inputEnterRef}
                  value={confirmCode}
                  onChange={handlePhoneNumberChange}
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
          {t("Or")}
        </div>
        <div data-aos="fade-up" data-aos-delay="1500">
          <h3 className="text-start input-heading">{t("Email_Address")}</h3>
          <div className="custom-card z-1 form-input mb-5">
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
            className="common-btn blue-btn"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
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

export default AgentContactInformation;
