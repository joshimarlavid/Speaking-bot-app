import { jsPDF } from 'jspdf';
import { playReward } from './audio';

export const generatePDFSummary = (
  studentName: string,
  exercisesCompleted: number,
  exerciseStreak: number,
  logs: any[]
) => {
  try {
    playReward();
    const doc = new jsPDF();

    const runes = (exercisesCompleted * 150) + 1200;
    const lvl = Math.floor(runes / 1000);

    doc.setFillColor(15, 20, 30);
    doc.rect(0, 0, 210, 297, 'F');

    doc.setDrawColor(50, 60, 80);
    doc.setLineWidth(1.5);
    doc.rect(8, 8, 194, 281);
    doc.setLineWidth(0.5);
    doc.rect(10, 10, 190, 277);

    doc.setTextColor(245, 158, 11);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.text("GOTHIC PROGRESS LEDGER", 105, 30, { align: "center" });

    doc.setDrawColor(244, 63, 94);
    doc.setLineWidth(1);
    doc.line(40, 35, 170, 35);
    doc.line(50, 37, 160, 37);

    doc.setDrawColor(200, 150, 50);
    doc.setFillColor(20, 25, 40);
    doc.roundedRect(20, 50, 170, 45, 5, 5, 'FD');

    doc.setTextColor(220, 220, 230);
    doc.setFontSize(16);
    doc.text(`Acolyte: ${studentName}`, 30, 65);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(150, 160, 180);
    doc.text(`Rank: Level ${lvl} Shadow Scholar`, 30, 75);
    doc.text(`Total Arcane Runes: ${runes.toLocaleString()}`, 30, 85);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(59, 130, 246);
    doc.text(`Spells Mastered: ${exercisesCompleted}`, 120, 65);
    doc.setTextColor(249, 115, 22);
    doc.text(`Current Streak: ${exerciseStreak}`, 120, 75);

    doc.setFontSize(18);
    doc.setTextColor(245, 158, 11);
    doc.text("Recent Dialogue Prophecies", 20, 115);
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(0.5);
    doc.line(20, 118, 100, 118);

    let yPos = 130;
    const recentLogs = [...logs].reverse().slice(0, 3);

    if (recentLogs.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(11);
      doc.setTextColor(120, 130, 150);
      doc.text("No prophecies recorded yet. Begin your journey.", 20, yPos);
      yPos += 20;
    } else {
      recentLogs.forEach((log) => {
        doc.setFillColor(25, 30, 45);
        doc.setDrawColor(60, 70, 90);
        doc.roundedRect(20, yPos - 8, 170, 42, 3, 3, 'FD');

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(167, 139, 250);
        doc.text(log.role, 25, yPos);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(100, 110, 130);
        const dateStr = log.date ? new Date(log.date).toLocaleDateString() : 'Unknown Date';
        doc.text(dateStr, 160, yPos);

        doc.setFontSize(10);
        doc.setTextColor(147, 197, 253);
        doc.text(`Focus: ${log.topic}`, 25, yPos + 8);

        doc.setTextColor(52, 211, 153);
        doc.text(`Fluency: ${log.ratingAI}/5`, 25, yPos + 16);
        doc.text(`Accuracy: ${log.ratingTopic}/5`, 70, yPos + 16);

        doc.setFont("helvetica", "italic");
        doc.setTextColor(200, 210, 220);
        const wrappedComments = doc.splitTextToSize(`"${log.comments}"`, 160);
        doc.text(wrappedComments, 25, yPos + 24);

        yPos += 48;
      });
    }

    if (yPos > 240) {
      doc.addPage();
      doc.setFillColor(15, 20, 30);
      doc.rect(0, 0, 210, 297, 'F');
      doc.setDrawColor(50, 60, 80);
      doc.setLineWidth(1.5);
      doc.rect(8, 8, 194, 281);
      doc.setLineWidth(0.5);
      doc.rect(10, 10, 190, 277);
      yPos = 30;
    } else {
      yPos += 10;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(245, 158, 11);
    doc.text("Grimoire Study Plan", 20, yPos);
    doc.setLineWidth(0.5);
    doc.line(20, yPos + 3, 80, yPos + 3);
    yPos += 15;

    const suggestions = [
      { title: "Vocabulary Rituals", desc: "Spend 10 minutes reviewing flashcards for your weakest topics. Repetition binds the words to your memory." },
      { title: "Grammar Scribing", desc: "Write 3 complete sentences daily using the structures from your recent exercises. Let the ink flow." },
      { title: "Shadow Speaking", desc: "Shadow the AI's pronunciation. Listen carefully and mimic the rhythm and intonation precisely." }
    ];

    suggestions.forEach((s) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(244, 63, 94);
      doc.text(`• ${s.title}`, 20, yPos);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(180, 190, 200);
      const wrappedDesc = doc.splitTextToSize(s.desc, 165);
      doc.text(wrappedDesc, 25, yPos + 6);

      yPos += 15 + (wrappedDesc.length * 4);
    });

    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(80, 90, 110);
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`Sealed and certified on this day, ${today}`, 105, 285, { align: 'center' });

    doc.save(`LinguaRole_Grimoire_${studentName.replace(/\s+/g, '_')}.pdf`);
  } catch (e) {
    console.error("Failed to generate PDF", e);
    alert("Could not generate PDF. Please ensure popups are allowed.");
  }
};
