// // import type { Config } from "tailwindcss";

// // export default {
// //   darkMode: ["class"],
// //   content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"], 
// //   theme: {
// //     extend: {
// //       colors: {
// //         // You MUST define these so Tailwind creates the classes
// //         background: "hsl(var(--background))",
// //         foreground: "hsl(var(--foreground))",
// //         card: {
// //           DEFAULT: "hsl(var(--card))",
// //           foreground: "hsl(var(--card-foreground))",
// //         },
// //         primary: {
// //           DEFAULT: "hsl(var(--primary))",
// //           foreground: "hsl(var(--primary-foreground))",
// //         },
// //         border: "hsl(var(--border))",
// //         input: "hsl(var(--input))",
// //         ring: "hsl(var(--ring))",
// //         muted: {
// //           DEFAULT: "hsl(var(--muted))",
// //           foreground: "hsl(var(--muted-foreground))",
// //         },
// //       },
// //       borderRadius: {
// //         lg: "var(--radius)",
// //         md: "calc(var(--radius) - 2px)",
// //         sm: "calc(var(--radius) - 4px)",
// //       },
// //     }
// //   },
// //   plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
// // } satisfies Config;


// // import type { Config } from "tailwindcss";
// import animate from "tailwindcss-animate";
// import typography from "@tailwindcss/typography";

// export default {
//   darkMode: ["class"],
//   content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
//   theme: {
//     extend: {
//       colors: {
//         border: "hsl(var(--border))",
//         input: "hsl(var(--input))",
//         ring: "hsl(var(--ring))",
//         background: "hsl(var(--background))",
//         foreground: "hsl(var(--foreground))",
//         primary: {
//           DEFAULT: "hsl(var(--primary))",
//           foreground: "hsl(var(--primary-foreground))",
//         },
//         secondary: {
//           DEFAULT: "hsl(var(--secondary))",
//           foreground: "hsl(var(--secondary-foreground))",
//         },
//         destructive: {
//           DEFAULT: "hsl(var(--destructive))",
//           foreground: "hsl(var(--destructive-foreground))",
//         },
//         muted: {
//           DEFAULT: "hsl(var(--muted))",
//           foreground: "hsl(var(--muted-foreground))",
//         },
//         accent: {
//           DEFAULT: "hsl(var(--accent))",
//           foreground: "hsl(var(--accent-foreground))",
//         },
//         card: {
//           DEFAULT: "hsl(var(--card))",
//           foreground: "hsl(var(--card-foreground))",
//         },
//       },
//       borderRadius: {
//         lg: "var(--radius)",
//         md: "calc(var(--radius) - 2px)",
//         sm: "calc(var(--radius) - 4px)",
//       },
//     },
//   },
//   plugins: [animate, typography],
// } satisfies Config;
import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";
import typography from "@tailwindcss/typography";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
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
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  // Use the imported variables here instead of require()
  plugins: [animate, typography],
} satisfies Config;