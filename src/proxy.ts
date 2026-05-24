import NextAuth from 'next-auth'
import authConfig from '@/auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

const publicRoutes = ['/login', '/forgot-password', '/reset-password']
const publicPrefixes = ['/api/auth']

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname)
  const isPublicPrefix = publicPrefixes.some(p => nextUrl.pathname.startsWith(p))

  // Allow next-auth APIs and forgot-password APIs
  if (isPublicPrefix) {
    return undefined // let NextAuth or the API handle it
  }

  // If user is logged in and trying to access login page, redirect to home
  if (isPublicRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/', nextUrl))
    }
    return undefined
  }

  // If not logged in and trying to access protected route, redirect to login
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', nextUrl))
  }
  
  return undefined
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}
