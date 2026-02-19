'use client';

import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { User, Lock, Save, Loader2, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export default function ProfileSettings() {
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        dept: '',
        role: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Password Change State
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwords, setPasswords] = useState({
        currentPass: '',
        newPass: '',
        confirmPass: ''
    });
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/users/me');
            if (res.data) {
                setProfile({
                    ...res.data,
                    dept: res.data.department?.name || ''
                });
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async () => {
        setSaving(true);
        try {
            const res = await api.patch('/users/me', {
                name: profile.name,
                email: profile.email
            });
            if (res.status === 200) {
                alert('프로필이 업데이트되었습니다.');
            }
        } catch (error) {
            console.error('Failed to update profile:', error);
            alert('프로필 업데이트에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage(null);

        if (passwords.newPass !== passwords.confirmPass) {
            setPasswordMessage({ type: 'error', text: '새 비밀번호가 일치하지 않습니다.' });
            return;
        }

        if (passwords.newPass.length < 6) {
            setPasswordMessage({ type: 'error', text: '비밀번호는 6자 이상이어야 합니다.' });
            return;
        }

        try {
            await api.patch('/users/me/password', {
                currentPass: passwords.currentPass,
                newPass: passwords.newPass
            });
            setPasswordMessage({ type: 'success', text: '비밀번호가 성공적으로 변경되었습니다.' });

            // Reset form
            setPasswords({ currentPass: '', newPass: '', confirmPass: '' });

            // Close modal after delay
            setTimeout(() => {
                setShowPasswordModal(false);
                setPasswordMessage(null);
            }, 1500);

        } catch (error) {
            console.error('Password change failed:', error);
            setPasswordMessage({
                type: 'error',
                text: (error as any).response?.data?.message || '비밀번호 변경에 실패했습니다. 현재 비밀번호를 확인해주세요.'
            });
        }
    };

    if (loading) {
        return <div className="text-center py-10 text-slate-500 dark:text-slate-400 font-bold italic">프로필 정보를 불러오는 중...</div>;
    }

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 px-1">
                <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20">
                    <User size={20} />
                </div>
                내 프로필 설정
            </h3>

            <div className="bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-600 rounded-3xl p-8 space-y-10 shadow-sm">
                <div className="flex items-center space-x-6">
                    <div className="w-24 h-24 rounded-3xl bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-100 dark:border-indigo-800/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-3xl font-black shadow-inner">
                        {profile.name.slice(0, 1)}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{profile.name}</h4>
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-400 text-[10px] font-black rounded-lg uppercase tracking-widest">{profile.role}</span>
                        </div>
                        <p className="text-sm font-bold text-slate-400 dark:text-slate-400 mt-1 flex items-center">
                            <span className="text-indigo-500 mr-2">●</span>
                            {profile.dept || '부서 미정'}
                        </p>
                    </div>
                </div>

                <div className="pt-8 border-t border-stone-100 dark:border-slate-700 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2.5">
                            <label className="block text-[11px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest pl-1">이름</label>
                            <input
                                type="text"
                                value={profile.name}
                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                className="w-full bg-stone-50 dark:bg-slate-700/50 border border-stone-200 dark:border-slate-600 rounded-2xl px-5 py-4 text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold"
                            />
                        </div>
                        <div className="space-y-2.5 opacity-80">
                            <label className="block text-[11px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest pl-1">부서 (수정 불가)</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={profile.dept || ''}
                                    readOnly
                                    className="w-full bg-stone-100/50 dark:bg-slate-700/30 border border-stone-200 dark:border-slate-600 rounded-2xl px-5 py-4 text-slate-400 dark:text-slate-400 outline-none cursor-not-allowed font-bold"
                                />
                                <AlertCircle size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">이메일</label>
                        <input
                            type="email"
                            value={profile.email || ''}
                            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                            className="w-full bg-stone-50 dark:bg-slate-700/50 border border-stone-200 dark:border-slate-600 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-800/30 transition-all font-medium"
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            onClick={handleUpdateProfile}
                            disabled={saving}
                            className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-bold transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
                        >
                            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            <span>변경사항 저장</span>
                        </button>
                    </div>
                </div>

                <div className="pt-8 border-t border-stone-100 dark:border-slate-700">
                    <h4 className="text-slate-800 dark:text-slate-100 font-bold mb-4 flex items-center">
                        <Lock size={18} className="mr-2 text-indigo-500" />
                        보안 설정
                    </h4>
                    <div className="flex items-center justify-between bg-stone-50 dark:bg-slate-700/50 p-5 rounded-2xl border border-stone-200/60 dark:border-slate-600">
                        <div>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">비밀번호 변경</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">주기적인 원격 비밀번호 변경을 권장합니다.</p>
                        </div>
                        <button
                            onClick={() => setShowPasswordModal(true)}
                            className="px-4 py-2 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-600 hover:border-indigo-300 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm hover:shadow"
                        >
                            변경하기
                        </button>
                    </div>
                </div>
            </div>

            {/* Password Change Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md border border-stone-100 dark:border-slate-700 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-stone-100 dark:border-slate-700 flex justify-between items-center bg-stone-50/50 dark:bg-slate-700/30 rounded-t-2xl">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">비밀번호 변경</h3>
                            <button
                                onClick={() => {
                                    setShowPasswordModal(false);
                                    setPasswordMessage(null);
                                    setPasswords({ currentPass: '', newPass: '', confirmPass: '' });
                                }}
                                className="text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleChangePassword} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-1.5">현재 비밀번호</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-stone-50 dark:bg-slate-700/50 border border-stone-200 dark:border-slate-600 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-800/30 transition-all"
                                    value={passwords.currentPass}
                                    onChange={e => setPasswords({ ...passwords, currentPass: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-1.5">새 비밀번호</label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    className="w-full bg-stone-50 dark:bg-slate-700/50 border border-stone-200 dark:border-slate-600 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-800/30 transition-all"
                                    value={passwords.newPass}
                                    onChange={e => setPasswords({ ...passwords, newPass: e.target.value })}
                                />
                                <p className="text-xs text-slate-400 dark:text-slate-400 mt-1.5 ml-1">6자 이상 입력해주세요.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-1.5">새 비밀번호 확인</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-stone-50 dark:bg-slate-700/50 border border-stone-200 dark:border-slate-600 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-800/30 transition-all"
                                    value={passwords.confirmPass}
                                    onChange={e => setPasswords({ ...passwords, confirmPass: e.target.value })}
                                />
                            </div>

                            {passwordMessage && (
                                <div className={`p-4 rounded-xl flex items-start space-x-2 ${passwordMessage.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/30' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/30'
                                    }`}>
                                    {passwordMessage.type === 'success' ? <CheckCircle size={18} className="mt-0.5" /> : <AlertCircle size={18} className="mt-0.5" />}
                                    <p className="text-sm font-medium">{passwordMessage.text}</p>
                                </div>
                            )}

                            <div className="pt-4 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordModal(false)}
                                    className="px-5 py-3 rounded-xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-600 hover:bg-stone-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium transition-all"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
                                >
                                    변경하기
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

