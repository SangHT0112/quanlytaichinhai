// test.js - Final fixed: Parses VND prices accurately from snippets
import axios from 'axios';

// Fallbacks (giữ nguyên)
const fallbacks = {
  electronics: { min: 5000000, max: 50000000, avg: 20000000 },
  travel: { min: 5000000, max: 30000000, avg: 15000000 },
  vehicle: { min: 20000000, max: 50000000, avg: 30000000 },
  education: { min: 2000000, max: 100000000, avg: 20000000 },
  real_estate: { min: 1000000000, max: 5000000000, avg: 2000000000 },
  wedding: { min: 50000000, max: 200000000, avg: 100000000 },
  emergency: { min: 30000000, max: 60000000, avg: 45000000 },
  general: { min: 10000000, max: 100000000, avg: 50000000 }
};

const detectGoalAndFetchPrice = async (user_input) => {
  const lowerInput = user_input.toLowerCase();
  let detected = { item: null, category: null, estimated_price: null, price_range: null };

  // Patterns (giữ nguyên)
  const patterns = {
    electronics: /(iphone|ipad|samsung|macbook|laptop)/i,
    travel: /(du lịch|japan|nhật|đà lạt|phú quốc)/i,
    vehicle: /(xe máy|wave|exciter|xe hơi)/i,
    education: /(học|khóa học|đại học|thạc sĩ)/i,
    real_estate: /(mua nhà|đất|chung cư|nhà mặt tiền tphcm)/i,
    wedding: /(đám cưới|kết hôn)/i,
    emergency: /quỹ khẩn cấp/i
  };

  for (const [cat, regex] of Object.entries(patterns)) {
    if (regex.test(lowerInput)) {
      detected.category = cat;
      detected.item = lowerInput.match(regex)[0];
      break;
    }
  }

  if (!detected.item) {
    detected.category = 'general';
    detected.item = 'mục tiêu chung';
  }

  try {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().toLocaleString('default', { month: 'short' }).toLowerCase();
    const query = `${detected.item} giá việt nam ${currentMonth} ${currentYear}`;
    
    console.log(`🔍 Đang search query: "${query}"`);

    const response = await axios.get('https://serpapi.com/search', {
      params: {
        engine: 'google',
        q: query,
        api_key: '8aed61aa7af0cfce22127f266b1082637060379e5784389c46cc2a358022bf97', // Key thật của bạn
        num: 5,
        location: 'Vietnam',
        gl: 'vn', // Ưu tiên site VN
        lr: 'lang_vi' // Tiếng Việt
      }
    });

    const results = response.data.organic_results || [];
    console.log(`📄 Tìm thấy ${results.length} kết quả snippets`);

    let prices = [];
    results.forEach((result, index) => {
      console.log(`Snippet ${index + 1}: ${result.snippet?.substring(0, 100)}...`);
      
      // Regex tinh chỉnh: Match số optional dots/thousands, optional decimals, optional unit
      const matches = result.snippet?.match(/(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:\.\d+)?)\s*([₫đồngđVNĐtriệutynghìn\$millionthousandbillion]+)?/gi) || [];
      matches.forEach(match => {
        if (!match[1]) return; // Null-check cho group 1 (số)
        
        const numStr = match[1].replace(/\./g, '').replace(/,/g, ''); // 37.990.000 → 37990000
        let num = parseFloat(numStr);
        const unitStr = (match[2] || '').toLowerCase();
        
        if (isNaN(num) || num <= 1000) return; // Bỏ số nhỏ (model/year/GB)
        
        let multiplier = 1;
        if (unitStr.includes('triệu') || unitStr.includes('million')) multiplier = 1e6;
        else if (unitStr.includes('ty') || unitStr.includes('billion')) multiplier = 1e9;
        else if (unitStr.includes('nghìn') || unitStr.includes('thousand')) multiplier = 1e3;
        else if (unitStr.includes('$')) multiplier = 24500; // USD → VND ~24.5k
        // ₫/đồng/đ/VNĐ: 1 (VND trực tiếp)
        
        num *= multiplier;
        
        // Filter: >5tr <60tr cho electronics (tùy category)
        const minPrice = detected.category === 'real_estate' ? 1e9 : 5e6;
        const maxPrice = detected.category === 'real_estate' ? 1e10 : 6e7;
        if (num > minPrice && num < maxPrice) {
          prices.push(num);
          console.log(`  → Parsed: ${num.toLocaleString()} VND (unit: ${unitStr})`);
        }
      });
    });

    console.log(`💰 Parsed prices array: [${prices.map(p => p.toLocaleString()).join(', ')}]`);

    if (prices.length > 0) {
      detected.estimated_price = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
      detected.price_range = { min: Math.min(...prices), max: Math.max(...prices) };
      console.log(`✅ Search success: Avg ${detected.estimated_price.toLocaleString()} VND, Range ${detected.price_range.min.toLocaleString()}-${detected.price_range.max.toLocaleString()} VND`);
    } else {
      throw new Error('No valid prices parsed');
    }
  } catch (error) {
    console.error('❌ Lỗi fetch/parse:', error.message);
    const fb = fallbacks[detected.category] || fallbacks.general;
    detected.estimated_price = fb.avg;
    detected.price_range = { min: fb.min, max: fb.max };
    console.log(`🔄 Fallback: ${detected.category} - Avg ${detected.estimated_price.toLocaleString()} VND`);
  }

  return detected;
};

// Test
async function testFunction() {
  const userInput = "Mua iphone 17 promax 256gb";
  console.log(`\n🧪 Test input: "${userInput}"\n`);
  const result = await detectGoalAndFetchPrice(userInput);
  console.log(`\n📊 Kết quả cuối:`, JSON.stringify(result, null, 2));
}

testFunction().catch(console.error);