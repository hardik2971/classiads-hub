/** Settings hub sections. `fields` sections are rendered by the generic settings form. */
export interface SettingField {
  group: string;
  key: string;
  label: string;
  type?: "text" | "number" | "toggle" | "textarea" | "select" | "color" | "password";
  options?: { value: string; label: string }[];
  hint?: string;
  secret?: boolean;
  span?: 2;
}

export interface SettingSection {
  slug: string;
  title: string;
  subtitle: string;
  icon: string;
  kind: "fields" | "page" | "custom" | "link";
  href?: string;
  pageKey?: string;
  blocks?: { title: string; fields: SettingField[] }[];
}

const yes = (group: string, key: string, label: string, hint?: string): SettingField => ({ group, key, label, type: "toggle", hint });

export const SECTIONS: SettingSection[] = [
  {
    slug: "general",
    title: "Settings",
    subtitle: "General platform configuration",
    icon: "settings",
    kind: "fields",
    blocks: [
      {
        title: "Company Details",
        fields: [
          { group: "general", key: "app_name", label: "Company Name" },
          { group: "general", key: "app_tagline", label: "Tagline" },
          { group: "general", key: "support_email", label: "Email" },
          { group: "general", key: "contact_number_1", label: "Contact Number 1" },
          { group: "general", key: "contact_number_2", label: "Contact Number 2" },
          { group: "general", key: "address", label: "Address", type: "textarea" },
        ],
      },
      {
        title: "More Setting",
        fields: [
          { group: "general", key: "default_language", label: "Default Language" },
          { group: "general", key: "android_version", label: "Android Version" },
          { group: "general", key: "play_store_link", label: "Play Store Link" },
          { group: "general", key: "ios_version", label: "IOS Version" },
          { group: "general", key: "app_store_link", label: "App Store Link" },
          yes("general", "force_update", "Force Update App"),
          yes("general", "android_maintenance", "Android Maintenance Mode"),
          yes("general", "ios_maintenance", "IOS Maintenance Mode"),
          yes("general", "maintenance_mode", "Web Maintenance Mode"),
        ],
      },
      {
        title: "Advertisement Settings",
        fields: [
          yes("ads", "free_ad_listing", "Free Ad Listing", "Allow posting without a package"),
          yes("ads", "require_approval", "Require admin approval for new ads"),
          yes("ads", "require_subscription", "Require an active package to post"),
          { group: "ads", key: "default_expiry_days", label: "Ad expiry (days)", type: "number" },
          { group: "ads", key: "max_images_per_ad", label: "Max images per ad", type: "number" },
          { group: "ads", key: "nearby_radius_km", label: "Nearby radius (km)", type: "number" },
          { group: "commerce", key: "tax_percent", label: "Tax (%)", type: "number" },
          { group: "commerce", key: "commission_percent", label: "Commission (%)", type: "number" },
        ],
      },
    ],
  },
  {
    slug: "web",
    title: "Web Settings",
    subtitle: "Website appearance and behaviour",
    icon: "monitor",
    kind: "fields",
    blocks: [
      {
        title: "Website",
        fields: [
          { group: "web", key: "header_color", label: "Header colour", type: "color" },
          { group: "web", key: "footer_color", label: "Footer colour", type: "color" },
          { group: "web", key: "footer_description", label: "Footer description", type: "textarea", span: 2 },
          { group: "web", key: "google_maps_key", label: "Google Maps / Places key", hint: "Used for address autocomplete on the website" },
          { group: "web", key: "default_latitude", label: "Default map latitude", type: "number" },
          { group: "web", key: "default_longitude", label: "Default map longitude", type: "number" },
        ],
      },
      {
        title: "Social links",
        fields: ["facebook", "instagram", "x", "linkedin", "youtube", "pinterest"].map((s) => ({ group: "web", key: `${s}_url`, label: `${s[0].toUpperCase()}${s.slice(1)} URL` })),
      },
    ],
  },
  {
    slug: "notification",
    title: "Notification Settings",
    subtitle: "Push and email notifications",
    icon: "bell",
    kind: "fields",
    blocks: [
      {
        title: "Notifications",
        fields: [
          yes("notifications", "push_enabled", "Push notifications (FCM)"),
          yes("notifications", "email_enabled", "Email notifications"),
          yes("notifications", "notify_new_message", "Notify on new chat messages"),
          yes("notifications", "notify_offers", "Notify on offers"),
          { group: "firebase", key: "vapid_key", label: "Web push VAPID key", hint: "Firebase console → Project settings → Cloud Messaging → Web Push certificates", span: 2 },
        ],
      },
    ],
  },
  {
    slug: "video-ads",
    title: "Video Ads Settings",
    subtitle: "Reels and video advertisements",
    icon: "video",
    kind: "fields",
    blocks: [{ title: "Video ads", fields: [yes("video_ads", "enabled", "Enable video ads"), { group: "video_ads", key: "max_duration_seconds", label: "Max duration (seconds)", type: "number" }, { group: "video_ads", key: "max_size_mb", label: "Max file size (MB)", type: "number" }] }],
  },
  {
    slug: "watermark",
    title: "Watermark Settings",
    subtitle: "Image watermark configuration",
    icon: "image",
    kind: "fields",
    blocks: [
      {
        title: "Watermark",
        fields: [
          yes("media", "watermark_enabled", "Enable watermark"),
          { group: "media", key: "watermark_text", label: "Watermark text" },
          { group: "media", key: "watermark_position", label: "Position", type: "select", options: ["bottom-right", "bottom-left", "top-right", "top-left", "center"].map((v) => ({ value: v, label: v })) },
          { group: "media", key: "watermark_opacity", label: "Opacity (%)", type: "number" },
        ],
      },
    ],
  },
  {
    slug: "otp",
    title: "OTP Provider Settings",
    subtitle: "Login and OTP providers",
    icon: "mail",
    kind: "fields",
    blocks: [
      {
        title: "OTP",
        fields: [
          { group: "otp", key: "provider", label: "Provider", type: "select", options: [{ value: "log", label: "Test mode (show code in app)" }, { value: "firebase", label: "Firebase Phone Auth" }, { value: "twilio", label: "Twilio" }, { value: "msg91", label: "MSG91" }], hint: "Test mode returns the code to the app — switch off for production" },
          { group: "otp", key: "code_length", label: "Code length", type: "number" },
          { group: "otp", key: "expiry_minutes", label: "Expiry (minutes)", type: "number" },
          { group: "otp", key: "twilio_sid", label: "Twilio account SID", secret: true },
          { group: "otp", key: "twilio_token", label: "Twilio auth token", type: "password", secret: true },
          { group: "otp", key: "twilio_from", label: "Twilio sender number" },
        ],
      },
    ],
  },
  { slug: "dummy-data", title: "Dummy Data", subtitle: "Populate or remove demo data", icon: "database", kind: "custom" },
  {
    slug: "admob",
    title: "Admob",
    subtitle: "Google AdMob configuration",
    icon: "ad",
    kind: "fields",
    blocks: [
      {
        title: "AdMob",
        fields: [
          yes("admob", "enabled", "Enable AdMob"),
          { group: "admob", key: "android_app_id", label: "Android app ID" },
          { group: "admob", key: "ios_app_id", label: "iOS app ID" },
          { group: "admob", key: "banner_unit_id", label: "Banner unit ID" },
          { group: "admob", key: "interstitial_unit_id", label: "Interstitial unit ID" },
        ],
      },
    ],
  },
  {
    slug: "adsense",
    title: "AdSense",
    subtitle: "Google AdSense configuration",
    icon: "google",
    kind: "fields",
    blocks: [{ title: "AdSense", fields: [yes("adsense", "enabled", "Enable AdSense"), { group: "adsense", key: "client_id", label: "Publisher ID (ca-pub-…)" }, { group: "adsense", key: "slot_id", label: "Ad slot ID" }] }],
  },
  { slug: "about-us", title: "About Us", subtitle: "About us page content", icon: "info", kind: "page", pageKey: "about" },
  { slug: "terms", title: "Terms & Conditions", subtitle: "Terms and conditions content", icon: "file", kind: "page", pageKey: "terms" },
  { slug: "privacy", title: "Privacy Policy", subtitle: "Privacy policy content", icon: "shield", kind: "page", pageKey: "privacy" },
  { slug: "refund", title: "Refund Policy", subtitle: "Refund policy content", icon: "receipt", kind: "page", pageKey: "refund" },
  { slug: "contact-us", title: "Contact Us", subtitle: "Contact details and page", icon: "phone", kind: "page", pageKey: "contact" },
  { slug: "firebase", title: "Firebase Settings", subtitle: "Firebase project credentials", icon: "cloud", kind: "custom" },
  { slug: "languages", title: "Languages", subtitle: "Manage languages and translations", icon: "language", kind: "custom" },
  { slug: "payment-gateways", title: "Payment Gateways", subtitle: "Configure payment providers", icon: "card", kind: "custom" },
  { slug: "system-status", title: "System Status", subtitle: "Health and connectivity checks", icon: "server", kind: "custom" },
  { slug: "seo", title: "Seo-Settings", subtitle: "Search engine optimization", icon: "search", kind: "custom" },
  { slug: "file-manager", title: "File Manager", subtitle: "Storage and file management", icon: "folder", kind: "custom" },
  { slug: "email-templates", title: "Email Templates", subtitle: "Manage email templates", icon: "mail", kind: "custom" },
  {
    slug: "gemini-ai",
    title: "Gemini AI",
    subtitle: "AI content generation settings",
    icon: "robot",
    kind: "fields",
    blocks: [
      {
        title: "Gemini",
        fields: [
          { group: "ai", key: "provider", label: "Provider", type: "select", options: [{ value: "stub", label: "Draft templates (no key)" }, { value: "gemini", label: "Google Gemini" }, { value: "disabled", label: "Disabled" }] },
          { group: "ai", key: "gemini_api_key", label: "Gemini API key", type: "password", secret: true },
        ],
      },
    ],
  },
  { slug: "currency", title: "Default Currency Settings", subtitle: "Default currency configuration", icon: "coins", kind: "custom" },
  { slug: "logs", title: "Log Viewer", subtitle: "Admin activity / audit log", icon: "terminal", kind: "custom" },
];
