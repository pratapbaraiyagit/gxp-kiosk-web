import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { bookingPaymentAPI, terminalCardAPI, terminalPaymentAPI } from "../../../utils/apiEndPoint";
import { notification } from "../../../helpers/middleware";

const initialState = {
  terminalCardLoading: false,
  activeTerminalCardList: [],
  getTerminalCardDetailsData: {},
  isTerminalCardUpdate: false,
  totalPages: 0,
  currentPage: 1,
  totalUsers: 0,
};

export const updatePaymentTerminalStatus = createAsyncThunk(
  "admin/update-payment-terminal-status",
  (props, { dispatch }) => {
    const { data } = props;
    return new Promise((resolve, reject) => {
      axios
        .post(terminalCardAPI, data)
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

export const addNewTerminalPayment = createAsyncThunk(
  "admin/add-new-terminal-Payment",
  (payload , { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .post(terminalPaymentAPI, payload)
        .then((res) => {
          if (res.data.status) {
            // notification(
            //   res.data.message || "Booking Payment create successfully!!",
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

export const terminalCardSlice = createSlice({
  name: "terminalCard",
  initialState,
  reducers: {
    setIsTerminalCardUpdate: (state, action) => {
      state.isTerminalCardUpdate = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updatePaymentTerminalStatus.pending, (state) => {
        state.terminalCardLoading = true;
      })
      .addCase(updatePaymentTerminalStatus.rejected, (state) => {
        state.terminalCardLoading = false;
      })
      .addCase(updatePaymentTerminalStatus.fulfilled, (state, action) => {
        state.terminalCardLoading = false;
      })
     .addCase(addNewTerminalPayment.pending, (state) => {
        state.terminalCardLoading = true;
        state.isTerminalCardUpdate = false;
      })
      .addCase(addNewTerminalPayment.rejected, (state) => {
        state.terminalCardLoading = false;
        state.isTerminalCardUpdate = false;
      })
      .addCase(addNewTerminalPayment.fulfilled, (state, action) => {
        state.terminalCardLoading = false;
        state.isTerminalCardUpdate = true;
      })
  },
});

export const { setIsTerminalCardUpdate } = terminalCardSlice.actions;

export default terminalCardSlice.reducer;
