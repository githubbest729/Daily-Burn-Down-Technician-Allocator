/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        rig: {
          bg: '#0A0C0F',        // primary background, near-black steel
          surface: '#14181D',   // card / lane background
          raised: '#1C2128',    // elevated surface (task card)
          border: '#2A3138',
          borderLight: '#394049',
          text: '#F1F3F4',
          muted: '#8A939C',
          faint: '#5B636C'
        },
        signal: {
          amber: '#FF8A00',     // primary accent — active work
          amberDim: '#7A4300',
          green: '#00C853',     // on-track / under capacity
          greenDim: '#0B4224',
          red: '#FF3B30',       // over-allocation / danger
          redDim: '#4A1310',
          yellow: '#FFD400',    // caution / near-capacity
          yellowDim: '#4A3D00'
        }
      },
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto',
          'Helvetica Neue', 'Arial', 'sans-serif'
        ],
        condensed: [
          'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'
        ]
      },
      minHeight: {
        touch: '44px'
      },
      minWidth: {
        touch: '44px'
      },
      boxShadow: {
        lane: 'inset 0 0 0 1px rgba(255,255,255,0.04)',
        card: '0 1px 0 rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.35)',
        cardLift: '0 8px 24px rgba(0,0,0,0.55), 0 0 0 2px #FF8A00'
      }
    }
  },
  plugins: []
};
