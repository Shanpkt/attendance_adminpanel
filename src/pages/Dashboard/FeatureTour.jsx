import { useEffect, useState } from "react";

const TOUR_KEY = "monthly-access-tour-seen";

const STEPS = [
  {
    title: "New feature added",
    body: "Employees can now ask to see their own monthly attendance. You approve each person from this dashboard. The next steps show how the bell, Enable, Disable, and Delete work.",
  },
  {
    title: "Employee raises a request",
    body: "In the punch app, the employee chooses Show monthly attendance, enters their registered mobile number, and taps Raise request. The month stays hidden until you enable it.",
  },
  {
    title: "The request shows on the bell",
    body: "The bell at the top of Today Attendance shows how many new requests are waiting. Open it to see the employee name, mobile number, and the time they asked.",
  },
  {
    title: "Enable only that employee",
    body: "Select Enable for that employee. Only they can open their monthly attendance. Everyone else still cannot see their month.",
  },
  {
    title: "Disable keeps the request",
    body: "Select Disable to hide the month again. The employee stays in the list, so you can enable them later. Punch records are not changed.",
  },
  {
    title: "Delete removes the request only",
    body: "Delete clears that request from the database. It does not delete punch-in, punch-out, selfies, or the employee. They can raise a new request later.",
  },
];

export const hasSeenFeatureTour = () => {
  try {
    return localStorage.getItem(TOUR_KEY) === "1";
  } catch (error) {
    return false;
  }
};

export const markFeatureTourSeen = () => {
  try {
    localStorage.setItem(TOUR_KEY, "1");
  } catch (error) {
    // Storage can be blocked; the tour can still close.
  }
};

function GuideHand() {
  return (
    <span className="guide-hand" aria-hidden="true">
      <span className="guide-hand__ring" />
      <span className="guide-hand__pointer">👆</span>
    </span>
  );
}

function FeatureTour({ onClose, onStepChange }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const pointsAtDashboard = step >= 2;

  useEffect(() => {
    if (onStepChange) {
      onStepChange(step);
    }
  }, [step, onStepChange]);

  const finish = () => {
    markFeatureTourSeen();
    onClose();
  };

  return (
    <div
      className={`feature-tour${
        pointsAtDashboard ? " feature-tour--anchored" : ""
      }`}
      role="dialog"
      aria-modal="true"
    >
      <div className="feature-tour__card">
        <p className="feature-tour__kicker">
          Step {step + 1} of {STEPS.length}
        </p>
        <h2>{current.title}</h2>
        <p>{current.body}</p>

        {step === 1 && (
          <div className="feature-tour__phone">
            <span>Show monthly attendance</span>
            <div className="feature-tour__phone-btn">
              Raise request
              <GuideHand />
            </div>
          </div>
        )}

        <div className="feature-tour__dots" aria-hidden="true">
          {STEPS.map((item, index) => (
            <span
              key={item.title}
              className={
                index === step ? "is-active" : ""
              }
            />
          ))}
        </div>

        <div className="feature-tour__actions">
          {step > 0 ? (
            <button
              type="button"
              className="feature-tour__back"
              onClick={() => setStep((value) => value - 1)}
            >
              Back
            </button>
          ) : (
            <button
              type="button"
              className="feature-tour__back"
              onClick={finish}
            >
              Skip
            </button>
          )}

          <button
            type="button"
            className="feature-tour__next"
            onClick={() => {
              if (isLast) {
                finish();
                return;
              }
              setStep((value) => value + 1);
            }}
          >
            {isLast ? "Done" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

export { GuideHand };
export default FeatureTour;
