import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { I18nextProvider } from "react-i18next";

import store from "./redux/store";
import i18n from "./utils/i18n.js";
import ImageInitializer from "./component/ImageInitializer.js";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <Provider store={store}>
      <ImageInitializer>
        <I18nextProvider i18n={i18n}>
          <App />
        </I18nextProvider>
      </ImageInitializer>
    </Provider>
  </BrowserRouter>
);
