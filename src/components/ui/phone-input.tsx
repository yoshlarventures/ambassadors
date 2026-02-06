"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: string;
  onChange: (value: string) => void;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, value, onChange, disabled, ...props }, ref) => {
    // Format the display value (add spaces)
    const formatDisplay = (digits: string): string => {
      // Remove any non-digits
      const clean = digits.replace(/\D/g, "").slice(0, 9);

      // Format as XX XXX XX XX
      let formatted = "";
      if (clean.length > 0) formatted += clean.slice(0, 2);
      if (clean.length > 2) formatted += " " + clean.slice(2, 5);
      if (clean.length > 5) formatted += " " + clean.slice(5, 7);
      if (clean.length > 7) formatted += " " + clean.slice(7, 9);

      return formatted;
    };

    // Get the raw digits from the stored value (which is +998XXXXXXXXX format)
    const getDigitsFromValue = (val: string): string => {
      if (!val) return "";
      // If it starts with +998, extract the remaining digits
      if (val.startsWith("+998")) {
        return val.slice(4).replace(/\D/g, "");
      }
      return val.replace(/\D/g, "");
    };

    const displayValue = formatDisplay(getDigitsFromValue(value));

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      // Extract only digits from input
      const digits = input.replace(/\D/g, "").slice(0, 9);

      // Store as +998XXXXXXXXX format (no spaces)
      if (digits.length > 0) {
        onChange(`+998${digits}`);
      } else {
        onChange("");
      }
    };

    return (
      <div className="flex">
        <div className={cn(
          "flex h-10 items-center rounded-l-md border border-r-0 bg-muted px-3 text-sm font-medium text-muted-foreground",
          disabled && "opacity-50"
        )}>
          +998
        </div>
        <input
          type="tel"
          className={cn(
            "flex h-10 w-full rounded-r-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          value={displayValue}
          onChange={handleChange}
          placeholder="__ ___ __ __"
          disabled={disabled}
          {...props}
        />
      </div>
    );
  }
);
PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
