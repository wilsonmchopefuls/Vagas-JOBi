import NextAuth from "next-auth"
import DiscordProvider from "next-auth/providers/discord"

import prisma from "../../../../lib/prisma";

export const authOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.sub; // Inject Discord User ID
        
        // Salva/Atualiza o usuário no banco de dados para poder ser pesquisado depois
        try {
          await prisma.user.upsert({
            where: { discordId: token.sub },
            update: {
              name: session.user.name || "Sem Nome",
              image: session.user.image,
            },
            create: {
              discordId: token.sub,
              name: session.user.name || "Sem Nome",
              image: session.user.image,
            },
          });
        } catch (err) {
          console.error("Erro ao salvar usuário no login:", err);
        }
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
