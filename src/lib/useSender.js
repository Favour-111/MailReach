import { useEffect, useState } from 'react';
import { api } from '../api';

// Non-secret info about the user's connected Gmail: { configured, needsReconnect, email, name, maxRecipients }
export function useSender() {
  const [sender, setSender] = useState(null);
  useEffect(() => { api.get('/campaigns/sender').then(setSender).catch(() => setSender({ configured: false })); }, []);
  return sender;
}
