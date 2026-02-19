// Daily Report Page - Refactored with Component Extraction
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Save, Plus, ArrowLeft, FileSpreadsheet } from 'lucide-react';
import Link from 'next/link';
import api from '../../lib/api';
import WeeklyStatusNav from '../../components/WeeklyStatusNav';

import {
    JobItem, ProjectItem, WeeklyNavStatus, SystemMemo, PastJobResult,
    formatDate, getWeekStart, isLineExceeded, isWeeklyNoteExceeded
} from '../../components/daily-report/types';
import DateNavigation from '../../components/daily-report/DateNavigation';
import JobCard from '../../components/daily-report/JobCard';
import Sidebar from '../../components/daily-report/Sidebar';
import CreateProjectModal from '../../components/daily-report/CreateProjectModal';
import DeleteConfirmModal from '../../components/daily-report/DeleteConfirmModal';
import ToastNotification from '../../components/daily-report/ToastNotification';

export default function DailyReportPage() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showCalendar, setShowCalendar] = useState(false);
    const [jobs, setJobs] = useState<JobItem[]>([
        { tempId: Math.random().toString(36).substr(2, 9), title: '', content: '', projectId: null, isIssue: false, timeSpent: 2 }
    ]);
    const [projects, setProjects] = useState<ProjectItem[]>([]);
    const [weeklyNote, setWeeklyNote] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [workType, setWorkType] = useState('내근');
    const [holidayName, setHolidayName] = useState('');
    const [weeklyStatus, setWeeklyStatus] = useState<WeeklyNavStatus[]>([]);
    const [projectSearchTerm, setProjectSearchTerm] = useState('');
    const [systemMemos, setSystemMemos] = useState<SystemMemo[]>([]);
    const [searchStartDate, setSearchStartDate] = useState(formatDate(new Date(new Date().setDate(new Date().getDate() - 7))));
    const [searchEndDate, setSearchEndDate] = useState(formatDate(new Date()));
    const [pastJobSearchResults, setPastJobSearchResults] = useState<PastJobResult[]>([]);
    const [isSearchingPastJobs, setIsSearchingPastJobs] = useState(false);
    const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
    const [newProjectData, setNewProjectData] = useState({ clientName: '', projectName: '' });
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [jobToDeleteIndex, setJobToDeleteIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);
    const [userInfo, setUserInfo] = useState<{ id: number, name: string } | null>(null);

    const dropdownRef = useRef<HTMLDivElement>(null);

    // --- Project Filter ---
    const getFilteredProjects = () => {
        const search = projectSearchTerm.trim().normalize('NFC').replace(/[\s\(\)㈜]/g, '').toLowerCase();
        if (!search) return projects.slice(0, 50);
        return projects.filter(p => {
            const name = String(p.projectName || '').normalize('NFC').replace(/[\s\(\)㈜]/g, '').toLowerCase();
            const client = String(p.clientName || '').normalize('NFC').replace(/[\s\(\)㈜]/g, '').toLowerCase();
            return name.includes(search) || client.includes(search);
        }).slice(0, 100);
    };

    const matchingCount = projects.filter(p => {
        const search = projectSearchTerm.trim().normalize('NFC').replace(/[\s\(\)㈜]/g, '').toLowerCase();
        if (!search) return false;
        const name = String(p.projectName || '').normalize('NFC').replace(/[\s\(\)㈜]/g, '').toLowerCase();
        const client = String(p.clientName || '').normalize('NFC').replace(/[\s\(\)㈜]/g, '').toLowerCase();
        return name.includes(search) || client.includes(search);
    }).length;

    // --- Init ---
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    setUserInfo(user);
                } catch {
                    // ignore parse error
                }
            }
        }
    }, []);

    // --- Data Fetching ---
    const fetchProjects = async () => {
        try {
            const projectsRes = await api.get(`/reports/projects`);
            if (projectsRes.data) setProjects(projectsRes.data);
        } catch {
            // silently ignore
        }
    };

    const fetchReport = useCallback(async () => {
        setIsLoading(true);
        const dateStr = formatDate(selectedDate);
        const weekStartStr = formatDate(getWeekStart(selectedDate));

        try {
            try {
                const statusNavRes = await api.get(`/reports/my-status?date=${dateStr}`);
                if (statusNavRes.data) setWeeklyStatus(statusNavRes.data);
            } catch {
                // silently ignore
            }

            let fetchedWorkType = '내근';
            try {
                const statusRes = await api.get(`/reports/daily-status?date=${dateStr}`);
                if (statusRes.data) {
                    fetchedWorkType = statusRes.data.workType || '내근';
                    setWorkType(fetchedWorkType);
                    setHolidayName(statusRes.data.holidayName || '');
                } else {
                    setWorkType('내근');
                    setHolidayName('');
                }
            } catch {
                setWorkType('내근');
                setHolidayName('');
            }

            const jobsRes = await api.get(`/reports/jobs?date=${dateStr}`);
            if (jobsRes.data && jobsRes.data.length > 0) {
                setJobs(jobsRes.data);
            } else {
                if (fetchedWorkType === '연차' || fetchedWorkType === '공휴일') {
                    setJobs([]);
                } else {
                    setJobs([{ tempId: Math.random().toString(36).substr(2, 9), title: '', content: '', projectId: null, isIssue: false, timeSpent: 2, isCustomTitle: false }]);
                }
            }

            try {
                const noteRes = await api.get(`/reports/weekly-note?weekStart=${weekStartStr}`);
                if (noteRes.data) setWeeklyNote(noteRes.data.content || '');
                else setWeeklyNote('');
            } catch {
                setWeeklyNote('');
            }

            try {
                const memosRes = await api.get(`/reports/system-memos?date=${dateStr}`);
                if (memosRes.data) setSystemMemos(memosRes.data);
                else setSystemMemos([]);
            } catch {
                setSystemMemos([]);
            }

            await fetchProjects();
        } catch {
            // silently ignore
        } finally {
            setIsLoading(false);
        }
    }, [selectedDate]);

    useEffect(() => { fetchReport(); }, [fetchReport]);

    // --- Click Outside ---
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdownIndex(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- Textarea Auto-resize ---
    useEffect(() => {
        requestAnimationFrame(() => {
            jobs.forEach((_, index) => {
                const textarea = document.getElementById(`job-title-${index}`);
                if (textarea) {
                    textarea.style.height = 'auto';
                    textarea.style.height = `${textarea.scrollHeight}px`;
                }
            });
        });
    }, [jobs]);

    useEffect(() => {
        requestAnimationFrame(() => {
            const textarea = document.getElementById('weekly-note-textarea');
            if (textarea) {
                textarea.style.height = 'auto';
                textarea.style.height = `${textarea.scrollHeight}px`;
            }
        });
    }, [weeklyNote]);

    // --- Toast Helper ---
    const showToastMsg = (msg: string) => {
        setToastMessage(msg);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    // --- Handlers ---
    const handleWorkTypeChange = (type: string) => {
        if (['연차', '공휴일', '공가'].includes(type)) {
            const hasData = jobs.some(job => job.title || job.content || job.projectId);
            if (hasData && !window.confirm('작성된 업무내용을 지우시겠습니까?')) return;
        }
        setWorkType(type);
        if (type === '연차' || type === '공휴일' || type === '공가') {
            setJobs([]);
        } else if (jobs.length === 0) {
            setJobs([{ tempId: Math.random().toString(36).substr(2, 9), title: '', content: '', projectId: null, isIssue: false, timeSpent: 0 }]);
        }
    };

    const handleSave = async () => {
        const hasJobError = jobs.some(job => isLineExceeded(job.title) || isLineExceeded(job.content));
        const hasWeeklyError = isWeeklyNoteExceeded(weeklyNote);
        if (hasJobError || hasWeeklyError) {
            const errorMsg = hasJobError
                ? '업무 항목 중 1줄에 20자를 초과한 항목이 있습니다.'
                : '주간 정보 사항이 제한(4줄, 줄당 40자)을 초과했습니다.';
            showToastMsg(`${errorMsg} 수정 후 저장해 주세요.`);
            return;
        }
        try {
            const dateStr = formatDate(selectedDate);
            await api.post('/reports/jobs', { date: dateStr, jobs });
            await api.post('/reports/daily-status', { date: dateStr, workType, holidayName: workType === '공휴일' ? holidayName : null });
            await api.post('/reports/weekly-note', { weekStart: formatDate(getWeekStart(selectedDate)), content: weeklyNote });
            showToastMsg('저장되었습니다');
        } catch {
            showToastMsg('저장에 실패했습니다');
        }
    };

    const addJob = () => {
        setJobs([...jobs, { tempId: Math.random().toString(36).substr(2, 9), title: '', content: '', projectId: null, isIssue: false, timeSpent: 2, isCustomTitle: false }]);
    };

    const updateJob = (index: number, field: string, value: unknown) => {
        const newJobs = [...jobs];
        if (field === 'projectId') {
            const selectedProject = projects.find(p => p.id === value);
            let newTitle = '';
            if (selectedProject) {
                newTitle = selectedProject.clientName
                    ? `${selectedProject.clientName} : ${selectedProject.projectName}`
                    : selectedProject.projectName;
            }
            newJobs[index].title = newTitle;
            newJobs[index].isCustomTitle = false;
            setOpenDropdownIndex(null);
        }
        if (field === 'title' && newJobs[index].projectId) {
            newJobs[index].isCustomTitle = true;
        }
        newJobs[index][field] = value;
        setJobs(newJobs);
    };

    const getJobDisplayTitle = (job: JobItem) => {
        if (job.isCustomTitle) return job.title;
        if (job.projectId) {
            const project = projects.find(p => p.id === job.projectId);
            if (project) {
                return project.clientName
                    ? `${project.clientName} : ${project.projectName}`
                    : project.projectName;
            }
        }
        return job.title;
    };

    const confirmTitleEdit = async (index: number) => {
        const job = jobs[index];
        if (job.projectId) {
            try {
                const match = job.title.match(/^(.*?)\s*:\s*([\s\S]*)$/);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let updateData: any;
                if (match) {
                    updateData = { clientName: match[1].trim(), projectName: match[2].trim() };
                } else {
                    updateData = { clientName: null, projectName: job.title };
                }
                await api.patch(`/reports/projects/${job.projectId}`, updateData);
                showToastMsg('업무명(프로젝트정보)이 수정되었습니다');
                await fetchProjects();
                setJobs(prevJobs => prevJobs.map((j, idx) => {
                    if (j.projectId === job.projectId) {
                        return { ...j, title: job.title, isCustomTitle: idx === index ? false : j.isCustomTitle };
                    }
                    return j;
                }));
            } catch {
                showToastMsg('업무명 수정에 실패했습니다');
            }
        } else {
            setJobs(prevJobs => prevJobs.map((j, idx) =>
                idx === index ? { ...j, isCustomTitle: false } : j
            ));
        }
    };

    const requestDeleteJob = (index: number) => {
        if (jobs.length === 1) return;
        setJobToDeleteIndex(index);
        setShowDeleteConfirmModal(true);
    };

    const confirmDeleteJob = () => {
        if (jobToDeleteIndex === null) return;
        setJobs(jobs.filter((_, i) => i !== jobToDeleteIndex));
        setShowDeleteConfirmModal(false);
        setJobToDeleteIndex(null);
    };

    const handleCreateProject = async () => {
        if (!newProjectData.projectName.trim()) { showToastMsg('업무명을 입력해주세요.'); return; }
        try {
            const res = await api.post('/reports/projects', newProjectData);
            await fetchProjects();
            if (openDropdownIndex !== null) updateJob(openDropdownIndex, 'projectId', res.data.id);
            showToastMsg('새 업무가 등록되었습니다');
            setShowCreateProjectModal(false);
            setNewProjectData({ clientName: '', projectName: '' });
        } catch {
            showToastMsg('업무 등록에 실패했습니다.');
        }
    };

    const handleShowCreateProjectModal = (searchTerm?: string) => {
        if (searchTerm) setNewProjectData({ clientName: '', projectName: searchTerm });
        setShowCreateProjectModal(true);
    };

    const handleSearchPastJobs = async () => {
        if (!searchStartDate || !searchEndDate) { showToastMsg('시작일과 종료일을 모두 선택해주세요'); return; }
        setIsSearchingPastJobs(true);
        try {
            const res = await api.get(`/reports/search-jobs?startDate=${searchStartDate}&endDate=${searchEndDate}`);
            setPastJobSearchResults(res.data || []);
            if (!res.data || res.data.length === 0) showToastMsg('검색된 업무가 없습니다');
        } catch {
            showToastMsg('검색에 실패했습니다');
        } finally {
            setIsSearchingPastJobs(false);
        }
    };

    const copyPastJob = (pastJob: PastJobResult) => {
        setJobs([...jobs, {
            title: pastJob.title, content: pastJob.content, projectId: pastJob.projectId,
            isIssue: false, timeSpent: pastJob.timeSpent || 2, isCustomTitle: true
        }]);
        showToastMsg('업무 내용을 복사했습니다');
    };

    // --- Drag & Drop ---
    const handleDragStart = (e: React.DragEvent, jobData: PastJobResult) => {
        const transferData = {
            title: jobData.project
                ? (jobData.project.clientName ? `${jobData.project.clientName} : ${jobData.project.projectName}` : jobData.project.projectName)
                : jobData.title,
            content: jobData.content, projectId: jobData.projectId, timeSpent: jobData.timeSpent || 2
        };
        e.dataTransfer.setData('jobData', JSON.stringify(transferData));
        e.dataTransfer.effectAllowed = 'copy';
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault(); e.stopPropagation();
        if (dragOverIndex !== index) setDragOverIndex(index);
    };

    const handleListDragLeave = (e: React.DragEvent) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setDragOverIndex(null);
    };

    const handleDrop = (e: React.DragEvent, index: number) => {
        e.preventDefault(); e.stopPropagation(); setDragOverIndex(null);
        const dataStr = e.dataTransfer.getData('jobData');
        if (!dataStr) return;
        try {
            const pastJob = JSON.parse(dataStr);
            const newJobs = [...jobs];
            newJobs.splice(index, 0, {
                tempId: Math.random().toString(36).substr(2, 9),
                title: pastJob.title || '', content: pastJob.content || '',
                projectId: pastJob.projectId, isIssue: false, timeSpent: pastJob.timeSpent || 2, isCustomTitle: false
            });
            setJobs(newJobs);
            showToastMsg('업무가 추가되었습니다');
        } catch {
            // drop parse error
        }
    };

    const handleDownloadMyWeeklyExcel = async () => {
        if (!userInfo) { showToastMsg('사용자 정보를 찾을 수 없습니다.'); return; }
        try {
            const dateStr = formatDate(selectedDate);
            const res = await api.get(`/excel/weekly-report?userId=${userInfo.id}&date=${dateStr}`, { responseType: 'blob' });
            if (res.data.type === 'application/json') {
                const text = await res.data.text();
                const json = JSON.parse(text);
                showToastMsg(`다운로드 실패: ${json.message || '서버 오류'}`);
                return;
            }
            const filename = `${userInfo.name}_주간보고서_${dateStr}.xlsx`;
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url; a.download = filename;
            document.body.appendChild(a); a.click();
            window.URL.revokeObjectURL(url); document.body.removeChild(a);
        } catch {
            showToastMsg('엑셀 다운로드 중 오류가 발생했습니다.');
        }
    };

    // --- Render ---
    return (
        <div className="w-full max-w-[1920px] mx-auto space-y-4 sm:space-y-8 pb-20 px-3 sm:px-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                    <Link href="/" aria-label="대시보드로 돌아가기" className="p-2 sm:p-2.5 hover:bg-stone-100 dark:hover:bg-slate-600 rounded-full transition-colors text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 shrink-0">
                        <ArrowLeft size={22} className="sm:hidden" aria-hidden="true" />
                        <ArrowLeft size={24} className="hidden sm:block" aria-hidden="true" />
                    </Link>
                    <div className="min-w-0">
                        <h2 className="text-xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 truncate">일일 업무 보고</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 font-medium text-xs sm:text-base hidden sm:block">오늘 진행한 업무를 상세히 기록하세요.</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
                    <button
                        onClick={handleDownloadMyWeeklyExcel}
                        aria-label="내 주간 업무 엑셀 다운로드"
                        className="flex items-center space-x-1.5 sm:space-x-2 bg-teal-600 hover:bg-teal-700 text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl transition-colors shadow-lg shadow-teal-200"
                        title="내 주간 업무 엑셀 다운로드"
                    >
                        <FileSpreadsheet size={16} className="sm:hidden" />
                        <FileSpreadsheet size={18} className="hidden sm:block" />
                        <span className="text-xs sm:text-sm font-bold">엑셀</span>
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center space-x-1.5 sm:space-x-2 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl font-bold text-white transition-colors shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
                    >
                        <Save size={16} className="sm:hidden" />
                        <Save size={18} className="hidden sm:block" />
                        <span className="text-xs sm:text-base">저장</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div id="report-container" className="flex flex-col space-y-6 sm:space-y-10 p-3 sm:p-8 rounded-2xl sm:rounded-[2.5rem] bg-white dark:bg-slate-800 border border-stone-100 dark:border-slate-700 shadow-[0_20px_50px_rgba(0,0,0,0.02)]">
                <div className="mb-4">
                    <WeeklyStatusNav
                        statusData={weeklyStatus}
                        selectedDate={formatDate(selectedDate)}
                        onDateSelect={(date) => setSelectedDate(date)}
                    />
                </div>

                <DateNavigation
                    selectedDate={selectedDate}
                    onDateChange={setSelectedDate}
                    showCalendar={showCalendar}
                    onToggleCalendar={() => setShowCalendar(!showCalendar)}
                    workType={workType}
                    onWorkTypeChange={handleWorkTypeChange}
                    holidayName={holidayName}
                    onHolidayNameChange={setHolidayName}
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10 items-start">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="space-y-6" ref={dropdownRef} onDragLeave={handleListDragLeave}>
                            {jobs.map((job, index) => (
                                <JobCard
                                    key={job.id || job.tempId || index}
                                    job={job}
                                    index={index}
                                    projects={projects}
                                    openDropdownIndex={openDropdownIndex}
                                    onToggleDropdown={setOpenDropdownIndex}
                                    onUpdateJob={updateJob}
                                    onDeleteJob={requestDeleteJob}
                                    onConfirmTitleEdit={confirmTitleEdit}
                                    getJobDisplayTitle={getJobDisplayTitle}
                                    projectSearchTerm={projectSearchTerm}
                                    onProjectSearchChange={setProjectSearchTerm}
                                    filteredProjects={getFilteredProjects()}
                                    matchingCount={matchingCount}
                                    onShowCreateProjectModal={handleShowCreateProjectModal}
                                    dragOverIndex={dragOverIndex}
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                />
                            ))}
                            <button
                                onClick={addJob}
                                className={`w-full py-8 border-2 border-dashed rounded-2xl transition-all flex flex-col items-center justify-center space-y-3 group no-print ${dragOverIndex === jobs.length ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-500' : 'border-stone-200 dark:border-slate-600 text-slate-400 dark:text-slate-400 hover:text-indigo-500 hover:border-indigo-300 hover:bg-indigo-50/30'}`}
                                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); handleDragOver(e, jobs.length); }}
                                onDrop={(e) => handleDrop(e, jobs.length)}
                            >
                                <div className={`p-3 rounded-full transition-all ${dragOverIndex === jobs.length ? 'bg-indigo-100 text-indigo-500' : 'bg-stone-50 dark:bg-slate-700/50 text-slate-400 dark:text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-500'}`}>
                                    <Plus size={24} />
                                </div>
                                <span className="text-sm font-bold tracking-widest uppercase">
                                    {dragOverIndex === jobs.length ? '여기에 놓기' : '새 업무 추가'}
                                </span>
                            </button>
                        </div>
                    </div>

                    <Sidebar
                        systemMemos={systemMemos}
                        searchStartDate={searchStartDate}
                        searchEndDate={searchEndDate}
                        onSearchStartDateChange={setSearchStartDate}
                        onSearchEndDateChange={setSearchEndDate}
                        onSearchPastJobs={handleSearchPastJobs}
                        isSearchingPastJobs={isSearchingPastJobs}
                        pastJobSearchResults={pastJobSearchResults}
                        onCopyPastJob={copyPastJob}
                        onDragStart={handleDragStart}
                        weeklyNote={weeklyNote}
                        onWeeklyNoteChange={setWeeklyNote}
                    />
                </div>

                {isLoading && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-stone-100 dark:border-slate-700 shadow-2xl flex items-center space-x-4 animate-in zoom-in-95 duration-200">
                            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">처리 중...</span>
                        </div>
                    </div>
                )}

                <ToastNotification show={showToast} message={toastMessage} />

                <CreateProjectModal
                    show={showCreateProjectModal}
                    data={newProjectData}
                    onDataChange={setNewProjectData}
                    onCreate={handleCreateProject}
                    onClose={() => setShowCreateProjectModal(false)}
                />
                <DeleteConfirmModal
                    show={showDeleteConfirmModal}
                    onConfirm={confirmDeleteJob}
                    onCancel={() => { setShowDeleteConfirmModal(false); setJobToDeleteIndex(null); }}
                />
            </div>

            {/* Floating Save Button (FAB) */}
            <button
                onClick={handleSave}
                aria-label="저장"
                className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-full shadow-2xl shadow-indigo-400/40 flex items-center justify-center transition-colors no-print"
                title="저장"
            >
                <Save size={22} />
            </button>
        </div>
    );
}
