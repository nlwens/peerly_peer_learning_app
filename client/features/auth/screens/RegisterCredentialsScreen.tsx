import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';

import { COLORS } from '@/constants/theme';
import PeerlyButton from '@/shared/components/ui/PeerlyButton';
import { setRegisterCredentials } from '@/features/auth/store/registerStore';
import { getRegisterEmailCheck } from '@/features/auth/api/registerApi';

function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return 'Email is required.';
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(trimmed)) return 'Please enter a valid email address.';
  return null;
}

export default function RegisterCredentialsScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const handleNext = async () => {
    let hasError = false;

    const eErr = validateEmail(email);
    setEmailError(eErr);
    if (eErr) hasError = true;

    if (!password.trim()) {
      setPasswordError('Password is required.');
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      hasError = true;
    } else {
      setPasswordError(null);
    }

    if (!confirm.trim()) {
      setConfirmError('Please confirm your password.');
      hasError = true;
    } else if (confirm !== password) {
      setConfirmError('Passwords do not match.');
      hasError = true;
    } else {
      setConfirmError(null);
    }

    if (hasError) return;

    setChecking(true);
    setEmailError(null);
    try {
      const available = await getRegisterEmailCheck(email.trim());
      if (!available) {
        setEmailError('Email is already in use.');
        return;
      }
    } catch (e) {
      setEmailError(e instanceof Error ? e.message : 'Could not verify email.');
      return;
    } finally {
      setChecking(false);
    }

    setRegisterCredentials({ email: email.trim(), password });
    router.push('/register/photo');
  };

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <Pressable onPress={handleBack} style={styles.back} accessibilityRole="button" accessibilityLabel="Go back">
          <Feather name="arrow-left" size={22} color={COLORS.textPrimary} />
        </Pressable>

        <Text style={styles.title}>Register</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              setEmailError(null);
            }}
            placeholder="Enter email"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            accessibilityLabel="Email address"
          />
          {emailError && <Text style={styles.error}>{emailError}</Text>}

          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              setPasswordError(null);
            }}
            placeholder="Enter password"
            secureTextEntry
            style={styles.input}
            accessibilityLabel="Password"
          />
          {passwordError && <Text style={styles.error}>{passwordError}</Text>}

          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            value={confirm}
            onChangeText={(v) => {
              setConfirm(v);
              setConfirmError(null);
            }}
            placeholder="Confirm password"
            secureTextEntry
            style={styles.input}
            accessibilityLabel="Confirm password"
          />
          {confirmError && <Text style={styles.error}>{confirmError}</Text>}

          {checking ? (
            <ActivityIndicator color={COLORS.textPrimary} style={{ marginVertical: 12 }} />
          ) : (
            <PeerlyButton
              title="Next"
              backgroundColor={COLORS.buttonGreen}
              textColor={COLORS.textOnDark}
              onPress={() => void handleNext()}
              style={{ marginTop: 10 }}
              accessibilityLabel="Continue to photo upload"
            />
          )}

          <Pressable onPress={() => router.replace('/login')} accessibilityRole="link" accessibilityLabel="Go to login">
            <Text style={styles.link}>Login here →</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, padding: 20 },
  back: { marginBottom: 10 },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 40 },
  card: { backgroundColor: COLORS.card, padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#E5E5E5' },
  label: { color: COLORS.textPrimary, marginBottom: 6, fontWeight: '500' },
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 12, marginBottom: 8 },
  error: { color: COLORS.red, marginBottom: 8, fontSize: 13 },
  link: { textAlign: 'center', marginTop: 15, color: COLORS.textPrimary, textDecorationLine: 'underline' },
});
