export function extractTotalAmount(text) {
  const lines = text.split('\n').map(line => line.trim());

  // Ưu tiên từ khóa chứa cụm này
  const priorityKeywords = /t[oô]ng.*ti[eê]n.*(thanh.to[aá]n|bao.g[oồ]m)/i;
  const fallbackKeywords = /t[oô]ng.*ti[eê]n|thanh.to[aá]n|ti[eê]n.th[aá]nh/i;

  let bestMatch = null;

  for (const line of lines) {
    if (priorityKeywords.test(line)) {
      const matches = line.match(/(\d{1,3}(?:[.,]\d{3})+)/g);
      if (matches) {
        const max = Math.max(...matches.map(m => parseInt(m.replace(/[.,]/g, ''))));
        if (max) return max; // Ưu tiên lấy đúng dòng chứa từ khóa "tổng tiền phải thanh toán"
      }
    }
  }

  // Nếu không có dòng ưu tiên, mới fallback
  for (const line of lines) {
    if (fallbackKeywords.test(line)) {
      const matches = line.match(/(\d{1,3}(?:[.,]\d{3})+)/g);
      if (matches) {
        const max = Math.max(...matches.map(m => parseInt(m.replace(/[.,]/g, ''))));
        if (max > 0) bestMatch = max;
      }
    }
  }

  return bestMatch || null;
}



export function parseReceipt(text) {
    console.log('✅ Raw OCR text:\n', text); // Xem thử dòng nào bị OCR sai
  const result = {
    ngay: null,
    tong_tien: null,
    san_pham: [],
  };

  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);

  // Ngày hóa đơn
  const dateMatch = text.match(/(\d{2}\/\d{2}\/\d{4})/);
  result.ngay = dateMatch ? dateMatch[1] : null;

  // Tổng tiền từ dòng gần giống "tổng cộng tiền thanh toán"
  const extractedTotal = extractTotalAmount(text);
  if (extractedTotal) {
    result.tong_tien = extractedTotal;
  } else {
    // Fallback: tìm số cuối cùng trong OCR
    const fallback = text.match(/(\d{1,3}(?:[.,]\d{3})*)\s*$/);
    result.tong_tien = fallback ? fallback[1].replace(/[^\d]/g, '') : null;
  }

  // Tách các dòng sản phẩm
    result.san_pham = lines.filter(line =>
    /^[A-ZÀÁẠĂÂĐÊÔƠƯa-z0-9\s\-]+[\s\d.,]{6,}$/.test(line) && /\d+/.test(line)
    );
  return result;
}
