"use client";

export default function Footer() {
  return (
    <footer className="footer">
      <span className="footer-brand">✦ AI Frontend Developer Assistant</span>
      <span className="footer-divider">|</span>
      <span>© {new Date().getFullYear()} All rights reserved.</span>
      <span className="footer-divider">|</span>
      <span className="footer-disclaimer">
        AI responses may contain mistakes. Verify important code.
      </span>
    </footer>
  );
}