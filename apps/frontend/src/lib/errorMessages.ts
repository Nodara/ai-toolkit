export type ApiErrorContext = 'fetch' | 'retry' | 'cancel' | 'submit';

function normalizeMessage(msg: string | string[] | undefined): string {
  if (msg == null) return '';
  if (Array.isArray(msg)) return msg[0] ?? msg.join(', ');
  return String(msg);
}

export function getUserFriendlyMessage(options: {
  status?: number;
  message?: string | string[];
  context?: ApiErrorContext;
}): string {
  const { status, message } = options;
  const msg = normalizeMessage(message).toLowerCase();

  // Network / fetch failures (no status, or "Failed to fetch")
  if (
    !status &&
    (msg.includes('failed to fetch') ||
      msg.includes('network') ||
      msg.includes('networkerror'))
  ) {
    return 'Unable to connect. Check your connection and try again.';
  }

  // Extract status from "Request failed: 503" style messages
  const requestFailedMatch = msg.match(/request failed:\s*(\d+)/);
  const effectiveStatus =
    status ?? (requestFailedMatch ? +requestFailedMatch[1] : undefined);

  if (effectiveStatus !== undefined) {
    if (effectiveStatus === 404 || msg.includes('not found')) {
      return 'This item could not be found.';
    }
    if (effectiveStatus === 409) {
      if (msg.includes('cannot cancel')) {
        return "This job can't be cancelled right now.";
      }
      if (msg.includes('can only retry')) {
        return 'Only failed or cancelled jobs can be retried.';
      }
      if (msg.includes('can only delete')) {
        return 'Only completed, failed, or cancelled jobs can be deleted.';
      }
    }
    if (
      effectiveStatus === 503 ||
      msg.includes('queue') ||
      msg.includes('unavailable')
    ) {
      return 'The service is temporarily busy. Please try again in a moment.';
    }
    if (effectiveStatus >= 500) {
      if (msg.includes('database')) {
        return 'Something went wrong. Please try again.';
      }
      return 'Something went wrong. Please try again.';
    }
    if (
      effectiveStatus === 400 &&
      (msg.includes('at least') ||
        msg.includes('at most') ||
        msg.includes('must be') ||
        msg.includes('required'))
    ) {
      return normalizeMessage(message);
    }
  }

  // Message-based fallbacks when no status
  if (msg.includes('cannot cancel'))
    return "This job can't be cancelled right now.";
  if (msg.includes('can only retry'))
    return 'Only failed or cancelled jobs can be retried.';
  if (msg.includes('can only delete'))
    return 'Only completed, failed, or cancelled jobs can be deleted.';
  if (msg.includes('queue') || msg.includes('unavailable')) {
    return 'The service is temporarily busy. Please try again in a moment.';
  }

  // Already user-friendly (from our own throw) - pass through
  const friendlyPhrases = [
    'could not be found',
    "can't be cancelled",
    'can be retried',
    'temporarily busy',
    'something went wrong',
    'unable to connect',
    'please try again',
  ];
  if (friendlyPhrases.some((p) => msg.includes(p))) {
    return normalizeMessage(message);
  }

  return 'Something went wrong. Please try again.';
}

export function formatJobErrorMessage(rawMessage: string | null): string {
  if (!rawMessage || !rawMessage.trim())
    return 'Something went wrong. Please try again.';
  const msg = rawMessage.toLowerCase();
  if (msg.includes('timed out') || msg.includes('timeout')) {
    return 'Generation took too long. Please try again.';
  }
  if (
    msg.includes('text generation returned empty') ||
    msg.includes('empty response')
  ) {
    return 'The response was empty. Please try again.';
  }
  if (msg.includes('resource not found') || msg.includes('not found')) {
    return 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}
