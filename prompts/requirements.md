# Developer Guide: PDF to PDF/A-3 (ZUGFeRD) UI Redesign

This guide outlines the steps to transform the current frontend into a professional, "Finance-Style" interface. The redesign focuses on clarity, accessibility, and modern aesthetics suitable for secure document archiving.

## 1. Analysis & Preparation

### Reference Image Analysis
Analyze the reference image at `/styles/style_finance.png` (if available) for:
- **Color Palette**: Extract Hex colors for:
  - Background (Main & Sections)
  - Primary (Call-to-action, Brand)
  - Secondary (Success, Accents)
  - Text (Headers, Body, Subtext)
- **Typography**: Match the brand's feel using Google Fonts (e.g., *Poppins*, *Roboto*, or *Inter*).
- **Composition**: Note the layout, grid spacing, and motifs used.

### Roles & Mindset
- **Senior UI/UX Designer**: Prioritize user flow, visual hierarchy, and emotional response (trust/security).
- **Front-End Developer**: Implement clean, responsive React components using Tailwind CSS.

---

## 2. Implementation Steps

### Phase 1: Styling Foundation
- **Colors**: Update `tailwind.config.js` with the extracted hex colors. Use descriptive names like `brand-primary`, `surface-muted`, etc.
- **Typography**: Import the selected font in `index.css` and set it as the default `sans` font in Tailwind.
- **Global Effects**:
  - Implement larger, "friendly" `border-radius` (e.g., `2xl` or `3xl`).
  - Apply soft, layered shadows for depth (e.g., `shadow-layered` class).
  - Increase base font sizes for better readability.

### Phase 2: Component Overhaul
- **Icons**:
  - Replace generic icons with **Iconify Solar Linear Icons** for general UI elements.
  - Use **Iconify Simple Icons** for brand logos (standardize at `96x36px`).
- **Imagery**:
  - Integrate high-quality placeholder images from Unsplash (`source.unsplash.com`) that match the "Secure Archiving" or "Financial Technology" mood.
- **Layout**:
  - Use a clean, structured grid.
  - Ensure generous whitespace (padding/margin) between sections.

### Phase 3: Interactive Elements
- **FileUpload**: Enhance the drop zone with better hover states and clearer success/error feedback.
- **Preview Sections**: Ensure the PDF and XML previews are prominent and easy to toggle.
- **Feedback**: Use consistent status displays for loading, success, and error states.

---

## 3. Best Practices

- **Tailwind Utility First**: Stick to Tailwind classes for layout and styling to maintain consistency.
- **Accessibility**: Maintain high contrast ratios, especially for financial data and status messages.
- **Responsiveness**: Verify that the "friendly" interface translates well to tablet and mobile views.

---

## 4. Building & Verification

### Build Process
```bash
cd src/main/frontend
npm install
npm run build
```

### Verification Checklist
- [ ] Colors match the reference style.
- [ ] Solar Linear icons are used for UI elements.
- [ ] Border-radius and shadows are consistent across all cards/containers.
- [ ] The interface remains "friendly" and readable with larger fonts.
- [ ] Frontend builds without errors and integrates with the Spring Boot backend (`src/main/resources/static`).
