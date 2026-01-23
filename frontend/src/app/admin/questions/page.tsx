'use client';

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, Upload, FileText } from 'lucide-react';
import QuestionListTab from '@/components/admin/questions/QuestionListTab';
import AddQuestionTab from '@/components/admin/questions/AddQuestionTab';
import BulkUploadTab from '@/components/admin/questions/BulkUploadTab';

interface TabButtonProps {
    active: boolean;
    onClick: () => void;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}

export default function QuestionManagementPage() {
    const [activeTab, setActiveTab] = useState<'add' | 'bulk' | 'list'>('list');

    return (
        <div className="space-y-8 pb-10" style={{ colorScheme: 'dark' }}>
            <header>
                <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                    Question Management
                </h1>
                <p className="text-slate-400 font-medium mt-2">
                    Unified interface for all question operations
                </p>
            </header>

            {/* Tab Navigation */}
            <div className="flex gap-1 bg-slate-900/40 p-1 rounded-xl w-fit border border-slate-800/50 flex-wrap">
                <TabButton active={activeTab === 'list'} onClick={() => setActiveTab('list')} label="Question List" icon={FileText} />
                <TabButton active={activeTab === 'add'} onClick={() => setActiveTab('add')} label="Add Question" icon={Plus} />
                <TabButton active={activeTab === 'bulk'} onClick={() => setActiveTab('bulk')} label="Bulk Upload" icon={Upload} />
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                {activeTab === 'list' && <QuestionListTab key="list" />}
                {activeTab === 'add' && <AddQuestionTab key="add" />}
                {activeTab === 'bulk' && <BulkUploadTab key="bulk" />}
            </AnimatePresence>
        </div>
    );
}

function TabButton({ active, onClick, label, icon: Icon }: TabButtonProps) {
    return (
        <button
            onClick={onClick}
            role="tab"
            aria-selected={active}
            aria-label={label}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
        >
            <Icon className="w-4 h-4" />
            {label}
        </button>
    );
}
