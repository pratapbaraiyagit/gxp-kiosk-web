import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { notification } from "../../../helpers/middleware";
import { cardTypeAPI } from "../../../utils/apiEndPoint";

const initialState = {
  cardTypeLoading: false,
  activeCardTypeList: [],
  getCardTypeDetailsData: {},
  isCardTypeUpdate: false,
  totalPages: 0,
  currentPage: 1,
  totalUsers: 0,
};

export const getCardTypeListData = createAsyncThunk(
  "admin/get-CardType-list",
  (params) => {
    return new Promise((resolve, reject) => {
      axios
        .get(`${cardTypeAPI}`, params)
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

export const addNewCardType = createAsyncThunk(
  "admin/add-new-CardType",
  (CardType, { dispatch }) => {
    const { payload } = CardType;
    return new Promise((resolve, reject) => {
      axios
        .post(cardTypeAPI, payload)
        .then((res) => {
          if (res.data.status) {
            notification(
              res.data.message || "Card Type create successfully!!",
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

export const getCardTypeDetails = createAsyncThunk(
  "admin/get-CardType-details-CardType",
  (data, { dispatch }) => {
    const { id } = data;
    return new Promise((resolve, reject) => {
      axios
        .get(`${cardTypeAPI}?id=${id}`)
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

export const cardTypeSlice = createSlice({
  name: "CardType",
  initialState,
  reducers: {
    setIsCardTypeUpdate: (state, action) => {
      state.isCardTypeUpdate = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCardTypeListData.pending, (state) => {
        state.cardTypeLoading = true;
      })
      .addCase(getCardTypeListData.rejected, (state) => {
        state.cardTypeLoading = false;
      })
      .addCase(getCardTypeListData.fulfilled, (state, action) => {
        const { data, total_pages, page_number, page_size, count } =
          action.payload;
        state.activeCardTypeList = data;
        state.cardTypeLoading = false;
        state.totalPages = total_pages;
        state.currentPage = page_number;
        state.pageSize = page_size;
        state.totalUsers = count;
      })
      .addCase(addNewCardType.pending, (state) => {
        state.cardTypeLoading = true;
        state.isCardTypeUpdate = false;
      })
      .addCase(addNewCardType.rejected, (state) => {
        state.cardTypeLoading = false;
        state.isCardTypeUpdate = false;
      })
      .addCase(addNewCardType.fulfilled, (state, action) => {
        state.cardTypeLoading = false;
        state.isCardTypeUpdate = true;
      })
      .addCase(getCardTypeDetails.pending, (state) => {
        state.cardTypeLoading = true;
        state.getCardTypeDetailsData = "";
      })
      .addCase(getCardTypeDetails.rejected, (state) => {
        state.cardTypeLoading = false;
        state.getCardTypeDetailsData = "";
      })
      .addCase(getCardTypeDetails.fulfilled, (state, action) => {
        state.cardTypeLoading = false;
        state.getCardTypeDetailsData = action.payload;
      });
  },
});

export const { setIsCardTypeUpdate } = cardTypeSlice.actions;

export default cardTypeSlice.reducer;
