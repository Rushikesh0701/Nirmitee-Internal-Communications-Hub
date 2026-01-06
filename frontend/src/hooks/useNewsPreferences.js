import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

/**
 * Hook for managing user news preferences
 */
export const useNewsPreferences = () => {
    const [preferences, setPreferences] = useState({
        categories: [],
        language: 'en',
        onboardingComplete: false
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Available categories for selection
    const availableCategories = [
        { value: 'AI', label: 'AI & Machine Learning', icon: '🤖' },
        { value: 'Cloud', label: 'Cloud Computing', icon: '☁️' },
        { value: 'DevOps', label: 'DevOps', icon: '🔧' },
        { value: 'Programming', label: 'Programming', icon: '💻' },
        { value: 'Cybersecurity', label: 'Cybersecurity', icon: '🔒' },
        { value: 'HealthcareIT', label: 'Healthcare IT', icon: '🏥' }
    ];

    // Fetch preferences from backend
    const fetchPreferences = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/users/news-preferences');
            if (response.data.success) {
                setPreferences(response.data.data);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load preferences');
            console.error('Error fetching news preferences:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Save preferences to backend
    const savePreferences = useCallback(async (newPreferences) => {
        try {
            setSaving(true);
            setError(null);
            const response = await api.put('/users/news-preferences', newPreferences);
            if (response.data.success) {
                setPreferences(response.data.data);
                toast.success('Preferences saved successfully');
                return true;
            }
            return false;
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to save preferences';
            setError(message);
            toast.error(message);
            return false;
        } finally {
            setSaving(false);
        }
    }, []);

    // Toggle a category selection
    const toggleCategory = useCallback((category) => {
        setPreferences(prev => {
            const categories = prev.categories.includes(category)
                ? prev.categories.filter(c => c !== category)
                : [...prev.categories, category];
            return { ...prev, categories };
        });
    }, []);

    // Set language preference
    const setLanguage = useCallback((language) => {
        setPreferences(prev => ({ ...prev, language }));
    }, []);

    // Complete onboarding
    const completeOnboarding = useCallback(async () => {
        const success = await savePreferences({
            ...preferences,
            onboardingComplete: true
        });
        return success;
    }, [preferences, savePreferences]);

    // Load preferences on mount
    useEffect(() => {
        fetchPreferences();
    }, [fetchPreferences]);

    return {
        preferences,
        setPreferences,
        loading,
        saving,
        error,
        availableCategories,
        fetchPreferences,
        savePreferences,
        toggleCategory,
        setLanguage,
        completeOnboarding,
        needsOnboarding: !preferences.onboardingComplete
    };
};

export default useNewsPreferences;
