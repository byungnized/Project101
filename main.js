class LottoDisplay extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        .lotto-number {
          width: 50px;
          height: 50px;
          background-color: var(--number-bg-color);
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 1.5rem;
          font-weight: bold;
          color: var(--ball-text-color);
          border: 2px solid var(--ball-border-color);
          animation: reveal 0.5s ease-in-out forwards;
          opacity: 0;
          transform: scale(0.5);
        }
        .ball-yellow { background-color: #f7d64f; }

        @keyframes reveal {
          from {
            opacity: 0;
            transform: scale(0.5);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      </style>
    `;
  }

  generateNumbers() {
    this.shadowRoot.querySelectorAll('.lotto-number').forEach(el => el.remove());
    const numbers = new Set();
    while (numbers.size < 6) {
      numbers.add(Math.floor(Math.random() * 45) + 1);
    }

    [...numbers].sort((a, b) => a - b).forEach((number, index) => {
      const lottoNumber = document.createElement('div');
      lottoNumber.classList.add('lotto-number');
      if (index === 5) {
        lottoNumber.classList.add('ball-yellow');
      }
      lottoNumber.textContent = number;
      lottoNumber.style.animationDelay = `${index * 0.1}s`;
      this.shadowRoot.appendChild(lottoNumber);
    });
  }
}

customElements.define('lotto-display', LottoDisplay);

document.addEventListener('DOMContentLoaded', () => {
  const lottoDisplay = document.querySelector('lotto-display');
  const generateBtn = document.getElementById('generate-btn');
  const themeToggle = document.getElementById('theme-toggle');

  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    const isDark = theme === 'dark';
    themeToggle.textContent = isDark ? 'Light mode' : 'Dark mode';
    themeToggle.setAttribute('aria-pressed', String(isDark));
  };

  const getPreferredTheme = () => {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  generateBtn.addEventListener('click', () => {
    lottoDisplay.generateNumbers();
  });

  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', next);
    applyTheme(next);
  });

  applyTheme(getPreferredTheme());
  lottoDisplay.generateNumbers(); // Initial generation
});
