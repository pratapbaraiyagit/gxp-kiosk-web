import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import Aos from "aos";
import { getSessionItem, setSessionItem } from "../../hooks/session";
import { getAddOnListData } from "../../redux/reducers/Booking/AddOn";
import { getKioskAddOnListData } from "../../redux/reducers/Booking/kioskAddOn";
import { getImageSrc } from "../../utils/bulkImageStorage";
import { Placeholder } from "react-bootstrap";
import { currency, currencyName, DummayAddon } from "../../utils/data";
import { playSafeAudio } from "../../utils/commonFun";

const Addon = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { activeBookingList } = useSelector(({ booking }) => booking);
  const { activeAddOnList, appAddOnLoading } = useSelector(
    ({ addOn }) => addOn
  );

  const { activeKioskAddOnList, kioskAddOnLoading } = useSelector(
    ({ kioskAddOn }) => kioskAddOn
  );
  const booking = activeBookingList?.[0];

  const KioskDeviceInfo = getSessionItem("KioskDeviceInfo");
  const KioskDeviceInfoSession = KioskDeviceInfo
    ? JSON.parse(decodeURIComponent(escape(atob(KioskDeviceInfo))))
    : null;
  const newKioskDeviceMode = KioskDeviceInfoSession?.[0]?.mode;

  const userData = getSessionItem("hotelKiosk");
  const userSession = userData
    ? JSON.parse(decodeURIComponent(escape(atob(userData))))
    : null;

  const { activeCurrencyList } = useSelector(
    ({ paymentMethod }) => paymentMethod
  );

  const currencySymbol = useMemo(() => {
    return activeCurrencyList?.find(
      (item) => item?.id === userSession?.hotel?.currency
    );
  }, [activeCurrencyList, userSession?.hotel?.currency]);

  useEffect(() => {
    if (activeAddOnList?.length === 0) {
      const param = {
          params: {
            is_active: true,
          },
        };
      dispatch(getAddOnListData(param));
    }
    if (booking?.id) {
      const param = {
        params: {
          booking_id: booking?.id,
        },
      };
      dispatch(getKioskAddOnListData(param));
    }
  }, [dispatch]);

  // Calculate number of nights
  const calculateNights = () => {
    if (!booking?.checkIn || !booking?.checkOut) return 1;
    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    const diffTime = Math.abs(checkOut - checkIn);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  };

  const numberOfNights = calculateNights();

  // Initialize states from session storage
 const getInitialState = () => {
  const savedState = getSessionItem("addonState");
  const earlyCheckinAddon = activeAddOnList?.find(
    (item) => item?.code_name === "early_check_in"
  );

  const defaultSelected = new Set();
  if (earlyCheckinAddon?.id) {
    defaultSelected.add(earlyCheckinAddon.id);
  }

  if (savedState) {
    const parsedState = JSON.parse(savedState);
    return {
      selectedAddons: new Set([
        ...parsedState.selectedAddons,
        ...(earlyCheckinAddon?.id ? [earlyCheckinAddon.id] : []),
      ]),
      baseAmount:
        parsedState.baseAmount ||
        parseFloat(getSessionItem("amountTotal") || "0"),
      addonTotal: parsedState.addonTotal || 0,
      totalAmount:
        parsedState.totalAmount ||
        parseFloat(getSessionItem("amountTotal") || "0"),
    };
  }

  return {
    selectedAddons: defaultSelected,
    baseAmount: parseFloat(getSessionItem("amountTotal") || "0"),
    addonTotal: 0,
    totalAmount: parseFloat(getSessionItem("amountTotal") || "0"),
  };
};


  const initialState = getInitialState();
  const [selectedAddons, setSelectedAddons] = useState(
    initialState.selectedAddons
  );
  const [baseAmount] = useState(initialState.baseAmount);
  const [addonTotal, setAddonTotal] = useState(initialState.addonTotal);
  const [totalAmount, setTotalAmount] = useState(initialState.totalAmount);

  // Initialize AOS
  useEffect(() => {
    Aos.init({
      duration: 1000,
      once: true,
      easing: "ease-in-out",
    });
    playSafeAudio("select_add_on");
  }, []);

  // Save state to session storage whenever it changes
  const saveStateToSession = (
    newSelectedAddons,
    newAddonTotal,
    newTotalAmount
  ) => {
    const stateToSave = {
      selectedAddons: Array.from(newSelectedAddons),
      baseAmount,
      addonTotal: newAddonTotal,
      totalAmount: newTotalAmount,
    };

    setSessionItem("addonState", JSON.stringify(stateToSave));
    setSessionItem("amountTotal", newTotalAmount.toFixed(2));

    // Save selected addons details
    const selectedServices = Array.from(newSelectedAddons)?.map((id) => {
      const addon = activeAddOnList?.find((item) => item.id === id);
      const total =
        addon?.period === "daily"
          ? addon?.total_amount * numberOfNights
          : addon?.total_amount;

      return {
        ...addon,
        quantity: 1,
        total,
        numberOfNights: addon?.period === "daily" ? numberOfNights : 1,
      };
    });

    setSessionItem("selectedServices", JSON.stringify(selectedServices));
  };

  // Calculate totals and update session storage
  useEffect(() => {
    const calculateTotals = () => {
      let newAddonTotal = 0;
      selectedAddons.forEach((id) => {
        const addon = activeAddOnList?.find((item) => item.id === id);
        if (addon) {
          const amount =
            addon?.period === "daily"
              ? addon?.total_amount * numberOfNights
              : addon?.total_amount;
          newAddonTotal += amount;
        }
      });

      const newTotalAmount = baseAmount + newAddonTotal;

      setAddonTotal(newAddonTotal);
      setTotalAmount(newTotalAmount);

      // Save to session storage
      saveStateToSession(selectedAddons, newAddonTotal, newTotalAmount);
    };

    calculateTotals();
  }, [selectedAddons, baseAmount, numberOfNights]);

  // Handle addon selection
  const handleAddonSelect = (id) => {
  const addon = activeAddOnList?.find((item) => item.id === id);
  if (addon?.code_name === "early_check_in") return; // prevent unselect

  setSelectedAddons((prev) => {
    const newSet = new Set(prev);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    return newSet;
  });
};


  const handleConfirm = () => {
    const selectedServices = Array.from(selectedAddons)?.map((id) => {
      const addon = activeAddOnList?.find((item) => item.id === id);
      // const total =
      //   addon?.period === "daily"
      //     ? addon?.amount * numberOfNights
      //     : addon?.amount;

      return {
        add_on_id: addon?.id,
        quantity: 1,
        base_amount: addon?.amount || 0,
        tax_amount: addon?.tax || 0,
        is_active: true,
      };
    });

    // Final calculations already saved in session storage
    setSessionItem("addonTotal", addonTotal.toFixed(2));
    setSessionItem("finalTotal", totalAmount.toFixed(2));
    setSessionItem("addonPayload", JSON.stringify(selectedServices));

    navigate("/check-in/room-number");
  };

  return (
    <div className="my-auto">
      <h1 className="heading-h1" data-aos="fade-up" data-aos-delay="500">
        {t("Select_Any_Additional_Service")}
      </h1>

      <div
        className="custom-card add-on-section mb-5"
        data-aos="zoom-in"
        data-aos-delay="500"
      >
        <div className="custom-card-wrap p-4">
          <div className="add-on-scroll p-1">
            <div className="row">
              {appAddOnLoading ? (
                <>
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div className="col-md-6 mb-3" key={index}>
                      <div className="border border-dark rounded-3 p-4  h-100">
                        <Placeholder as="div" animation="glow">
                          <Placeholder xs={8} className="mb-2" />
                          <Placeholder xs={12} className="mb-2" />
                          <Placeholder xs={10} />
                        </Placeholder>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                activeAddOnList?.map((product) => {
                  const isSelected = selectedAddons.has(product?.id);
                  const displayPrice =
                    product?.period === "daily"
                      ? `${
                          currencySymbol?.symbol || currency
                        }${product?.total_amount?.toFixed(2)} ${
                          currencySymbol?.code_name?.toUpperCase() ||
                          currencyName
                        } /${t("Night")} (${t("Total")}: ${
                          currencySymbol?.symbol || currency
                        }${(product?.total_amount * numberOfNights).toFixed(2)})`
                      : `${
                          currencySymbol?.symbol || currency
                        }${product?.total_amount?.toFixed(2)} ${
                          currencySymbol?.code_name?.toUpperCase() ||
                          currencyName
                        }`;


                  return (
                    <div className="col-md-6 mb-3" key={product?.id}>
                      <div
                        className={`add-on-card ${
                          isSelected ? "selected" : ""
                        }`}
                      >
                        <div className="d-flex align-items-center gap-3 mb-3">
                          <i className={product?.icon} />
                          <h4
                            className={`mb-0 ${
                              isSelected ? `green-success` : ""
                            }`}
                          >
                            {product?.add_on_name}
                          </h4>
                        </div>
                        <div className="d-flex align-items-center justify-content-between mb-4 gap-3">
                          <button
                            className="add-on-bg"
                            onClick={() => handleAddonSelect(product?.id)}
                            disabled={product?.code_name === "early_check_in"}
                          >
                            {isSelected ? t("Remove") : t("Add_On")}
                          </button>
                          <div className="add-on-text">
                            <h5 className="mb-0">{isSelected ? "01" : "00"}</h5>
                          </div>
                        </div>
                        <h5 className="mb-0">{displayPrice}</h5>
                      </div>
                    </div>
                  );
                })
              )}

              {activeAddOnList?.length === 0 &&
                newKioskDeviceMode === "demo" &&
                DummayAddon?.map((product) => {
                  const isSelected = selectedAddons.has(product?.id);
                  const displayPrice =
                    product?.period === "daily"
                      ? `${
                          currencySymbol?.symbol || currency
                        }${product?.total_amount?.toFixed(
                          2
                        )} ${currencySymbol?.code_name?.toUpperCase()} /${t(
                          "Night"
                        )} (${t("Total")}: ${
                          currencySymbol?.symbol || currency
                        }${(product?.total_amount * numberOfNights).toFixed(2)})`
                      : `${
                          currencySymbol?.symbol || currency
                        }${product?.total_amount?.toFixed(
                          2
                        )} ${currencySymbol?.code_name?.toUpperCase()}`;

                  return (
                    <div className="col-md-6 mb-3" key={product?.id}>
                      <div
                        className={`add-on-card ${
                          isSelected ? "selected" : ""
                        }`}
                      >
                        <div className="d-flex align-items-center gap-3 mb-3">
                          <i className={product?.icon} />
                          <h4
                            className={`mb-0 ${
                              isSelected ? `green-success` : ""
                            }`}
                          >
                            {product?.add_on_name}
                          </h4>
                        </div>
                        <div className="d-flex align-items-center justify-content-between mb-4 gap-3">
                          <button
                            className="add-on-bg"
                            onClick={() => handleAddonSelect(product?.id)}
                          >
                            {isSelected ? t("Remove") : t("Add_On")}
                          </button>
                          <div className="add-on-text">
                            <h5 className="mb-0">{isSelected ? "01" : "00"}</h5>
                          </div>
                        </div>
                        <h5 className="mb-0">{displayPrice}</h5>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      <div
        className="custom-card total-box-section mb-5"
        data-aos="fade-up"
        data-aos-delay="1500"
      >
        <div className="custom-card-wrap p-3">
          <div className="total-box align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-3">
              <img src={getImageSrc("AccountIcon")} alt="account" />
              <div className="flex-grow-1">
                {addonTotal > 0 && (
                  <div className="d-flex align-items-center justify-content-between">
                    <h3 className="mb-0">{t("Add_on_Charges")}</h3>
                    <h4 className="mb-0 green-success">
                      {currencySymbol?.symbol || currency}
                      {addonTotal.toFixed(2)}
                    </h4>
                  </div>
                )}
                <div className="d-flex align-items-center justify-content-between">
                  <h2 className="mb-0">{t("Total")}</h2>
                  <h2 className="blue-text mb-0">
                    {currencySymbol?.symbol || currency}
                    {totalAmount.toFixed(2)}
                  </h2>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="d-flex align-items-center justify-content-between"
        data-aos="fade-up"
        data-aos-delay="150"
      >
        <button className="common-btn black-btn" onClick={() => navigate(-1)}>
          {t("Back")}
        </button>
        <button className="common-btn blue-btn" onClick={handleConfirm}>
          {t("Confirm")}
        </button>
      </div>
    </div>
  );
};

export default Addon;
