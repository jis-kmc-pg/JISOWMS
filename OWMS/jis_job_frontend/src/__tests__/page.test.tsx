import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import DashboardPage from '../app/page'

// Mock fetch
global.fetch = jest.fn((url: string) => {
    if (url.includes('/dashboard/summary')) {
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
                todayProjects: 5,
                weeklyCompleted: 10,
                leaveBalance: 15,
                leaveUsed: 2,
                teamAbsence: []
            }),
        });
    }
    if (url.includes('/dashboard/recent-jobs')) {
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([
                {
                    id: 1,
                    title: "Test Job",
                    content: "Test Content",
                    projectName: "Test Project",
                    category: "Dev",
                    timeAgo: "1 hour ago"
                }
            ]),
        });
    }
    return Promise.reject(new Error('Unknown URL'));
}) as jest.Mock;

// Mock Next/Link
jest.mock('next/link', () => {
    return ({ children }: { children: React.ReactNode }) => {
        return children;
    }
});

describe('DashboardPage', () => {
    beforeEach(() => {
        // Clear mocks
        jest.clearAllMocks();
        // Set token
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: jest.fn(() => 'test-token'),
                setItem: jest.fn(),
                removeItem: jest.fn(),
                clear: jest.fn(),
            },
            writable: true
        });
    });

    it('renders dashboard correctly', async () => {
        render(<DashboardPage />)

        expect(screen.getByText(/반갑습니다, 관리자님!/i)).toBeInTheDocument()

        // Wait for fetch to complete and stats to appear
        await waitFor(() => {
            expect(screen.getByText('오늘 진행 업무')).toBeInTheDocument()
            expect(screen.getByText('5')).toBeInTheDocument()
        })
    })
})
