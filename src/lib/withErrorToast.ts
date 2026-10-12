import { toast } from "sonner";

/** Runs an action; on failure shows an error toast and returns undefined. */
export async function withErrorToast<T>(
  message: string,
  action: () => Promise<T>,
): Promise<T | undefined> {
  try {
    return await action();
  } catch (error) {
    console.error(error);
    toast.error(message);
    return undefined;
  }
}
