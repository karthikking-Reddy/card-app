import {
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/Home/HomeScreen';
import ConnectionsScreen from '../screens/Connections/ConnectionsScreen';
import InsightsScreen from '../screens/Insights/InsightsScreen';
import MetaScreen from '../screens/Meta/MetaScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';

const Tab =
  createBottomTabNavigator();

const icons = {
  Home: 'home-outline',
  Connections:
    'people-outline',
  Insights:
    'analytics-outline',
  Meta: 'sparkles-outline',
  Profile:
    'person-outline',
};

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({
        route,
      }) => ({
        headerShown: false,

        tabBarActiveTintColor:
          '#FFFFFF',

        tabBarInactiveTintColor:
          '#6B7280',

        tabBarStyle: {
          backgroundColor:
            '#111827',
          borderTopColor:
            '#273044',
          height: 65,
          paddingBottom: 8,
          paddingTop: 6,
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },

        tabBarIcon: ({
          color,
          size,
        }) => (
          <Ionicons
            name={
              icons[
                route.name
              ]
            }
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
      />

      <Tab.Screen
        name="Connections"
        component={
          ConnectionsScreen
        }
      />

      <Tab.Screen
        name="Insights"
        component={
          InsightsScreen
        }
      />

      <Tab.Screen
        name="Meta"
        component={
          MetaScreen
        }
      />

      <Tab.Screen
        name="Profile"
        component={
          ProfileScreen
        }
      />
    </Tab.Navigator>
  );
}
