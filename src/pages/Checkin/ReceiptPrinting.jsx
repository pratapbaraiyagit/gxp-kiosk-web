"use client";

import Aos from "aos";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getSessionItem } from "../../hooks/session";
import moment from "moment/moment";
import { playSafeAudio } from "../../utils/commonFun";

const ReceiptPrinting = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const receiptRef = useRef(null);

  const { activeBookingList, referenceNumber } = useSelector(
    ({ booking }) => booking
  );
  const booking = activeBookingList?.[0];
  const roomtype = getSessionItem("room_type");
  const roomTypeData = JSON.parse(roomtype);
  const room = getSessionItem("room");
  const roomData = JSON.parse(room);

  const parking = getSessionItem("parking");
  const check_In_Date = getSessionItem("checkInDate");
  const check_Out_Date = getSessionItem("checkOutDate");
  const checkInDate = booking?.check_in_date
    ? moment(booking?.check_in_date)
    : moment(check_In_Date);
  const checkOutDate = booking?.check_out_date
    ? moment(booking?.check_out_date)
    : moment(check_Out_Date);

  const roomNumber = roomData?.room_number || booking?.room_number || "114";

  const userData = getSessionItem("hotelKiosk");
  const userSession = userData
    ? JSON.parse(decodeURIComponent(escape(atob(userData))))
    : null;

  const selfieGetData = getSessionItem("SelfieGetData");
  const customerData = JSON.parse(selfieGetData);
  const documentType = getSessionItem("document_type");
  const documentTypeData = JSON.parse(documentType);
  const customer_data = booking || customerData;

  const fullName = `${customer_data?.guest?.first_name ||
    userData?.firstName ||
    documentTypeData?.first_name ||
    ""
    } ${customer_data?.guest?.last_name ||
    userData?.lastName ||
    documentTypeData?.last_name ||
    ""
    }`.trim();

  // SINGLE PRINT PROTECTION
  const printExecutedRef = useRef(false);
  const [printStatus, setPrintStatus] = useState("pending");

  // Single print function - SIMPLIFIED
  const printReceipt = () => {
    if (printExecutedRef.current || printStatus !== "pending") {
      return;
    }

    // SET FLAG IMMEDIATELY
    printExecutedRef.current = true;
    setPrintStatus("printing");

    try {
      const iframe = document.createElement("iframe");
      iframe.style.position = "absolute";
      iframe.style.top = "-1000px";
      iframe.style.left = "-1000px";
      iframe.style.width = "0px";
      iframe.style.height = "0px";
      iframe.style.border = "none";
      document.body.appendChild(iframe);

      const receiptContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Motel 6 Receipt - Room ${roomNumber}</title>
            <style>
                @media print {
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                        font-size: 11px !important;
                        line-height: 1.2 !important;
                        -webkit-print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }
                    .receipt {
                        width: 80mm !important;
                        height: auto !important;
                        margin: 0 !important;
                        padding: 8mm !important;
                        box-sizing: border-box !important;
                        box-shadow: none !important;
                        border: none !important;
                        page-break-inside: avoid !important;
                    }
                    @page {
                        size: 80mm auto;
                        margin: 0;
                    }
                }
                
                body {
                    font-family: 'Arial', sans-serif;
                    font-size: 12px;
                    line-height: 1.4;
                    margin: 0;
                    padding: 20px;
                    background: #f5f5f5;
                    color: #000;
                }
                
                .receipt {
                    width: 80mm;
                    min-height: 150mm;
                    background: white;
                    margin: 0 auto;
                    padding: 10mm;
                    box-sizing: border-box;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                    position: relative;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                }
                
                .header-section {
                    text-align: center;
                    margin-bottom: 15px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #333;
                }
                
                .motel-name {
                    font-size: 18px;
                    font-weight: bold;
                    color: #000;
                    margin: 8px 0;
                    letter-spacing: 2px;
                }
                
                .contact-info {
                    font-size: 10px;
                    color: #333;
                    line-height: 1.5;
                }
                
                .room-banner {
                    text-align: center;
                    padding: 12px 0;
                    margin: 15px 0;
                    font-size: 20px;
                    font-weight: bold;
                    letter-spacing: 3px;
                    border: 3px solid #000;
                    background: white;
                    color: #000;
                    border-radius: 4px;
                }
                
                .guest-info {
                    margin: 15px 0;
                    padding: 10px;
                    border: 2px solid #666;
                    background: #f9f9f9;
                    border-radius: 4px;
                }
                
                .guest-info p {
                    margin: 4px 0;
                    font-size: 10px;
                    line-height: 1.6;
                }
                
                .guest-label {
                    font-weight: bold;
                    color: #000;
                    display: inline-block;
                    min-width: 80px;
                }
                
                .section-title {
                    font-weight: bold;
                    font-size: 12px;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    text-align: center;
                }
                
                .footer {
                    text-align: center;
                    margin-top: 20px;
                    padding-top: 15px;
                    border-top: 2px solid #333;
                }
                
                .thank-you {
                    font-size: 18px;
                    font-weight: bold;
                    margin-bottom: 10px;
                    color: #000;
                    letter-spacing: 1px;
                }
                
                .generation-time {
                    font-size: 10px;
                    margin-top: 10px;
                    color: #999;
                }
            </style>
        </head>
        <body>
            <div class="receipt">
                <div class="header-section">
                    <img src="${userSession?.hotel?.logo
        }" alt="logo" width="50%" />
                    <div class="motel-name">${userSession?.hotel?.hotel_name
        }</div>
                    <div class="contact-info">
                        ${userSession?.hotel?.address} ${userSession?.hotel?.city
        } ${userSession?.hotel?.state} ${userSession?.hotel?.country}<br>
                        Phone: ${userSession?.hotel?.phone_number}<br>
                        Email: ${userSession?.hotel?.billing_email}
                    </div>
                </div>

                <div class="room-banner">
                    ROOM ${roomNumber}
                </div>

                <div class="guest-info">
                    <div class="section-title">Guest Information</div>
                    <p><span class="guest-label">Name:</span> ${fullName || "N/A"
        }</p>
                    <p><span class="guest-label">Check-in:</span> ${checkInDate.format(
          "DD MMM YYYY"
        )}</p>
                    <p><span class="guest-label">Check-out:</span> ${checkOutDate.format(
          "DD MMM YYYY"
        )}</p>
                    <p><span class="guest-label">Ref Number:</span> ${booking?.reference_no || referenceNumber
        }</p>
                    <p><span class="guest-label">Room Type:</span> ${roomTypeData?.roomtype_name ||
        booking?.roomtype_name ||
        "Standard"
        }</p>
                </div>

                <div class="footer">
                    <div class="thank-you">🙏 THANK YOU! 🙏</div>
                    <div class="generation-time">
                        Generated: ${moment().format("DD MMM YYYY, hh:mm A")}
                    </div>
                </div>
            </div>
            
            <!-- NO JAVASCRIPT - REMOVED ALL PRINT SCRIPTS -->
        </body>
        </html>
      `;

      // Write content and wait for load
      iframe.contentDocument.open();
      iframe.contentDocument.write(receiptContent);
      iframe.contentDocument.close();

      // ONLY ONE PRINT CALL - Wait for content to load
      iframe.onload = () => {
        setTimeout(() => {
          try {
            iframe.contentWindow.focus();
            iframe.contentWindow.print(); // SINGLE PRINT CALL
          } catch (error) {
            // console.log("Print completed or error:", error);
          }

          setPrintStatus("completed");

          // Cleanup
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 2000);
        }, 500);
      };
    } catch (error) {
      setPrintStatus("completed");
    }
  };

  // SINGLE useEffect with delay to prevent double execution
  useEffect(() => {
    playSafeAudio("print_check_in_rec");
    // Add delay to avoid React StrictMode double execution
    const timer = setTimeout(() => {
      if (!printExecutedRef.current && printStatus === "pending") {
        // printReceipt();
      }
    }, 200); // Small delay prevents double execution

    return () => clearTimeout(timer);
  }, []); // Empty dependency array

  // Initialize AOS
  useEffect(() => {
    Aos.init({
      duration: 1000,
      once: true,
      easing: "ease-in-out",
    });
  }, []);

  // Navigate after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      if (parking === "Yes") {
        navigate("/check-in/parking-receipt");
      } else {
        navigate("/check-in/thank-you");
      }
    }, 4500);

    return () => clearTimeout(timer);
  }, [parking, navigate]);

  return (
    <>
      <div className="my-auto">
        <div className="d-flex align-items-center justify-content-center gap-3 mb-5">
          <div className="spinner-border spinner-border-blue" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <h3 className="fs-52 text-center mb-0">
            {t("Printing_your_receipt_now")}
          </h3>
        </div>

        <div
          className="substract-bg thank-you-section d-flex flex-column pb-5"
          data-aos="fade-down"
          data-aos-delay="1000"
        >
          <div className="list-section">
            <div className="d-flex align-items-center justify-content-between">
              <h3>{t("Ref_Number")}</h3>
              <h3 className="text-gray">
                {booking?.reference_no || referenceNumber}
              </h3>
            </div>
            <div className="bottom-border-gray"></div>
            <div className="d-flex align-items-center justify-content-between">
              <h3>{t("Room_Type")}</h3>
              <h3 className="text-gray">
                {roomTypeData?.roomtype_name || booking?.roomtype_name}
              </h3>
            </div>
            <div className="bottom-border-gray"></div>
            <div className="d-flex align-items-center justify-content-between">
              <h3>{t("Checkin_date")}</h3>
              <h3 className="text-gray">
                {checkInDate.format("DD MMMM YYYY")}
              </h3>
            </div>
            <div className="bottom-border-gray"></div>
            <div className="d-flex align-items-center justify-content-between">
              <h3>{t("Checkout_date")}</h3>
              <h3 className="text-gray">
                {checkOutDate.format("DD MMMM YYYY")}
              </h3>
            </div>
            <div className="bottom-border-gray"></div>
            <h3 className="d-flex align-items-center justify-content-center text-center mb-0">
              <span className="me-3">{t("Your_room_number")}</span>
              <span className="fs-86">
                {roomData?.room_number || booking?.room_number}
              </span>
            </h3>
          </div>
          <h4 className="thankyou-text">{t("Thank_you_nice_day")}</h4>
        </div>
      </div>
    </>
  );
};

export default ReceiptPrinting;
