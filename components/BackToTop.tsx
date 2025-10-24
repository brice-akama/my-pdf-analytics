'use client';

import { useState, useEffect } from 'react';
import { MdArrowUpward } from 'react-icons/md'; // Import the icon from React Icons

const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Show the button when the user scrolls down
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
<button
  onClick={scrollToTop}
  className="fixed bottom-20 right-4 z-50 p-2 bg-gradient-to-br from-slate-100 via-blue-100 to-indigo-100 text-white rounded-full shadow-md  transition"
  aria-label="Back to Top"
>
  <MdArrowUpward className="h-6 w-6" />
</button>

  );
};

export default BackToTop;