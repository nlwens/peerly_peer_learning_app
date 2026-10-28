import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/theme';
import PeerlyButton from '@/shared/components/ui/PeerlyButton';
import { router } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { loginWithSession } from '@/shared/store/auth';
import { postLogin } from '@/features/auth/api/loginApi';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      const { accessToken, userId } = await postLogin(email, password);
      await loginWithSession(accessToken, userId);
      router.replace('/(tabs)/home');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/home');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <Pressable onPress={handleBack} style={styles.back} accessibilityRole="button" accessibilityLabel="Go back">
          <Feather name="arrow-left" size={22} color={COLORS.textPrimary} />
        </Pressable>

        <Text style={styles.title}>Login</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Enter Email"
            style={styles.input}
            autoCapitalize="none"
            accessibilityLabel="Email address"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Enter Password"
            secureTextEntry
            style={styles.input}
            accessibilityLabel="Password"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {submitting ? (
            <ActivityIndicator color={COLORS.textPrimary} style={{ marginVertical: 12 }} />
          ) : (
            <PeerlyButton
              title="Sign In"
              backgroundColor={COLORS.buttonGreen}
              textColor={COLORS.textOnDark}
              onPress={handleLogin}
              accessibilityLabel="Sign in"
            />
          )}

          <Pressable
            onPress={() => router.push('/register/credentials')}
            accessibilityRole="link"
            accessibilityLabel="Register new account"
          >
            <Text style={styles.link}>Register New Account →</Text>
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
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 12, marginBottom: 15 },
  error: { color: COLORS.red, marginBottom: 15 },
  link: { textAlign: 'center', marginTop: 15, color: COLORS.textPrimary, textDecorationLine: 'underline' },
});
