import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';

// Supply only the WebCrypto operations Supabase PKCE needs on Hermes.
// Preserve a complete platform implementation when one already exists.
if (Platform.OS !== 'web') {
  if (!globalThis.crypto) globalThis.crypto = {};
  if (!globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues = Crypto.getRandomValues;
  }
  if (!globalThis.crypto.subtle) {
    globalThis.crypto.subtle = {
      digest: (algorithm, data) => {
        if (algorithm !== 'SHA-256') throw new Error('Unsupported digest algorithm.');
        return Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, data);
      },
    };
  }
}
