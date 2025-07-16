import React from "react";
import { Routes, Route } from "react-router-dom";
import { lazy } from "react";
import SplashScreen from "../pages/SplashScreen";
import SelfieSplashScreen from "../pages/SelfieSplashScreen";
import LaneClosedScreen from "../pages/LaneClosedScreen";
import UnProtectedRoute from "./UnProtectedRoute.config.js";
import { hasAccess } from "../utils/commonFun.js";
import { getSessionItem } from "../hooks/session.js";
import PrivateRoute from "./PrivateRoutes.js";
import NotFound from "../components/NotFound.jsx";

const Login = lazy(() => import("../pages/auth/Login"));

const Setting = lazy(() => import("../pages/setting"));
const ReviewConfirmation = lazy(() =>
  import("../pages/Walkin/ReviewConfirmation")
);
const ReviewConfirmations = lazy(() =>
  import("../pages/Walkin/ReviewConfirmations")
);
const HomeScreen = lazy(() => import("../pages/HomeScreen"));
const ScanProof = lazy(() => import("../pages/Checkin/ScanProof"));
const AgentScanProof = lazy(() => import("../pages/Checkin/AgentScanProof"));
const AgentContactInformation = lazy(() =>
  import("../pages/Checkin/AgentContactInformation")
);
const EarlyCheckin = lazy(() => import("../pages/Checkin/EarlyCheckin"));
const ConfirmationCode = lazy(() =>
  import("../pages/Checkin/ConfirmationCode")
);
const GuestName = lazy(() => import("../pages/Checkin/GuestName"));
const TermsCondition = lazy(() => import("../pages/Checkin/TermsCondition"));
const FindBooking = lazy(() => import("../pages/Checkin/FindBooking"));
const ContactInformation = lazy(() =>
  import("../pages/Checkin/ContactInformation")
);
const Addon = lazy(() => import("../pages/Checkin/Addon"));
const QuestionPage = lazy(() => import("../pages/Checkin/QuestionPage"));
const Room = lazy(() => import("../pages/Checkin/Room"));
const BookingPaymentMethod = lazy(() =>
  import("../pages/Checkin/BookingPaymentMethod.jsx")
);
const PaymentCreditCard = lazy(() =>
  import("../pages/Checkin/PaymentCreditCard")
);
const AgentPaymentCreditCard = lazy(() =>
  import("../pages/Checkin/AgentPaymentCreditCard")
);
const AgentPaymentTerminal = lazy(() =>
  import("../pages/Checkin/AgentPaymentTerminal")
);
const Signature = lazy(() => import("../pages/Checkin/Signature"));
const AgentSignature = lazy(() =>
  import("../pages/Checkin/AgentSignature.jsx")
);
const MobileKeyReceipt = lazy(() =>
  import("../pages/Checkin/MobileKeyReceipt")
);
const AgentMobileKeyReceipt = lazy(() =>
  import("../pages/Checkin/AgentMobileKeyReceipt")
);
const ReceiptPrinting = lazy(() => import("../pages/Checkin/ReceiptPrinting"));
const ParkingReceipt = lazy(() =>
  import("../pages/Checkin/ParkingReceipt.jsx")
);
const ThankYou = lazy(() => import("../pages/Checkin/ThankYou.jsx"));
const SelectRoomType = lazy(() =>
  import("../pages/Checkin/SelectRoomType.jsx")
);
const VehicalInfo = lazy(() => import("../pages/Checkin/VehicalInfo.jsx"));
const CheckInVehicalInfo = lazy(() =>
  import("../pages/Checkin/CheckInVehicalInfo.jsx")
);
const Pickup = lazy(() => import("../pages/PickupKey/Pickup.jsx"));
const Selfie = lazy(() => import("../pages/PickupKey/Selfie.jsx"));
const CheckInSelfie = lazy(() =>
  import("../pages/PickupKey/CheckInSelfie.jsx")
);
const AgentThankYou = lazy(() => import("../pages/Checkin/AgentThankYou.jsx"));
const NearByPlace = lazy(() => import("../pages/NearByPlace/NearByPlace.jsx"));
const NearByPlaceDetails = lazy(() =>
  import("../pages/NearByPlace/NearByPlaceDetails.jsx")
);
const HotelMap = lazy(() => import("../pages/NearByPlace/HotelMap.jsx"));
const HotelInfo = lazy(() => import("../pages/HotelInfo/HotelInfo.jsx"));
const HotelInfoDetails = lazy(() =>
  import("../pages/HotelInfo/HotelInfoDetails.jsx")
);
const Feedback = lazy(() => import("../pages/Feedback/Feedback.jsx"));
const FlightSchedule = lazy(() =>
  import("../pages/FlightSchedule/FlightSchedule.jsx")
);

const FindRoom = lazy(() => import("../pages/Checkout/FindRoom.jsx"));
const RoomKey = lazy(() => import("../pages/Checkout/RoomKey.jsx"));

const AppRouter = () => {
  const userData = getSessionItem("UserSessionKiosk");
  const userSession = userData
    ? JSON.parse(decodeURIComponent(escape(atob(userData))))
    : null;

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <UnProtectedRoute>
            <Login />
          </UnProtectedRoute>
        }
      />
      {hasAccess(userSession, ["hotel_admin"]) && (
        <>
          <Route
            path="/setting"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <Setting />
              </PrivateRoute>
            }
          />
          <Route
            path="/home"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <HomeScreen />
              </PrivateRoute>
            }
          />
          <Route
            path="/splash"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <SplashScreen />
              </PrivateRoute>
            }
          />
          <Route
            path="/selfie-splash"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <SelfieSplashScreen />
              </PrivateRoute>
            }
          />
          <Route
            path="/lane-closed"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <LaneClosedScreen />
              </PrivateRoute>
            }
          />
          <Route
            path="/check-in/terms-condition"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <TermsCondition />
              </PrivateRoute>
            }
          />
          <Route
            path="/check-in/find-booking"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <FindBooking />
              </PrivateRoute>
            }
          />
          <Route
            path="/check-in/guest-name"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <GuestName />
              </PrivateRoute>
            }
          />
          <Route
            path="/check-in/confirmation-code"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <ConfirmationCode />
              </PrivateRoute>
            }
          />
          <Route
            path="/check-in/early-checkin"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <EarlyCheckin />
              </PrivateRoute>
            }
          />
          <Route
            path="/check-in/scan-proof"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <ScanProof />
              </PrivateRoute>
            }
          />
          <Route
            path="/agent-check-in/scan-proof"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <AgentScanProof />
              </PrivateRoute>
            }
          />
          <Route
            path="/agent-check-in/contact-information"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <AgentContactInformation />
              </PrivateRoute>
            }
          />
          <Route
            path="/check-in/contact-information"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <ContactInformation />
              </PrivateRoute>
            }
          />
          <Route
            path="/walk-in/review-confirmation"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <ReviewConfirmation />
              </PrivateRoute>
            }
          />
          <Route
            path="/walk-in/review-confirmations"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <ReviewConfirmations />
              </PrivateRoute>
            }
          />
          <Route
            path="/check-in/questions"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <QuestionPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/check-in/addon"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <Addon />
              </PrivateRoute>
            }
          />
          <Route
            path="/check-in/room-number"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <Room />
              </PrivateRoute>
            }
          />
          <Route
            path="/check-in/payment-method"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <BookingPaymentMethod />
              </PrivateRoute>
            }
          />
          <Route
            path="/check-in/payment"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <PaymentCreditCard />
              </PrivateRoute>
            }
          />
          <Route
            path="/agent-check-in/payment"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <AgentPaymentCreditCard />
              </PrivateRoute>
            }
          />
          <Route
            path="/agent-check-out/payment"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <AgentPaymentCreditCard />
              </PrivateRoute>
            }
          />
          <Route
            path="/agent-terminal/payment"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <AgentPaymentTerminal />
              </PrivateRoute>
            }
          />
          <Route
            path="/check-out/payment"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <PaymentCreditCard />
              </PrivateRoute>
            }
          />
          <Route
            path="/check-in/signature"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <Signature />
              </PrivateRoute>
            }
          />
          <Route
            path="/agent-check-in/signature"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <AgentSignature />
              </PrivateRoute>
            }
          />

          <Route
            path="/agent-check-in/key-receipt"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <AgentMobileKeyReceipt />
              </PrivateRoute>
            }
          />
          <Route
            path="/check-in/key-receipt"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <MobileKeyReceipt />
              </PrivateRoute>
            }
          />
          <Route
            path="/check-in/receipt-print"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <ReceiptPrinting />
              </PrivateRoute>
            }
          />
          <Route
            path="/check-in/parking-receipt"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <ParkingReceipt />
              </PrivateRoute>
            }
          />
          <Route
            path="/check-in/thank-you"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <ThankYou />
              </PrivateRoute>
            }
          />
          <Route
            path="/agent-check-in/vehical"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <VehicalInfo />
              </PrivateRoute>
            }
          />
          <Route
            path="/check-in/vehical"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <CheckInVehicalInfo />
              </PrivateRoute>
            }
          />
          <Route
            path="/walk-in/room-type"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <SelectRoomType />
              </PrivateRoute>
            }
          />
          <Route
            path="/pickup"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <Pickup />
              </PrivateRoute>
            }
          />
          <Route
            path="/selfie"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <CheckInSelfie />
              </PrivateRoute>
            }
          />
          <Route
            path="/agent-selfie"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <Selfie />
              </PrivateRoute>
            }
          />
          <Route
            path="/agent/check-in/thank-you"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <AgentThankYou />
              </PrivateRoute>
            }
          />
          <Route
            path="/near-by-place"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <NearByPlace />
              </PrivateRoute>
            }
          />
          <Route
            path="/near-by-place/details"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <NearByPlaceDetails />
              </PrivateRoute>
            }
          />
          <Route
            path="/hotel-map"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <HotelMap />
              </PrivateRoute>
            }
          />
          <Route
            path="/hotel-info"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <HotelInfo />
              </PrivateRoute>
            }
          />
          <Route
            path="/hotel-info/details"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <HotelInfoDetails />
              </PrivateRoute>
            }
          />
          <Route
            path="/feedback"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <Feedback />
              </PrivateRoute>
            }
          />
          <Route
            path="/flight-schedule"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <FlightSchedule />
              </PrivateRoute>
            }
          />
          <Route
            path="/check-out/find-room"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <FindRoom />
              </PrivateRoute>
            }
          />
          <Route
            path="/check-out/room-key"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <RoomKey />
              </PrivateRoute>
            }
          />
          <Route
            path="*"
            element={
              <PrivateRoute roles={["hotel_admin"]}>
                <NotFound />
              </PrivateRoute>
            }
          />
        </>
      )}
    </Routes>
  );
};

export default AppRouter;
