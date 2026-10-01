const API_URL = import.meta.env.VITE_API_URL || "/api";

export const registerLand = async (land) => {
    const response = await fetch(`${API_URL}/lands`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(land)
    });

    if (!response.ok) {
        throw new Error("Failed to register land");
    }

    return response.json();
};