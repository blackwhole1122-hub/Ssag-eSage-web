// src/proxy.js
import { NextResponse } from 'next/server'

export async function proxy(request) {
  const { pathname } = request.nextUrl

  const hasSession = request.cookies.getAll().some(
    c => c.name.startsWith('sb-') && c.name.includes('auth-token')
  )

  const isLoginPage = pathname === '/admin' || pathname === '/admin/'
  const isProtectedPage = pathname.startsWith('/admin/') && !isLoginPage

  if (!hasSession && isProtectedPage) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  if (hasSession && isLoginPage) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  return NextResponse.next({ request })
}

export const config = {
  matcher: ['/admin/:path*'],
}