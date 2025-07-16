import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { hotelDocumentTypeAPI } from "../../../utils/apiEndPoint";

const initialState = {
  documentTypeLoading: false,
  activeDocumentTypeList: [],
  getDocumentTypeDetailsData: {},
  isDocumentTypeUpdate: false,
  totalPages: 0,
  currentPage: 1,
  totalUsers: 0,
};

export const getDocumentTypeListData = createAsyncThunk(
  "admin/get-DocumentType-list",
  (params) => {
    return new Promise((resolve, reject) => {
      axios
        .get(hotelDocumentTypeAPI, params)
        .then((res) => {
          if (res.data.status) {
            resolve(res.data);
          } else {
            reject();
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  }
);

export const documentTypeSlice = createSlice({
  name: "DocumentType",
  initialState,
  reducers: {
    setIsDocumentTypeUpdate: (state, action) => {
      state.isDocumentTypeUpdate = action.payload;
    },
    setIsGetDocumentTypeDetailsData: (state, action) => {
      state.getDocumentTypeDetailsData = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getDocumentTypeListData.pending, (state) => {
        state.documentTypeLoading = true;
      })
      .addCase(getDocumentTypeListData.rejected, (state) => {
        state.documentTypeLoading = false;
      })
      .addCase(getDocumentTypeListData.fulfilled, (state, action) => {
        const { data, total_pages, page_number, page_size, count } =
          action.payload;
        state.activeDocumentTypeList = data;
        state.documentTypeLoading = false;
        state.totalPages = total_pages;
        state.currentPage = page_number;
        state.pageSize = page_size;
        state.totalUsers = count;
      });
  },
});

export const { setIsDocumentTypeUpdate, setIsGetDocumentTypeDetailsData } =
  documentTypeSlice.actions;

export default documentTypeSlice.reducer;
