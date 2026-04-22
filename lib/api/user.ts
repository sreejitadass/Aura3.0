interface UserProfile {
  age?: number;
  profession?: string;
  lifestyle?: string;
  sleepHours?: number;
  stressLevel?: number;
  primaryGoal?: string;
  customNote?: string;
}

export async function updateUserProfile(data: UserProfile) {
  const token = localStorage.getItem("token");

  if (!token) throw new Error("Not authenticated");

  const response = await fetch("http://localhost:3001/api/user/profile", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update profile");
  }

  return response.json();
}
