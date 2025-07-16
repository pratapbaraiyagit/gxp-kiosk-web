import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { payment, paymentLogTransactionAPI } from "../../../utils/apiEndPoint";
// import { notification } from "../../../helpers/middleware";

const initialState = {
  appPaymentLogLoading: false,
  activePaymentLogList: [],
  appPaymentLoading: false,
  activePaymentList: [],
  getPaymentDetailsData: {},
  isPaymentUpdate: false,
  totalPages: 0,
  currentPage: 1,
  totalUsers: 0,
};

export const getPaymentlogListData = createAsyncThunk(
  "admin/get-payment-log-list",
  (params) => {
    return new Promise((resolve, reject) => {
      axios
        .get(paymentLogTransactionAPI, params)
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

export const getPaymentListData = createAsyncThunk(
  "admin/get-payment-list",
  (params) => {
    return new Promise((resolve, reject) => {
      axios
        .get(payment, params)
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

export const addNewPayment = createAsyncThunk(
  "admin/add-new-Payment",
  (payload, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .post(payment, payload)
        .then((res) => {
          if (res.data.status) {
            // notification(
            //   res.data.message || "Payment create successfully!!",
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

export const getPaymentDetails = createAsyncThunk(
  "admin/get-Payment-details",
  (id, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .get(`${payment}?id=${id}`)
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

export const updatePaymentDetails = createAsyncThunk(
  "admin/update-Payment-details",
  (payload, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .patch(payment, payload)
        .then((res) => {
          if (res.data.status) {
            // notification(
            //   res.data.message || "Payment update successfully!!",
            //   "success"
            // );
            resolve({
              payment_ids: payload.payment_ids[0],
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

export const deletePayment = createAsyncThunk(
  "admin/Payment-delete",
  (props, { dispatch }) => {
    const { id } = props;
    return new Promise((resolve, reject) => {
      axios
        .delete(`${payment}`, {
          data: {
            payment_ids: id,
          },
        })
        .then((res) => {
          if (res.data.status) {
            // notification(
            //   res.data.message || "Payment delete successfully!!",
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

export const paymentSlice = createSlice({
  name: "payment",
  initialState,
  reducers: {
    setIsPaymentUpdate: (state, action) => {
      state.isPaymentUpdate = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getPaymentlogListData.pending, (state) => {
        state.appPaymentLogLoading = true;
      })
      .addCase(getPaymentlogListData.rejected, (state) => {
        state.appPaymentLogLoading = false;
      })
      .addCase(getPaymentlogListData.fulfilled, (state, action) => {
        const { data, total_pages, page_number, page_size, count } =
          action.payload;
        state.appPaymentLogLoading = false;
        state.activePaymentLogList = data;
        state.totalPages = total_pages;
        state.currentPage = page_number;
        state.pageSize = page_size;
        state.totalUsers = count;
      })
      .addCase(getPaymentListData.pending, (state) => {
        state.appPaymentLoading = true;
      })
      .addCase(getPaymentListData.rejected, (state) => {
        state.appPaymentLoading = false;
      })
      .addCase(getPaymentListData.fulfilled, (state, action) => {
        const { data, total_pages, page_number, page_size, count } =
          action.payload;
        state.activePaymentList = data;
        state.appPaymentLoading = false;
        state.totalPages = total_pages;
        state.currentPage = page_number;
        state.pageSize = page_size;
        state.totalUsers = count;
      })
      .addCase(addNewPayment.pending, (state) => {
        state.appPaymentLoading = true;
        state.isPaymentUpdate = false;
      })
      .addCase(addNewPayment.rejected, (state) => {
        state.appPaymentLoading = false;
        state.isPaymentUpdate = false;
      })
      .addCase(addNewPayment.fulfilled, (state, action) => {
        state.appPaymentLoading = false;
        state.isPaymentUpdate = true;
      })
      .addCase(getPaymentDetails.pending, (state) => {
        state.appPaymentLoading = true;
        state.getPaymentDetailsData = "";
      })
      .addCase(getPaymentDetails.rejected, (state) => {
        state.appPaymentLoading = false;
        state.getPaymentDetailsData = "";
      })
      .addCase(getPaymentDetails.fulfilled, (state, action) => {
        state.appPaymentLoading = false;
        state.getPaymentDetailsData = action.payload;
      })
      .addCase(updatePaymentDetails.pending, (state) => {
        state.isPaymentUpdate = false;
        state.appPaymentLoading = true;
      })
      .addCase(updatePaymentDetails.rejected, (state) => {
        state.isPaymentUpdate = false;
        state.appPaymentLoading = false;
      })
      .addCase(updatePaymentDetails.fulfilled, (state, action) => {
        const { payment_ids, ...updatedData } = action.payload;
        state.activePaymentList = state.activePaymentList.map((item) =>
          payment_ids.includes(item.id) ? { ...item, ...updatedData } : item
        );
        state.isPaymentUpdate = true;
        state.appPaymentLoading = false;
      })
      .addCase(deletePayment.pending, (state) => {
        state.appPaymentLoading = true;
        state.isPaymentUpdate = false;
      })
      .addCase(deletePayment.rejected, (state) => {
        state.appPaymentLoading = false;
        state.isPaymentUpdate = false;
      })
      .addCase(deletePayment.fulfilled, (state, action) => {
        const uuidsToDelete = Array.isArray(action.payload)
          ? action.payload
          : [];
        state.activePaymentList = state.activePaymentList.filter(
          (user) => !uuidsToDelete.includes(user.id)
        );
        state.appPaymentLoading = false;
        state.isPaymentUpdate = true;
      });
  },
});

export const { setIsPaymentUpdate } = paymentSlice.actions;

export default paymentSlice.reducer;
