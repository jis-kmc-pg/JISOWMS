'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSWRConfig } from 'swr';

const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') + '/dashboard';

export function useSocket() {
    const { mutate } = useSWRConfig();
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        const socket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 3000,
            reconnectionAttempts: 5,
        });

        socketRef.current = socket;

        // 특정 위젯 갱신
        socket.on('widget:refresh', (payload: { widgetId: string }) => {
            // SWR 캐시에서 해당 위젯의 API 키를 revalidate
            // 정확한 키를 모르므로 정규식 매칭으로 전체 revalidate
            mutate(
                (key: string) => typeof key === 'string',
                undefined,
                { revalidate: true },
            );
        });

        // 전체 대시보드 갱신
        socket.on('dashboard:refresh', () => {
            mutate(
                (key: string) => typeof key === 'string',
                undefined,
                { revalidate: true },
            );
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [mutate]);

    return socketRef;
}
