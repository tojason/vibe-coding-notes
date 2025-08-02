# UX Design: Card-Style Add Note Button

## Executive Summary
This consolidated design replaces the Floating Action Button (FAB) with an integrated card-style Add Note button that balances high discoverability with contextual relevance. It’s informed by comprehensive UX research, detailed UI specifications, and a robust implementation plan.

- **UX Insight**: Users display two primary mental models—“Capture Mode” favors instant FAB access, while “Organization Mode” benefits from contextual placement. A hybrid card approach can serve both. :contentReference[oaicite:6]{index=6}  
- **Design Goal**: Create a visually distinctive card that transitions from a 50%-opacity dashed border to a 100%-opacity solid border on hover, aligns with the existing design system, and works seamlessly across device sizes. :contentReference[oaicite:7]{index=7}  
- **Implementation Milestone**: Complete removal of the FAB, insertion of the Add Note card as the first grid item, responsive behavior, dark-mode support, keyboard and screen-reader accessibility, and context-aware microcopy. :contentReference[oaicite:8]{index=8}  

---

## 1. UX Research Findings :contentReference[oaicite:9]{index=9}
- **Discoverability vs Context**  
  - **FAB Strengths**: Always visible, muscle-memory alignment, high contrast.  
  - **FAB Weaknesses**: Overlays content, limited scalability, context disconnect.  
  - **Card Strengths**: Integrates with content grid, scales well, context cues.  
  - **Card Weaknesses**: Risk of being overlooked, potential confusion with notes.  
- **User Mental Models**  
  - **Capture Mode** (power users): Prioritize speed—retain keyboard shortcuts.  
  - **Organization Mode** (casual users): Favor contextual entry points.  
- **Placement Options**  
  1. **Top of Grid** (new users)  
  2. **Embedded in Grid** (frequent browsers)  
  3. **Sticky Header** (balanced)  
- **Hybrid Recommendation**: Phase in card while retaining FAB initially, then A/B test before full rollout.

---

## 2. UI Design Specifications :contentReference[oaicite:10]{index=10}

### 2.1 Visual Style
```css
.add-note-card {
  background: var(--add-button-bg-default);
  border: 2px dashed var(--add-button-border-default);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  min-height: 140px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  cursor: pointer;
  transition: all 0.3s var(--ease-out);
  order: -1; /* First in grid */
}
.add-note-card:hover {
  border-style: solid;
  border-color: var(--add-button-border-hover);
  background: var(--add-button-bg-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}
.add-note-icon {
  width: 32px;
  height: 32px;
  color: var(--add-button-icon);
  transition: all 0.2s var(--ease-out);
}
.add-note-text {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  margin: 0;
}
.add-note-description {
  font-size: var(--text-sm);
  opacity: 0.8;
  margin: 0;
}
