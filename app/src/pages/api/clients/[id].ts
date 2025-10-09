import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/lib/db";
import { clients } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const clientId = Number(req.query.id);

  if (req.method === "DELETE") {
    try {
      await db.delete(clients).where(eq(clients.id, clientId));
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ message: "Error deleting client" });
    }
  } else {
    res.setHeader("Allow", ["DELETE"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}



