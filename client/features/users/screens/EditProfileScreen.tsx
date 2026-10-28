import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, Image, ScrollView, Pressable, ActivityIndicator, Text, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/theme';
import Feather from '@expo/vector-icons/Feather';
import PeerlyButton from '@/shared/components/ui/PeerlyButton';
import { router } from 'expo-router';

import { getLoggedInUserId, logout } from '@/shared/store/auth';
import { updateUser, useUsers, deleteUser } from '@/features/users/store/usersStore';
import { type EducationLevel, type User } from '@/features/users/data/types';
import { fetchUserById, putUserProfile, deleteUserAccount, patchUserPause } from '@/features/users/api/homeUsers';
import { consumeEditProfilePrefill } from '../store/editProfilePrefill';

import ProfileEditForm from '../components/ProfileEditForm';
import PhotoActionSheet from '../components/PhotoActionSheet';
import EducationLevelModal from '../components/EducationLevelModal';
import AddTagModal from '../components/AddTagModal';

const FALLBACK_AVATAR = 'https://via.placeholder.com/120/cccccc/666666?text=%3F';

const EDUCATION_LEVELS: EducationLevel[] = ['MBO', 'HBO', 'WO', 'Master HBO', 'Master WO'];

type LoadedFormProps = {
  initialUser: User;
};

function EditProfileLoaded({ initialUser }: LoadedFormProps) {
  const users = useUsers();
  const [name, setName] = useState(initialUser.name);
  const [major, setMajor] = useState(initialUser.major);
  const [about, setAbout] = useState(initialUser.description ?? '');
  const [educationLevel, setEducationLevel] = useState<EducationLevel>(initialUser.education_level);

  const [strengths, setStrengths] = useState<string[]>(initialUser.strengths);
  const [needs, setNeeds] = useState<string[]>(initialUser.needs_help_with);
  const [photoUri, setPhotoUri] = useState(initialUser.profile_image_url ?? '');
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);
  const [eduOpen, setEduOpen] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);
  const [tagTitle, setTagTitle] = useState('Enter a strength');
  const [tagValue, setTagValue] = useState('');
  const [tagError, setTagError] = useState('');
  const [tagTarget, setTagTarget] = useState<'strengths' | 'needs'>('strengths');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(Boolean(initialUser.isPaused));
  const [pauseToggling, setPauseToggling] = useState(false);
  const [pauseError, setPauseError] = useState<string | null>(null);

  const formDisabled = isPaused;

  const openTag = (target: 'strengths' | 'needs') => {
    setTagTarget(target);
    setTagTitle(target === 'strengths' ? 'Enter a strength' : 'Enter a weakness');
    setTagValue('');
    setTagError('');
    setTagOpen(true);
  };

  const addTag = () => {
    const trimmed = tagValue.trim();

    if (!trimmed) return setTagError('Value is required.');
    if (!/^[a-zA-Z0-9 ]+$/.test(trimmed)) return setTagError('Only letters and spaces allowed.');

    if (tagTarget === 'strengths') setStrengths((prev) => [...prev, trimmed]);
    else setNeeds((prev) => [...prev, trimmed]);

    setTagOpen(false);
  };

  const handleSave = async () => {
    setSaveError(null);
    setSaving(true);
    const trimmedAbout = about.trim();
    const rawPhoto = photoUri.trim();
    const profile_image_url =
      rawPhoto && /^https?:\/\//i.test(rawPhoto) && rawPhoto !== FALLBACK_AVATAR ? rawPhoto : undefined;

    const payload = {
      name,
      major,
      ...(trimmedAbout ? { description: trimmedAbout } : {}),
      education_level: educationLevel,
      strengths,
      needs_help_with: needs,
      ...(profile_image_url ? { profile_image_url } : {}),
    };
    try {
      await putUserProfile(initialUser.id, payload);
      if (users.some((u) => u.id === initialUser.id)) {
        await updateUser(initialUser.id, payload);
      }
      router.back();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePauseToggle = async () => {
    setPauseError(null);
    setPauseToggling(true);
    try {
      const u = await patchUserPause(initialUser.id, !isPaused);
      const next = Boolean(u.isPaused);
      setIsPaused(next);
      if (users.some((x) => x.id === initialUser.id)) {
        await updateUser(initialUser.id, { isPaused: next });
      }
    } catch (e) {
      setPauseError(e instanceof Error ? e.message : 'Could not update pause status');
    } finally {
      setPauseToggling(false);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    setDeleteError(null);
    setDeleting(true);
    try {
      await deleteUserAccount(initialUser.id);
      if (users.some((u) => u.id === initialUser.id)) {
        await deleteUser(initialUser.id);
      }
      await logout();
      setDeleteConfirmOpen(false);
      router.replace('/(tabs)/home');
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Could not delete account');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 228 }}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: photoUri.trim() || FALLBACK_AVATAR }} style={styles.image} />

            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Feather name="arrow-left" size={22} />
            </Pressable>

            <Pressable style={styles.photoEdit} onPress={() => setPhotoSheetOpen(true)} disabled={formDisabled}>
              <Feather name="edit-2" size={16} color="#fff" />
            </Pressable>
          </View>

          {isPaused ? (
            <Text style={styles.pausedBanner}>
              Your account is paused. You will not appear on the home screen until you resume.
            </Text>
          ) : null}
          {saveError ? <Text style={styles.saveError}>{saveError}</Text> : null}
          {pauseError ? <Text style={styles.saveError}>{pauseError}</Text> : null}

          <ProfileEditForm
            name={name}
            setName={setName}
            major={major}
            setMajor={setMajor}
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
            disabled={formDisabled}
          />
        </ScrollView>

        <View style={styles.bottom}>
          <View style={styles.row}>
            <PeerlyButton
              title={saving ? 'Saving…' : 'Save'}
              backgroundColor={COLORS.buttonGreen}
              textColor="#fff"
              style={{ flex: 1 }}
              onPress={handleSave}
              disabled={formDisabled || saving}
              accessibilityLabel="Save profile changes"
            />

            <PeerlyButton
              title="Cancel"
              backgroundColor={COLORS.red}
              textColor="#fff"
              style={{ flex: 1, marginLeft: 6 }}
              onPress={() => router.back()}
              disabled={formDisabled}
              accessibilityLabel="Cancel edit"
            />
          </View>

          <PeerlyButton
            title={pauseToggling ? 'Updating…' : isPaused ? 'Resume account' : 'Pause account'}
            backgroundColor="transparent"
            textColor={COLORS.textPrimary}
            borderColor={COLORS.textMuted}
            style={styles.pauseAccountButton}
            disabled={pauseToggling}
            onPress={() => void handlePauseToggle()}
            accessibilityLabel="Pause my account"
          />

          <PeerlyButton
            title="Delete account"
            backgroundColor="transparent"
            textColor={COLORS.red}
            borderColor={COLORS.red}
            style={styles.deleteAccountButton}
            disabled={formDisabled}
            onPress={() => {
              setDeleteError(null);
              setDeleteConfirmOpen(true);
            }}
            accessibilityLabel="Delete my account"
          />
        </View>

        <PhotoActionSheet
          visible={photoSheetOpen}
          onClose={() => setPhotoSheetOpen(false)}
          onPick={(uri) => setPhotoUri(uri)}
        />

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

        <Modal
          visible={deleteConfirmOpen}
          transparent
          animationType="fade"
          onRequestClose={() => {
            if (!deleting) setDeleteConfirmOpen(false);
          }}
        >
          <View style={styles.deleteDialogBackdrop}>
            <View style={styles.deleteDialogSheet}>
              <Text style={styles.deleteDialogTitle}>Delete account?</Text>
              <Text style={styles.deleteDialogMessage}>
                Are you sure you want to delete your account? This action cannot be undone.
              </Text>
              {deleteError ? <Text style={styles.deleteDialogError}>{deleteError}</Text> : null}
              <View style={styles.deleteDialogFooter}>
                <PeerlyButton
                  title="Cancel"
                  backgroundColor="transparent"
                  textColor={COLORS.textPrimary}
                  borderColor={COLORS.textMuted}
                  style={styles.deleteDialogFooterButton}
                  disabled={deleting}
                  onPress={() => setDeleteConfirmOpen(false)}
                  accessibilityLabel="Cancel account deletion"
                />
                <PeerlyButton
                  title={deleting ? 'Deleting…' : 'Delete account'}
                  backgroundColor={COLORS.red}
                  textColor="#fff"
                  style={styles.deleteDialogFooterButton}
                  disabled={deleting || formDisabled}
                  onPress={() => void handleConfirmDeleteAccount()}
                  accessibilityLabel="Delete account permanently"
                />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

export default function EditProfileScreen() {
  const userId = getLoggedInUserId();
  const prefillFromProfile = useMemo(() => consumeEditProfilePrefill(), []);
  const initialUser = prefillFromProfile && userId && prefillFromProfile.id === userId ? prefillFromProfile : null;

  const [user, setUser] = useState<User | null>(initialUser);
  const [loading, setLoading] = useState(!initialUser && !!userId);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setError(null);
    try {
      const u = await fetchUserById(userId);
      setUser(u);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load profile');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    if (initialUser) {
      return;
    }
    setLoading(true);
    load();
  }, [userId, initialUser, load]);

  if (!userId) {
    return null;
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.textMuted} />
      </SafeAreaView>
    );
  }

  if (error && !user) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered]}>
        <Text style={styles.loadError}>{error}</Text>
        <PeerlyButton
          title="Go back to Homescreen"
          backgroundColor={COLORS.buttonGreen}
          textColor="#fff"
          onPress={() => {
            router.push('/(tabs)/home');
          }}
          style={{ marginTop: 16, width: 160 }}
          accessibilityLabel="Go back to home screen"
        />
        <PeerlyButton
          title="Go back"
          backgroundColor={COLORS.textMuted}
          textColor="#fff"
          onPress={() => router.back()}
          style={{ marginTop: 12, width: 160 }}
          accessibilityLabel="Go back"
        />
      </SafeAreaView>
    );
  }

  if (!user) {
    return null;
  }

  return <EditProfileLoaded key={user.id} initialUser={user} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadError: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: 15,
  },
  saveError: {
    color: COLORS.red,
    marginHorizontal: 16,
    marginBottom: 8,
    fontSize: 14,
  },
  pausedBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.textMuted,
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  imageContainer: { height: 220 },
  image: { width: '100%', height: '100%' },
  backButton: { position: 'absolute', top: 16, left: 16 },
  photoEdit: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    paddingBottom: 20,
    backgroundColor: COLORS.background,
  },
  row: { flexDirection: 'row' },
  pauseAccountButton: {
    marginTop: 10,
  },
  deleteAccountButton: {
    marginTop: 10,
  },
  deleteDialogBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 18,
  },
  deleteDialogSheet: {
    backgroundColor: COLORS.background,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  deleteDialogTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  deleteDialogMessage: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textSecondary,
  },
  deleteDialogError: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.red,
  },
  deleteDialogFooter: {
    marginTop: 18,
    flexDirection: 'row',
  },
  deleteDialogFooterButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});
