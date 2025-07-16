import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import {
  paymentDeviceStatusAPI,
  paymentTerminalsAPI,
} from "../../../utils/apiEndPoint";
import { notification } from "../../../helpers/middleware";

const initialState = {
  appPaymentTerminalLoading: false,
  activePaymentTerminalList: [],
  getPaymentTerminalDetailsData: {},
  isPaymentTerminalUpdate: false,
  totalPages: 0,
  currentPage: 1,
  totalUsers: 0,
};

export const getPaymentTerminalListData = createAsyncThunk(
  "admin/get-Payment-terminal-list",
  (params) => {
    return new Promise((resolve, reject) => {
      axios
        .get(paymentTerminalsAPI, params)
        .then((res) => {
          if (res.data.status) {
            resolve(res.data);
          } else {
            notification(res?.data?.message || "Something went wrong", "error");
            reject();
          }
        })
        .catch((error) => {
          notification(error?.response?.data?.message || "error", "error");
          reject(error);
        });
    });
  }
);

export const addNewPaymentTerminal = createAsyncThunk(
  "admin/add-new-Payment-terminal",
  (payload, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .post(paymentTerminalsAPI, payload)
        .then((res) => {
          if (res.data.status) {
            notification(
              res.data.message || "payment terminal create successfully!!",
              "success"
            );
            resolve(res.data.data);
          } else {
            notification(res?.data?.message || "Something went wrong", "error");
            reject();
          }
        })
        .catch((error) => {
          notification(error?.response?.data?.message || "error", "error");
          reject(error);
        });
    });
  }
);

export const getPaymentTerminalDetails = createAsyncThunk(
  "admin/getPayment-ternimal-details",
  (id, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .get(`${paymentTerminalsAPI}?id=${id}`)
        .then((res) => {
          if (res.data.status) {
            resolve(res.data.data);
          } else {
            notification(res?.data?.message || "Something went wrong", "error");
            reject();
          }
        })
        .catch((error) => {
          notification(error?.response?.data?.message || "error", "error");
          reject(error);
        });
    });
  }
);

export const updatePaymentTerminalDetails = createAsyncThunk(
  "admin/update-Payment-terminal-details",
  (props, { dispatch }) => {
    const { id, data } = props;
    return new Promise((resolve, reject) => {
      axios
        .patch(`${paymentTerminalsAPI}/${id}`, data)
        .then((res) => {
          if (res.data.status) {
            notification(
              res.data.message || "payment terminal update successfully!!",
              "success"
            );
            resolve({ id, ...data });
          } else {
            notification(res?.data?.message || "Something went wrong", "error");
            reject();
          }
        })
        .catch((error) => {
          notification(error?.response?.data?.message || "error", "error");
          reject(error);
        });
    });
  }
);

export const updatePaymentTerminalStatus = createAsyncThunk(
  "admin/update-payment-terminal-status-p",
  (props, { dispatch }) => {
    const { data } = props;
    return new Promise((resolve, reject) => {
      axios
        .post(paymentDeviceStatusAPI, data)
        .then((res) => {
          if (res.data.status) {
            notification(
              res.data.message ||
                "payment terminal status update successfully!!",
              "success"
            );
            resolve(data);
          } else {
            notification(res?.data?.message || "Something went wrong", "error");
            reject();
          }
        })
        .catch((error) => {
          notification(error?.response?.data?.message || "error", "error");
          reject(error);
        });
    });
  }
);
export const deletePaymentTerminal = createAsyncThunk(
  "admin/delete-Payment-terminal",
  (props, { dispatch }) => {
    const { id } = props;
    return new Promise((resolve, reject) => {
      axios
        .delete(`${paymentTerminalsAPI}`, {
          data: {
            payment_terminal_ids: id,
          },
        })
        .then((res) => {
          if (res.data.status) {
            notification(
              res.data.message || "payment terminal delete successfully!!",
              "success"
            );
            resolve(id);
          } else {
            notification(res.data.message || "error", "error");
            reject();
          }
        })
        .catch((error) => {
          notification(error?.response?.data?.message || "error", "error");
          reject(error);
        });
    });
  }
);

export const paymentTerminalAPISlice = createSlice({
  name: "paymentTerminalAPI",
  initialState,
  reducers: {
    setIsPaymentTerminalUpdate: (state, action) => {
      state.isPaymentTerminalUpdate = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getPaymentTerminalListData.pending, (state) => {
        state.appPaymentTerminalLoading = true;
      })
      .addCase(getPaymentTerminalListData.rejected, (state) => {
        state.appPaymentTerminalLoading = false;
      })
      .addCase(getPaymentTerminalListData.fulfilled, (state, action) => {
        const { data, total_pages, page_number, page_size, count } =
          action.payload;
        state.activePaymentTerminalList = data;
        state.appPaymentTerminalLoading = false;
        state.totalPages = total_pages;
        state.currentPage = page_number;
        state.pageSize = page_size;
        state.totalUsers = count;
      })
      .addCase(addNewPaymentTerminal.pending, (state) => {
        state.appPaymentTerminalLoading = true;
        state.isPaymentTerminalUpdate = false;
      })
      .addCase(addNewPaymentTerminal.rejected, (state) => {
        state.appPaymentTerminalLoading = false;
        state.isPaymentTerminalUpdate = false;
      })
      .addCase(addNewPaymentTerminal.fulfilled, (state, action) => {
        state.appPaymentTerminalLoading = false;
        state.isPaymentTerminalUpdate = true;
      })
      .addCase(getPaymentTerminalDetails.pending, (state) => {
        state.appPaymentTerminalLoading = true;
        state.getPaymentTerminalDetailsData = "";
      })
      .addCase(getPaymentTerminalDetails.rejected, (state) => {
        state.appPaymentTerminalLoading = false;
        state.getPaymentTerminalDetailsData = "";
      })
      .addCase(getPaymentTerminalDetails.fulfilled, (state, action) => {
        state.appPaymentTerminalLoading = false;
        state.getPaymentTerminalDetailsData = action.payload;
      })
      .addCase(updatePaymentTerminalDetails.pending, (state) => {
        state.isPaymentTerminalUpdate = false;
        state.appPaymentTerminalLoading = true;
      })
      .addCase(updatePaymentTerminalDetails.rejected, (state) => {
        state.isPaymentTerminalUpdate = false;
        state.appPaymentTerminalLoading = false;
      })
      .addCase(updatePaymentTerminalDetails.fulfilled, (state, action) => {
        const { id, ...updatedData } = action.payload;
        if (updatedData.is_default === true) {
          state.activePaymentTerminalList = state.activePaymentTerminalList.map(
            (item) => ({
              ...item,
              is_default: false,
            })
          );
          state.activePaymentTerminalList = state.activePaymentTerminalList.map(
            (item) =>
              id?.includes(item?.id)
                ? {
                    ...item,
                    ...updatedData,
                    is_default: id === item.id ? true : false,
                  }
                : item
          );
        } else {
          state.activePaymentTerminalList = state.activePaymentTerminalList.map(
            (item) =>
              id?.includes(item?.id) ? { ...item, ...updatedData } : item
          );
        }
        state.isPaymentTerminalUpdate = true;
        state.appPaymentTerminalLoading = false;
      })
      .addCase(updatePaymentTerminalStatus.pending, (state) => {
        state.appPaymentTerminalLoading = true;
      })
      .addCase(updatePaymentTerminalStatus.rejected, (state) => {
        state.appPaymentTerminalLoading = false;
      })
      .addCase(updatePaymentTerminalStatus.fulfilled, (state, action) => {
        state.appPaymentTerminalLoading = false;
      })
      .addCase(deletePaymentTerminal.pending, (state) => {
        state.appPaymentTerminalLoading = true;
        state.isPaymentTerminalUpdate = false;
      })
      .addCase(deletePaymentTerminal.rejected, (state) => {
        state.appPaymentTerminalLoading = false;
        state.isPaymentTerminalUpdate = false;
      })
      .addCase(deletePaymentTerminal.fulfilled, (state, action) => {
        const uuidsToDelete = Array.isArray(action.payload)
          ? action.payload
          : [];
        state.activePaymentTerminalList =
          state.activePaymentTerminalList.filter(
            (user) => !uuidsToDelete.includes(user.id)
          );
        state.appPaymentTerminalLoading = false;
        state.isPaymentTerminalUpdate = true;
      });
  },
});

export const { setIsPaymentTerminalUpdate } = paymentTerminalAPISlice.actions;

export default paymentTerminalAPISlice.reducer;
