# Project Improvement Plan: UI Redesign & Developer Guide Implementation

This plan details the steps required to implement the improvements outlined in `prompts/requirements.md` for the PDF to PDF/A-3 (ZUGFeRD) project.

## Phase 1: Styling Foundation & Global Configuration
1. **Color Palette Refinement**
   - Review current CSS variables in `src/main/frontend/src/index.css`.
   - Extract hex colors from `/styles/style_finance.png` for Background, Primary, Secondary, and Text.
   - Update `tailwind.config.js` to use descriptive names (e.g., `brand-primary`, `surface-muted`).

2. **Typography Setup**
   - Import Google Fonts (Poppins, Inter, or Roboto) in `src/main/frontend/src/index.css`.
   - Update `tailwind.config.js` to set the selected font as the default `sans` stack.

3. **Global Effects & Spacing**
   - Standardize `border-radius` to `2xl` or `3xl` in `tailwind.config.js` and components.
   - Refine `shadow-layered` utility in `tailwind.config.js` for soft, depth-giving effects.
   - Increase base font sizes and line heights across the application for a "friendly" feel.

## Phase 2: Component Overhaul & Visual Identity
4. **Iconography Update**
   - Audit all components for icon usage.
   - Replace generic icons (e.g., from `lucide-react`) with **Iconify Solar Linear Icons**.
   - Standardize brand logos using **Iconify Simple Icons** at `96x36px`.

5. **Imagery Integration**
   - Replace static or missing images with high-quality Unsplash placeholders.
   - Match the "Secure Archiving" and "FinTech" mood in Hero and feature sections.

6. **Layout & Grid Refinement**
   - Ensure generous whitespace (padding/margin) between main UI blocks.
   - Verify responsive behavior of the multi-column layout.

## Phase 3: Enhanced Interactivity & Feedback
7. **FileUpload Enhancement**
   - Improve the drag-and-drop zone's visual feedback (hover, active states).
   - Add clearer success/error animations or transitions.

8. **Preview Section Optimization**
   - Ensure PDF and XML previews are prominent and easily switchable.
   - Add loading skeletons or placeholders while previews are rendering.

9. **Status & Error Handling**
   - Standardize status displays for different application states.
   - Ensure high contrast for all feedback messages.

## Phase 4: Build, Integration & Verification
10. **Backend Integration**
    - Verify Vite build output path matches `src/main/resources/static`.
    - Ensure Spring Boot correctly serves the frontend from the static resources folder.

11. **Quality Assurance**
    - Run `npm run build` and `npm run lint` in the frontend project.
    - Execute a full conversion cycle to verify UI-to-Backend communication.
    - Check accessibility (contrast, aria-labels).

12. **Documentation Update**
    - Update `prompts/requirements.md` if any new best practices are discovered during implementation.
