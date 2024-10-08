import permissions from "@/utils/bitfield";
import { getToken } from "next-auth/jwt";

const API_KEY = process.env.API_KEY;
const ASTROBIRB_API_URL = process.env.ASTROBIRB_API_URL;

//@ts-ignore
export default async function guilds(req, res) {
  try {
    const session = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    //@ts-ignore
    const userAccessToken = session.accessToken;

    const userGuildsResponse = await fetch(
      "https://discord.com/api/v10/users/@me/guilds",
      {
        headers: {
          Authorization: `Bearer ${userAccessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!userGuildsResponse.ok) {
      res.status(500).json({ error: "Failed to fetch user guilds" });
    }

    const userGuilds = await userGuildsResponse.json();

    const botguildsResponse = await fetch(`${ASTROBIRB_API_URL}/guilds`, {
      //@ts-ignore
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": API_KEY,
        Authorization: API_KEY,
      },
    });

    if (!botguildsResponse.ok) {
      res.status(500).json({ error: "Failed to fetch bot guilds" });
    }

    const botGuildsData = await botguildsResponse.json();
    //@ts-ignore
    const botGuildIds = botGuildsData.guilds.map((guild) => guild.guild);
    //@ts-ignore
    const guilds = userGuilds.filter((userGuild) => {
      const userGuildId = parseInt(userGuild.id);
      const userHasManageGuild = permissions(userGuild.permissions).includes(
        "MANAGE_GUILD"
      );
      return botGuildIds.includes(userGuildId) && userHasManageGuild;
    });

    res.status(200).json(guilds);
  } catch (error) {
    //@ts-ignore
    console.error("Error in guilds API:", error.message);
    //@ts-ignore
    res.status(500).json({ error: error.message });
  }
}
