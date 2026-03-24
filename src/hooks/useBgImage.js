import { useState, useEffect, useRef, useCallback } from 'react';

export function useBgImage(url) {
  const [blur, setBlur]     = useState(0);
  const [key, setKey]       = useState('0');
  const revRef              = useRef(0);
  const dimsRef             = useRef({ w: 0, h: 0 });

  const calcBlur = useCallback((imgW, imgH) => {
    if (!imgW || !imgH) return 0;
    const scale = Math.max(window.innerWidth / imgW, window.innerHeight / imgH);
    return scale > 1.5 ? Math.min((scale - 1.5) * 8, 20) : 0;
  }, []);

  // Probe image dimensions on URL change
  useEffect(() => {
    revRef.current += 1;
    setKey(String(revRef.current));

    if (!url) { setBlur(0); dimsRef.current = { w: 0, h: 0 }; return; }

    const img = new Image();
    img.onload = () => {
      dimsRef.current = { w: img.naturalWidth, h: img.naturalHeight };
      setBlur(calcBlur(img.naturalWidth, img.naturalHeight));
    };
    img.onerror = () => { setBlur(0); dimsRef.current = { w: 0, h: 0 }; };
    img.src = url;

    return () => { img.onload = null; img.onerror = null; img.src = ''; };
  }, [url, calcBlur]);

  // Recalculate on window resize
  useEffect(() => {
    let timer;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const { w, h } = dimsRef.current;
        if (w && h) setBlur(calcBlur(w, h));
      }, 300);
    };
    window.addEventListener('resize', onResize);
    return () => { clearTimeout(timer); window.removeEventListener('resize', onResize); };
  }, [calcBlur]);

  return { blur, key };
}
