export class ViemcpError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ViemcpError";
  }
}

export function formatError(error: unknown): string {
  if (error instanceof ViemcpError) {
    return `${error.message}${error.code ? ` (${error.code})` : ""}`;
  }

  if (error instanceof Error) {
    // Handle viem specific errors
    if (error.message.includes("reverted")) {
      return `Contract call reverted: ${error.message}`;
    }
    if (error.message.includes("insufficient funds")) {
      return "Insufficient funds for transaction";
    }
    if (error.message.includes("nonce")) {
      return `Nonce error: ${error.message}`;
    }
    return error.message;
  }

  return String(error);
}

export function handleToolError(error: unknown): {
  content: Array<{ type: string; text: string }>;
} {
  return {
    content: [
      {
        type: "text",
        text: `Error: ${formatError(error)}`,
      },
    ],
  };
}
