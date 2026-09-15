import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AppButton from '../../components/ui/AppButton';
import AppCard from '../../components/ui/AppCard';
import AppHeader from '../../components/ui/AppHeader';
import ApprovalStatusBadge from '../../components/ApprovalStatusBadge';
import { colors, typography } from '../../theme';
import * as service from '../../services/adminManagementService';

function Frame({ navigation, title, children }) {
  return (
    <SafeAreaView style={s.root}>
      <AppHeader title={title} navigation={navigation} showBack fallbackTab="Profile" />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.body}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
// Each focus verifies access before rendering data. Blur invalidates pending results.
function useResource(loader) {
  const version = useRef(0);
  const [state, setState] = useState({ loading: true });
  const refresh = useCallback(async () => {
    const ticket = ++version.current;
    setState({ loading: true });
    try {
      const data = await loader();
      if (ticket === version.current) setState({ data });
    } catch (error) {
      if (ticket === version.current) setState({ error: error.message });
    }
  }, [loader]);
  useFocusEffect(
    useCallback(() => {
      refresh();
      return () => {
        version.current++;
        setState({ loading: true });
      };
    }, [refresh])
  );
  return { ...state, refresh };
}
function Feedback({ state }) {
  if (state.loading) return <ActivityIndicator color={colors.gold} />;
  if (state.error)
    return (
      <>
        <Text style={s.error}>{state.error}</Text>
        <AppButton title="Retry" onPress={state.refresh} />
      </>
    );
  return null;
}
function Person({ person, onPress, actionLabel = 'View details' }) {
  return (
    <AppCard>
      <Text style={typography.h3}>{person.full_name || 'Unnamed account'}</Text>
      <Text style={typography.small}>{person.email || 'No email'}</Text>
      <Text style={typography.small}>{person.role}</Text>
      {person.assigned_user_count != null && (
        <Text style={typography.small}>
          Assigned users: {person.assigned_user_count} | Pending cards: {person.pending_count}
        </Text>
      )}
      <AppButton title={actionLabel} variant="outline" onPress={onPress} />
    </AppCard>
  );
}
function PagedPeople({ loader, onSelect, label = 'Search name or email', actionLabel }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const resource = useResource(useCallback(() => loader({ page, search }), [loader, page, search]));
  return (
    <>
      <TextInput
        accessibilityLabel={label}
        placeholder={label}
        style={s.input}
        value={search}
        onChangeText={(value) => {
          setSearch(value);
          setPage(0);
        }}
        maxLength={200}
        autoCapitalize="none"
      />
      <Feedback state={resource} />
      {resource.data && (
        <>
          {resource.data.data.map((person) => (
            <Person
              key={person.id}
              person={person}
              actionLabel={actionLabel}
              onPress={() => onSelect(person)}
            />
          ))}
          {!resource.data.data.length && <Text>No accounts found.</Text>}
          <Text style={typography.small}>Page {page + 1}</Text>
          <AppButton
            title="Previous"
            disabled={page === 0}
            variant="outline"
            onPress={() => setPage(page - 1)}
          />
          <AppButton
            title="Next"
            disabled={!resource.data.hasMore}
            onPress={() => setPage(page + 1)}
          />
        </>
      )}
    </>
  );
}
function AdminPicker({ onSelect }) {
  return (
    <>
      <Text style={typography.h3}>Choose an admin</Text>
      <PagedPeople loader={service.getAdminsPage} onSelect={onSelect} actionLabel="Select admin" />
    </>
  );
}
export function SuperAdminDashboard({ navigation }) {
  const resource = useResource(service.getManagementSummary);
  return (
    <Frame navigation={navigation} title="Super Admin">
      <Feedback state={resource} />
      {resource.data && (
        <>
          {[
            ['total_admins', 'Total Admins'],
            ['total_users', 'Total Users'],
            ['pending', 'Pending Card Approvals'],
            ['approved', 'Approved Cards'],
            ['rejected', 'Rejected Cards'],
          ].map(([key, label]) => (
            <AppCard key={key}>
              <Text style={typography.small}>{label}</Text>
              <Text style={typography.h1}>{resource.data[key] ?? 0}</Text>
            </AppCard>
          ))}
          {[
            ['AdminManagement', 'Admins'],
            ['UserManagement', 'Users'],
            ['AdminApprovals', 'Card Approvals'],
          ].map(([route, title]) => (
            <AppButton
              key={route}
              title={title}
              variant="gold"
              onPress={() => navigation.navigate(route)}
            />
          ))}
        </>
      )}
    </Frame>
  );
}
export function AdminManagementScreen({ navigation }) {
  const gate = useResource(useCallback(() => service.requireManagementAccess(true), []));
  return (
    <Frame navigation={navigation} title="Admins">
      <Feedback state={gate} />
      {gate.data && (
        <>
          <AppButton
            title="Promote User to Admin"
            variant="gold"
            onPress={() => navigation.navigate('UserManagement', { role: 'user' })}
          />
          <PagedPeople
            loader={service.getAdminsPage}
            onSelect={(person) => navigation.navigate('AdminDetail', { id: person.id })}
          />
        </>
      )}
    </Frame>
  );
}
export function UserManagementScreen({ navigation, route }) {
  const gate = useResource(useCallback(() => service.requireManagementAccess(), []));
  const [role, setRole] = useState(route.params?.role || '');
  const [admin, setAdmin] = useState(null);
  const [unassigned, setUnassigned] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const loader = useCallback(
    (options) => service.getUsersPage({ ...options, role, adminId: admin?.id, unassigned }),
    [role, admin, unassigned]
  );
  return (
    <Frame navigation={navigation} title="Users">
      <Feedback state={gate} />
      {gate.data && (
        <>
          {gate.data.role === 'super_admin' && (
            <>
              <View style={s.filters}>
                {['', 'user', 'admin', 'super_admin'].map((value) => (
                  <AppButton
                    key={value}
                    fullWidth={false}
                    size="small"
                    variant={role === value ? 'gold' : 'outline'}
                    title={value || 'All roles'}
                    onPress={() => setRole(value)}
                  />
                ))}
              </View>
              <AppButton
                title={
                  admin
                    ? `Admin: ${admin.full_name || admin.email}`
                    : unassigned
                      ? 'Unassigned users'
                      : 'All assignments'
                }
                variant="outline"
                onPress={() => setChoosing(!choosing)}
              />
              {choosing && (
                <>
                  <AppButton
                    title="All assignments"
                    onPress={() => {
                      setAdmin(null);
                      setUnassigned(false);
                      setChoosing(false);
                    }}
                  />
                  <AppButton
                    title="Unassigned users"
                    onPress={() => {
                      setAdmin(null);
                      setUnassigned(true);
                      setChoosing(false);
                    }}
                  />
                  <AdminPicker
                    onSelect={(person) => {
                      setAdmin(person);
                      setUnassigned(false);
                      setChoosing(false);
                    }}
                  />
                </>
              )}
            </>
          )}
          <PagedPeople
            key={`${role}:${admin?.id}:${unassigned}`}
            loader={loader}
            onSelect={(person) => navigation.navigate('UserDetail', { id: person.id })}
          />
        </>
      )}
    </Frame>
  );
}
function Account({ detail }) {
  return (
    <AppCard>
      <Text style={typography.h2}>{detail.full_name || 'Unnamed account'}</Text>
      <Text style={typography.body}>{detail.email || 'No email'}</Text>
      <Text style={typography.body}>Role: {detail.role}</Text>
      <Text style={typography.small}>
        Created: {detail.created_at ? new Date(detail.created_at).toLocaleString() : 'Unavailable'}
      </Text>
      <Text style={typography.small}>
        Assigned admin: {detail.admin_name || detail.admin_email || 'None'}
      </Text>
      <Text style={typography.small}>Card count: {detail.card_count ?? 0}</Text>
    </AppCard>
  );
}
export function UserDetailScreen({ navigation, route }) {
  const id = route.params?.id;
  const resource = useResource(
    useCallback(
      async () => ({
        profile: await service.requireManagementAccess(),
        detail: await service.getUserDetail(id),
      }),
      [id]
    )
  );
  const [choosing, setChoosing] = useState(false);
  const [busy, setBusy] = useState(false);
  const acting = useRef(false);
  const [cardPage, setCardPage] = useState(0);
  const cards = useResource(
    useCallback(() => service.getUserCardsPage(id, { page: cardPage }), [id, cardPage])
  );
  async function act(action) {
    if (acting.current) return;
    acting.current = true;
    setBusy(true);
    try {
      await action();
      setChoosing(false);
      await resource.refresh();
    } catch (error) {
      Alert.alert('Unable to update account', error.message);
    } finally {
      acting.current = false;
      setBusy(false);
    }
  }
  function confirm(title, action) {
    Alert.alert(title, 'Confirm this account change?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => act(action) },
    ]);
  }
  const detail = resource.data?.detail;
  return (
    <Frame navigation={navigation} title="User Detail">
      <Feedback state={resource} />
      {detail && (
        <>
          <Account detail={detail} />
          {resource.data.profile.role === 'super_admin' && detail.role !== 'super_admin' && (
            <>
              <AppButton
                disabled={busy}
                title={detail.role === 'admin' ? 'Demote Admin to User' : 'Promote User to Admin'}
                variant="gold"
                onPress={() =>
                  confirm('Change role', () =>
                    service.setUserRole(id, detail.role === 'admin' ? 'user' : 'admin')
                  )
                }
              />
              {detail.role === 'user' && (
                <>
                  <AppButton
                    disabled={busy}
                    title="Assign / Reassign Admin"
                    onPress={() => setChoosing(!choosing)}
                  />
                  <AppButton
                    disabled={busy || !detail.admin_id}
                    title="Unassign Admin"
                    variant="outline"
                    onPress={() =>
                      confirm('Unassign admin', () => service.assignUserToAdmin(id, null))
                    }
                  />
                  {choosing && !busy && (
                    <AdminPicker
                      onSelect={(person) =>
                        confirm(`Assign to ${person.full_name || person.email}`, () =>
                          service.assignUserToAdmin(id, person.id)
                        )
                      }
                    />
                  )}
                </>
              )}
            </>
          )}
          <Text style={typography.h3}>User Cards</Text>
          <Feedback state={cards} />
          {cards.data && (
            <>
              {cards.data.data.map((card) => (
                <AppCard key={card.id}>
                  <Text style={typography.h3}>{card.name || 'Digital Card'}</Text>
                  <Text style={typography.small}>{card.company || ''}</Text>
                  <ApprovalStatusBadge status={card.approval_status} />
                </AppCard>
              ))}
              {!cards.data.data.length && <Text>No cards found.</Text>}
              <AppButton
                title="Previous cards"
                variant="outline"
                disabled={!cardPage}
                onPress={() => setCardPage(cardPage - 1)}
              />
              <AppButton
                title="Next cards"
                disabled={!cards.data.hasMore}
                onPress={() => setCardPage(cardPage + 1)}
              />
            </>
          )}
        </>
      )}
    </Frame>
  );
}
export function AdminDetailScreen({ navigation, route }) {
  const id = route.params?.id;
  const resource = useResource(useCallback(() => service.getAdminDetail(id), [id]));
  const loader = useCallback((options) => service.getAdminUsers(id, options), [id]);
  return (
    <Frame navigation={navigation} title="Admin Detail">
      <Feedback state={resource} />
      {resource.data && (
        <>
          <Account detail={resource.data} />
          <AppCard>
            <Text>Assigned users: {resource.data.assigned_user_count}</Text>
            <Text>Pending approval workload: {resource.data.pending_count}</Text>
          </AppCard>
          <AppButton
            title="Manage role"
            variant="gold"
            onPress={() => navigation.navigate('UserDetail', { id })}
          />
          <Text style={typography.h3}>Assigned users</Text>
          <PagedPeople
            loader={loader}
            onSelect={(person) => navigation.navigate('UserDetail', { id: person.id })}
          />
        </>
      )}
    </Frame>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 16 },
  body: { gap: 12, paddingBottom: 32 },
  input: {
    backgroundColor: colors.white,
    color: colors.text,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  error: { color: colors.danger },
});
