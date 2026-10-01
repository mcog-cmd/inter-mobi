const API_URL = import.meta.env.VITE_API_URL || "/api";

export const registerLand = async (land) => {
    const response = await fetch(`${API_URL}/lands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(land)
    });

    if (!response.ok) {
        let message = "Failed to register land";

        try {
            const body = await response.json();

            if (body.message) {
                message = body.message;
            }
        } catch {
            message = "Failed to register land";
        }

        throw new Error(message);
    }

    return response.json();
};

export const searchLands = async (geometry) => {
    const response = await fetch(`${API_URL}/lands/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geometry)
    });

    if (!response.ok) {
        throw new Error("Failed to search lands");
    }

    return response.json();
};

export const getLandById = async (id) => {
    const response = await fetch(`${API_URL}/lands/${id}`);

    if (!response.ok) {
        throw new Error("Failed to get land");
    }

    return response.json();
};