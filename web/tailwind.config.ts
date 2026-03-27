import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        spotify: {
          DEFAULT: "#1DB954",
          dark: "#158a3e",
          light: "#1ed760",
          muted: "#1db95420",
        },
        youtube: {
          DEFAULT: "#FF0000",
          dark: "#cc0000",
          light: "#ff3333",
          muted: "#ff000020",
        },
        surface: {
          DEFAULT: "#111111",
          raised: "#191919",
          overlay: "#222222",
          border: "#2a2a2a",
          "border-light": "#333333",
        },
        bg: {
          DEFAULT: "#080808",
          secondary: "#0d0d0d",
        },
        text: {
          primary: "#f5f5f5",
          secondary: "#a3a3a3",
          muted: "#525252",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      backgroundImage: {
        "gradient-spotify-yt":
          "linear-gradient(135deg, #1DB954 0%, #FF0000 100%)",
        "gradient-spotify-yt-subtle":
          "linear-gradient(135deg, #1DB95420 0%, #FF000020 100%)",
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "hero-glow":
          "radial-gradient(ellipse 80% 50% at 50% -20%, #1DB95430 0%, transparent 60%)",
        "card-shine":
          "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.00) 100%)",
      },
      boxShadow: {
        "spotify-glow": "0 0 20px rgba(29, 185, 84, 0.25)",
        "spotify-glow-lg": "0 0 40px rgba(29, 185, 84, 0.3)",
        "youtube-glow": "0 0 20px rgba(255, 0, 0, 0.25)",
        "youtube-glow-lg": "0 0 40px rgba(255, 0, 0, 0.3)",
        "card-hover": "0 8px 32px rgba(0, 0, 0, 0.4)",
        "surface": "0 1px 3px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
      },
      borderColor: {
        DEFAULT: "#2a2a2a",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "fade-in-up": "fadeInUp 0.6s ease-out",
        "fade-in-down": "fadeInDown 0.4s ease-out",
        "slide-in-right": "slideInRight 0.4s ease-out",
        "pulse-spotify": "pulseSpotify 2s ease-in-out infinite",
        "spin-slow": "spin 3s linear infinite",
        "bounce-subtle": "bounceSubtle 2s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeInDown: {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        pulseSpotify: {
          "0%, 100%": { boxShadow: "0 0 10px rgba(29, 185, 84, 0.3)" },
          "50%": { boxShadow: "0 0 25px rgba(29, 185, 84, 0.6)" },
        },
        bounceSubtle: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        glow: {
          "0%": { opacity: "0.6" },
          "100%": { opacity: "1" },
        },
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      transitionDuration: {
        "400": "400ms",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
