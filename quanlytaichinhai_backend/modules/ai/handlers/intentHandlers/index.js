// src/handlers/intentHandlers/index.js
import { handleTransaction } from './transactionHandler.js';
import { handleComponent } from './componentHandler.js';
import { handleSQL } from './sqlHandler.js';
import { handleForecast } from './forecastHandler.js';
import { handleFollowup } from './followupHandler.js';
import { handleNatural } from './naturalHandler.js';

const intentHandlers = {
  transaction: handleTransaction,
  component: handleComponent,
  sql_query: handleSQL,
  forecast: handleForecast,
  followup: handleFollowup,
  natural: handleNatural
};

export const handleIntent = async (intent, params) => {
  const handler = intentHandlers[intent] || handleNatural;
  return await handler(params);
};