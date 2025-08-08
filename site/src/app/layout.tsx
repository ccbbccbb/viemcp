import './globals.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'viemcp — MCP server for Viem',
  description:
    'Fast setup & flexible config for Model Context Protocol: choose networks, RPC, and keys.',
  applicationName: 'viemcp',
  keywords: ['mcp', 'model-context-protocol', 'viem', 'ethereum', 'evm'],
  authors: [{ name: 'charchar', url: 'https://github.com/ccbbccbb' }],
  icons: { icon: '/favicon.ico' },
  openGraph: {
    title: 'viemcp — MCP server for Viem',
    description:
      'Fast setup & flexible config for Model Context Protocol: choose networks, RPC, and keys.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'viemcp — MCP server for Viem',
    description:
      'Fast setup & flexible config for Model Context Protocol: choose networks, RPC, and keys.',
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style>
          {
            "@import url('https://fonts.googleapis.com/css2?family=Libre+Bodoni:ital,wght@0,700;1,700&display=swap');"
          }
        </style>
      </head>
      <body className="antialiased">{children}</body>
    </html>
  )
}
