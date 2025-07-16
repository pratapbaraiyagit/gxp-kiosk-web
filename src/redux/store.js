import { configureStore } from "@reduxjs/toolkit";
import auth from "./reducers/UserLoginAndProfile/auth.js";
import image from "./reducers/ImageUploadFile/imageUploadFile.js";
import mqttReducer from "./reducers/MQTT/mqttSlice.js";
import booking from "./reducers/Booking/booking.js";
import bookingAvailability from "./reducers/Booking/bookingAvailability.js";
import guest from "./reducers/Booking/guest.js";
import hotelTermsCondition from "./reducers/Booking/hotelTermsCondition.js";
import documentType from "./reducers/Booking/documentType.js";
import hotelSourcePaymentPolicyConfig from "./reducers/Booking/hotelSourcePaymentPolicyConfig.js";
import paymentMethod from "./reducers/Booking/PaymentMethod.js";
import guestPayment from "./reducers/Booking/GuestPayment.js";
import payment from "./reducers/Booking/Payment.js";
import addOn from "./reducers/Booking/AddOn.js";
import kioskAddOn from "./reducers/Booking/kioskAddOn.js";
import cardType from "./reducers/Booking/CardType.js";
import paymentTerminal from "./reducers/Booking/PaymentTerminal.js";
import hotelRoomType from "./reducers/Booking/hotelRoomType.js";
import idScannerSlice from "./reducers/IDScanner/IDScanner.js";
import keyDispenserSlice from "./reducers/MQTT/keyDispenser.js";
import keyEncoderSlice from "./reducers/MQTT/keyEncoder.js";
import cashRecyclerSlice from "./reducers/MQTT/cashRecycler.js";
import printSlice from "./reducers/MQTT/printer.js";
import kioskDevice from "./reducers/Kiosk/KioskDevice.js";
import callMQTT from "./reducers/MQTT/callMQTT.js";
import terminalCard from "./reducers/Terminal/terminalCard.js";
import agentUserMQTT from "./reducers/MQTT/agentUserMQTT.js";
import kioskAgentMQTT from "./reducers/MQTT/kioskAgentMQTT.js";
import kioskQADesk from "./reducers/Kiosk/KioskQADesk.js";
import kioskAnswer from "./reducers/Kiosk/KioskAnswer.js";
import loginSearchBooking from "./reducers/Booking/loginSearchBooking.js";
import ratingBookingSlice from "./reducers/Booking/ratingBooking.js";
import KioskAudio from "./reducers/Booking/kioskAudio.js";

const store = configureStore(
  {
    reducer: {
      auth: auth,
      image: image,
      mqtt: mqttReducer,
      booking: booking,
      bookingAvailability: bookingAvailability,
      guest: guest,
      hotelTermsCondition: hotelTermsCondition,
      documentType: documentType,
      paymentTerminal: paymentTerminal,
      hotelSourcePaymentPolicyConfig: hotelSourcePaymentPolicyConfig,
      paymentMethod: paymentMethod,
      payment: payment,
      guestPayment: guestPayment,
      addOn: addOn,
      kioskAddOn: kioskAddOn,
      hotelRoomType: hotelRoomType,
      cardType: cardType,
      idScannerSlice: idScannerSlice,
      keyDispenserSlice: keyDispenserSlice,
      keyEncoderSlice: keyEncoderSlice,
      cashRecyclerSlice: cashRecyclerSlice,
      printSlice: printSlice,
      kioskDevice: kioskDevice,
      callMQTT: callMQTT,
      terminalCard: terminalCard,
      agentUserMQTT: agentUserMQTT,
      kioskAgentMQTT: kioskAgentMQTT,
      kioskQADesk: kioskQADesk,
      kioskAnswer: kioskAnswer,
      loginSearchBooking: loginSearchBooking,
      ratingBookingSlice: ratingBookingSlice,
      KioskAudio : KioskAudio
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          // Ignore mqtt client actions and state paths
          ignoredActions: ["mqtt/setClient"],
          ignoredActionPaths: ["payload.client"],
          ignoredPaths: ["mqtt.client"],
        },
      }),
    devTools: false, // Redux devtools false when live
  }
  // window.REDUX_DEVTOOLS_EXTENSION && window.REDUX_DEVTOOLS_EXTENSION()
);

export default store;
