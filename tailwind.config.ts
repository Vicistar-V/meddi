import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "slide-indicator": {
          "0%": {
            transform: "translateX(var(--start-position))",
          },
          "100%": {
            transform: "translateX(var(--end-position))",
          },
        },
        "nav-icon-bounce": {
          "0%, 100%": {
            transform: "scale(1)",
          },
          "50%": {
            transform: "scale(1.1)",
          },
        },
        "ripple": {
          "0%": {
            transform: "scale(0)",
            opacity: "0.6",
          },
          "100%": {
            transform: "scale(4)",
            opacity: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-indicator": "slide-indicator 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "nav-icon-bounce": "nav-icon-bounce 0.3s ease-out",
        "ripple": "ripple 0.6s ease-out",
      },
      backgroundImage: {
        'gradient-cream': 'linear-gradient(135deg, hsl(40, 20%, 96%) 0%, hsl(35, 25%, 94%) 100%)',
        'gradient-warm-cream': 'linear-gradient(135deg, hsl(38, 25%, 95%) 0%, hsl(30, 30%, 92%) 100%)',
        'gradient-coffee': 'linear-gradient(135deg, hsl(30, 35%, 88%) 0%, hsl(35, 30%, 85%) 100%)',
        'gradient-mocha': 'linear-gradient(135deg, hsl(25, 30%, 90%) 0%, hsl(30, 35%, 87%) 100%)',
        'gradient-latte': 'linear-gradient(135deg, hsl(40, 25%, 94%) 0%, hsl(35, 30%, 90%) 100%)',
        'gradient-cappuccino': 'linear-gradient(to br, hsl(40, 20%, 96%), hsl(30, 25%, 93%))',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
