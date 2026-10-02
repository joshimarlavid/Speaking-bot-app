export function useGeneratedBackground(_prompt?: string) {
  // Use high-fidelity local deep-sea asset generated for the app
  return { 
    bgUrl: '/deep-sea-bg.jpg', 
    isGenerating: false 
  };
}
