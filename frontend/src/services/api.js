export const isStatic = import.meta.env.VITE_IS_STATIC === 'true';

const API_BASE_URL = 'http://localhost:3001/api';
const STATIC_BASE_URL = 'data';

export const apiService = {
    getModules: async () => {
        let modules = [];
        if (isStatic) {
            modules = window.LIPPSO_QUIZ_DATA?.modules || [];
        } else {
            const res = await fetch(`${API_BASE_URL}/modules`);
            if (!res.ok) throw new Error('Failed to load modules');
            modules = await res.json();
        }
        return [...modules].sort((a, b) => (Number(a.sort_order ?? a.id)) - (Number(b.sort_order ?? b.id)));
    },

    getTheory: async (moduleId) => {
        if (isStatic) {
            return window.LIPPSO_QUIZ_DATA?.theory?.[moduleId] || { content_html: '' };
        } else {
            const res = await fetch(`${API_BASE_URL}/modules/${moduleId}/theory`);
            if (!res.ok) throw new Error('Failed to load theory');
            return res.json();
        }
    },

    getQuiz: async (moduleId) => {
        if (isStatic) {
            return window.LIPPSO_QUIZ_DATA?.quiz?.[moduleId] || { json_structure: '[]' };
        } else {
            const res = await fetch(`${API_BASE_URL}/modules/${moduleId}/quiz`);
            if (!res.ok) throw new Error('Failed to load quiz');
            return res.json();
        }
    },

    processImageUrl: (text) => {
        if (!text) return text;
        // If it's static and there are absolute localhost upload URLs, convert to relative
        if (isStatic && typeof text === 'string') {
            return text.replace(/http:\/\/localhost:3001\/uploads\//g, './uploads/');
        }
        return text;
    },

    isImageUrl: (url) => {
        if (!url) return false;
        return url.startsWith('http') || url.startsWith('./uploads/');
    },

    getSetting: async (key) => {
        if (isStatic) {
            return { value: window.LIPPSO_QUIZ_DATA?.[key] || '' };
        } else {
            const res = await fetch(`${API_BASE_URL}/settings/${key}`);
            if (!res.ok) throw new Error(`Failed to load setting: ${key}`);
            return res.json();
        }
    },

    updateSetting: async (key, value) => {
        const res = await fetch(`${API_BASE_URL}/settings/${key}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ value })
        });
        if (!res.ok) throw new Error(`Failed to update setting: ${key}`);
        return res.json();
    }
};
