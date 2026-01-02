// // Load Gemini API keys từ environment variables
// let GEMINI_API_KEYS = Array.from({ length: 56 }, (_, i) => process.env[`GOOGLE_API_KEY_${i + 1}`])
//   .filter(key => key && key !== 'xxx'); // Lọc bỏ key không hợp lệ (undefined hoặc 'xxx')

// const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';

// // Module-level counter để track round-robin (phân bổ đồng đều)
// let callCounter = 0;

// // Helper function để gửi yêu cầu API với round-robin + failover
// export const fetchWithFailover = async (body) => {
//   if (GEMINI_API_KEYS.length === 0) {
//     throw new Error("Không có API key hợp lệ nào được cấu hình");
//   }

//   // Tạo copy của keys để thử nghiệm mà không ảnh hưởng index trong loop
//   let keysToTry = [...GEMINI_API_KEYS];
//   let numKeys = keysToTry.length;
//   const startIndex = callCounter % numKeys;
//   callCounter++; // Tăng counter cho lần gọi tiếp theo

//   console.log(`🔄 Starting call with round-robin key index ${startIndex + 1}/${numKeys}`);

//   // Tập hợp các key thất bại với lỗi persistent (429, 503) để loại bỏ sau
//   let failedKeys = new Set();

//   // Thử từ startIndex, wrap around nếu cần (failover)
//   let i = 0;
//   while (i < numKeys) {
//     const pos = (startIndex + i) % numKeys;
//     const apiKey = keysToTry[pos];

//     try {
//       const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(body)
//       });

//       if (response.ok) {
//         console.log(`✅ API call succeeded with round-robin key ${pos + 1}`);
//         // Loại bỏ các key thất bại persistent khỏi danh sách gốc trước khi return
//         GEMINI_API_KEYS = GEMINI_API_KEYS.filter(k => !failedKeys.has(k));
//         if (failedKeys.size > 0) {
//           console.log(`🗑️ Removed ${failedKeys.size} persistent failed keys for future calls`);
//         }
//         return await response.json();
//       } else {
//         const status = response.status;
//         const errorText = await response.text();
//         console.warn(`⚠️ Key ${pos + 1} failed with status ${status}: ${errorText}`);
//         // Chỉ blacklist nếu là lỗi persistent như 429 (rate limit) hoặc 503 (service unavailable)
//         if ([429, 503].includes(status)) {
//           failedKeys.add(apiKey);
//           console.log(`🔄 Marking key ${pos + 1} for removal due to persistent error ${status}`);
//         }
//       }
//     } catch (error) {
//       console.warn(`⚠️ Error with key ${pos + 1}: ${error.message}`);
//       // Lỗi network (catch) không blacklist, chỉ retry với key khác
//     }

//     i++; // Tiếp tục thử key tiếp theo
//   }

//   // Nếu tất cả thất bại, loại bỏ các key persistent failed
//   GEMINI_API_KEYS = GEMINI_API_KEYS.filter(k => !failedKeys.has(k));
//   if (failedKeys.size > 0) {
//     console.log(`🗑️ Removed ${failedKeys.size} persistent failed keys after full failure`);
//   }

//   throw new Error("Tất cả các khóa API Gemini đều thất bại trong vòng lặp round-robin");
// };



// Load Gemini API keys từ environment variables
let GEMINI_API_KEYS = Array.from({ length: 56 }, (_, i) => process.env[`GOOGLE_API_KEY_${i + 1}`])
  .filter(key => key && key !== 'xxx'); // Lọc bỏ key không hợp lệ (undefined hoặc 'xxx')

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';

// Helper function để gửi yêu cầu API với sequential failover (stick to first key until exhausted)
export const fetchWithFailover = async (body) => {
  if (GEMINI_API_KEYS.length === 0) {
    throw new Error("Không có API key hợp lệ nào được cấu hình");
  }

  // Tạo copy của keys để thử nghiệm mà không ảnh hưởng index trong loop
  let keysToTry = [...GEMINI_API_KEYS];
  let numKeys = keysToTry.length;

  console.log(`🔄 Starting call with sequential keys from 1/${numKeys}`);

  // Tập hợp các key thất bại với lỗi persistent (429, 503) để loại bỏ sau
  let failedKeys = new Set();

  // Thử từ index 0 (first key), sequential failover nếu cần
  for (let i = 0; i < numKeys; i++) {
    const pos = i;
    const apiKey = keysToTry[pos];

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        console.log(`✅ API call succeeded with key ${pos + 1}`);
        // Loại bỏ các key thất bại persistent khỏi danh sách gốc trước khi return
        GEMINI_API_KEYS = GEMINI_API_KEYS.filter(k => !failedKeys.has(k));
        if (failedKeys.size > 0) {
          console.log(`🗑️ Removed ${failedKeys.size} persistent failed keys for future calls`);
        }
        return await response.json();
      } else {
        const status = response.status;
        const errorText = await response.text();
        console.warn(`⚠️ Key ${pos + 1} failed with status ${status}: ${errorText}`);
        // Chỉ blacklist nếu là lỗi persistent như 429 (rate limit) hoặc 503 (service unavailable)
        if ([429, 503].includes(status)) {
          failedKeys.add(apiKey);
          console.log(`🔄 Marking key ${pos + 1} for removal due to persistent error ${status}`);
        }
      }
    } catch (error) {
      console.warn(`⚠️ Error with key ${pos + 1}: ${error.message}`);
      // Lỗi network (catch) không blacklist, chỉ retry với key tiếp theo
    }
  }

  // Nếu tất cả thất bại, loại bỏ các key persistent failed
  GEMINI_API_KEYS = GEMINI_API_KEYS.filter(k => !failedKeys.has(k));
  if (failedKeys.size > 0) {
    console.log(`🗑️ Removed ${failedKeys.size} persistent failed keys after full failure`);
  }

  throw new Error("Tất cả các khóa API Gemini đều thất bại trong vòng lặp sequential");
};