export interface SocialLink {
  platform: string;
  url: string;
  handleOrLabel: string;
  ariaLabel: string;
  iconName: "Instagram" | "Linkedin" | "Twitter" | "Reddit" | "Github" | "Mail" | "Telegram";
  directActionLabel: string;
  priorityBadge?: string;
  description?: string;
}

/**
 * Centralized Contact & Socials Configuration
 * Update these constants whenever handles, URLs, or email addresses change.
 */
export const CONTACT_CONFIG = {
  // Telegram - 24/7 AI Bot and Personal DM
  TELEGRAM_BOT_URL: "https://t.me/samarth_master_bot",
  TELEGRAM_BOT_HANDLE: "@samarth_master_bot",
  TELEGRAM_PERSONAL_URL: "https://t.me/Samarth1306",
  TELEGRAM_PERSONAL_HANDLE: "@Samarth1306",

  INSTAGRAM_URL: "https://www.instagram.com/samarth.buildss/",
  INSTAGRAM_HANDLE: "@samarth.buildss",

  LINKEDIN_URL: "https://www.linkedin.com/in/sam-codesai",
  LINKEDIN_LABEL: "Samarth Nimangre",

  // X (Twitter) URL & Handle — unified developer brand
  X_URL: "https://x.com/Sam_CodeAI",
  X_HANDLE: "@Sam_CodeAI",

  REDDIT_URL: "https://www.reddit.com/user/SamarthBuilds_/",
  REDDIT_HANDLE: "u/SamarthBuilds_",

  GITHUB_URL: "https://github.com/Sam-CodesAI",
  GITHUB_HANDLE: "Sam-CodesAI",

  // Direct Architecture & Scoping Calendar (Cal.com)
  CAL_URL: "https://cal.com/sam-codesai/15min",
  CAL_LABEL: "Book 15-Min Architecture Call (Cal.com)",

  // Primary contact email address
  EMAIL_ADDRESS: "samarthknimangre@gmail.com",
  EMAIL_LABEL: "samarthknimangre@gmail.com",
  EMAIL_IS_VERIFIED: true,
};

/**
 * Contact pathways ordered by priority:
 * 1. Telegram (24/7 AI Qualifier)
 * 2. Instagram (Top Preference for DMs)
 * 3. LinkedIn (Professional Engagements)
 * 4. X (Twitter - Tech Discussions)
 * 5. GitHub (Open Source Repositories)
 * 6. Reddit (Builder Community)
 * 7. Email (Formal Proposals & RFPs)
 */
export const socialsData: SocialLink[] = [
  {
    platform: "Telegram",
    url: CONTACT_CONFIG.TELEGRAM_BOT_URL,
    handleOrLabel: CONTACT_CONFIG.TELEGRAM_BOT_HANDLE,
    ariaLabel: "Chat with Sam's AI Qualifier bot on Telegram",
    iconName: "Telegram",
    directActionLabel: "Chat with AI Bot",
    priorityBadge: "24/7 Live Bot",
    description: "Instant requirement qualification, scope assessment, and real-time message routing",
  },
  {
    platform: "Instagram",
    url: CONTACT_CONFIG.INSTAGRAM_URL,
    handleOrLabel: CONTACT_CONFIG.INSTAGRAM_HANDLE,
    ariaLabel: "Message Sam on Instagram",
    iconName: "Instagram",
    directActionLabel: "DM on Instagram",
    priorityBadge: "Top Preference",
    description: "Fastest response for project chats, ideas, and quick questions",
  },
  {
    platform: "LinkedIn",
    url: CONTACT_CONFIG.LINKEDIN_URL,
    handleOrLabel: CONTACT_CONFIG.LINKEDIN_LABEL,
    ariaLabel: "Connect with Samarth on LinkedIn",
    iconName: "Linkedin",
    directActionLabel: "Connect on LinkedIn",
    priorityBadge: "Professional",
    description: "For client engagements, academic discussions, and professional network",
  },
  {
    platform: "X (Twitter)",
    url: CONTACT_CONFIG.X_URL,
    handleOrLabel: CONTACT_CONFIG.X_HANDLE,
    ariaLabel: "Message Sam on X (Twitter)",
    iconName: "Twitter",
    directActionLabel: "Send a DM on X",
    priorityBadge: "Tech & Builds",
    description: "Tech discussions, daily build progress, and direct messaging",
  },
  {
    platform: "GitHub",
    url: CONTACT_CONFIG.GITHUB_URL,
    handleOrLabel: CONTACT_CONFIG.GITHUB_HANDLE,
    ariaLabel: "View Sam's GitHub Profile",
    iconName: "Github",
    directActionLabel: "View Repositories",
    priorityBadge: "Open Source",
    description: "Production code repositories, agentic workflows, and verified benchmarks",
  },
  {
    platform: "Reddit",
    url: CONTACT_CONFIG.REDDIT_URL,
    handleOrLabel: CONTACT_CONFIG.REDDIT_HANDLE,
    ariaLabel: "Message Sam on Reddit",
    iconName: "Reddit",
    directActionLabel: "Chat on Reddit",
    description: "Builder community, discussions, and open-source feedback",
  },
  {
    platform: "Email",
    url: `mailto:${CONTACT_CONFIG.EMAIL_ADDRESS}`,
    handleOrLabel: CONTACT_CONFIG.EMAIL_LABEL,
    ariaLabel: "Send an email to Sam",
    iconName: "Mail",
    directActionLabel: "Copy Direct Email",
    priorityBadge: "Proposals & RFPs",
    description: "For formal project specifications, briefs, and scopes",
  },
];
