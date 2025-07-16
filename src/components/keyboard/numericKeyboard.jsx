import React, { useEffect, useRef, useState } from "react";
import Keyboard from "simple-keyboard";

const NumericKeyboard = ({
  keyboardClass = "simple-keyboard",
  input,
  onChange,
  onKeyPress,
}) => {
  const [keyboard, setKeyboard] = useState(null);
  const clickSoundRef = useRef(null);

  useEffect(() => {
    const newKeyboard = new Keyboard(`.${keyboardClass}`, {
      onChange: handleChange,
      onKeyPress: handleKeyPress,
      layout: {
        default: ["1 2 3 4 5 6 7 8 9 0 {bksp}"],
      },
      display: { "{bksp}": "DELETE" },
      theme: "hg-theme-default hg-layout-numeric numeric-theme",
      buttonTheme: [
        {
          class: "hg-red",
          buttons: "{bksp} DELETE",
        },
      ],
    });

    setKeyboard(newKeyboard);

    return () => {
      newKeyboard.destroy();
    };
  }, [keyboardClass]);

  useEffect(() => {
    if (keyboard) {
      keyboard.setInput(input);
    }
  }, [input, keyboard]);

  const handleChange = (input) => {
    clickSoundRef.current?.play();
    onChange(input);
  };

  const handleKeyPress = (button) => {
    clickSoundRef.current?.play();
    onKeyPress(button);
  };

  return (
    <>
      <div className={keyboardClass}></div>
      <audio id="timer-audio" ref={clickSoundRef} className="d-none" controls>
        <source src="/sound/timer.wav" type="audio/mpeg" />
      </audio>
    </>
  );
};

export default NumericKeyboard;
