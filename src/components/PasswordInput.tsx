"use client";
import { useState } from "react";
import Icon from "./Icon";

export default function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <div className="input-wrap">
      <input {...props} type={show ? "text" : "password"} style={{ paddingRight: 92 }} />
      <button type="button" className="btn ghost" onClick={() => setShow((s) => !s)} aria-pressed={show} aria-label={show ? "Hide password" : "Show password"}>
        <Icon name={show ? "eyeOff" : "eye"} /> {show ? "Hide" : "Show"}
      </button>
    </div>
  );
}
