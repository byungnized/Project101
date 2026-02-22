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
          animation: reveal 0.5s ease-in-out forwards;
          opacity: 0;
          transform: scale(0.5);
        }

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

  generateBtn.addEventListener('click', () => {
    lottoDisplay.generateNumbers();
  });

  lottoDisplay.generateNumbers(); // Initial generation
});
