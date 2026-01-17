'use client';
import { ReactNode } from 'react';

export const Modal = ({ 
  isOpen, 
  onClose, 
  children 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  children: ReactNode; 
}) => {
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/40"
      onClick={onClose} // Click outside để đóng
    >
      {/* Nội dung modal với backdrop trong suốt */}
      <div 
        className="bg-white rounded-lg max-w-md w-full mx-4 p-4 shadow-xl" 
        onClick={(e) => e.stopPropagation()} // Ngăn đóng khi click vào modal
      >
        {children}
      </div>
    </div>
  );
};