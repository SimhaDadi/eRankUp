'use client';

import { useTranslation } from 'react-i18next';
import { useState } from 'react';

export default function LanguageSelector() {
    const { i18n } = useTranslation();
    const [currentLang, setCurrentLang] = useState(i18n.language || 'en');

    const languages = [
        { code: 'en', name: 'English', flag: '🇬🇧' },
        { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
        { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
        { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
    ];

    const handleChange = async (langCode: string) => {
        setCurrentLang(langCode);
        await i18n.changeLanguage(langCode);
        // Store preference
        localStorage.setItem('preferredLanguage', langCode);
    };

    return (
        <div className="relative">
            <select
                value={currentLang}
                onChange={(e) => handleChange(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
            >
                {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                    </option>
                ))}
            </select>
        </div>
    );
}
