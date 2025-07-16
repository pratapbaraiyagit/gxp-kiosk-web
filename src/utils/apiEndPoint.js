export const authKioskLogin = "auth/kiosk-login";
export const authRefreshToken = "auth/access-token";
export const authFingerPrint = "kiosk/fingerprint";
export const authFingerPrintReset = "kiosk/reset-fingerprint";
export const bookingAPI = "booking/booking";
export const bookingCheckoutAPI = "booking/checkout";
export const imageUploadAPI = "app/s3-media";
export const bookingAvailabilityAPI = "booking/booking-room-availability";
export const businessSourceAPI = "booking/business-source";
export const bookingStatusAPI = "booking/booking-status";
export const guestAPI = "hotel/guest";
export const guestCategoryAPI = "hotel/guest-categories";
export const bookingTypeAPI = "booking/booking-type";
export const bookingRoomAvailabileAPI = "/booking/booking-room-available";
export const hotelRoomTypeAPI = "hotel/room-type";
export const hotelTermsConditionAPI = "hotel/terms-condition";
export const hotelDocumentTypeAPI = "hotel/document-type";
export const guestPayment = "account/guest-payment";
export const payment = "account/payment";
export const paymentMethod = "account/payment-method";
export const currency = "account/currency";
export const timeZoneAPI = "app/timezone";
export const paymentGatewayMetaAPI = "/account/meta-payment-gateway";
export const paymentGatewayAPI = "/account/payment-gateway";
export const paymentTerminalsAPI = "/account/payment-terminals";
export const gatewayTransactionMapAPI = "/account/gateway-transaction-mapping";
export const paymentLogTransactionAPI = "/proxygateway/payment-log-transaction";
export const paymentProxyTokenAPI = "/proxygateway/get-accesstoken";
export const paymentProxyMerchentAPI = "/proxygateway/merchant-details";
export const paymentDeviceStatusAPI = "/proxygateway/devices-get-status";
export const authorizationBookingAPI = "/proxygateway/authorization";
export const ratingBookingAPI = "/booking/guest-feedback";
export const bookingPaymentAPI = "booking/payment";
export const bookingPaymentRefundAPI = "booking/payment/refund";
export const hotelSourcePaymentPolicyAPI =
  "inventory/hotel/source-payment-policy-config";

export const hotelAddOnAPI = "/inventory/hotel/add-on";
export const kioskAddOnAPI = "/booking/add-on";
export const kioskAudioAPI = "/inventory/kiosk-audio";

export const cardTypeAPI = "/inventory/card-type";
export const idScannerMQTT = "/mqtt-command/idscanner";
export const keyEncoderMQTT = "/mqtt-command/keyencoder";
export const keyDispenserMQTT = "/mqtt-command/keydispense";
export const cashRecyclerMQTT = "/mqtt-command/cashrecycler";
export const printerMQTT = "/mqtt-command/printer";
export const serviceStatusMQTT = "/mqtt-command/servicestatus";
export const terminalCardAPI = "proxygateway/devices-get-status";
export const terminalPaymentAPI = "proxygateway/sale-purchase";

//kiosk
export const kioskSettingAPI = "user/kiosk-user";
export const kioskDeviceAPI = "kiosk/device";
export const kioskSubDeviceAPI = "kiosk/sub-device";
export const kioskDeviceConfigAPI = "kiosk/device-config";
export const kioskMetaDeviceConfigAPI = "kiosk/meta-device-config";
export const kioskSubDeviceConfigAPI = "kiosk/sub-device-config";
export const kioskMetaKioskModelAPI = "kiosk/meta-kiosk-model";
export const kioskQADeskAPI = "kiosk/question";
export const kioskQuestionActionAPI = "kiosk/question-action";
export const kioskAnswerAPI = "kiosk/answers";

//calling
export const agentMQTT = "/mqtt-command/console/agent";
export const kioskMQTT = "/mqtt-command/console/kiosk";
export const callMQTT = "/mqtt-command/console/call";

export const kioskCallMQTT = "/mqtt-command/kiosk/call";

//agent user
export const agentUserMQTT = "/mqtt-command/kiosk/console";
export const kioskAgentMQTT = "/mqtt-command/kiosk/agent";
export const loginSearchBookingAPI = "/booking/search-kiosk-booking";
