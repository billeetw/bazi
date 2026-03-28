import React from "react";
import styles from "./PremiumButton.module.css";

export interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export function PremiumButton({ variant = "primary", className, type = "button", ...rest }: PremiumButtonProps) {
  const cls = [styles.btn, variant === "secondary" && styles.secondary, className].filter(Boolean).join(" ");
  return <button type={type} className={cls} {...rest} />;
}
