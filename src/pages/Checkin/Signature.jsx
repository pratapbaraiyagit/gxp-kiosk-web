import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Aos from "aos";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import SignaturePad from "react-signature-canvas";
import { getSessionItem, setSessionItem } from "../../hooks/session";
import {
  addNewBooking,
  getBookingDetails,
  setIsBookingUpdate,
  updateBookingDetails,
} from "../../redux/reducers/Booking/booking";
import {
  getBookingStatusListData,
  getBookingTypeListData,
  getBusinessSourceListData,
} from "../../redux/reducers/Booking/bookingAvailability";
import moment from "moment";
import Swal from "sweetalert2";
import TermsModal from "../../components/TermsModal";
import { getDocumentTypeListData } from "../../redux/reducers/Booking/documentType";
import useIDScanner from "../../hooks/useIDScanner";
import { getSourcePaymentPolicyListData } from "../../redux/reducers/Booking/hotelSourcePaymentPolicyConfig";
import { addNewKioskAddOn } from "../../redux/reducers/Booking/kioskAddOn";
import { getPaymentTerminalListData } from "../../redux/reducers/Booking/PaymentTerminal";
import { UploadImageFile } from "../../redux/reducers/ImageUploadFile/imageUploadFile";
import { getImageSrc } from "../../utils/bulkImageStorage";
import { playBeep } from "../../utils/playBeep";
import { currency } from "../../utils/data";
import { playSafeAudio } from "../../utils/commonFun";

const Signature = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  const { paymentVerify } = location.state || {};

  const { ocrData } = useIDScanner();

  const userDataC = getSessionItem("hotelKiosk");
  const userSession = userDataC
    ? JSON.parse(decodeURIComponent(escape(atob(userDataC))))
    : null;

  const { activeCurrencyList } = useSelector(
    ({ paymentMethod }) => paymentMethod
  );

  const currencySymbol = useMemo(() => {
    return activeCurrencyList?.find(
      (item) => item?.id === userSession?.hotel?.currency
    );
  }, [activeCurrencyList, userSession?.hotel?.currency]);

  const OCR_Data = JSON.parse(ocrData);

  const check_In_Date = getSessionItem("checkInDate");
  const check_Out_Date = getSessionItem("checkOutDate");
  const check_In_Time = getSessionItem("checkInTime");
  const check_Out_Time = getSessionItem("checkOutTime");
  const document_type_p = getSessionItem("document_type");
  const document_type = JSON.parse(document_type_p);

  const payment_payload_p = getSessionItem("paymentPayload");
  const payment_payload = JSON.parse(payment_payload_p);

  const addon_payload_p = getSessionItem("addonPayload");
  const addon_payload_ze = JSON.parse(addon_payload_p);

  const addon_payload = addon_payload_ze.map(({ is_active, ...rest }) => rest);

  const user_data = getSessionItem("userData");
  const userData = JSON.parse(user_data);

  const selfieGetData = getSessionItem("SelfieGetData");
  const customerData = JSON.parse(selfieGetData);


  const contact_data = getSessionItem("contactData");
  const contactData = JSON.parse(contact_data);

  const vehicleNumber = getSessionItem("vehicalNum");

  const [termModalShow, setTermModalShow] = React.useState(false);

  const { t } = useTranslation();
  const signaturePad = useRef(null);

  const [hasSignature, setHasSignature] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [error, setError] = useState("");

  const {
    bookingLoading,
    isBookingUpdate,
    activeBookingList,
    getBookingDetailsData,
  } = useSelector(({ booking }) => booking);

  const {
    activeBusinessSourceList,
    activeBookingStatusList,
    activeBookingTypeList,
  } = useSelector(({ bookingAvailability }) => bookingAvailability);

  const { imgLoading, singledatabaseImage } = useSelector(({ image }) => image);

  const { documentTypeLoading, activeDocumentTypeList } = useSelector(
    ({ documentType }) => documentType
  );

  const { activeSourcePaymentPolicyList } = useSelector(
    ({ hotelSourcePaymentPolicyConfig }) => hotelSourcePaymentPolicyConfig
  );

  const booking = activeBookingList?.[0];

  const selectedBooking = getSessionItem("selectedSelfieBookingData");
  const selectedBookingData = JSON.parse(selectedBooking);

  const KioskDeviceInfo = getSessionItem("KioskDeviceInfo");
  const KioskDeviceInfoSession = KioskDeviceInfo
    ? JSON.parse(decodeURIComponent(escape(atob(KioskDeviceInfo))))
    : null;
  const newKioskDeviceInfo = KioskDeviceInfoSession?.[0]?.mode;

  const TermsAndCondition = getSessionItem("terms_and_conditions");
  const amount_Total = getSessionItem("amountTotal");
  const amountTotal = parseFloat(amount_Total);

  const roomTypeBooking = getSessionItem("roomType");
  const room = getSessionItem("room");
  const paymentMethod = getSessionItem("paymentMethod");
  const profilePicture = getSessionItem("profile_picture");

  const roomTypeBookingData = JSON.parse(roomTypeBooking);
  const roomData = JSON.parse(room);

  const room_type_Data = getSessionItem("roomType");
  const roomTypeData = JSON.parse(room_type_Data);
  const roomTypeDataX = getSessionItem("room_type");

  // const totalCharge = parseFloat(roomTypeData?.base_rate);
  // const total_Tax = parseFloat(roomTypeData?.total_per_day_tax);

  const totalCharge = parseFloat(
    roomTypeData?.rate_details?.[0]?.rate_room_type?.[0]?.rate_in_summary
      ?.avg_rate_final
  );
  const total_Tax = parseFloat(
    roomTypeData?.rate_details?.[0]?.rate_room_type?.[0]?.rate_in_summary
      ?.avg_tax_amount
  );

  // Calculate the number of nights - include both check-in and check-out dates
  const checkInDate = new Date(check_In_Date);
  const checkOutDate = new Date(check_Out_Date);
  const nights = Math.ceil(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const totalTax = parseFloat(total_Tax) * nights || 0;

  useEffect(() => {
    Aos.init({
      duration: 1000,
      once: true,
      easing: "ease-in-out",
    });
    playSafeAudio("draw_sign");
  }, []);

  useEffect(() => {
    dispatch(getBookingStatusListData());
    dispatch(getBusinessSourceListData());
    dispatch(getBookingTypeListData());
    dispatch(getDocumentTypeListData());
    const paramData = {
      params: {
        "bbs.name__istartswith": "Kiosk",
      },
    };
    dispatch(getSourcePaymentPolicyListData(paramData));

    if (booking?.id) dispatch(getBookingDetails(booking?.id));
  }, []);

  const normalizeString = (str) => {
    return str
      .toLowerCase()
      .replace(/[^a-z\s]/g, "") // Remove special characters
      .replace(/\blicence\b/g, "license") // Handle "licence" → "license"
      .replace(/\bdl\b/g, "driver license") // Handle "DL" → "driver license"
      .replace(/\bdriver\b/g, "driver license") // Handle "driver" → "driver license"
      .split(" ");
  };

  const getBestMatchId = (searchTerm) => {
    if (!searchTerm) return null;

    const searchWords = normalizeString(searchTerm);

    const matchedDoc = activeDocumentTypeList.find((doc) => {
      const docWords = normalizeString(doc.document_name);
      return docWords.some((word) => searchWords.includes(word));
    });

    return matchedDoc?.id;
  };

  const clearSignature = () => {
    if (signaturePad.current) {
      signaturePad.current.clear();
      setHasSignature(false);
      setError("");
    }
  };

  const handleSignatureChange = () => {
    if (signaturePad.current) {
      setHasSignature(!signaturePad.current.isEmpty());
      setError("");
    }
  };

  const handleTermsChange = (e) => {
    setTermsAccepted(e.target.checked);
    setError("");
  };

  const removeNullValues = (obj) => {
    if (!obj || typeof obj !== "object") return obj;

    const cleanObj = {};

    Object.entries(obj).forEach(([key, value]) => {
      // Only add the key-value pair if value is not null or undefined
      if (value !== null && value !== undefined) {
        // If value is an object, recursively clean it
        if (typeof value === "object" && !Array.isArray(value)) {
          cleanObj[key] = removeNullValues(value);
        } else if (Array.isArray(value)) {
          // If value is an array, map through and clean each item
          cleanObj[key] = value.map((item) =>
            typeof item === "object" ? removeNullValues(item) : item
          );
        } else {
          cleanObj[key] = value;
        }
      }
    });

    return cleanObj;
  };

  const imageUpload = async () => {
    const signatureData = signaturePad.current.toDataURL("image/png");

    // Convert base64 to File object
    const byteCharacters = atob(signatureData.split(",")[1]);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "image/png" });

    // Create File object
    const file = new File([blob], "signature.png", { type: "image/png" });

    // Prepare data for upload
    const data = {
      media_type: "signature_image",
      file_type: "png",
      file: file,
      fieldKeyName: "image",
      ocrModule: true,
    };

    return dispatch(UploadImageFile(data));
  };

  const handleNext = async () => {
    if (!hasSignature) {
      playBeep();
      Swal.fire({
        // title: t("Please_enter_code"),
        text: t("Please_provide_signature"),
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
    if (!termsAccepted) {
      playBeep();
      Swal.fire({
        // title: t("Please_enter_code"),
        text: t("Please_accept_terms_conditions"),
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

    const uplaodImage = await imageUpload();

    const businessSourceId = activeBusinessSourceList?.length
      ? activeBusinessSourceList?.find((x) => x.code_name === "kiosk")?.id
      : null;
    const bookingStatusId = activeBookingStatusList?.length
      ? activeBookingStatusList?.find((x) => x.code_name === "checked_in")?.id
      : null;
    const bookingStatusConfirmId = activeBookingStatusList?.length
      ? activeBookingStatusList?.find((x) => x.code_name === "confirmed")?.id
      : null;
    const bookingTypeId = activeBookingTypeList?.length
      ? activeBookingTypeList?.find((x) => x.code_name === "guest")?.id
      : null;

    if (TermsAndCondition === "checkin") {
      const updatePayload = {
        // guest: {
        //   profile_picture: profilePicture,
        // },
        booking: {
          id: booking?.id || selectedBookingData?.booking_details?.[0]?.booking?.id,
          status_id: bookingStatusId,
        },
        booking_room: [
          {
            roomtype_id: getBookingDetailsData?.booking_room?.[0]?.roomtype_id,
            rooms: [
              {
                room_id:
                  roomData?.room_id ||
                  getBookingDetailsData?.booking_room?.[0]?.rooms?.[0]?.room_id,
                booking_room_id:
                  getBookingDetailsData?.booking_room?.[0]?.rooms?.[0]
                    ?.booking_room_id,
              },
            ],
          },
        ],
      };
      const resultActionUpdate = await dispatch(
        updateBookingDetails(updatePayload)
      );
      if (updateBookingDetails.fulfilled.match(resultActionUpdate)) {
        const newBookingData = resultActionUpdate?.payload?.[0];
        setSessionItem(
          "bookingId",
          booking?.id || selectedBookingData?.booking_details?.[0]?.booking?.id
        );

        // const RoomX = 
        //   roomData?.room_number ||
        //   getBookingDetailsData?.booking_room?.[0]?.rooms?.[0]?.room_;

        // const formatDateTime = (date, time) =>
        //   date.replace(/-/g, "") + time.replace(/:/g, "").slice(0, 4);
        // const formattedCheckInDateTime =
        //   check_In_Date && check_In_Time
        //     ? formatDateTime(check_In_Date, check_In_Time)
        //     : "";
        // const formattedCheckOutDateTime =
        //   check_Out_Date && check_Out_Time
        //     ? formatDateTime(check_Out_Date, check_Out_Time)
        //     : "";
        dispatch(setIsBookingUpdate(false));
        // navigate("/check-in/key-receipt", {
        navigate("/check-in/payment-method", {
          state: {
            keyData: newBookingData,
          },
        });
      }
    } else if (TermsAndCondition === "reservation") {
      const bookingRates =
        roomTypeData?.rate_details?.[0]?.rate_room_type?.[0]?.rate_in_details.map(
          (taxData) => ({
            rate_date: taxData.rate_final_date,
            final_rate: taxData.rate_final,
            base_rate: parseFloat(
              roomTypeData?.rate_details?.[0]?.rate_room_type?.[0]
                ?.rate_in_summary?.avg_rate_final
            ),
            rate_plan_id: roomTypeData?.rate_details?.[0]?.rate_plan_id,
            rate_room_type_id:
              roomTypeData?.rate_details?.[0]?.rate_room_type?.[0]
                ?.rate_room_type_id,
          })
        ) || [];

      const basePayload = {
        booking: {
          check_in_date: moment(checkInDate).format("YYYY-MM-DD") || null,
          check_in_time: check_In_Time || null,
          check_out_date: moment(checkOutDate).format("YYYY-MM-DD") || null,
          check_out_time: check_Out_Time || null,
          type_id: bookingTypeId,
          business_source_id: businessSourceId,
          // status_id:
          //   newKioskDeviceInfo == "demo"
          //     ? bookingStatusId
          //     : bookingStatusConfirmId,
          status_id: bookingStatusId,
        },
        guest: {
          first_name: userData?.firstName || customerData?.guest?.first_name,
          last_name: userData?.lastName || customerData?.guest?.last_name,
          phone_number: contactData?.phoneNumber
            ? contactData?.phoneNumber
            : null,
          email: contactData?.email ? contactData?.email : null,
          profile_picture: profilePicture,
          signature_image: singledatabaseImage?.image,
          vehicle_no: vehicleNumber || null,
          guest_document: {
            document_type_id:
              getBestMatchId(document_type?.doc_type) ||
              activeDocumentTypeList.find(
                (docName) => docName.short_name == "OTHER"
              )?.id,
            doc_number: document_type?.doc_number,
            issue_date: moment(document_type?.doc_issue_date).isValid()
              ? moment(document_type?.doc_issue_date).format("YYYY-MM-DD")
              : null,

            expiry_date: document_type?.doc_expire_date && moment(document_type.doc_expire_date).isValid()
              ? moment(document_type.doc_expire_date).format("YYYY-MM-DD")
              : null,

            date_of_birth: document_type?.date_of_birth && moment(document_type?.date_of_birth).isValid()
              ? moment(document_type.date_of_birth).format("YYYY-MM-DD")
              : null,
            full_name: `${document_type?.first_name} ${document_type?.last_name}`,
            first_name: document_type?.first_name,
            last_name: document_type?.last_name,
            address_line_first: document_type?.address_line_first,
            address_line_second: document_type?.address_line_second,
            city: document_type?.city,
            state: document_type?.state,
            zip_code: document_type?.zip_code,
            country: document_type?.country,
            front_image: getSessionItem("frontUploadImage"),
            // back_image: getSessionItem("backside_image"),
          },
        },
        booking_room: [
          {
            roomtype_id: roomTypeBookingData?.room_type_id,
            rooms: [
              {
                room_id: roomData?.room_id || null,
                adult_count: roomTypeData?.base_adult || 2,
                child_count: roomTypeData?.base_children || 0,
              },
            ],
            booking_rate: bookingRates,
            // [
            //   {
            //     rate_date:
            //       roomTypeData?.rate_details?.[0]?.rate_room_type?.[0]
            //         ?.rate_in_details[0]?.rate_final_date,
            //     base_rate: parseFloat(
            //       roomTypeData?.rate_details?.[0]?.rate_room_type?.[0]
            //         ?.rate_in_summary?.avg_rate_final
            //     ),
            //     final_rate: amountTotal,
            //     rate_plan_id: roomTypeData?.rate_details?.[0]?.rate_plan_id,
            //     rate_room_type_id:
            //       roomTypeData?.rate_details?.[0]?.rate_room_type?.[0]
            //         ?.rate_room_type_id,
            //   },
            // ],
          },
        ],
      };
      const addPayload = removeNullValues(basePayload);
      if (uplaodImage) {
        const resultAction = await dispatch(addNewBooking(addPayload));
        if (addNewBooking.fulfilled.match(resultAction)) {
          const newBookingData = resultAction?.payload?.[0];
          setSessionItem("bookingId", resultAction?.payload?.booking?.id);

          const updateAddon = {
            add_on: addon_payload,
            booking_id: resultAction?.payload?.booking?.id,
            room_id: roomData?.room_id,
            guest_id: resultAction?.payload?.booking?.guest_id,
          };
          if (addon_payload_ze?.length !== 0) {
            dispatch(addNewKioskAddOn(updateAddon));
          }
          dispatch(setIsBookingUpdate(false));
          navigate("/check-in/payment-method", {
            state: {
              keyData: newBookingData,
            },
          });
        }
      }
    }
  };

  const capitalizeFirstLetter = (str) =>
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

  // Function to format the date with only the first letter of month capitalized
  const formatDate = (date) => {
    const options = { day: "numeric", month: "short", year: "numeric" };
    const [month, day, year] = date
      .toLocaleDateString("en-US", options)
      .split(" ");

    return `${capitalizeFirstLetter(month)} ${day} ${year}`;
  };

  // Function to format the date with weekday and month capitalized correctly
  const formatSecondDate = (date) => {
    const options = {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    };
    const [weekday, month, day, year] = date
      .toLocaleDateString("en-US", options)
      .split(" ");

    return `${capitalizeFirstLetter(weekday)} ${capitalizeFirstLetter(
      month
    )} ${day} ${year}`;
  };

  const savedState = getSessionItem("addonState");
  const savedStateData = savedState ? JSON.parse(savedState) : {};


  const formatAmount = (amount) => {
    return !isNaN(amount) ? Number(amount).toFixed(2) : "0.00";
  };

  return (
    <>
      <div className="my-auto">
        <div
          className="d-flex align-items-end justify-content-between gap-5 mb-5"
          data-aos="fade-up"
          data-aos-delay="500"
        >
          <h1 className="heading-h1 max-500 mb-0">
            {t("Please_confirm_your_reservation")}
          </h1>
          <h3 className="heading-s3 max-500 mb-0">
            {t("Please_sign_and_agree")}
          </h3>
        </div>

        <div
          className="custom-card mb-5"
          data-aos="fade-up"
          data-aos-delay="1000"
        >
          <div className="custom-card-wrap p-3">
            <div className="revirew-box p-4">
              <h2 className="font-poppins">
                {`${formatDate(checkInDate)} - ${formatDate(
                  checkOutDate
                )} (${nights} Nights)`}{" "}
                <br />
                {roomTypeData?.roomtype_name}
              </h2>
              <div className="black-border-bottom"></div>
              {[...Array(nights)]?.map((_, index) => {
                const date = new Date(checkInDate);
                date.setDate(date.getDate() + index);
                return (
                  <div
                    key={index}
                    className="d-flex align-items-center justify-content-between"
                  >
                    <h2>{formatSecondDate(date)}</h2>
                    <h2 className="white-text">
                      {currencySymbol?.symbol || currency}
                      {formatAmount(
                        getBookingDetailsData?.booking?.total_charge ??
                        totalCharge
                      )}{" "}
                      {currencySymbol?.code_name?.toUpperCase()}
                    </h2>
                  </div>
                );
              })}
              <div className="d-flex align-items-center justify-content-between">
                <h2 className="mb-0">{t("Taxes_and_Fees")}</h2>
                <h2 className="white-text mb-0">
                  {currencySymbol?.symbol || currency}
                  {parseFloat(
                    getBookingDetailsData?.booking?.total_tax
                      ? getBookingDetailsData?.booking?.total_tax
                      : totalTax
                  ).toFixed(2)}{" "}
                  {currencySymbol?.code_name?.toUpperCase()}
                </h2>
              </div>
              {savedStateData?.addonTotal && (
                <div className="d-flex align-items-center justify-content-between">
                  <h2 className="mb-0">{t("Total_Add_on_Charges")}</h2>
                  <h2 className="white-text mb-0">
                    {currencySymbol?.symbol || currency}
                    {parseFloat(savedStateData?.addonTotal).toFixed(2)}{" "}
                    {currencySymbol?.code_name?.toUpperCase()}
                  </h2>
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          className="custom-card total-box-section mb-5"
          data-aos="fade-up"
          data-aos-delay="1000"
        >
          <div className="custom-card-wrap total-box d-flex align-items-center justify-content-between p-4">
            <div className="d-flex align-items-center gap-3">
              <img src={getImageSrc("AccountIcon")} alt="account" />
              <h2 className="mb-0">{t("Total_amount_due")}</h2>
            </div>
            <h2 className="blue-text mb-0">
              {currencySymbol?.symbol || currency}
              {amountTotal?.toFixed(2) || booking?.total_charge}
            </h2>
          </div>
        </div>

        <div
          className="custom-card sign-section mb-4"
          data-aos="fade-up"
          data-aos-delay="1500"
        >
          <div className="custom-card-wrap p-4">
            <div className="position-relative before-box">
              <SignaturePad
                ref={signaturePad}
                canvasProps={{
                  className: "canvas-box signature-pad",
                  height: 250,
                }}
                onEnd={handleSignatureChange}
              />
              {hasSignature && !bookingLoading && !imgLoading && (
                <button
                  className="delete-btn text-light"
                  onClick={clearSignature}
                  type="button"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="text-danger mb-3" data-aos="fade-up">
            {error}
          </div>
        )}

        <h3
          className="sign-text text-end"
          data-aos="fade-up"
          data-aos-delay="2000"
        >
          {t("By_signing_this")}
        </h3>

        <label
          className="custom-checkbox mb-3"
          data-aos="fade-up"
          data-aos-delay="2500"
        >
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={handleTermsChange}
            id="termsCheckbox"
            disabled={bookingLoading || imgLoading}
          />
          <span className="checkmark"></span>
          <span
            onClick={() => setTermModalShow(true)}
            className="text-decoration-underline"
          >
            {t("hotel_policies")}
          </span>
        </label>

        <div
          className="d-flex align-items-center justify-content-end"
          data-aos="fade-up"
          data-aos-delay="3000"
        >
          <button
            className="common-btn blue-btn"
            onClick={() => {
              handleNext();
            }}
            disabled={bookingLoading || imgLoading}
          >
            {bookingLoading || imgLoading ? (
              <span className="d-flex align-items-center">
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                />
                <span> {t("Next")}...</span>
              </span>
            ) : (
              <span> {t("Next")}</span>
            )}
          </button>
        </div>
      </div>
      <TermsModal show={termModalShow} onHide={() => setTermModalShow(false)} />
    </>
  );
};

export default Signature;
