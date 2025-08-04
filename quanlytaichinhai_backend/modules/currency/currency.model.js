import db from "../../config/db.js";

export const getCurrencyMappings = async () => {
  const [rows] = await db.query("SELECT term, amount, currency_code FROM currency_terms");
  return rows; // [{ term: '1 củ', amount: 1000000, currency_code: 'VND' }, ...]
};