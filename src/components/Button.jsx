import React from "react";

const Button = ({
  text,
  icon,
  onClick,
  color,
  bgColor,
  size,
  borderRadius,
  width,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        color,
        backgroundColor: bgColor,
        borderRadius,
        width: width === "full" ? "100%" : "auto",
      }}
      className={`flex items-center justify-center gap-2 px-4 py-2 ${
        size === "2xl" ? "text-2xl" : "text-md"
      }`}
    >
      {icon}
      {text}
    </button>
  );
};

export default Button;
