import { accountLabel } from './studentId.js';

// Always something sensible to show for a person, even if the name was never filled in: name, else ID number or email.
export const profileName = (profile) => (profile?.displayName || '').trim() || accountLabel(profile) || 'Account';
export const profileInitial = (profile) => profileName(profile).charAt(0).toUpperCase();
