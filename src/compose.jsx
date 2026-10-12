import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from './api';

// Holds the email being composed across the Compose -> Recipients -> Preview steps.
const empty = { draftId: null, subject: '', body: '', recipients: [], attachments: [] };
const Ctx = createContext(null);
export const useCompose = () => useContext(Ctx);

function load() {
  try {
    return { ...empty, ...JSON.parse(sessionStorage.getItem('compose')) };
  } catch {
    return empty;
  }
}

export function ComposeProvider({ children }) {
  const [state, setState] = useState(load);

  useEffect(() => {
    try { sessionStorage.setItem('compose', JSON.stringify(state)); } catch { /* storage unavailable */ }
  }, [state]);

  const update = useCallback((patch) => setState((s) => ({ ...s, ...(typeof patch === 'function' ? patch(s) : patch) })), []);
  const reset = useCallback(() => setState(empty), []);

  const loadDraft = useCallback(async (id) => {
    const { draft } = await api.get(`/drafts/${id}`);
    setState({ draftId: draft.id, subject: draft.subject, body: draft.body, recipients: draft.recipients, attachments: draft.attachments });
  }, []);

  // Saves (creates or updates) the current draft; returns its id
  const saveDraft = useCallback(async () => {
    const payload = {
      subject: state.subject, body: state.body, recipients: state.recipients,
      attachmentIds: state.attachments.map((a) => a.id),
    };
    if (state.draftId) {
      await api.put(`/drafts/${state.draftId}`, payload);
      return state.draftId;
    }
    const { draft } = await api.post('/drafts', payload);
    setState((s) => ({ ...s, draftId: draft.id }));
    return draft.id;
  }, [state]);

  return <Ctx.Provider value={{ ...state, update, reset, loadDraft, saveDraft }}>{children}</Ctx.Provider>;
}
