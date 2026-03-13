import "./global.css";
import Footer from "./components/Footer";

export const metadata = {
  title: "AI Frontend Developer Assistant",
  description: "Analyze, debug and improve your JavaScript and React code using AI",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
         <Footer/>
      </body>
    </html>
  );
}