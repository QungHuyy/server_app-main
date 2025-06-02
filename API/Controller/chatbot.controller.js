import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function chat(req, res) {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Thiếu trường 'message'" });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Bạn là nhân viên tư vấn sản phẩm thời trang của cửa hàng XYZ. Nhiệm vụ của bạn là:
- Tư vấn các sản phẩm như: giày thể thao, áo thun, áo khoác, quần jeans, váy nữ, áo sơ mi nam, v.v.
- Đưa ra gợi ý theo danh mục cụ thể như "áo nam", "váy nữ", "giày thể thao nữ", v.v.
- Gợi ý sản phẩm phù hợp theo thời tiết (nắng, mưa, lạnh, nóng) nếu người dùng yêu cầu.

Chỉ trả lời các câu hỏi liên quan đến thời trang và sản phẩm của cửa hàng XYZ. Nếu câu hỏi không liên quan, hãy trả lời: "Xin lỗi, tôi chỉ hỗ trợ thông tin về sản phẩm thời trang của cửa hàng XYZ".`,
        },
        { role: "user", content: message },
      ],
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Có lỗi xảy ra!" });
  }
}
