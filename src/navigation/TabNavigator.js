import { StyleSheet, View } from 'react-native';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/Home/HomeScreen';

import ConnectionsScreen from '../screens/Connections/ConnectionsScreen';

import InsightsScreen from '../screens/Insights/InsightsScreen';

import MetaScreen from '../screens/Meta/MetaScreen';

import ProfileScreen from '../screens/Profile/ProfileScreen';

const Tab = createBottomTabNavigator();

const COLORS = {
  navy: '#06162D',
  gold: '#F6B91A',
  inactive: '#8F9BAE',
  white: '#FFFFFF',
};

const ICONS = {
  Home: {
    active: 'home',

    inactive: 'home-outline',
  },

  Connections: {
    active: 'people',

    inactive: 'people-outline',
  },

  Insights: {
    active: 'bar-chart',

    inactive: 'bar-chart-outline',
  },

  Meta: {
    active: 'infinite',

    inactive: 'infinite-outline',
  },

  Profile: {
    active: 'person',

    inactive: 'person-outline',
  },
};

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarHideOnKeyboard: true,

        tabBarActiveTintColor: COLORS.gold,

        tabBarInactiveTintColor: COLORS.inactive,

        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '700',
          marginTop: 1,
          marginBottom: 2,
        },

        tabBarStyle: {
          height: 72,

          backgroundColor: COLORS.navy,

          borderTopWidth: 0,

          paddingTop: 8,

          paddingBottom: 7,

          elevation: 14,

          shadowColor: '#000000',

          shadowOpacity: 0.15,

          shadowRadius: 12,

          shadowOffset: {
            width: 0,
            height: -4,
          },
        },

        tabBarIcon: ({ focused, color }) => {
          const config = ICONS[route.name];

          const name = focused ? config.active : config.inactive;

          return (
            <View style={[styles.iconContainer, focused && styles.iconActive]}>
              <Ionicons name={name} size={22} color={color} />

              {focused ? <View style={styles.activeDot} /> : null}
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />

      <Tab.Screen name="Connections" component={ConnectionsScreen} />

      <Tab.Screen name="Insights" component={InsightsScreen} />

      <Tab.Screen name="Meta" component={MetaScreen} />

      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    minWidth: 34,

    height: 30,

    alignItems: 'center',

    justifyContent: 'center',
  },

  iconActive: {
    transform: [
      {
        translateY: -1,
      },
    ],
  },

  activeDot: {
    width: 4,
    height: 4,

    borderRadius: 2,

    backgroundColor: COLORS.gold,

    position: 'absolute',

    bottom: -4,
  },
});
