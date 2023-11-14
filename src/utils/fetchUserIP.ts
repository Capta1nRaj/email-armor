// Fetching User IP Using external-ip NPM Module

async function fetchUserIP(attempts = 1) {
    try {
        const response = await fetch("https://api.ipify.org/?format=json");

        if (!response.ok) {
            throw new Error("Network response was not ok");
        }

        const data = await response.json();

        return data.ip;
    } catch (error) {
        if (attempts < 10) {
            console.log(`IP Fetch Attempt ${attempts} failed. Retrying....`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return fetchUserIP(attempts + 1);
        } else {
            throw new Error("Failed to fetch user IP.");
        }
    }
}

export default fetchUserIP;