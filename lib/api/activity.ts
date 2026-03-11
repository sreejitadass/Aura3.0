interface ActivityEntry {
  type: string;
  name: string;
  description?: string;
  duration?: number;
}

export async function logActivity(
  data: ActivityEntry,
): Promise<{ success: boolean; data: any }> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Not authenticated");

  const response = await fetch("http://localhost:3001/api/activity", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to log activity");
  }

  return response.json();
}

export async function getActivityStats() {
  const token = localStorage.getItem("token");

  const response = await fetch("http://localhost:3001/api/activity/stats", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch activity stats");
  }

  return response.json();
}
