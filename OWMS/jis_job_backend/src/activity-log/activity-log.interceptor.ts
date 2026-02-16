import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { ActivityLogService } from './activity-log.service';

// 로그 제외 경로
const EXCLUDED_PATHS = ['/auth/refresh', '/activity-logs'];

// HTTP 메서드 → 액션 매핑
function resolveAction(method: string, path: string): string {
    if (path.includes('/auth/login')) return 'LOGIN';
    if (path.includes('/auth/logout')) return 'LOGOUT';

    switch (method) {
        case 'POST': return 'CREATE';
        case 'PUT':
        case 'PATCH': return 'UPDATE';
        case 'DELETE': return 'DELETE';
        default: return method;
    }
}

@Injectable()
export class ActivityLogInterceptor implements NestInterceptor {
    constructor(private readonly activityLogService: ActivityLogService) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest();
        const { method, url, ip, headers } = req;

        // GET 요청 제외 (조회 로그는 양이 너무 많음)
        if (method === 'GET') return next.handle();

        // 제외 경로 확인
        const path = url.split('?')[0];
        if (EXCLUDED_PATHS.some((p) => path.startsWith(p))) {
            return next.handle();
        }

        const userId = req.user?.sub || req.user?.id || null;
        const userName = req.user?.userId || null;
        const action = resolveAction(method, path);
        const userAgent = headers['user-agent'] || null;

        return next.handle().pipe(
            tap({
                next: () => {
                    // 로그인의 경우 응답에서 user 정보 추출
                    let detail: string | undefined;
                    if (action === 'LOGIN' && !userId) {
                        // 로그인 요청 body에서 userId 추출 (비밀번호 제외)
                        const loginUserId = req.body?.userId;
                        if (loginUserId) {
                            detail = JSON.stringify({ loginUserId });
                        }
                    }

                    this.activityLogService.log({
                        userId: userId ? +userId : undefined,
                        userName,
                        action,
                        method,
                        path,
                        statusCode: 200,
                        ip,
                        userAgent,
                        detail,
                    });
                },
                error: (err) => {
                    let detail: string | undefined;
                    if (action === 'LOGIN') {
                        const loginUserId = req.body?.userId;
                        if (loginUserId) {
                            detail = JSON.stringify({ loginUserId, error: 'Login failed' });
                        }
                    }

                    this.activityLogService.log({
                        userId: userId ? +userId : undefined,
                        userName,
                        action,
                        method,
                        path,
                        statusCode: err.status || 500,
                        ip,
                        userAgent,
                        detail,
                    });
                },
            }),
        );
    }
}
