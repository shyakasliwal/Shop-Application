import { useEffect, useRef } from "react";

function OTPInput({ value, onChange, length = 6 }) {
  const inputsRef = useRef([]);

  const safeValue = (value || "").slice(0, length);

  useEffect(() => {
    if (inputsRef.current[0]) {
      inputsRef.current[0].focus();
    }
  }, []);

  const handleChange = (index, event) => {
    const raw = event.target.value;
    const digits = raw.replace(/\D/g, "");

    if (!digits) {
      const current = safeValue.split("");
      current[index] = "";
      const nextValue = current.join("");
      onChange(nextValue);
      return;
    }

    if (digits.length > 1) {
      const full = (safeValue + digits).replace(/\D/g, "").slice(0, length);
      onChange(full);
      const nextIndex = Math.min(full.length, length - 1);
      const input = inputsRef.current[nextIndex];
      if (input) input.focus();
      return;
    }

    const current = safeValue.split("");
    current[index] = digits;
    const nextValue = current.join("");
    onChange(nextValue);

    const nextIndex = index + 1;
    if (nextIndex < length) {
      const input = inputsRef.current[nextIndex];
      if (input) input.focus();
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace") {
      if (safeValue[index]) {
        const current = safeValue.split("");
        current[index] = "";
        const nextValue = current.join("");
        onChange(nextValue);
        event.preventDefault();
        return;
      }
      const prevIndex = index - 1;
      if (prevIndex >= 0) {
        const input = inputsRef.current[prevIndex];
        if (input) {
          input.focus();
          event.preventDefault();
        }
      }
    }

    if (event.key === "ArrowLeft") {
      const prevIndex = index - 1;
      if (prevIndex >= 0) {
        const input = inputsRef.current[prevIndex];
        if (input) {
          input.focus();
          event.preventDefault();
        }
      }
    }

    if (event.key === "ArrowRight") {
      const nextIndex = index + 1;
      if (nextIndex < length) {
        const input = inputsRef.current[nextIndex];
        if (input) {
          input.focus();
          event.preventDefault();
        }
      }
    }
  };

  const handlePaste = (event) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    event.preventDefault();
    onChange(pasted);
    const nextIndex = Math.min(pasted.length, length - 1);
    const input = inputsRef.current[nextIndex];
    if (input) input.focus();
  };

  const boxes = Array.from({ length }, (_, i) => safeValue[i] || "");

  return (
    <div
      className="flex items-center gap-2 justify-between"
      onPaste={handlePaste}
    >
      {boxes.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={digit}
          onChange={(event) => handleChange(index, event)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          className="w-11 h-11 md:w-12 md:h-12 text-center text-lg font-medium rounded-xl border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 outline-none"
        />
      ))}
    </div>
  );
}

export default OTPInput;

