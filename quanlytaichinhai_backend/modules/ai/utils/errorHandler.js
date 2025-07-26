// src/utils/errorHandler.js
export const handleError = (res, error) => {
  console.error("❌ Error:", error.message);
  
  const response = {
    error: `Lỗi xử lý AI: ${error.message}`,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: error.stack,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)) 
    })
  };
  
  res.status(500).json(response);
};