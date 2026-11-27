import { useEffect, useState } from 'react';

export function LogoAnimadaBT() {
  const [modo, setModo] = useState<'caminhao' | 'boi'>('caminhao');

  useEffect(() => {
    // Fica mais tempo como caminhão (7.5s) e muda de vez em quando para o boi (3.5s)
    const duracao = modo === 'caminhao' ? 7500 : 3500;
    const timer = setTimeout(() => {
      setModo((prev) => (prev === 'caminhao' ? 'boi' : 'caminhao'));
    }, duracao);

    return () => clearTimeout(timer);
  }, [modo]);

  return (
    <button
      type="button"
      onClick={() => setModo((prev) => (prev === 'caminhao' ? 'boi' : 'caminhao'))}
      title="Bacchiega Transporte"
      aria-label="Logo animada Bacchiega Transporte"
      className="relative w-9 h-9 rounded-lg bg-brand-500 flex items-center justify-center text-brand-contrast shadow-sm overflow-hidden shrink-0 cursor-pointer transition-colors group"
    >
      <style>{`
        @keyframes bt-truck-bounce {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-1.2px); }
        }
        @keyframes bt-road-dash {
          0% { stroke-dashoffset: 12; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes bt-ox-head {
          0%, 100% { transform: rotate(0deg) translateY(0px); }
          35% { transform: rotate(-6deg) translateY(0.8px); }
          70% { transform: rotate(4deg) translateY(-0.5px); }
        }
        @keyframes bt-ear-twitch {
          0%, 80%, 100% { transform: rotate(0deg); }
          88% { transform: rotate(-14deg); }
          94% { transform: rotate(6deg); }
        }
        .bt-anim-truck {
          animation: bt-truck-bounce 0.55s ease-in-out infinite;
        }
        .bt-anim-road {
          stroke-dasharray: 3 3;
          animation: bt-road-dash 0.5s linear infinite;
        }
        .bt-anim-ox {
          transform-origin: 18px 20px;
          animation: bt-ox-head 1.8s ease-in-out infinite;
        }
        .bt-anim-ear {
          transform-origin: 24px 16px;
          animation: bt-ear-twitch 2.4s ease-in-out infinite;
        }
      `}</style>

      {/* SVG 1: Caminhão Boiadeiro */}
      <svg
        viewBox="0 0 36 36"
        className={`absolute inset-0 w-full h-full p-1 transition-all duration-500 ${
          modo === 'caminhao'
            ? 'opacity-100 scale-100 rotate-0'
            : 'opacity-0 scale-75 -rotate-12 pointer-events-none'
        }`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Estrada animada */}
        <line
          x1="4"
          y1="28.5"
          x2="32"
          y2="28.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeOpacity="0.55"
          className="bt-anim-road"
        />

        <g className="bt-anim-truck">
          {/* Carroceria gaiola boiadeira */}
          <rect
            x="4.5"
            y="10.5"
            width="16.5"
            height="12.5"
            rx="1.8"
            stroke="currentColor"
            strokeWidth="2"
          />
          {/* Ripas horizontais da gaiola */}
          <line x1="4.5" y1="14.5" x2="21" y2="14.5" stroke="currentColor" strokeWidth="1.3" />
          <line x1="4.5" y1="18.5" x2="21" y2="18.5" stroke="currentColor" strokeWidth="1.3" />
          {/* Ripas verticais da gaiola */}
          <line x1="10" y1="10.5" x2="10" y2="23" stroke="currentColor" strokeWidth="1.3" />
          <line x1="15.5" y1="10.5" x2="15.5" y2="23" stroke="currentColor" strokeWidth="1.3" />

          {/* Cabine */}
          <path
            d="M21 13.5H26.8C27.6 13.5 28.3 14 28.6 14.7L30.5 18.8C30.7 19.2 30.8 19.6 30.8 20V23H21V13.5Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Janela da cabine */}
          <path
            d="M23.2 15.6H26.4L27.8 18.6H23.2V15.6Z"
            fill="currentColor"
            fillOpacity="0.35"
          />
          {/* Farol */}
          <circle cx="30.6" cy="20.6" r="0.9" fill="currentColor" />
        </g>

        {/* Rodas */}
        <circle
          cx="10.5"
          cy="24.5"
          r="2.6"
          fill="var(--color-brand-500, currentColor)"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx="10.5" cy="24.5" r="0.8" fill="currentColor" />

        <circle
          cx="25.5"
          cy="24.5"
          r="2.6"
          fill="var(--color-brand-500, currentColor)"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx="25.5" cy="24.5" r="0.8" fill="currentColor" />
      </svg>

      {/* SVG 2: Boi Animado */}
      <svg
        viewBox="0 0 36 36"
        className={`absolute inset-0 w-full h-full p-1 transition-all duration-500 ${
          modo === 'boi'
            ? 'opacity-100 scale-100 rotate-0'
            : 'opacity-0 scale-75 rotate-12 pointer-events-none'
        }`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g className="bt-anim-ox">
          {/* Chifres */}
          <path
            d="M11.5 13.5C8.5 12.8 7.2 10.2 8.4 7.5C9.4 9.5 10.9 10.6 13.2 11.1"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M24.5 13.5C27.5 12.8 28.8 10.2 27.6 7.5C26.6 9.5 25.1 10.6 22.8 11.1"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Orelhas */}
          <path
            d="M11.5 15.2L7.8 16.5L10.8 18.2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M24.5 15.2L28.2 16.5L25.2 18.2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="bt-anim-ear"
          />

          {/* Cabeça */}
          <path
            d="M12.2 12.5C12.2 11.2 14.5 10.5 18 10.5C21.5 10.5 23.8 11.2 23.8 12.5L22.8 21.5C22.5 24.5 20.6 26.8 18 26.8C15.4 26.8 13.5 24.5 13.2 21.5L12.2 12.5Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Olhos */}
          <circle cx="15.2" cy="16.2" r="1.1" fill="currentColor" />
          <circle cx="20.8" cy="16.2" r="1.1" fill="currentColor" />

          {/* Focinho */}
          <rect
            x="13.8"
            y="20.2"
            width="8.4"
            height="5.4"
            rx="2.7"
            fill="currentColor"
            fillOpacity="0.22"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          {/* Narinas */}
          <circle cx="16.3" cy="22.9" r="0.85" fill="currentColor" />
          <circle cx="19.7" cy="22.9" r="0.85" fill="currentColor" />
        </g>
      </svg>
    </button>
  );
}