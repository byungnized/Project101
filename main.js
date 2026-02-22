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
          color: #111111;
          border: 2px solid rgba(0, 0, 0, 0.08);
          animation: reveal 0.5s ease-in-out forwards;
          opacity: 0;
          transform: scale(0.5);
        }

        .ball-yellow { background-color: #f7d64f; }
        .ball-blue { background-color: #5aa6ff; color: #0b1b36; }
        .ball-red { background-color: #ff6b6b; color: #3b0b0b; }
        .ball-gray { background-color: #bfbfbf; color: #1f1f1f; }
        .ball-green { background-color: #71d28b; color: #0b2a16; }

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
      lottoNumber.classList.add('lotto-number', this.getBallClass(number));
      lottoNumber.textContent = number;
      lottoNumber.style.animationDelay = `${index * 0.1}s`;
      this.shadowRoot.appendChild(lottoNumber);
    });
  }

  getBallClass(number) {
    if (number <= 10) return 'ball-yellow';
    if (number <= 20) return 'ball-blue';
    if (number <= 30) return 'ball-red';
    if (number <= 40) return 'ball-gray';
    return 'ball-green';
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
