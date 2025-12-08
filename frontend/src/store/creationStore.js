import { create } from 'zustand'

/**
 * Global store to track creation state across all forms
 * Ensures only one resource (announcement, blog, group, discussion) can be created at a time
 * Also ensures only one comment can be posted at a time across all comment forms
 */
const useCreationStore = create((set, get) => ({
  isCreating: false,
  creatingType: null, // 'announcement' | 'blog' | 'group' | 'discussion' | null
  isPostingComment: false,
  commentType: null, // 'blog' | 'discussion' | 'group' | null

  // Start creation process
  startCreation: (type) => {
    if (get().isCreating) {
      return false; // Already creating something
    }
    set({ isCreating: true, creatingType: type });
    return true;
  },

  // End creation process
  endCreation: () => {
    set({ isCreating: false, creatingType: null });
  },

  // Start comment posting process
  startCommentPosting: (type) => {
    if (get().isPostingComment) {
      return false; // Already posting a comment
    }
    set({ isPostingComment: true, commentType: type });
    return true;
  },

  // End comment posting process
  endCommentPosting: () => {
    set({ isPostingComment: false, commentType: null });
  },

  // Check if any creation is in progress
  isAnyCreationInProgress: () => {
    return get().isCreating;
  },

  // Check if any comment is being posted
  isAnyCommentPosting: () => {
    return get().isPostingComment;
  },

  // Check if a specific type is being created
  isTypeBeingCreated: (type) => {
    return get().isCreating && get().creatingType === type;
  }
}))

export { useCreationStore }

