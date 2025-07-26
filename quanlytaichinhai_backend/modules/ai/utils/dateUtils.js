// src/utils/dateUtils.js
export const getCurrentDate = () => {
  return new Date().toISOString().split("T")[0];
};