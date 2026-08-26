import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import AuthScreen
  from '../screens/AuthScreen';

import TabNavigator
  from './TabNavigator';

import CardScreen
  from '../screens/Card/CardScreen';

import SocialLinksScreen
  from '../screens/SocialLinks/SocialLinksScreen';

import ServicesScreen
  from '../screens/Services/ServicesScreen';

import PortfolioScreen
  from '../screens/Portfolio/PortfolioScreen';

import LeadDetailScreen
  from '../screens/Connections/LeadDetailScreen';

import MyCardsScreen
  from '../screens/Cards/MyCardsScreen';

import CardSettingsScreen
  from '../screens/Settings/CardSettingsScreen';

import NotificationsScreen
  from '../screens/Notifications/NotificationsScreen';

import BlockBuilderScreen
  from '../screens/Blocks/BlockBuilderScreen';

import LeadStagesScreen
  from '../screens/CRM/LeadStagesScreen';

import FollowUpsScreen
  from '../screens/FollowUps/FollowUpsScreen';

import CRMExportScreen
  from '../screens/CRMExport/CRMExportScreen';

import WhatsAppInboxScreen
  from '../screens/WhatsApp/WhatsAppInboxScreen';

import WhatsAppChatScreen
  from '../screens/WhatsApp/WhatsAppChatScreen';

import WhatsAppTemplatesScreen
  from '../screens/WhatsApp/WhatsAppTemplatesScreen';


const Stack =
  createNativeStackNavigator();


export default function RootNavigator({
  session,
}) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {!session ? (
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
        />
      ) : (
        <>
          {/* =========================
              MAIN APPLICATION
          ========================== */}

          <Stack.Screen
            name="MainTabs"
            component={TabNavigator}
          />


          {/* =========================
              DIGITAL CARD
          ========================== */}

          <Stack.Screen
            name="CardEditor"
            component={CardScreen}
          />

          {/*
            Compatibility route used
            by the new premium UI.

            Home/Profile currently
            navigate to "Card".
          */}
          <Stack.Screen
            name="Card"
            component={CardScreen}
          />

          <Stack.Screen
            name="MyCards"
            component={MyCardsScreen}
          />

          <Stack.Screen
            name="CardSettings"
            component={CardSettingsScreen}
          />

          <Stack.Screen
            name="SocialLinks"
            component={SocialLinksScreen}
          />

          <Stack.Screen
            name="BlockBuilder"
            component={BlockBuilderScreen}
          />

          <Stack.Screen
            name="Services"
            component={ServicesScreen}
          />

          <Stack.Screen
            name="Portfolio"
            component={PortfolioScreen}
          />


          {/* =========================
              CRM
          ========================== */}

          <Stack.Screen
            name="LeadDetail"
            component={LeadDetailScreen}
          />

          <Stack.Screen
            name="LeadStages"
            component={LeadStagesScreen}
          />

          <Stack.Screen
            name="FollowUps"
            component={FollowUpsScreen}
          />

          <Stack.Screen
            name="CRMExport"
            component={CRMExportScreen}
          />


          {/* =========================
              ACTIVITY
          ========================== */}

          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
          />


          {/* =========================
              WHATSAPP
          ========================== */}

          <Stack.Screen
            name="WhatsAppInbox"
            component={WhatsAppInboxScreen}
          />

          <Stack.Screen
            name="WhatsAppChat"
            component={WhatsAppChatScreen}
          />

          <Stack.Screen
            name="WhatsAppTemplates"
            component={WhatsAppTemplatesScreen}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
