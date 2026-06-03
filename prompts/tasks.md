# Task List: UI Redesign & Developer Guide Implementation

## Phase 1: Styling Foundation & Global Configuration
1. [x] **Color Palette Refinement**
   - [x] Review current CSS variables in `src/main/frontend/src/index.css`.
   - [x] Extract hex colors from `/styles/style_finance.png` for Background, Primary, Secondary, and Text.
   - [x] Update `tailwind.config.js` to use descriptive names (e.g., `brand-primary`, `surface-muted`).
2. [x] **Typography Setup**
   - [x] Import Google Fonts (Poppins, Inter, or Roboto) in `src/main/frontend/src/index.css`.
   - [x] Update `tailwind.config.js` to set the selected font as the default `sans` stack.
3. [x] **Global Effects & Spacing**
   - [x] Standardize `border-radius` to `2xl` or `3xl` in `tailwind.config.js` and components.
   - [x] Refine `shadow-layered` utility in `tailwind.config.js` for soft, depth-giving effects.
   - [x] Increase base font sizes and line heights across the application for a "friendly" feel.

## Phase 2: Component Overhaul & Visual Identity
4. [x] **Iconography Update**
   - [x] Audit all components for icon usage.
   - [x] Replace generic icons (e.g., from `lucide-react`) with **Iconify Solar Linear Icons**.
   - [x] Standardize brand logos using **Iconify Simple Icons** at `96x36px`.
5. [x] **Imagery Integration**
   - [x] Replace static or missing images with high-quality Unsplash placeholders.
   - [x] Match the "Secure Archiving" and "FinTech" mood in Hero and feature sections.
6. [x] **Layout & Grid Refinement**
   - [x] Ensure generous whitespace (padding/margin) between main UI blocks.
   - [x] Verify responsive behavior of the multi-column layout.

## Phase 3: Enhanced Interactivity & Feedback
7. [x] **FileUpload Enhancement**
   - [x] Improve the drag-and-drop zone's visual feedback (hover, active states).
   - [x] Add clearer success/error animations or transitions.
8. [x] **Preview Section Optimization**
   - [x] Ensure PDF and XML previews are prominent and easily switchable.
   - [x] Add loading skeletons or placeholders while previews are rendering.
9. [x] **Status & Error Handling**
   - [x] Standardize status displays for different application states.
   - [x] Ensure high contrast for all feedback messages.

## Phase 4: Build, Integration & Verification
10. [x] **Backend Integration**
    - [x] Verify Vite build output path matches `src/main/resources/static`.
    - [x] Ensure Spring Boot correctly serves the frontend from the static resources folder.
11. [x] **Quality Assurance**
    - [x] Run `npm run build` and `npm run lint` in the frontend project.
    - [x] Execute a full conversion cycle to verify UI-to-Backend communication.
    - [x] Check accessibility (contrast, aria-labels).
12. [x] **Documentation Update**
    - [x] Update `prompts/requirements.md` if any new best practices are discovered during implementation.
