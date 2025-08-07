'use client';
import {useState } from 'react';
import Image from 'next/image';
export default function BackgroundImageConfirmForm({
  imageUrl,
}: {
  imageUrl: string;
}) {
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    // Không thêm backend URL nếu ảnh từ Cloudinary
    const fullImageUrl = imageUrl;

    document.body.style.backgroundImage = `url('${fullImageUrl}')`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundAttachment = 'fixed';

    localStorage.setItem('custom_background', fullImageUrl);
    setConfirmed(true);
  };


  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded-xl shadow space-y-4 mt-6">
      <h2 className="text-xl font-bold text-center">Xác nhận ảnh làm hình nền</h2>
      <Image
        src={imageUrl}
        alt="Background Preview"
        className="w-full rounded-md shadow"
      />
      {!confirmed ? (
        <div className="flex justify-center gap-4 mt-4">
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Đặt làm hình nền
          </button>
          <button
            onClick={() => alert('Bạn đã huỷ đổi hình nền')}
            className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
          >
            Huỷ
          </button>
        </div>
      ) : (
        <p className="text-green-600 text-center font-semibold">
          ✅ Hình nền đã được cập nhật!
        </p>
      )}
    </div>
  );
}
