import { Modal, Pressable, View, Text, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '@/constants/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onPick: (uri: string) => void;
};

export default function PhotoActionSheet({ visible, onClose, onPick }: Props) {
  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });

    if (!result.canceled) {
      onPick(result.assets[0].uri);
    }

    onClose();
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
    });

    if (!result.canceled) {
      onPick(result.assets[0].uri);
    }

    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.backdrop} onPress={onClose} accessible={false}>
        <Pressable style={styles.sheet} accessible={false}>
          <Pressable
            style={styles.row}
            onPress={pickFromGallery}
            accessibilityRole="button"
            accessibilityLabel="Upload photo from gallery"
          >
            <Text>Upload from Gallery</Text>
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={styles.row}
            onPress={takePhoto}
            accessibilityRole="button"
            accessibilityLabel="Take photo with camera"
          >
            <Text>Camera</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: COLORS.card, paddingVertical: 8 },
  row: { padding: 16 },
  divider: { height: 1, backgroundColor: '#E5E5E5' },
});
