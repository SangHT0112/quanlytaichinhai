// controllers/sepay.controller.js
export const handleSepayWebhook = async (req, res) => {
  try {
    const data = req.body; // Sepay sẽ gửi JSON ở đây
    console.log("Webhook từ Sepay:", data);

    // TODO: lưu giao dịch vào database
    // TODO: gửi socket.io đến frontend (nếu muốn realtime)

    res.status(200).send("OK");
  } catch (err) {
    console.error("Lỗi webhook:", err);
    res.status(500).send("FAIL");
  }
};
