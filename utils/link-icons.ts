import { LinkType } from "@/shared/graphql/operations.ts";

export const linkIconNames: Record<LinkType, string> = {
  [LinkType.INSTAGRAM]: "instagram",
  [LinkType.YOUTUBE]: "youtube",
  [LinkType.TIKTOK]: "tiktok",
  [LinkType.EMAIL]: "email",
  [LinkType.TWITTER]: "x-3",
  [LinkType.MASTODON]: "mastodon",
  [LinkType.FACEBOOK]: "facebook",
  [LinkType.WEBSITE]: "link-3",
  [LinkType.MERCH_STORE]: "store",
  [LinkType.TWITCH]: "twitch",
  [LinkType.SNAPCHAT]: "snapchat",
  [LinkType.REDDIT]: "reddit",
  [LinkType.DISCORD]: "discord",
  [LinkType.TELEGRAM]: "telegram",
  [LinkType.PATREON]: "patreon-2",
  [LinkType.PINTEREST]: "pinterest",
  [LinkType.TUMBLR]: "tumblr",
  [LinkType.SPOTIFY]: "spotify",
  [LinkType.SOUNDCLOUD]: "soundcloud",
  [LinkType.BANDCAMP]: "bandcamp",
  [LinkType.VIMEO]: "vimeo",
  [LinkType.WECHAT]: "wechat",
  [LinkType.WHATSAPP]: "whatsapp",
  [LinkType.KO_FI]: "kofi-2",
  [LinkType.LINKTREE]: "linktree-1",
  [LinkType.ETSY]: "etsy",
};