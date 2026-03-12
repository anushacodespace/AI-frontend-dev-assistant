import "./global.css"

export const metadata = {
  title: "AI Frontend Developer Assistant",
  description: "Analyze, debug and improve your JavaScript and React code using AI",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}