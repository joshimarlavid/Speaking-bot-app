export const safeGetFeedbackLogs = (): any[] => {
  try {
    const data = localStorage.getItem('linguaRole_feedback');
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to parse feedback logs from localStorage:", error);
    return [];
  }
};
