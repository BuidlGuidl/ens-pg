export const SESSION_MESSAGES = {
  genericExpiredRetry: "Session expired. Please sign in again and retry.",
  adminExpiredFinalApproval: "Admin session expired. Please sign in again before final approval.",
  adminExpiredMilestoneApproval: "Admin session expired. Please sign in again before milestone approval.",
  adminPermissionsRequired: "Re-authenticated, but admin permissions are required.",
  reauthFailed: "Could not re-authenticate. Please try again.",
  sessionRestoredSubmitAgain: "Session restored. You can submit final approval now.",
  sessionRestoredWithdrawAgain: "Session restored. You can withdraw now.",
  reviewSyncAfterOnChainFailed:
    "On-chain transaction succeeded, but stage review failed. Sign in again and retry to sync status.",
  milestoneSyncAfterOnChainFailed:
    "On-chain transaction succeeded, but milestone review failed. Sign in again and retry to sync status.",
  withdrawSyncAfterOnChainFailed: "On-chain withdraw succeeded, but your session expired. Re-authenticate and retry.",
  sessionStillUnavailable: "Session is still unavailable. Please try again.",
} as const;

export const REAUTH_UI_TEXT = {
  reauth: "Re-authenticate",
  reauthAndRetry: "Re-authenticate & Retry",
  reauthenticating: "Re-authenticating...",
  finalApprovalPendingSync: "On-chain transaction is already confirmed. Re-authenticate to sync approval status.",
  finalApprovalSessionExpired: "Admin session expired. Re-authenticate to continue final approval.",
  milestonePendingSync: "On-chain transaction is already confirmed. Re-authenticate to sync milestone status.",
  milestoneSessionExpired: "Admin session expired. Re-authenticate to continue milestone approval.",
  withdrawPendingSync: "On-chain withdraw is confirmed. Re-authenticate to sync milestone payment status.",
  withdrawSessionExpired: "Session expired. Re-authenticate to continue withdraw.",
} as const;
