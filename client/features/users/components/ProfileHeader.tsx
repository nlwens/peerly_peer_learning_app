import { View, Text, StyleSheet, Image } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { User } from '@/features/users/data/types';
import BackButton from '@/shared/components/ui/BackButton';
import { router } from 'expo-router';

type BackToType = Parameters<typeof router.replace>[0];

type Props = {
  user: User;
  showBack?: boolean;
  backTo?: BackToType;
};

export default function ProfileHeader({ user, showBack = true, backTo }: Props) {
  const average = Math.max(0, Math.min(5, Math.round(user.rating_average ?? 0)));
  const ratingCount = Math.max(0, user.rating_count ?? 0);

  return (
    <View style={styles.container}>
      <Image source={{ uri: user.profile_image_url }} style={styles.image} />

      <View style={styles.bottomScrim} />

      {showBack && <BackButton to={backTo} />}

      <View style={styles.nameContainer}>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.meta}>
          {user.education_level} - {user.major}
        </Text>

        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map((value) => (
            <MaterialIcons
              key={value}
              name={value <= average ? 'star' : 'star-border'}
              size={16}
              color={value <= average ? '#F5C518' : 'rgba(255,255,255,0.85)'}
            />
          ))}
          <Text style={styles.ratingText}>({ratingCount})</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 260, position: 'relative' },
  image: { width: '100%', height: '100%' },

  bottomScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 95,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  nameContainer: { position: 'absolute', bottom: 20, left: 20 },
  name: { color: '#fff', fontSize: 28, fontWeight: '700' },
  meta: { color: '#fff', fontSize: 14 },
  ratingRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    marginLeft: 6,
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
