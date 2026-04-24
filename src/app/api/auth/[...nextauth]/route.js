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
    // jwt é chamado só no login/refresh de token — local correto para persistir o usuário.
    // session é chamado em CADA getServerSession() — não deve ter side-effects de DB.
    async jwt({ token, user, account, profile }) {
      if (account && profile) {
        // Primeiro login: salva/atualiza o usuário no banco uma única vez
        try {
          await prisma.user.upsert({
            where: { discordId: token.sub },
            update: {
              name: profile.username || profile.global_name || token.name || 'Sem Nome',
              image: profile.avatar
                ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
                : token.picture ?? null,
            },
            create: {
              discordId: token.sub,
              name: profile.username || profile.global_name || token.name || 'Sem Nome',
              image: profile.avatar
                ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
                : token.picture ?? null,
            },
          });
        } catch (err) {
          console.error('Erro ao salvar usuário no login:', err);
        }
      }
      return token;
    },

    async session({ session, token }) {
      // Apenas injeta o ID — sem queries de banco aqui
      if (session?.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  session: { strategy: 'jwt' }, // obrigatório para que o jwt callback seja invocado
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
