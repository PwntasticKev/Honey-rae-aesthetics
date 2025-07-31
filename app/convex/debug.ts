import { query } from "./_generated/server";

export const getDatabaseStats = query({
  args: {},
  handler: async (ctx) => {
    const orgs = await ctx.db.query("orgs").collect();
    const users = await ctx.db.query("users").collect();
    const clients = await ctx.db.query("clients").collect();
    const appointments = await ctx.db.query("appointments").collect();
    const messageTemplates = await ctx.db.query("messageTemplates").collect();

    return {
      orgs: orgs.length,
      users: users.length,
      clients: clients.length,
      appointments: appointments.length,
      messageTemplates: messageTemplates.length,
      sampleData: {
        orgs: orgs.slice(0, 2).map((org) => ({ id: org._id, name: org.name })),
        users: users
          .slice(0, 2)
          .map((user) => ({
            id: user._id,
            email: user.email,
            orgId: user.orgId,
          })),
        clients: clients
          .slice(0, 2)
          .map((client) => ({
            id: client._id,
            name: client.fullName,
            orgId: client.orgId,
          })),
      },
    };
  },
});
