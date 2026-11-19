/**
 * Cal.com API v2 Client for SAM CODES
 * Provides real-time slot fetching and direct meeting creation.
 */

const CAL_API_BASE = "https://api.cal.com/v2";
const DEFAULT_CAL_VERSION = "2024-08-13";
const DEFAULT_EVENT_TYPE_ID = 7978692; // 15 Min Architecture & Strategy
const DEFAULT_CAL_URL = "https://cal.com/sam-codesai/15min";

export interface CalSlot {
  time: string; // ISO 8601 UTC string
}

export interface CalSlotsResponse {
  status: string;
  data?: {
    slots?: Record<string, CalSlot[]>;
  };
  error?: unknown;
}

export interface CreateBookingParams {
  start: string; // ISO 8601 UTC string
  name: string;
  email: string;
  notes?: string;
  timeZone?: string;
}

export interface CreateBookingResponse {
  status: string;
  data?: {
    id: number;
    uid: string;
    title: string;
    startTime: string;
    endTime: string;
  };
  error?: unknown;
}

function getCalApiKey(): string {
  return process.env.CAL_API_KEY || "cal_live_9ad33a40a44716de51ca94c10fea8134";
}

/**
 * Fetch available slots for the 15-min event type.
 */
export async function getAvailableSlots(
  daysAhead = 2,
  eventTypeId = DEFAULT_EVENT_TYPE_ID
): Promise<{ date: string; time: string; istTime: string }[]> {
  const apiKey = getCalApiKey();
  if (!apiKey) return [];

  const now = new Date();
  const future = new Date(now.getTime() + daysAhead * 24 * 3600 * 1000);

  const startIso = now.toISOString();
  const endIso = future.toISOString();

  const url = `${CAL_API_BASE}/slots/available?eventTypeId=${eventTypeId}&startTime=${startIso}&endTime=${endIso}`;

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "cal-api-version": DEFAULT_CAL_VERSION,
        "Content-Type": "application/json",
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      console.warn(`[Cal.com] getAvailableSlots returned status ${res.status}`);
      return [];
    }

    const json = (await res.json()) as CalSlotsResponse;
    const slotsMap = json.data?.slots || {};
    const results: { date: string; time: string; istTime: string }[] = [];

    for (const [dateStr, slotList] of Object.entries(slotsMap)) {
      for (const slot of slotList) {
        const d = new Date(slot.time);
        const istTime = d.toLocaleTimeString("en-US", {
          timeZone: "Asia/Calcutta",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });

        results.push({
          date: dateStr,
          time: slot.time,
          istTime: `${istTime} IST`,
        });
      }
    }

    return results;
  } catch (err) {
    console.error("[Cal.com] Error fetching available slots:", err);
    return [];
  }
}

/**
 * Create a booking directly via Cal.com API.
 */
export async function createCalBooking(
  params: CreateBookingParams,
  eventTypeId = DEFAULT_EVENT_TYPE_ID
): Promise<CreateBookingResponse> {
  const apiKey = getCalApiKey();
  if (!apiKey) {
    return { status: "error", error: "CAL_API_KEY not configured" };
  }

  const url = `${CAL_API_BASE}/bookings`;
  const payload = {
    eventTypeId,
    start: params.start,
    attendee: {
      name: params.name,
      email: params.email,
      timeZone: params.timeZone || "Asia/Calcutta",
    },
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "cal-api-version": "2024-06-14",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as CreateBookingResponse;
    return data;
  } catch (err) {
    console.error("[Cal.com] Error creating booking:", err);
    return { status: "error", error: (err as Error).message };
  }
}

export { DEFAULT_CAL_URL, DEFAULT_EVENT_TYPE_ID };
