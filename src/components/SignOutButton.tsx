"use client";
import { signOut } from "next-auth/react";
import Icon from "./Icon";

export default function SignOutButton({ block }: { block?: boolean }) {
  return (
    <button type="button" className={`btn ghost sm${block ? " block" : ""}`} onClick={() => signOut({ callbackUrl: "/" })}>
      <Icon name="logout" />
      Sign out
    </button>
  );
}
