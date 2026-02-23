import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decodeJwt } from 'jose';

function isTokenExpired(token: string): boolean {
    try {
        const payload = decodeJwt(token);
        if (!payload.exp) {
            // No expiry claim means we can't verify - treat as expired for safety
            return true;
        }
        // Check if the token has expired (compare with current time in seconds)
        const now = Math.floor(Date.now() / 1000);
        return payload.exp < now;
    } catch {
        // If decoding fails, treat token as invalid/expired
        return true;
    }
}

export function middleware(request: NextRequest) {
    const token = request.cookies.get('access_token')?.value;
    const { pathname } = request.nextUrl;

    // 로그인 페이지, SSO, 정적 리소스는 통과
    if (
        pathname.startsWith('/login') ||
        pathname.startsWith('/sso') || // SSO 경로 추가
        pathname.startsWith('/_next') ||
        pathname === '/favicon.ico' ||
        pathname.includes('.') // 이미지 등 파일 제외
    ) {
        return NextResponse.next();
    }

    // 토큰이 없거나 만료되었으면 로그인 페이지로 리다이렉트
    if (!token || isTokenExpired(token)) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';

        // If token existed but was expired, clear the stale cookie
        if (token) {
            const response = NextResponse.redirect(url);
            response.cookies.delete('access_token');
            return response;
        }

        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
