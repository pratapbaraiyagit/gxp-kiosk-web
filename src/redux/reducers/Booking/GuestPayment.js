import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { guestPayment } from "../../../utils/apiEndPoint";
// import { notification } from "../../../helpers/middleware";

const initialState = {
  appGuestPaymentLoading: false,
  activeGuestPaymentList: [],
  getGuestPaymentDetailsData: {},
  isGuestPaymentUpdate: false,
  totalPages: 0,
  currentPage: 1,
  totalUsers: 0,
};

export const getGuestPaymentListData = createAsyncThunk(
  "admin/get-guest-Payment-list",
  (params) => {
    return new Promise((resolve, reject) => {
      axios
        .get(guestPayment, params)
        .then((res) => {
          if (res.data.status) {
            resolve(res.data);
          } else {
            // notification(res?.data?.message || "Something went wrong", "error");
            reject();
          }
        })
        .catch((error) => {
          // notification(error?.response?.data?.message || "error", "error");
          reject(error);
        });
    });
  }
);

export const addGuestNewPayment = createAsyncThunk(
  "admin/add-guest-new-Payment",
  (payload, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .post(guestPayment, payload)
        .then((res) => {
          if (res.data.status) {
            // notification(
            //   res.data.message || "Guest payment create successfully!!",
            //   "success"
            // );
            resolve(res.data.data);
          } else {
            // notification(res?.data?.message || "Something went wrong", "error");
            reject();
          }
        })
        .catch((error) => {
          // notification(error?.response?.data?.message || "error", "error");
          reject(error);
        });
    });
  }
);

export const getGuestPaymentDetails = createAsyncThunk(
  "admin/get-guest-Payment-details",
  (id, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .get(`${guestPayment}?id=${id}`)
        .then((res) => {
          if (res.data.status) {
            resolve(res.data.data);
          } else {
            // notification(res?.data?.message || "Something went wrong", "error");
            reject();
          }
        })
        .catch((error) => {
          // notification(error?.response?.data?.message || "error", "error");
          reject(error);
        });
    });
  }
);

export const updateGuestPaymentDetails = createAsyncThunk(
  "admin/update-guest-Payment-details",
  (payload, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .patch(guestPayment, payload)
        .then((res) => {
          if (res.data.status) {
            // notification(
            //   res.data.message || "Guest payment update successfully!!",
            //   "success"
            // );
            resolve({
              guest_payment_ids: payload.guest_payment_ids[0],
              ...payload,
            });
          } else {
            // notification(res?.data?.message || "Something went wrong", "error");
            reject();
          }
        })
        .catch((error) => {
          // notification(error?.response?.data?.message || "error", "error");
          reject(error);
        });
    });
  }
);

export const deleteGuestPayment = createAsyncThunk(
  "admin/delete-guest-Payment",
  (props, { dispatch }) => {
    const { id } = props;
    return new Promise((resolve, reject) => {
      axios
        .delete(`${guestPayment}`, {
          data: {
            guest_payment_ids: id,
          },
        })
        .then((res) => {
          if (res.data.status) {
            // notification(
            //   res.data.message || "Guest payment delete successfully!!",
            //   "success"
            // );
            resolve(id);
          } else {
            // notification(res.data.message || "error", "error");
            reject();
          }
        })
        .catch((error) => {
          // notification(error?.response?.data?.message || "error", "error");
          reject(error);
        });
    });
  }
);

export const guestPaymentSlice = createSlice({
  name: "guestPayment",
  initialState,
  reducers: {
    setIsGuestPaymentUpdate: (state, action) => {
      state.isGuestPaymentUpdate = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getGuestPaymentListData.pending, (state) => {
        state.appGuestPaymentLoading = true;
      })
      .addCase(getGuestPaymentListData.rejected, (state) => {
        state.appGuestPaymentLoading = false;
      })
      .addCase(getGuestPaymentListData.fulfilled, (state, action) => {
        const { data, total_pages, page_number, page_size, count } =
          action.payload;
        state.activeGuestPaymentList = data;
        state.appGuestPaymentLoading = false;
        state.totalPages = total_pages;
        state.currentPage = page_number;
        state.pageSize = page_size;
        state.totalUsers = count;
      })
      .addCase(addGuestNewPayment.pending, (state) => {
        state.appGuestPaymentLoading = true;
        state.isGuestPaymentUpdate = false;
      })
      .addCase(addGuestNewPayment.rejected, (state) => {
        state.appGuestPaymentLoading = false;
        state.isGuestPaymentUpdate = false;
      })
      .addCase(addGuestNewPayment.fulfilled, (state, action) => {
        state.appGuestPaymentLoading = false;
        state.isGuestPaymentUpdate = true;
      })
      .addCase(getGuestPaymentDetails.pending, (state) => {
        state.appGuestPaymentLoading = true;
        state.getGuestPaymentDetailsData = "";
      })
      .addCase(getGuestPaymentDetails.rejected, (state) => {
        state.appGuestPaymentLoading = false;
        state.getGuestPaymentDetailsData = "";
      })
      .addCase(getGuestPaymentDetails.fulfilled, (state, action) => {
        state.appGuestPaymentLoading = false;
        state.getGuestPaymentDetailsData = action.payload;
      })
      .addCase(updateGuestPaymentDetails.pending, (state) => {
        state.isGuestPaymentUpdate = false;
        state.appGuestPaymentLoading = true;
      })
      .addCase(updateGuestPaymentDetails.rejected, (state) => {
        state.isGuestPaymentUpdate = false;
        state.appGuestPaymentLoading = false;
      })
      .addCase(updateGuestPaymentDetails.fulfilled, (state, action) => {
        const { guest_payment_ids, ...updatedData } = action.payload;
        if (updatedData.is_primary === true) {
          state.activeGuestPaymentList = state.activeGuestPaymentList.map(
            (item) => ({
              ...item,
              is_primary: false,
            })
          );
          state.activeGuestPaymentList = state.activeGuestPaymentList.map(
            (item) =>
              guest_payment_ids?.includes(item?.id)
                ? {
                    ...item,
                    ...updatedData,
                    is_primary:
                      guest_payment_ids?.[0] === item.id ? true : false,
                  }
                : item
          );
        } else {
          state.activeGuestPaymentList = state.activeGuestPaymentList.map(
            (item) =>
              guest_payment_ids?.includes(item.id)
                ? { ...item, ...updatedData }
                : item
          );
        }
        state.isGuestPaymentUpdate = true;
        state.appGuestPaymentLoading = false;
      })
      .addCase(deleteGuestPayment.pending, (state) => {
        state.appGuestPaymentLoading = true;
        state.isGuestPaymentUpdate = false;
      })
      .addCase(deleteGuestPayment.rejected, (state) => {
        state.appGuestPaymentLoading = false;
        state.isGuestPaymentUpdate = false;
      })
      .addCase(deleteGuestPayment.fulfilled, (state, action) => {
        const uuidsToDelete = Array.isArray(action.payload)
          ? action.payload
          : [];
        state.activeGuestPaymentList = state.activeGuestPaymentList.filter(
          (user) => !uuidsToDelete.includes(user.id)
        );
        state.appGuestPaymentLoading = false;
        state.isGuestPaymentUpdate = true;
      });
  },
});

export const { setIsGuestPaymentUpdate } = guestPaymentSlice.actions;

export default guestPaymentSlice.reducer;
