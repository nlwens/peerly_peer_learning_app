import { View, StyleSheet, Text, Image } from 'react-native';
import { COLORS } from '../../../constants/theme';

export default function Header() {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Image
          source={require('../../../assets/icons/peerly-logo.png')}
          style={styles.logo}
          resizeMode="contain"
          accessible={false}
        />
        <Text style={styles.title}>Peerly</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: COLORS.background,
  },
  logo: {
    width: 48,
    height: 48,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Nunito_800ExtraBold',
    color: COLORS.textPrimary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
