import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { MenuMode, AppTheme } from '../types';
import { THEMES } from '../themes';
import { ROLES, TOPICS, STUDENTS, GRAMMAR_TOPICS } from '../data';

interface AppContextType {
  mode: MenuMode;
  setMode: (mode: MenuMode) => void;
  activeTheme: AppTheme;
  studentName: string;
  setStudentName: (name: string) => void;
  selectedRole: any;
  setSelectedRole: (role: any) => void;
  selectedTopic: any;
  setSelectedTopic: (topic: any) => void;
  isPremium: boolean;
  setIsPremium: (premium: boolean) => void;
  selectedGrammarTopic: any;
  setSelectedGrammarTopic: (topic: any) => void;
  bubbles: any[];
  showDialogue: boolean;
  setShowDialogue: (show: boolean) => void;
  dailyChallenge: any;
  challengeCompleted: boolean;
  setChallengeCompleted: (completed: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<MenuMode>(() => {
    return (localStorage.getItem('linguaRole_mode') as MenuMode) || 'student';
  });
  const activeTheme = THEMES[mode] || THEMES.student;

  const [bubbles, setBubbles] = useState<{ id: number; left: number; size: number; delay: number; duration: number; type: number }[]>([]);

  useEffect(() => {
    const generated = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 10 + 3,
      delay: Math.random() * 10,
      duration: Math.random() * 15 + 15,
      type: Math.floor(Math.random() * 3)
    }));
    setBubbles(generated);
  }, []);

  const [showDialogue, setShowDialogue] = useState(true);
  const [studentName, setStudentName] = useState(() => {
    return localStorage.getItem('linguaRole_student') || STUDENTS[0];
  });
  const [selectedRole, setSelectedRole] = useState(() => {
    const saved = localStorage.getItem('linguaRole_role');
    if (saved) {
      const found = ROLES.find(r => r.id === saved);
      if (found) return found;
    }
    return ROLES[0];
  });
  const [selectedTopic, setSelectedTopic] = useState(() => {
    const savedRole = localStorage.getItem('linguaRole_role');
    const role = savedRole ? ROLES.find(r => r.id === savedRole) : ROLES[0];
    const defaultTopicId = role ? role.topicId : null;

    const saved = localStorage.getItem('linguaRole_topic');
    if (saved && TOPICS.find(t => t.id === saved)) {
      return TOPICS.find(t => t.id === saved)!;
    } else if (defaultTopicId && TOPICS.find(t => t.id === defaultTopicId)) {
      return TOPICS.find(t => t.id === defaultTopicId)!;
    }
    return TOPICS[0];
  });

  const [isPremium, setIsPremium] = useState(false);
  const [selectedGrammarTopic, setSelectedGrammarTopic] = useState(() => GRAMMAR_TOPICS[0]);

  useEffect(() => {
    localStorage.setItem('linguaRole_mode', mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('linguaRole_student', studentName);
  }, [studentName]);

  useEffect(() => {
    localStorage.setItem('linguaRole_role', selectedRole.id);
  }, [selectedRole]);

  const dailyChallenge = useMemo(() => {
    const allItems: { type: 'vocabulary' | 'grammar', content: string, topic: string }[] = [];
    TOPICS.forEach(t => {
      ((t.vocabulary || []) as unknown as string[]).forEach(v => allItems.push({ type: 'vocabulary', content: v, topic: t.title }));
      ((t.grammar || []) as unknown as string[]).forEach(g => allItems.push({ type: 'grammar', content: g, topic: t.title }));
    });

    const dateStr = new Date().toISOString().split('T')[0];
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
      hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % allItems.length;
    return allItems[index] || { type: 'vocabulary', content: 'magic', topic: 'General' };
  }, []);

  const [challengeCompleted, setChallengeCompleted] = useState(false);

  return (
    <AppContext.Provider value={{
      mode, setMode,
      activeTheme,
      studentName, setStudentName,
      selectedRole, setSelectedRole,
      selectedTopic, setSelectedTopic,
      isPremium, setIsPremium,
      selectedGrammarTopic, setSelectedGrammarTopic,
      bubbles,
      showDialogue, setShowDialogue,
      dailyChallenge, challengeCompleted, setChallengeCompleted
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
