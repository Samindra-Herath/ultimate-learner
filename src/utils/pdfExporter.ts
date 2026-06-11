import { jsPDF } from "jspdf";
import { StudyGuide } from "../types";
import { stripMarkdown } from "./stripMarkdown";

export function exportStudyGuideToPDF(guide: StudyGuide) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Formatting Helper
  const checkPageBreak = (heightNeeded: number) => {
    if (y + heightNeeded > pageHeight - margin) {
      doc.addPage();
      // Draw footer on previous page or background? Let's just reset cursor
      y = margin;
      drawHeaderFooter();
    }
  };

  const drawHeaderFooter = () => {
    // Elegant tiny running header
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`Ultimate Learner Study Set — ${guide.title.substring(0, 45)}${guide.title.length > 45 ? "..." : ""}`, margin, margin - 10);
    doc.line(margin, margin - 8, pageWidth - margin, margin - 8);
  };

  // --- 1. COVER PAGE / HEADER ---
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(30, 41, 59); // Slate-800
  
  const titleLines = doc.splitTextToSize(guide.title, contentWidth);
  titleLines.forEach((line: string) => {
    doc.text(line, margin, y);
    y += 10;
  });

  y += 5;
  doc.setLineWidth(0.5);
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Metadata
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // Slate-500
  const createdDate = new Date(guide.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text(`Generated on: ${createdDate}`, margin, y);
  y += 6;
  doc.text(`Sources parsed: ${guide.sources.map((s) => s.name).join(", ")}`, margin, y);
  y += 12;

  // Quick Summary
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.text("Executive Summary", margin, y);
  y += 7;

  doc.setFont("Helvetica", "oblique");
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105); // Slate-600
  const summaryLines = doc.splitTextToSize(stripMarkdown(guide.quickSummary), contentWidth);
  summaryLines.forEach((line: string) => {
    checkPageBreak(6);
    doc.text(line, margin, y);
    y += 6;
  });

  y += 15;

  // --- 2. EXHAUSTIVE STUDY TOPICS ---
  checkPageBreak(25);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(79, 70, 229); // Violet-600
  doc.text("Exhaustive Topic Lectures", margin, y);
  y += 10;

  guide.topics.forEach((topic, idx) => {
    checkPageBreak(30);

    // Topic Title & Category
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(30, 41, 59);
    const topicHeading = `${idx + 1}. ${topic.title}`;
    const wrappedTopicHeading = doc.splitTextToSize(topicHeading, contentWidth);
    wrappedTopicHeading.forEach((line: string) => {
      doc.text(line, margin, y);
      y += 6;
    });

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(99, 102, 241); // Indigo-500
    doc.text(`Category: ${topic.category || "General Study"}`, margin, y);
    y += 5;

    // Academic Explanation
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(51, 65, 85); // Slate-700
    
    const explanationLines = doc.splitTextToSize(stripMarkdown(topic.fullExplanation), contentWidth);
    explanationLines.forEach((line: string) => {
      checkPageBreak(6);
      doc.text(line, margin, y);
      y += 6;
    });

    y += 4;

    // Simplified Feynman Method Box
    checkPageBreak(35);
    
    // Draw background placeholder for Analogy callout
    doc.setFillColor(248, 250, 252); // Slate-50 background
    doc.setDrawColor(224, 242, 254); // Light blue border
    
    const boxMargin = margin + 4;
    const boxWidth = contentWidth - 8;
    const analogyLines = doc.splitTextToSize(`Intuitive Analogy: ${stripMarkdown(topic.simplified.analogy)}`, boxWidth);
    const boxHeight = (analogyLines.length * 5) + 12;
    
    doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, "FD");
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(2, 132, 199); // Sky-600
    doc.text("Feynman Simplified Explanation", margin + 4, y + 5);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    
    let boxY = y + 10;
    analogyLines.forEach((line: string) => {
      doc.text(line, margin + 4, boxY);
      boxY += 5;
    });

    y += boxHeight + 12;
  });

  // --- 3. HIGH-YIELD FLASHCARDS ---
  checkPageBreak(35);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(79, 70, 229); // Violet-600
  doc.text("Active-Recall Flashcards", margin, y);
  y += 10;

  guide.flashcards.forEach((card, idx) => {
    checkPageBreak(25);
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`Card ${idx + 1} — Q:`, margin, y);
    
    const frontLines = doc.splitTextToSize(stripMarkdown(card.front), contentWidth - 12);
    let tempY = y;
    frontLines.forEach((line: string) => {
      doc.text(line, margin + 12, tempY);
      tempY += 5;
    });
    y = tempY + 1;

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text("A:", margin, y);
    const backLines = doc.splitTextToSize(stripMarkdown(card.back), contentWidth - 12);
    backLines.forEach((line: string) => {
      checkPageBreak(6);
      doc.text(line, margin + 12, y);
      y += 5;
    });
    y += 6;
  });

  // --- 4. PRACTICE EXAM ---
  checkPageBreak(35);
  y += 4;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(79, 70, 229); // Violet-600
  doc.text("Practice Exam", margin, y);
  y += 10;

  guide.practiceExam.forEach((item, idx) => {
    checkPageBreak(40);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    
    const qLines = doc.splitTextToSize(`Q${idx + 1}. ${stripMarkdown(item.question)}`, contentWidth);
    qLines.forEach((line: string) => {
      doc.text(line, margin, y);
      y += 6;
    });
    
    y += 2;

    // Options
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    item.options.forEach((opt, optIdx) => {
      checkPageBreak(8);
      const isCorrectText = opt === item.correctAnswer ? " [Correct]" : "";
      const optStr = `   ${String.fromCharCode(65 + optIdx)}) ${stripMarkdown(opt)}`;
      doc.text(optStr, margin, y);
      y += 5.5;
    });

    y += 2;

    // Explanation
    checkPageBreak(25);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(16, 185, 129); // Emerald-500
    doc.text(`Solution & Reasoning:`, margin, y);
    y += 4.5;

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    const explanationLines = doc.splitTextToSize(stripMarkdown(item.explanation), contentWidth);
    explanationLines.forEach((line: string) => {
      checkPageBreak(5);
      doc.text(line, margin, y);
      y += 5;
    });

    y += 10;
  });

  // Save PDF trigger
  const fileName = `${guide.title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_study_guide.pdf`;
  doc.save(fileName);
}
