import { View, StyleSheet } from 'react-native';
import Tag from './Tag';

type Props = { items: string[] };

export default function TagList({ items }: Props) {
  return (
    <View style={styles.container}>
      {items.map((item, index) => (
        <Tag key={index} label={item} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
