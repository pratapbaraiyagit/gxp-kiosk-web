import React, { forwardRef, useRef, useState, useEffect } from "react";

const Input = forwardRef(({ numDigits, value, onChange }, ref) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRefs = useRef(
    Array(numDigits)
      .fill(null)
      .map(() => React.createRef())
  );

  // Auto focus on first input when component mounts
  useEffect(() => {
    if (inputRefs.current[0].current) {
      inputRefs.current[0].current.focus();
    }
  }, []);

  // Automatically highlight next input
  useEffect(() => {
    // Find the first empty input after a filled input
    const filledInputs = value.split("").filter((char) => char !== "").length;
    const nextInputIndex = filledInputs;

    // Remove all highlight classes first
    inputRefs.current.forEach((inputRef) => {
      if (inputRef.current) {
        inputRef.current.classList.remove("next-input-highlight");
      }
    });

    // Add highlight to the next input if it exists and is not the last input
    if (nextInputIndex < numDigits) {
      const nextInput = inputRefs.current[nextInputIndex]?.current;
      if (nextInput) {
        nextInput.classList.add("next-input-highlight");
      }
    }
  }, [value, numDigits]);

  const handleInputFocus = (index) => {
    // Check if all previous inputs are filled
    const isPreviousInputsFilled = Array.from({ length: index }).every(
      (_, i) => value[i] && value[i] !== ""
    );

    if (isPreviousInputsFilled) {
      setActiveIndex(index);
    } else {
      // If previous inputs are not filled, focus the first empty previous input
      const firstEmptyPreviousIndex = Array.from({ length: index }).findIndex(
        (_, i) => !value[i] || value[i] === ""
      );

      if (firstEmptyPreviousIndex !== -1) {
        inputRefs.current[firstEmptyPreviousIndex].current.focus();
      }
    }
  };

  const handleInputBlur = () => {
    setActiveIndex(null);
  };

  const handleKeyDown = (e, index) => {
    const input = inputRefs.current[index].current;

    // Handle backspace
    if (e.key === "Backspace") {
      e.preventDefault();
      onChange(index, "", "backspace");

      // Move focus to previous input if current is empty
      if (input.value === "" && index > 0) {
        inputRefs.current[index - 1].current.focus();
      }
    }

    // Handle input of alphanumeric characters
    if (/^[A-Za-z0-9]$/.test(e.key) && value.length < numDigits) {
      e.preventDefault();
      onChange(index, e.key, "input");
    }
  };

  // Determine input state classes
  const getInputClasses = (index) => {
    const baseClasses = "form-control text-center";

    // Active state (focused or first empty input)
    if (
      activeIndex === index ||
      (activeIndex === null &&
        index === value.split("").findIndex((char) => char === ""))
    ) {
      return `${baseClasses} border-primary shadow-primary`;
    }

    // Filled input
    if (value[index]) {
      return `${baseClasses} border-success`;
    }

    // Default state
    return `${baseClasses} border-secondary hover-primary`;
  };

  return (
    <div
      className="d-flex justify-content-center gap-2 input-container"
      style={{ position: "relative" }}
    >
      {Array.from({ length: numDigits }).map((_, index) => (
        <input
          key={index}
          ref={inputRefs.current[index]}
          type="text"
          maxLength="1"
          value={value[index] || ""}
          className={getInputClasses(index)}
          style={{
            width: "50px",
            height: "50px",
            fontSize: "1.5rem",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
          onFocus={() => handleInputFocus(index)}
          onBlur={handleInputBlur}
          onKeyDown={(e) => handleKeyDown(e, index)}
          readOnly
        />
      ))}
     </div>
  );
});

Input.displayName = "Input";

export default Input;
