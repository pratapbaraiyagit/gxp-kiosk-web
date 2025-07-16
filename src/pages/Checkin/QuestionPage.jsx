import React, { useEffect, useState } from "react";
import Question from "../../components/Question";
import { useNavigate } from "react-router-dom";
import Aos from "aos";
import { useTranslation } from "react-i18next";
import { getSessionItem, setSessionItem } from "../../hooks/session";
import Swal from "sweetalert2";
import { playBeep } from "../../utils/playBeep";
import { useSelector } from "react-redux";
import { dummay_QueAns } from "../../utils/data";
import { playSafeAudio } from "../../utils/commonFun";

const QuestionPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { kioskQADeskLoading, activeKioskQADeskList } = useSelector(
    ({ kioskQADesk }) => kioskQADesk
  );

  const KioskDeviceInfo = getSessionItem("KioskDeviceInfo");
  const KioskDeviceInfoSession = KioskDeviceInfo
    ? JSON.parse(decodeURIComponent(escape(atob(KioskDeviceInfo))))
    : null;
  const newKioskDeviceMode = KioskDeviceInfoSession?.[0]?.mode;

  const finalKioskQAList =
    newKioskDeviceMode === "demo"
      ? activeKioskQADeskList?.length !== 0
        ? activeKioskQADeskList
        : dummay_QueAns
      : activeKioskQADeskList;

  const getInitialAnswers = () => {
    const savedAnswers = getSessionItem("questionAnswers");

    if (savedAnswers && finalKioskQAList) {
      try {
        const parsedAnswers = JSON.parse(savedAnswers);
        return finalKioskQAList.reduce((acc, q) => {
          acc[q.id] = {
            id: q.id,
            answer_text: parsedAnswers[q.id]?.answer_text || "",
            answer_id: parsedAnswers[q.id]?.answer_id || null,
            isValid: parsedAnswers[q.id]?.isValid || !q.is_mandatory,
          };
          return acc;
        }, {});
      } catch (error) {
        // console.error("Error parsing saved answers:", error);
      }
    }

    // If no saved answers or error parsing, return default state based on finalKioskQAList
    if (finalKioskQAList) {
      return finalKioskQAList.reduce((acc, q) => {
        acc[q.id] = {
          id: q.id,
          answer_text: "",
          answer_id: null,
          isValid: !q.is_mandatory,
        };
        return acc;
      }, {});
    }

    return {};
  };

  const [answers, setAnswers] = useState(getInitialAnswers());

  // Initialize AOS
  useEffect(() => {
    Aos.init({
      duration: 1000,
      once: true,
      easing: "ease-in-out",
    });
    playSafeAudio("ask_questions");
  }, []);

  // Save answers to session storage whenever they change
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      setSessionItem("questionAnswers", JSON.stringify(answers));

      // Save individual answers for specific fields - can be made dynamic based on question type/id
      const parkingQuestion = finalKioskQAList?.find((q) =>
        q.question_text.toLowerCase().includes("parking")
      );

      const visitQuestion = finalKioskQAList?.find((q) =>
        q.question_text.toLowerCase().includes("first time visit")
      );

      if (parkingQuestion && answers[parkingQuestion.id]?.answer_text) {
        setSessionItem("parking", answers[parkingQuestion.id].answer_text);
      }

      if (visitQuestion && answers[visitQuestion.id]?.answer_text) {
        setSessionItem("visit", answers[visitQuestion.id].answer_text);
      }
    }
  }, [answers, finalKioskQAList]);

  // Transform API data format to match component's expected format
  const mapQuestionData = (apiQuestion) => {
    let answerType = "text"; // default

    switch (apiQuestion.question_type) {
      case "multiple_choice":
        answerType = "radio";
        break;
      case "checkbox":
        answerType = "checkbox";
        break;
      case "dropdown":
        answerType = "dropdown";
        break;
      case "text":
        answerType = "text";
        break;
      case "number":
        answerType = "number";
        break;
      case "date":
        answerType = "date";
        break;
      case "time":
        answerType = "time";
        break;
      case "email":
        answerType = "email";
        break;
      case "long_text":
        answerType = "long_text";
        break;
      default:
        answerType = "text";
    }

    return {
      id: apiQuestion.id,
      question_text: apiQuestion.question_text,
      answer_type: answerType,
      is_editable: true,
      is_required: apiQuestion.is_mandatory,
      answer_text: answers[apiQuestion.id]?.answer_text || "",
      answer_id: answers[apiQuestion.id]?.answer_id || null,
      options: apiQuestion.kiosk_question_options?.map((option) => ({
        id: option.question_option_id,
        text: option.option_text,
        value: option.option_text,
        action: option.question_action?.code_name || null,
      })),
    };
  };

  const updateAnswer = (question, value, optionId = null) => {
    // Determine the answer_id based on the question type and selected value
    let answerId = optionId;

    // For multiple choice questions, try to find the matching option ID
    if (
      question.answer_type === "radio" ||
      question.answer_type === "checkbox"
    ) {
      const apiQuestion = finalKioskQAList.find((q) => q.id === question.id);
      if (apiQuestion && apiQuestion.kiosk_question_options) {
        const selectedOption = apiQuestion.kiosk_question_options.find(
          (option) => option.option_text === value
        );
        if (selectedOption) {
          answerId = selectedOption.question_option_id;
        }
      }
    }

    setAnswers((prev) => {
      const newAnswers = {
        ...prev,
        [question.id]: {
          id: question.id,
          answer_text: value,
          answer_id: answerId,
          isValid: question.is_required ? !!value : true,
        },
      };
      return newAnswers;
    });
  };

  const validateAnswers = () => {
    if (!finalKioskQAList || finalKioskQAList.length === 0) {
      return true;
    }

    const invalidAnswers = Object.values(answers)?.filter(
      (ans) => !ans.isValid
    );

    if (invalidAnswers.length > 0) {
      playBeep();
      Swal.fire({
        text: t("Please_question_answer"),
        icon: "error",
        confirmButtonText: t("Ok"),
        showClass: {
          popup: `
            animate__animated
            animate__fadeInUp
            animate__faster
          `,
        },
        hideClass: {
          popup: `
            animate__animated
            animate__fadeOutDown
            animate__faster
          `,
        },
      });
      return false;
    }

    return true;
  };

  const handleContinue = () => {
    if (validateAnswers()) {
      // Save final state before navigation
      setSessionItem("questionAnswers", JSON.stringify(answers));

      // Check if any selected answer has a question_action for vehicle_no
      let shouldNavigateToVehicle = false;

      if (finalKioskQAList && finalKioskQAList.length > 0) {
        finalKioskQAList.forEach((question) => {
          const selectedAnswerText = answers[question.id]?.answer_text;

          // If this question has options and user provided an answer
          if (question.kiosk_question_options && selectedAnswerText) {
            // Find the selected option
            const selectedOption = question.kiosk_question_options.find(
              (option) => option.option_text === selectedAnswerText
            );

            // Check if selected option has a question_action with code_name "vehicle_no"
            if (
              selectedOption &&
              selectedOption.question_action &&
              selectedOption.question_action.code_name === "vehicle_no"
            ) {
              shouldNavigateToVehicle = true;
            }
          }
        });
      }

      // Navigate based on the presence of vehicle_no action
      if (shouldNavigateToVehicle) {
        navigate("/check-in/vehical");
      } else {
        navigate("/check-in/addon");
      }
    }
  };

  // Show loading state while questions are being fetched
  if (kioskQADeskLoading) {
    return (
      <div className="my-auto text-center">
        <h2>{t("Loading")}</h2>
      </div>
    );
  }

  return (
    <div className="my-auto">
      <h1 data-aos="fade-up" data-aos-delay="500" className="heading-h1">
        {t("Need_more_information")}
      </h1>

      <div
        data-aos="fade-up"
        data-aos-delay="1000"
        className="form-input addon-scrollbar p-4 mb-5"
        id="scrollbar-style"
      >
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="question-text p-1" id="scrollbar-style">
            {finalKioskQAList &&
              finalKioskQAList.map((apiQuestion, index) => (
                <Question
                  key={apiQuestion.id}
                  question={mapQuestionData(apiQuestion)}
                  number={index + 1}
                  onUpdate={(questionObj, value, optionId) =>
                    updateAnswer(questionObj, value, optionId)
                  }
                />
              ))}
          </div>
        </form>
      </div>

      <div
        className="d-flex align-items-center justify-content-between"
        data-aos="fade-up"
        data-aos-delay="1500"
      >
        <button
          className="common-btn black-btn"
          onClick={() => {
            navigate(-1);
          }}
        >
          {t("Back")}
        </button>
        <button className="common-btn blue-btn" onClick={handleContinue}>
          {t("Continue")}
        </button>
      </div>
    </div>
  );
};

export default QuestionPage;
