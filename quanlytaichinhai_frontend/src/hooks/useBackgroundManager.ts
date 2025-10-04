import { useEffect } from 'react';

export const useBackgroundManager = () => {
  useEffect(() => {
    const savedBg = localStorage.getItem('custom_background');
    if (savedBg) {
      document.body.style.backgroundImage = `url('${savedBg}')`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundRepeat = 'no-repeat';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundAttachment = 'fixed';
    }

    return () => {
      document.body.style.backgroundImage = '';
    };
  }, []);
};