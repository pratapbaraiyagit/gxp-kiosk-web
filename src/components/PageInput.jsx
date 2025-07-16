// PageInput.js (with fixes)
import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
} from "react";

const PageInput = forwardRef(
  (
    {
      numDigits = 6,
      inputType = "text",
      inputClass = "",
      warpperClass,
      disabled = false,
      value = "",
      onChange,
      onPaste,
      onClick,
      onFocus,
      autoFocus = true, // Added autoFocus prop with default value
    },
    ref
  ) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRefs = useRef(Array(numDigits).fill(null));
    const didMount = useRef(false);

    useImperativeHandle(ref, () => ({
      focusInput: (index) => {
        if (index >= 0 && index < numDigits) {
          inputRefs.current[index]?.focus();
        }
      },
    }));

    // Modified: Only auto-focus on first input when autoFocus prop is true
    useEffect(() => {
      if (autoFocus && !didMount.current && inputRefs.current[0]) {
        inputRefs.current[0].focus();
        didMount.current = true;
      }
    }, [autoFocus]);

    // Automatically highlight next input
    useEffect(() => {
      // Find the first empty input after a filled input
      if (autoFocus) {
        const filledInputs = value
          .split("")
          .filter((char) => char !== "").length;
        const nextInputIndex = filledInputs;

        // Remove all highlight classes first
        inputRefs.current.forEach((inputRef) => {
          if (inputRef) {
            inputRef.classList.remove("next-input-highlight");
          }
        });

        // Add highlight to the next input if it exists and is not the last input
        if (nextInputIndex < numDigits) {
          const nextInput = inputRefs.current[nextInputIndex];
          if (nextInput) {
            nextInput.classList.add("next-input-highlight");
          }
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
        if (onFocus) onFocus(index);
      } else {
        // If previous inputs are not filled, focus the first empty previous input
        const firstEmptyPreviousIndex = Array.from({ length: index }).findIndex(
          (_, i) => !value[i] || value[i] === ""
        );

        if (firstEmptyPreviousIndex !== -1) {
          inputRefs.current[firstEmptyPreviousIndex].focus();
        }
      }
    };

    const handleInputBlur = () => {
      setActiveIndex(null);
    };

    const handleChange = (e, index) => {
      const newDigit = e.target.value.slice(-1);
      onChange(index, newDigit, "input");

      // Auto-focus next input after value is entered
      if (newDigit && index < numDigits - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    };

    const handleKeyDown = (e, index) => {
      if (e.key === "Backspace") {
        e.preventDefault();
        if (value[index]) {
          onChange(index, "", "backspace");
        } else if (index > 0) {
          onChange(index - 1, "", "backspace");
          inputRefs.current[index - 1]?.focus();
        }
      } else if (e.key === "ArrowLeft" && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === "ArrowRight" && index < numDigits - 1) {
        inputRefs.current[index + 1]?.focus();
      } else if (/^[A-Za-z0-9]$/.test(e.key) && value.length < numDigits) {
        // Handle alphanumeric input like in the Input component
        e.preventDefault();
        onChange(index, e.key, "input");

        // Auto-focus next input
        if (index < numDigits - 1) {
          inputRefs.current[index + 1]?.focus();
        }
      }
    };

    const handlePaste = (e) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData("text").slice(0, numDigits);

      if (onPaste) {
        onPaste(pastedData);
      } else {
        pastedData.split("").forEach((char, index) => {
          if (index < numDigits) {
            onChange(index, char, "input");
          }
        });
      }

      // Focus on the input after the last pasted character
      const nextIndex = Math.min(pastedData.length, numDigits - 1);
      if (nextIndex < numDigits) {
        inputRefs.current[nextIndex]?.focus();
      }
    };

    // Determine input state classes
    const getInputClasses = (index) => {
      const baseClasses = `otp-input ${inputClass}`;

      // Active state (focused or first empty input)
      if (
        activeIndex === index ||
        (activeIndex === null &&
          index === value.split("").findIndex((char) => char === ""))
      ) {
        return `${baseClasses} shadow-primary`;
      }

      // Filled input
      if (value[index]) {
        return `${baseClasses} border-success`;
      }

      // Default state
      return `${baseClasses} hover-primary`;
    };

    return (
      <div
        className={`${warpperClass} common-input d-flex align-items-center justify-content-center gap-2`}
        onPaste={handlePaste}
        style={{ position: "relative" }}
      >
        {Array.from({ length: numDigits }, (_, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type={inputType}
            maxLength={1}
            value={value[index] || ""}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={getInputClasses(index)}
            style={{
              
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            disabled={disabled}
            autoComplete="off"
            onClick={() => {
              if (onClick) onClick(index);
              handleInputFocus(index);
            }}
            onFocus={() => handleInputFocus(index)}
            onBlur={handleInputBlur}
            readOnly
          />
        ))}
      </div>
    );
  }
);

PageInput.displayName = "PageInput";

export default PageInput;
