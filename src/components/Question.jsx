import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";
import { useTranslation } from "react-i18next";

const Question = ({ question, number, onUpdate }) => {
  const { t } = useTranslation();

  // Initialize state with proper type checking
  const [answerText, setAnswerText] = useState(() => {
    if (question.answer_type === "multi_select") {
      return question.answer_text || "";
    }
    return question.answer_text || "";
  });

  const [dateValue, setDateValue] = useState(null);
  const [timeValue, setTimeValue] = useState(null);

  // Improved date/time initialization
  useEffect(() => {
    if (question.answer_type === "date" && question.answer_text) {
      const parsedDate = moment(question.answer_text, "YYYY-MM-DD", true);
      if (parsedDate.isValid()) {
        setDateValue(parsedDate.toDate());
      }
    }
    if (question.answer_type === "time" && question.answer_text) {
      const parsedTime = moment(question.answer_text, "HH:mm", true);
      if (parsedTime.isValid()) {
        setTimeValue(parsedTime.toDate());
      }
    }
  }, [question.answer_type, question.answer_text]);

  // Enhanced input change handler with validation
  const handleInputChange = (value) => {
    if (question.answer_type === "number") {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) || value === "") {
        setAnswerText(value);
        onUpdate(question, value);
      }
    } else {
      setAnswerText(value);
      onUpdate(question, value);
    }
  };

  // Improved date change handler with validation
  const handleDateChange = (date) => {
    if (date && moment(date).isValid()) {
      setDateValue(date);
      onUpdate(question, moment(date).format("YYYY-MM-DD"));
    }
  };

  // Improved time change handler with validation
  const handleTimeChange = (time) => {
    if (time && moment(time).isValid()) {
      setTimeValue(time);
      onUpdate(question, moment(time).format("HH:mm"));
    }
  };

  // Enhanced file change handler with basic validation
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      onUpdate(question, file);
    }
  };

  // Improved multi-select handler
  const handleMultiSelectChange = (e) => {
    const value = e.target.value;
    const isChecked = e.target.checked;

    const currentValues = answerText
      ? answerText.split(",").filter(Boolean)
      : [];
    let newValues;

    if (isChecked) {
      newValues = [...currentValues, value];
    } else {
      newValues = currentValues?.filter((item) => item !== value);
    }

    const newAnswerText = newValues.join(",");
    setAnswerText(newAnswerText);
    onUpdate(question, newAnswerText);
  };

  const renderInput = () => {
    switch (question.answer_type) {
      case "text":
      case "phone":
      case "email":
      case "number":
        return (
          <input
            type={question.answer_type === "number" ? "number" : "text"}
            className="form-control"
            disabled={!question.is_editable}
            required={question.is_required}
            name={`question_${question.id}`}
            value={answerText}
            onChange={(e) => handleInputChange(e.target.value)}
            onBlur={(e) => onUpdate(question, e.target.value)}
          />
        );

      case "date":
        return (
          <DatePicker
            selected={dateValue}
            onChange={handleDateChange}
            dateFormat="yyyy-MM-dd"
            className="form-control"
            disabled={!question.is_editable}
            required={question.is_required}
            name={`question_${question.id}`}
            placeholderText="Select date"
          />
        );

      case "time":
        return (
          <DatePicker
            selected={timeValue}
            onChange={handleTimeChange}
            showTimeSelect
            showTimeSelectOnly
            timeIntervals={15}
            timeCaption="Time"
            dateFormat="HH:mm"
            className="form-control"
            disabled={!question.is_editable}
            required={question.is_required}
            name={`question_${question.id}`}
            placeholderText="Select time"
          />
        );

      case "long_text":
      case "textarea":
        return (
          <textarea
            className="form-control"
            placeholder="Your Answer"
            rows={3}
            disabled={!question.is_editable}
            required={question.is_required}
            name={`question_${question.id}`}
            value={answerText}
            onChange={(e) => handleInputChange(e.target.value)}
            onBlur={(e) => onUpdate(question, e.target.value)}
          />
        );

      case "radio":
      case "boolean":
        return (
          <div className="d-flex align-items-center gap-3">
            {[t("Yes"), t("No")].map((option) => (
              <div className="radio" key={option}>
                <label className="custom-checkbox mb-0 me-3">
                  <input
                    type="radio"
                    value={option}
                    name={`question_${question.id}`}
                    disabled={!question.is_editable}
                    required={question.is_required}
                    checked={answerText === option}
                    onChange={(e) => handleInputChange(e.target.value)}
                    className="custom-radio-input"
                  />
                  <span className="checkmark"></span>
                  <span>{option}</span>
                </label>
              </div>
            ))}
          </div>
        );

      case "choice":
        return (
          <div className="d-flex align-items-center">
            {Array.isArray(question.form_data) &&
              question?.form_data?.map((option, index) => (
                <div className="radio" key={index}>
                  <label className="text-dark mb-0 me-3">
                    <input
                      id={`question_${question.id}_option_${index}`}
                      type="radio"
                      name={`question_${question.id}`}
                      value={option.option}
                      checked={answerText === option.option}
                      onChange={(e) => handleInputChange(e.target.value)}
                      disabled={!question.is_editable}
                      required={question.is_required}
                    />
                    {option.option}
                    <span className="checkmark"></span>
                  </label>
                </div>
              ))}
          </div>
        );

      case "multi_select":
        return (
          <div className="d-flex align-items-center flex-wrap">
            {Array.isArray(question.form_data) &&
              question?.form_data?.map((option, index) => (
                <div
                  className="checkbox d-flex align-items-center me-3 mb-2"
                  key={index}
                >
                  <input
                    id={`question_${question.id}_option_${index}`}
                    type="checkbox"
                    name={`question_${question.id}`}
                    value={option.option}
                    disabled={!question.is_editable}
                    required={question.is_required}
                    checked={answerText.split(",").includes(option.option)}
                    onChange={handleMultiSelectChange}
                  />
                  <label
                    htmlFor={`question_${question.id}_option_${index}`}
                    className="mb-0 ms-2"
                  >
                    {option.option}
                  </label>
                </div>
              ))}
          </div>
        );

      case "file":
        return (
          <input
            type="file"
            className="form-control"
            name={`question_${question.id}`}
            disabled={!question.is_editable}
            required={question.is_required}
            onChange={handleFileChange}
            accept={question.file_types || "*"}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="mb-4 question-wrap">
      <p className="label-text font-weight-600 mb-2">
        {number}. {question.question_text}
        {question.is_required && <span className="text-danger">*</span>}
      </p>
      {renderInput()}
    </div>
  );
};

export default Question;
