"use client";
import { useState } from "react";
import Icon from "./Icon";

export default function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <div className="input-wrap has-icon has-action">
      <Icon name="lock" className="input-icon" />
      <input {...props} type={show ? "text" : "password"} />
      <button type="button" className="input-action" onClick={() => setShow((s) => !s)} aria-pressed={show} aria-label={show ? "Hide password" : "Show password"}>
        <Icon name={show ? "eyeOff" : "eye"} />
      </button>
    </div>
  );
}
