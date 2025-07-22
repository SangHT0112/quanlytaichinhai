class Transaction {
  type string @description("Loại giao dịch: ví dụ 'expense'")
  amount float @description("Số tiền đã chi tiêu cho món hàng")
  category string @description("Phân loại chi tiêu, ví dụ: Ăn uống")
  description string @description("Tên món hàng hoặc dịch vụ")
}

class Invoices {
  group_name string @description("Tên cửa hàng hoặc đơn vị bán hàng ghi trên hóa đơn")
  transaction_date string @description("Ngày giao dịch, định dạng yyyy-mm-dd")
  total_amount float @description("Tổng tiền thanh toán")
  transactions Transaction[] @description("Danh sách các giao dịch được ghi nhận trong hóa đơn")
}




function ExtractInvoices(images: image[]) -> Invoices {
  client "ollama/llama3"
  prompt #"
    {{_.role("user")}}
    Hãy trích xuất các thông tin từ hóa đơn sau:
    - Trường `group_name` là tên cửa hàng/quán ăn được in trên đầu hóa đơn. Nếu không xác định được rõ ràng, hãy đoán từ phần có font to hoặc nổi bật nhất trên hóa đơn. Nếu vẫn không có, hãy đặt là "Hóa đơn".
    - Ngày giao dịch (transaction_date)
    - Tổng số tiền thanh toán (total_amount)
    - Danh sách các món hàng đã mua (transactions) gồm: loại, số tiền, phân loại, mô tả

     📂 Danh sách category được nhận: ['Lương', 'Ăn uống', 'Di chuyển', 'Giải trí', 'Hóa đơn', 'Y tế', 'Nhà cửa', 'Giáo dục', 'Du lịch', 'Thể thao', 'Thưởng']
     Hãy đảm bảo rằng trường `category` của mỗi giao dịch phải thuộc danh sách trên. Nếu không rõ, hãy chọn giá trị gần đúng nhất.
     
    {% for img in images %}
    [Ảnh {{loop.index}}]
    {{ img }}
    {% endfor %}

    Trả về đúng theo định dạng sau:
    {
      "group_name": "...",
      "transaction_date": "...",
      "total_amount": ...,
      "transactions": [
        {
          "type": "expense",
          "amount": ...,
          "category": "...",
          "description": "..."
        },
        ...
      ]
    }
    
    {{ ctx.output_format }}
  "#
}
