import "./globals.css";

export const metadata = { title: "Smart Task Evaluator" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 min-h-screen">
        <main className="max-w-4xl mx-auto p-6">{children}</main>
      </body>
    </html>
  );
}
