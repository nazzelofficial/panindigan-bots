/**
 * builders/index.ts v0.2.6
 * Embed + component builders — re-export barrel.
 *
 * Also re-exports the low-level button/select/modal builders
 * from structures/builders for a single import path.
 */

export * from "./PaginatorBuilder.js";
export * from "./ErrorBuilder.js";

// Re-export low-level builders for convenience
export {
  paginationButtons,
  confirmCancelRow,
  primaryButton,
  secondaryButton,
  dangerButton,
  successButton,
  linkButton,
} from "../structures/builders/button.js";

export {
  buildModal,
  shortInput,
  paragraphInput,
} from "../structures/builders/modal.js";

export {
  stringSelect,
  roleSelect,
  userSelect,
  channelSelect,
  mentionableSelect,
} from "../structures/builders/select.js";
