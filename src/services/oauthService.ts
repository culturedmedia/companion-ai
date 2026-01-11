import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../lib/supabase';
import { sessionService } from './sessionService';

// Complete auth session for web
WebBrowser.maybeCompleteAuthSession();

// Google OAuth config - replace with your actual client IDs
const GOOGLE_CONFIG = {
  iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
  androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
};

export interface OAuthResult {
  success: boolean;
  error?: string;
  user?: any;
}

class OAuthService {
  // Check if Apple Sign In is available
  async isAppleSignInAvailable(): Promise<boolean> {
    if (Platform.OS !== 'ios') return false;
    return await AppleAuthentication.isAvailableAsync();
  }

  // Sign in with Apple
  async signInWithApple(): Promise<OAuthResult> {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        return { success: false, error: 'No identity token received' };
      }

      // Sign in with Supabase using the Apple token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Update profile with Apple name if available
      if (data.user && credential.fullName) {
        const displayName = [
          credential.fullName.givenName,
          credential.fullName.familyName,
        ].filter(Boolean).join(' ');

        if (displayName) {
          await supabase
            .from('profiles')
            .update({ display_name: displayName })
            .eq('id', data.user.id);
        }
      }

      // Create session
      if (data.user) {
        await sessionService.createSession(data.user.id);
      }

      return { success: true, user: data.user };
    } catch (error: any) {
      if (error.code === 'ERR_CANCELED') {
        return { success: false, error: 'Sign in cancelled' };
      }
      return { success: false, error: error.message || 'Apple sign in failed' };
    }
  }

  // Sign in with Google
  async signInWithGoogle(
    request: Google.GoogleAuthRequestConfig | null,
    response: Google.AuthSessionResult | null,
    promptAsync: () => Promise<Google.AuthSessionResult>
  ): Promise<OAuthResult> {
    try {
      // If we don't have a response yet, prompt the user
      if (!response) {
        const result = await promptAsync();
        if (result.type !== 'success') {
          return { success: false, error: 'Google sign in cancelled' };
        }
        response = result;
      }

      if (response.type !== 'success' || !response.authentication?.idToken) {
        return { success: false, error: 'No ID token received' };
      }

      // Sign in with Supabase using the Google token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.authentication.idToken,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Create session
      if (data.user) {
        await sessionService.createSession(data.user.id);
      }

      return { success: true, user: data.user };
    } catch (error: any) {
      return { success: false, error: error.message || 'Google sign in failed' };
    }
  }

  // Get Google auth request hook config
  getGoogleAuthConfig() {
    return {
      iosClientId: GOOGLE_CONFIG.iosClientId,
      androidClientId: GOOGLE_CONFIG.androidClientId,
      webClientId: GOOGLE_CONFIG.webClientId,
    };
  }

  // Link Apple account to existing user
  async linkAppleAccount(): Promise<OAuthResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        return { success: false, error: 'No identity token received' };
      }

      // Link the identity
      const { error } = await supabase.auth.linkIdentity({
        provider: 'apple',
        options: {
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      if (error.code === 'ERR_CANCELED') {
        return { success: false, error: 'Linking cancelled' };
      }
      return { success: false, error: error.message || 'Failed to link Apple account' };
    }
  }

  // Unlink OAuth provider
  async unlinkProvider(provider: 'apple' | 'google'): Promise<OAuthResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      // Check if user has other auth methods
      const identities = user.identities || [];
      if (identities.length <= 1) {
        return { 
          success: false, 
          error: 'Cannot unlink your only authentication method' 
        };
      }

      const { error } = await supabase.auth.unlinkIdentity({
        provider,
      } as any);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to unlink account' };
    }
  }

  // Get linked providers for current user
  async getLinkedProviders(): Promise<string[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      return (user.identities || []).map(i => i.provider);
    } catch {
      return [];
    }
  }
}

export const oauthService = new OAuthService();
export default oauthService;
