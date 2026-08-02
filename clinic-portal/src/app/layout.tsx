import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import "./globals.css";
import "./clinical.css";
const font=Noto_Sans({variable:"--font-saxlem",subsets:["latin"]});
export const metadata:Metadata={title:"Saxlem Clinic Portal",description:"A calm operational workspace for clinic receptionists."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" className={font.variable}><body>{children}</body></html>}
