import express, { Request, Response } from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const sessionEndpoint = process.env.SESSION_ENDPOINT || "";
const statusEndpoint = process.env.STATUS_ENDPOINT || "";

// Proxy for /session endpoint (POST)
app.post("/api/session", async (req: Request, res: Response) => {
    try {
        const { nonce } = req.body; // Extract nonce from request body
        const userAgent = req.headers["user-agent"] || "";

        // Make the POST request to the /session endpoint
        const response = await fetch(sessionEndpoint, {
            method: "POST",
            headers: {
                "User-Agent": userAgent,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ nonce }), // Send the nonce in the body
        });

        // Capture the Set-Cookie header from the response
        const cookies = response.headers.raw()["set-cookie"];
        if (cookies) {
            res.setHeader("Set-Cookie", cookies);
        }

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({ message: "Error fetching /session", error });
    }
});

// Proxy for /status endpoint (POST)
app.post("/api/status", async (req: Request, res: Response) => {
    try {
        const { session_id, nonce } = req.body; // Extract session_id and nonce from request body
        const userAgent = req.headers["user-agent"] || "";
        const cookies = req.headers.cookie || "";

        // Make the POST request to the /status endpoint
        const response = await fetch(statusEndpoint, {
            method: "POST",
            headers: {
                "User-Agent": userAgent,
                "Content-Type": "application/json",
                Cookie: cookies, // Forward the cookies
            },
            body: JSON.stringify({ session_id, nonce }), // Send session_id and nonce in the body
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({ message: "Error fetching /status", error });
    }
});

// Start the server
const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
