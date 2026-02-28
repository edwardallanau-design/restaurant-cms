import type { Config } from 'tailwindcss'

const config: Config = {
    darkMode: ['class'],
    content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	extend: {
  		colors: {
  			primary: {
  				'50': 'oklch(97% 0.02 80)',
  				'100': 'oklch(93% 0.05 80)',
  				'200': 'oklch(87% 0.09 75)',
  				'300': 'oklch(79% 0.13 72)',
  				'400': 'oklch(70% 0.16 68)',
  				'500': 'oklch(60% 0.18 65)',
  				'600': 'oklch(52% 0.18 62)',
  				'700': 'oklch(44% 0.16 60)',
  				'800': 'oklch(36% 0.13 58)',
  				'900': 'oklch(28% 0.09 55)',
  				'950': 'oklch(18% 0.06 52)',
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			surface: {
  				DEFAULT: 'oklch(98% 0.005 80)',
  				dark: 'oklch(12% 0.005 80)'
  			},
  			muted: {
  				DEFAULT: 'oklch(55% 0.01 80)',
  				dark: 'oklch(65% 0.01 80)',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		fontFamily: {
  			sans: [
  				'var(--font-inter)',
  				'ui-sans-serif',
  				'system-ui',
  				'sans-serif'
  			],
  			serif: [
  				'var(--font-playfair)',
  				'ui-serif',
  				'Georgia',
  				'serif'
  			]
  		},
  		borderRadius: {
  			card: '0.75rem',
  			button: '0.375rem',
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		spacing: {
  			section: '5rem'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
