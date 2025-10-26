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
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
          light: "hsl(var(--success-light))",
          dark: "hsl(var(--success-dark))",
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      backgroundImage: {
        'gradient-cream': 'linear-gradient(135deg, hsl(43, 40%, 95%) 0%, hsl(40, 38%, 92%) 100%)',
        'gradient-warm-cream': 'linear-gradient(135deg, hsl(45, 42%, 94%) 0%, hsl(42, 40%, 90%) 100%)',
        'gradient-butter': 'linear-gradient(135deg, hsl(45, 45%, 93%) 0%, hsl(40, 42%, 88%) 100%)',
        'gradient-vanilla': 'linear-gradient(135deg, hsl(42, 38%, 96%) 0%, hsl(38, 35%, 93%) 100%)',
        'gradient-honey': 'linear-gradient(135deg, hsl(40, 48%, 90%) 0%, hsl(35, 45%, 85%) 100%)',
        'gradient-caramel': 'linear-gradient(135deg, hsl(38, 42%, 88%) 0%, hsl(33, 40%, 83%) 100%)',
        'gradient-cream-radial': 'radial-gradient(circle at top, hsl(45, 42%, 95%), hsl(40, 38%, 90%))',
        'gradient-warm-glow': 'radial-gradient(ellipse at center, hsl(45, 50%, 92%), hsl(40, 35%, 88%))',
        'gradient-coffee': 'linear-gradient(135deg, hsl(32, 40%, 86%) 0%, hsl(35, 38%, 82%) 100%)',
        'gradient-mocha': 'linear-gradient(135deg, hsl(28, 38%, 88%) 0%, hsl(30, 40%, 84%) 100%)',
        'gradient-latte': 'linear-gradient(135deg, hsl(42, 35%, 92%) 0%, hsl(38, 38%, 88%) 100%)',
        'gradient-cappuccino': 'linear-gradient(to br, hsl(43, 40%, 95%), hsl(35, 38%, 91%))',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
