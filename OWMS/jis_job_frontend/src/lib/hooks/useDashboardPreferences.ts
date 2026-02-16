'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { WidgetPref } from '../../types/dashboard';

interface UseDashboardPreferencesReturn {
    preferences: WidgetPref[];
    loading: boolean;
    saving: boolean;
    savePreferences: (layout: WidgetPref[]) => Promise<void>;
    resetPreferences: () => Promise<void>;
}

export function useDashboardPreferences(): UseDashboardPreferencesReturn {
    const [preferences, setPreferences] = useState<WidgetPref[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        try {
            const res = await api.get('/dashboard-preferences');
            setPreferences(res.data.layout ?? []);
        } catch (error) {
            console.error('Failed to fetch dashboard preferences:', error);
        } finally {
            setLoading(false);
        }
    };

    const savePreferences = useCallback(async (layout: WidgetPref[]) => {
        setSaving(true);
        try {
            await api.put('/dashboard-preferences', { layout });
            setPreferences(layout);
        } catch (error) {
            console.error('Failed to save dashboard preferences:', error);
            throw error;
        } finally {
            setSaving(false);
        }
    }, []);

    const resetPreferences = useCallback(async () => {
        setSaving(true);
        try {
            const res = await api.delete('/dashboard-preferences');
            setPreferences(res.data.layout ?? []);
        } catch (error) {
            console.error('Failed to reset dashboard preferences:', error);
            throw error;
        } finally {
            setSaving(false);
        }
    }, []);

    return { preferences, loading, saving, savePreferences, resetPreferences };
}
