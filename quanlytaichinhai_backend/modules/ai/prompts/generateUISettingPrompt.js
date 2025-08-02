export function generateUISettingPrompt({ user_input }) {
  return `Người dùng đang yêu cầu thay đổi giao diện. Phân tích yêu cầu sau và trả về JSON như sau:

{
  "setting_type": "theme" | "background" | "language" | ...,
  "value": "dark" | "light" | "blue-theme" | "vi" | "en" | ...
}

Yêu cầu người dùng: "${user_input}"`;
}
