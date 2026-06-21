import React, { useEffect, useState } from 'react';

export default function PageTransition({ children }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(true);
    return () => setActive(false);
  }, []);

  return (
    <div className={`transition-all duration-300 ease-out ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {children}
    </div>
  );
}
