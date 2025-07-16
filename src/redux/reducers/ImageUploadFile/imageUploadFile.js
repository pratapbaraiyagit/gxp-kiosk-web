import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { compressImage, notification } from "../../../helpers/middleware";
import customAxios from "../../../utils/common";
import { imageUploadAPI } from "../../../utils/apiEndPoint";
import { setSessionItem } from "../../../hooks/session";

const initialState = {
  imgLoading: false,
  imgputLoading: false,
  singleImageShow: {},
  singledatabaseImage: {},
  isImageUpdate: false,
  removeStatus: false,
  multipleImageLoading: false,
  multipleImages: [],
  multiple_database_url: [],
  removeUrl: [],
};

// Pre-sign URL thunk
export const putPreSignUrl = createAsyncThunk(
  "auth/put-pre-sign-url",
  async (dataProp, { dispatch }) => {
    const { url, data } = dataProp; // Ensure dataProp has url and data

    try {
      const response = await customAxios.put(url, data, {
        headers: {
          "Content-Type": data.type,
        },
      });
      if (response.data) {
        return response.data;
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      throw error;
    }
  }
);

export const getPreSignUrl = createAsyncThunk(
  "auth/get-pre-sign-url",
  async (dataProp, { dispatch }) => {
    const { url, data } = dataProp; // Ensure dataProp has url and data
    try {
      const response = await customAxios.get(url, data); // Ensure correct use of url
      if (response.data) {
        return response.data;
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      throw error;
    }
  }
);

export const UploadBase64ImageFile = createAsyncThunk(
  "auth/base64-image-upload",
  async (dataProp, { dispatch }) => {
    try {
      const { media_type, base64_files } = dataProp;
      const requestData = {
        media_type,
        base64_files
      };
      const response = await axios.post(imageUploadAPI, requestData);
      if (response.data.status) {
        setSessionItem("frontUploadImage", response?.data?.data?.[0]?.database_url);
        return response;
      } else {
        notification(response.data.message || "error", "error");
        throw new Error(response.data.message);
      }
    } catch (error) {
      throw error;
    }
  }
);

// Upload Image File thunk
export const UploadImageFile = createAsyncThunk(
  "auth/image-upload",
  async (dataProp, { dispatch }) => {
    try {
      const { media_type, file_type, file, fieldKeyName } = dataProp;
      const requestData = {
        media_type,
        file_type: [file_type],
      };
      const response = await axios.post(imageUploadAPI, requestData);
      if (response.data.status) {
        if (requestData?.media_type === "guest_profile_picture") {
          setSessionItem("profile_picture", response.data.data[0].database_url);
        }
        const fileImg = await compressImage(file);

        // Ensure preSignUrl receives the correct dataProp structure
        const putPreSignUrlDataProp = {
          url: response.data.data[0].put_presign_url,
          data: fileImg.compressedImage,
        };

        const getPreSignUrlDataProp = {
          url: response.data.data[0].get_presign_url,
          data: fileImg.compressedImage,
        };

        await dispatch(putPreSignUrl(putPreSignUrlDataProp));
        await dispatch(getPreSignUrl(getPreSignUrlDataProp));

        const responseData = { ...response.data, fieldKeyName };

        return responseData;
      } else {
        notification(response.data.message || "error", "error");
        throw new Error(response.data.message);
      }
    } catch (error) {
      throw error;
    }
  }
);
export const UploadImagesFiles = createAsyncThunk(
  "auth/multiple-images-upload",
  async (dataProp, { dispatch }) => {
    try {
      const { media_type, file_type, files } = dataProp;
      const requestData = {
        media_type,
        file_type: file_type,
      };
      const response = await axios.post(imageUploadAPI, requestData);
      if (response.data.status) {
        // const fileImg = await compressImage(file);
        const presignUrls = response.data.data;

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const presignUrl = presignUrls[i];

          // Compress the image
          const fileImg = await compressImage(file);

          // Prepare data for PUT presigned URL
          const putPreSignUrlDataProp = {
            url: presignUrl.put_presign_url,
            data: fileImg.compressedImage,
          };

          // Prepare data for GET presigned URL
          const getPreSignUrlDataProp = {
            url: presignUrl.get_presign_url,
            data: fileImg.compressedImage,
          };

          // Upload the file using presigned URLs
          await dispatch(putPreSignUrl(putPreSignUrlDataProp));
          await dispatch(getPreSignUrl(getPreSignUrlDataProp));
        }

        return response.data;
      } else {
        notification(response.data.message || "error", "error");
        throw new Error(response.data.message);
      }
    } catch (error) {
      throw error;
    }
  }
);

// Image Delete
export const imageDelete = createAsyncThunk(
  "auth/image-deleted",
  async (removeData, { dispatch }) => {
    try {
      const response = await axios.delete(imageUploadAPI, { data: removeData }); // Ensure correct structure
      if (response.data.status) {
        notification(response.data.message || "success", "success");
        const responseData = { ...response.data, ...removeData };
        return responseData;
      } else {
        notification(response.data.message || "error", "error");
        throw new Error(response.data.message);
      }
    } catch (error) {
      throw error;
    }
  }
);

// Image Upload Slice
export const imageUploadSlice = createSlice({
  name: "imageUpload",
  initialState,
  reducers: {
    setIsImageUpdate: (state, action) => {
      state.isImageUpdate = action.payload;
    },
    setIsMultiple_database_url: (state, action) => {
      state.multiple_database_url = action.payload;
    },
    setIsMultipleImage_url: (state, action) => {
      state.multipleImages = action.payload;
    },
    setIsSingleImageShow: (state, action) => {
      state.singleImageShow = action.payload;
    },
    setIsSingledatabaseImage: (state, action) => {
      state.singledatabaseImage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(UploadImageFile.pending, (state) => {
        state.imgLoading = true;
      })
      .addCase(UploadImageFile.rejected, (state) => {
        state.imgLoading = false;
      })
      .addCase(UploadImageFile.fulfilled, (state, action) => {
        state.singleImageShow = {
          ...state.singleImageShow,
          [action.payload.fieldKeyName]:
            action.payload.data[0]?.get_presign_url,
        };
        state.singledatabaseImage = {
          ...state.singledatabaseImage,
          [action.payload.fieldKeyName]: action.payload.data[0]?.database_url,
        };

        state.imgLoading = false;
        state.isImageUpdate = false;
        state.removeStatus = false;
      })
      .addCase(UploadBase64ImageFile.pending, (state) => {
        state.imgLoading = true;
      })
      .addCase(UploadBase64ImageFile.rejected, (state) => {
        state.imgLoading = false;
      })
      .addCase(UploadBase64ImageFile.fulfilled, (state, action) => {
        state.imgLoading = false;
        state.isImageUpdate = false;
        state.removeStatus = false;
      })
      .addCase(UploadImagesFiles.pending, (state) => {
        state.multipleImageLoading = true;
      })
      .addCase(UploadImagesFiles.rejected, (state) => {
        state.multipleImageLoading = false;
      })
      .addCase(UploadImagesFiles.fulfilled, (state, action) => {
        state.multipleImageLoading = false;
        state.isImageUpdate = false;
        state.removeStatus = false;
        state.multipleImages = [
          ...state.multipleImages,
          ...action.payload.data.map((image) => image?.get_presign_url),
        ];
        state.multiple_database_url = [
          ...state.multiple_database_url,
          ...action.payload.data.map((image) => image.database_url),
        ];
      })
      .addCase(putPreSignUrl.pending, (state) => {
        state.imgputLoading = true;
      })
      .addCase(putPreSignUrl.rejected, (state) => {
        state.imgputLoading = false;
      })
      .addCase(putPreSignUrl.fulfilled, (state, action) => {
        state.imgputLoading = false;
      })
      .addCase(getPreSignUrl.pending, (state) => {
        state.imgLoading = true;
      })
      .addCase(getPreSignUrl.rejected, (state) => {
        state.imgLoading = false;
      })
      .addCase(getPreSignUrl.fulfilled, (state, action) => {
        state.imgLoading = false;
      })
      .addCase(imageDelete.pending, (state) => {
        state.profile_image = "";
        state.imgLoading = true;
        state.isImageUpdate = false;
        state.removeStatus = false;
      })
      .addCase(imageDelete.rejected, (state) => {
        state.profile_image = "";
        state.imgLoading = false;
        state.isImageUpdate = false;
        state.removeStatus = false;
      })
      .addCase(imageDelete.fulfilled, (state, action) => {
        const removeUrl = action.payload.file_keys[0];

        if (!removeUrl) return;

        const getPathname = (urlString) => {
          try {
            const url = new URL(urlString);
            return url.pathname.substring(1);
          } catch (e) {
            return urlString;
          }
        };

        const paths = state.multipleImages?.map((image) => getPathname(image));

        const removePath = getPathname(removeUrl);

        if (paths?.includes(removePath)) {
          state.multiple_database_url = state.multiple_database_url?.filter(
            (imageUrl) => getPathname(imageUrl) !== removePath
          );
        }

        state.multipleImages = state.multipleImages?.filter(
          (imageUrl) => getPathname(imageUrl) !== removePath
        );

        state.removeUrl = state.removeUrl
          ? [...state.removeUrl, removeUrl]
          : [removeUrl];

        state.profile_image = "";
        state.imgLoading = false;
        state.isImageUpdate = true;
        state.removeStatus = true;
      });
  },
});

export const {
  setIsImageUpdate,
  setIsMultiple_database_url,
  setIsMultipleImage_url,
  setIsSingleImageShow,
  setIsSingledatabaseImage,
} = imageUploadSlice.actions;

export default imageUploadSlice.reducer;