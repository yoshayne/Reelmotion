import * as WebBrowser from "expo-web-browser";

// This screen exists solely to complete the OAuth session.
// Clerk redirects to reelmotion:///sso-callback after Google auth;
// maybeCompleteAuthSession() fires on fresh module load, signals
// expo-web-browser to dismiss the ASWebAuthenticationSession and
// hand the URL back to startSSOFlow so it can exchange the token.
WebBrowser.maybeCompleteAuthSession();

export default function SSOCallback() {
  return null;
}
