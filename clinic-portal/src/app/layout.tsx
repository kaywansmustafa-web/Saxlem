import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./clinical.css";
import "./aura.css";
const font=localFont({src:"./fonts/Inter-Variable.woff2",variable:"--font-saxlem",weight:"100 900",display:"swap"});
const display=localFont({src:"./fonts/Sora-Variable.woff2",variable:"--font-display",weight:"100 800",display:"swap"});
export const metadata:Metadata={title:"Saxlem Clinic Portal",description:"A calm operational workspace for clinic receptionists."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" className={`${font.variable} ${display.variable}`}><body>{children}</body></html>}
