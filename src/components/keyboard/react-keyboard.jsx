import React from "react";
import Keyboard from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";

const ReactSimpleKeyboard = ({
  keyboardRef,
  onKeyPress,
  inputName,
  layout,
  layoutName,
  display,
  buttonTheme,
  keyboardClass = "",
}) => {
  const customButtonTheme = [
    {
      class: "hg-red",
      buttons: "{bksp}",
    },
    {
      class:
        "hg-email-domain btn btn-primary d-flex align-items-center justify-content-center",
      buttons: "{gmail} {hotmail} {yahoo}",
    },
  ];

  return (
    <Keyboard
      keyboardRef={(r) => keyboardRef(r)}
      layoutName="default"
      layout={layout}
      onChange={() => {}}
      onKeyPress={onKeyPress}
      inputName={inputName}
      baseClass={keyboardClass}
      display={{
        "{bksp}": "<i className='fas fa-backspace'></i>",
        "{space}": "Space",
        "{gmail}":
          "<span className='email-btn'><i className='fab fa-google me-1'></i>@gmail.com</span>",
        "{hotmail}":
          "<span className='email-btn'><i className='fab fa-google me-1'></i>@hotmail.com</span>",
        "{yahoo}":
          "<span className='email-btn'><i className='fab fa-yahoo me-1'></i>@yahoo.com</span>",
        ...display,
      }}
      buttonTheme={customButtonTheme}
    />
  );
};

export default ReactSimpleKeyboard;
