import { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { useRouter, useRootNavigationState } from 'expo-router';

import { COLORS } from '@/constants/theme';
import { type EducationLevel } from '@/features/users/data/types';
import { addUser, findUser } from '@/features/users/store/usersStore';
import { fetchUserById } from '@/features/users/api/homeUsers';

import ProfileEditForm from '@/features/users/components/ProfileEditForm';
import PeerlyButton from '@/shared/components/ui/PeerlyButton';
import EducationLevelModal from '@/features/users/components/EducationLevelModal';
import AddTagModal from '@/features/users/components/AddTagModal';
import RegisterConsentModal from '@/features/auth/components/RegisterConsentModal';

import { getRegisterCredentials, getRegisterProfileImage } from '@/features/auth/store/registerStore';

import { loginWithSession } from '@/shared/store/auth';
import { postRegister } from '@/features/auth/api/registerApi';

const EDUCATION_LEVELS: EducationLevel[] = ['MBO', 'HBO', 'WO', 'Master HBO', 'Master WO'];

export default function RegisterProfileScreen() {
  const router = useRouter();
  const navState = useRootNavigationState();

  const safeReplace = (href: string) => {
    if (!navState?.key) return;
    router.replace(href as any);
  };

  const creds = getRegisterCredentials();

  const [name, setName] = useState('');
  const [major, setMajor] = useState('');
  const [about, setAbout] = useState('');
  const [educationLevel, setEducationLevel] = useState<EducationLevel>('HBO');

  const [strengths, setStrengths] = useState<string[]>([]);
  const [needs, setNeeds] = useState<string[]>([]);

  const [eduOpen, setEduOpen] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);
  const [tagTitle, setTagTitle] = useState('Enter a strength');
  const [tagValue, setTagValue] = useState('');
  const [tagError, setTagError] = useState('');
  const [tagTarget, setTagTarget] = useState<'strengths' | 'needs'>('strengths');

  const [consentOpen, setConsentOpen] = useState(false);
  const [acceptedDataUse, setAcceptedDataUse] = useState(false);
  const [acceptedVisibility, setAcceptedVisibility] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const openTag = (target: 'strengths' | 'needs') => {
    setTagTarget(target);
    setTagTitle(target === 'strengths' ? 'Enter a strength' : 'Enter a weakness');
    setTagValue('');
    setTagError('');
    setTagOpen(true);
  };

  const addTag = () => {
    const trimmed = tagValue.trim();

    if (!trimmed) {
      setTagError('Value is required.');
      return;
    }

    if (!/^[a-zA-Z0-9 ]+$/.test(trimmed)) {
      setTagError('Only letters and spaces allowed.');
      return;
    }

    if (tagTarget === 'strengths') {
      setStrengths((prev) => [...prev, trimmed]);
    } else {
      setNeeds((prev) => [...prev, trimmed]);
    }

    setTagOpen(false);
  };

  const submitRegistration = async () => {
    if (!creds) {
      setError('Something went wrong. Please start registration again.');
      return;
    }

    const trimmedName = name.trim();
    const trimmedMajor = major.trim();

    if (!trimmedName || !trimmedMajor || !strengths.length || !needs.length) {
      setError('Please fill in all required fields marked with *.');
      return;
    }

    if (!/[aeiouAEIOU]/.test(trimmedName) || trimmedName.length < 2) {
      setError('Name must be at least 2 characters and contain a vowel.');
      return;
    }

    if (!acceptedDataUse || !acceptedVisibility) {
      setError('You must review and accept the privacy consent before creating an account.');
      return;
    }

    setError(null);

    const rawImage = getRegisterProfileImage();
    const profile_image_url = rawImage && /^https?:\/\//i.test(rawImage) ? rawImage : undefined;

    setSaving(true);
    try {
      const { accessToken, userId } = await postRegister({
        email: creds.email,
        password: creds.password,
        name: trimmedName,
        major: trimmedMajor,
        education_level: educationLevel,
        description: about.trim() || undefined,
        strengths,
        needs_help_with: needs,
        profile_image_url,
      });

      await loginWithSession(accessToken, userId);

      if (userId) {
        try {
          const u = await fetchUserById(userId);
          if (!findUser(userId)) {
            await addUser(u);
          }
        } catch {
          // synced on next app load / home fetch
        }
      }

      safeReplace('/home');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    if (!creds) {
      setError('Something went wrong. Please start registration again.');
      return;
    }

    const trimmedName = name.trim();
    const trimmedMajor = major.trim();

    if (!trimmedName || !trimmedMajor || !strengths.length || !needs.length) {
      setError('Please fill in all required fields marked with *.');
      return;
    }

    if (!/[aeiouAEIOU]/.test(trimmedName) || trimmedName.length < 2) {
      setError('Name must be at least 2 characters and contain a vowel.');
      return;
    }

    setError(null);
    setConsentOpen(true);
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/register/photo');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <Pressable onPress={handleBack} style={styles.back} accessibilityRole="button" accessibilityLabel="Go back">
          <Feather name="arrow-left" size={22} color={COLORS.textPrimary} />
        </Pressable>

        <Text style={styles.title}>Register</Text>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <ProfileEditForm
            name={name}
            setName={(v) => {
              setName(v);
              setError(null);
            }}
            major={major}
            setMajor={(v) => {
              setMajor(v);
              setError(null);
            }}
            about={about}
            setAbout={setAbout}
            educationLevel={educationLevel}
            onOpenEducation={() => setEduOpen(true)}
            strengths={strengths}
            needs={needs}
            onAddStrength={() => openTag('strengths')}
            onAddNeed={() => openTag('needs')}
            onRemoveStrength={(value) => setStrengths((prev) => prev.filter((x) => x !== value))}
            onRemoveNeed={(value) => setNeeds((prev) => prev.filter((x) => x !== value))}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </ScrollView>

        <View style={styles.bottom}>
          {saving ? (
            <ActivityIndicator color={COLORS.textPrimary} style={styles.loading} />
          ) : (
            <PeerlyButton
              title="Save"
              backgroundColor={COLORS.buttonGreen}
              textColor={COLORS.textOnDark}
              style={styles.saveButton}
              onPress={handleSave}
              accessibilityLabel="Create account and finish registration"
            />
          )}
        </View>

        <EducationLevelModal
          visible={eduOpen}
          levels={EDUCATION_LEVELS}
          onSelect={(lvl) => {
            setEducationLevel(lvl);
            setEduOpen(false);
          }}
          onClose={() => setEduOpen(false)}
        />

        <AddTagModal
          visible={tagOpen}
          title={tagTitle}
          value={tagValue}
          error={tagError}
          onChange={(v) => {
            setTagValue(v);
            setTagError('');
          }}
          onClose={() => setTagOpen(false)}
          onSubmit={addTag}
        />

        <RegisterConsentModal
          visible={consentOpen}
          acceptedDataUse={acceptedDataUse}
          acceptedVisibility={acceptedVisibility}
          onToggleDataUse={() => setAcceptedDataUse((prev) => !prev)}
          onToggleVisibility={() => setAcceptedVisibility((prev) => !prev)}
          onClose={() => setConsentOpen(false)}
          onConfirm={() => {
            setConsentOpen(false);
            void submitRegistration();
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  back: {
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 24,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  bottom: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 16,
    backgroundColor: COLORS.background,
  },
  saveButton: {
    width: '100%',
  },
  loading: {
    paddingVertical: 12,
  },
  errorText: {
    color: COLORS.red,
    fontSize: 13,
    paddingHorizontal: 20,
    marginTop: 8,
  },
});
