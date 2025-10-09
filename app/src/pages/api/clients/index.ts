import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/lib/db";
import { clients } from "@/db/schema";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    try {
      const allClients = await db.select().from(clients);
      res.status(200).json(allClients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Error fetching clients" });
    }
  } else if (req.method === "POST") {
    try {
      const newClientData = req.body;
      // In a real app, you'd want to validate this data with Zod
      const [newClient] = await db
        .insert(clients)
        .values(newClientData)
        .returning();
      res.status(201).json(newClient);
    } catch (error) {
      console.error("Error creating client:", error);
      res.status(500).json({ message: "Error creating client" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
