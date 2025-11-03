import type { ReactNode } from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Desglosar Horas Trabajadas",
  description: "Aplicación de registro de horas de trabajo",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
