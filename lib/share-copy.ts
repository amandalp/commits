import { deadlineLabel, durationLabel } from "@/lib/utils";
import type { Duration, DurationUnit } from "@/lib/types";

/** The minimum a commitment needs for a link preview. */
export type ShareSubject = {
  text: string;
  deadline: string;
  duration_amount: number | null;
  duration_unit: DurationUnit | null;
  status: string;
  author: { name: string };
};

/** The commit's own framing: "for 30 days" when it has one, else "by <date>". */
export function framing(c: {
  deadline: string;
  duration_amount: number | null;
  duration_unit: DurationUnit | null;
}): { duration: Duration | null; phrase: string } {
  const duration =
    c.duration_amount && c.duration_unit
      ? { amount: c.duration_amount, unit: c.duration_unit }
      : null;
  return {
    duration,
    phrase: duration ? `for ${durationLabel(duration)}` : `by ${deadlineLabel(c.deadline)}`,
  };
}

/**
 * Title and description for a shared commitment. Shared by /share/[id] and the
 * commitment page itself, which is public and just as likely to be pasted into
 * a group chat.
 *
 * Generic they/them keeps the copy correct for every author, since we don't store
 * anyone's pronouns, and guessing from a name would misgender people.
 */
export function shareMeta(c: ShareSubject): { title: string; description: string } {
  const shipped = c.status === "shipped";
  const name = c.author.name;
  const { phrase } = framing(c);

  return {
    title: shipped ? `${name} did it` : `${name} is committing out loud`,
    description: shipped
      ? `${name} said they’d ${c.text} ${phrase}, and they did. See what happened.`
      : `${name} is going to ${c.text} ${phrase}. Hold them to it, or commit to something of your own.`,
  };
}
