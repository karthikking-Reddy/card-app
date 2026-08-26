import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  colors,
  radius,
  typography,
} from '../../theme';


export default function AppHeader({
  title,
  subtitle,

  navigation,

  showBack = false,

  rightIcon,

  onRightPress,
}) {
  return (
    <View
      style={
        styles.header
      }
    >
      {showBack ? (
        <TouchableOpacity
          style={
            styles.iconButton
          }
          onPress={() =>
            navigation?.goBack()
          }
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={
              colors.text
            }
          />
        </TouchableOpacity>
      ) : null}


      <View
        style={
          styles.titleContainer
        }
      >
        <Text
          style={
            typography.h1
          }
        >
          {title}
        </Text>

        {subtitle ? (
          <Text
            style={
              styles.subtitle
            }
          >
            {subtitle}
          </Text>
        ) : null}
      </View>


      {rightIcon ? (
        <TouchableOpacity
          style={
            styles.iconButton
          }
          onPress={
            onRightPress
          }
        >
          <Ionicons
            name={
              rightIcon
            }
            size={21}
            color={
              colors.text
            }
          />
        </TouchableOpacity>
      ) : (
        showBack ? (
          <View
            style={{
              width: 44,
            }}
          />
        ) : null
      )}
    </View>
  );
}


const styles =
  StyleSheet.create({
    header: {
      minHeight: 66,

      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 12,
    },

    titleContainer: {
      flex: 1,
    },

    subtitle: {
      ...typography.small,

      marginTop: 2,
    },

    iconButton: {
      width: 44,
      height: 44,

      backgroundColor:
        colors.surface,

      borderWidth: 1,

      borderColor:
        colors.border,

      borderRadius:
        radius.md,

      alignItems:
        'center',

      justifyContent:
        'center',
    },
  });
