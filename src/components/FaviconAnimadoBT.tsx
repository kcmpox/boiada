import { useEffect, useState } from 'react';

function criarSvgFavicon(modo: 'caminhao' | 'boi', corFundo = '#f59e0b', corTraco = '#0f172a'): string {
  const svg =
    modo === 'caminhao'
      ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" fill="none">
          <rect width="36" height="36" rx="8" fill="${corFundo}"/>
          <line x1="4" y1="28.5" x2="32" y2="28.5" stroke="${corTraco}" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="3 3" stroke-opacity="0.65"/>
          <rect x="4.5" y="10.5" width="16.5" height="12.5" rx="1.8" stroke="${corTraco}" stroke-width="2"/>
          <line x1="4.5" y1="14.5" x2="21" y2="14.5" stroke="${corTraco}" stroke-width="1.3"/>
          <line x1="4.5" y1="18.5" x2="21" y2="18.5" stroke="${corTraco}" stroke-width="1.3"/>
          <line x1="10" y1="10.5" x2="10" y2="23" stroke="${corTraco}" stroke-width="1.3"/>
          <line x1="15.5" y1="10.5" x2="15.5" y2="23" stroke="${corTraco}" stroke-width="1.3"/>
          <path d="M21 13.5H26.8C27.6 13.5 28.3 14 28.6 14.7L30.5 18.8C30.7 19.2 30.8 19.6 30.8 20V23H21V13.5Z" stroke="${corTraco}" stroke-width="2" stroke-linejoin="round"/>
          <path d="M23.2 15.6H26.4L27.8 18.6H23.2V15.6Z" fill="${corTraco}" fill-opacity="0.35"/>
          <circle cx="30.6" cy="20.6" r="0.9" fill="${corTraco}"/>
          <circle cx="10.5" cy="24.5" r="2.6" fill="${corFundo}" stroke="${corTraco}" stroke-width="2"/>
          <circle cx="10.5" cy="24.5" r="0.8" fill="${corTraco}"/>
          <circle cx="25.5" cy="24.5" r="2.6" fill="${corFundo}" stroke="${corTraco}" stroke-width="2"/>
          <circle cx="25.5" cy="24.5" r="0.8" fill="${corTraco}"/>
        </svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" fill="none">
          <rect width="36" height="36" rx="8" fill="${corFundo}"/>
          <path d="M11.5 13.5C8.5 12.8 7.2 10.2 8.4 7.5C9.4 9.5 10.9 10.6 13.2 11.1" stroke="${corTraco}" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M24.5 13.5C27.5 12.8 28.8 10.2 27.6 7.5C26.6 9.5 25.1 10.6 22.8 11.1" stroke="${corTraco}" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M11.5 15.2L7.8 16.5L10.8 18.2" stroke="${corTraco}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M24.5 15.2L28.2 16.5L25.2 18.2" stroke="${corTraco}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12.2 12.5C12.2 11.2 14.5 10.5 18 10.5C21.5 10.5 23.8 11.2 23.8 12.5L22.8 21.5C22.5 24.5 20.6 26.8 18 26.8C15.4 26.8 13.5 24.5 13.2 21.5L12.2 12.5Z" stroke="${corTraco}" stroke-width="2" stroke-linejoin="round"/>
          <circle cx="15.2" cy="16.2" r="1.1" fill="${corTraco}"/>
          <circle cx="20.8" cy="16.2" r="1.1" fill="${corTraco}"/>
          <rect x="13.8" y="20.2" width="8.4" height="5.4" rx="2.7" fill="${corTraco}" fill-opacity="0.22" stroke="${corTraco}" stroke-width="1.6"/>
          <circle cx="16.3" cy="22.9" r="0.85" fill="${corTraco}"/>
          <circle cx="19.7" cy="22.9" r="0.85" fill="${corTraco}"/>
        </svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function FaviconAnimadoBT() {
  const [modo, setModo] = useState<'caminhao' | 'boi'>('caminhao');

  useEffect(() => {
    const duracao = modo === 'caminhao' ? 7500 : 3500;
    const timer = setTimeout(() => {
      setModo((prev) => (prev === 'caminhao' ? 'boi' : 'caminhao'));
    }, duracao);

    return () => clearTimeout(timer);
  }, [modo]);

  useEffect(() => {
    const computed = getComputedStyle(document.documentElement);
    const brandHex =
      computed.getPropertyValue('--color-brand-500').trim() || '#f59e0b';

    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }

    link.type = 'image/svg+xml';
    link.href = criarSvgFavicon(modo, brandHex, '#0f172a');
  }, [modo]);

  return null;
}