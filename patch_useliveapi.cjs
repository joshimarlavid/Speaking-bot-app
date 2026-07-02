const fs = require('fs');

const file = '/app/src/useLiveAPI.ts';
let content = fs.readFileSync(file, 'utf8');

// 1. Add activeSources reference
if (!content.includes('activeSourcesRef')) {
    content = content.replace(
        'const timerRef = useRef<NodeJS.Timeout | null>(null);',
        'const timerRef = useRef<NodeJS.Timeout | null>(null);\n  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);'
    );
}

// 2. Clear sources on interrupt
const interruptLogic = `
            if (message.serverContent?.interrupted) {
              // Clear audio queue if interrupted
              if (audioContextRef.current) {
                nextPlayTimeRef.current = audioContextRef.current.currentTime;
                // Stop any currently playing audio nodes
                activeSourcesRef.current.forEach(source => {
                  try {
                    source.stop();
                  } catch (e) {
                    // Ignore errors if already stopped
                  }
                });
                activeSourcesRef.current = [];
              }
            }
`;
content = content.replace(
    /if \(message\.serverContent\?\.interrupted\) \{[\s\S]*?\}\n/,
    interruptLogic
);

// 3. Track sources when they start playing
const playLogic = `
                const source = audioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContext.destination);

                const currentTime = audioContext.currentTime;
                if (nextPlayTimeRef.current < currentTime) {
                  nextPlayTimeRef.current = currentTime;
                }

                // Track source
                activeSourcesRef.current.push(source);
                source.onended = () => {
                  activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source);
                };

                source.start(nextPlayTimeRef.current);
`;
content = content.replace(
    /const source = audioContext\.createBufferSource\(\);[\s\S]*?source\.start\(nextPlayTimeRef\.current\);/,
    playLogic
);

// 4. Clear on disconnect
const disconnectLogic = `
    if (audioContextRef.current) {
      activeSourcesRef.current.forEach(source => {
        try { source.stop(); } catch(e){}
      });
      activeSourcesRef.current = [];
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
`;
content = content.replace(
    /if \(audioContextRef\.current\) \{\s*audioContextRef\.current\.close\(\);\s*audioContextRef\.current = null;\s*\}/,
    disconnectLogic
);

fs.writeFileSync(file, content);
console.log("useLiveAPI patched to fix audio overlap.");
