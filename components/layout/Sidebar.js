import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import {
  Gamepad2, Layers, Database,
  User, Shield, ChevronDown,
} from 'lucide-react-native';
import { Colors } from '../../theme/colors';

const ICON_MAP = {
  gamepad: Gamepad2,
  layers: Layers,
  database: Database,
  user: User,
  shield: Shield,
};

// roles: which roles can see this item ('admin','mod','user' = all roles see it)
const SECTIONS = [
  {
    title: 'Workspace',
    roles: ['admin', 'mod', 'user'],
    items: [
      { id: 'games', label: 'Games', icon: 'gamepad', screen: 'SelectGame', roles: ['admin', 'mod', 'user'] },
    ],
  },
  {
    title: 'Stream Tools',
    roles: ['admin', 'mod'],
    items: [
      { id: 'log', label: 'Selection Log', icon: 'layers', screen: 'SelectionLog', roles: ['admin', 'mod'] },
    ],
  },
  {
    title: 'Library',
    roles: ['admin', 'mod'],
    items: [
      { id: 'db', label: 'VTuber Database', icon: 'database', screen: 'VTuberDatabase', roles: ['admin', 'mod'] },
    ],
  },
  {
    title: 'System',
    roles: ['admin', 'mod', 'user'],
    items: [
      { id: 'profile', label: 'Profile', icon: 'user', screen: 'Profile', roles: ['admin', 'mod', 'user'] },
      { id: 'admin', label: 'Admin', icon: 'shield', screen: 'AdminUsers', roles: ['admin'] },
    ],
  },
];

const ROLE_LABEL = { admin: 'Admin', mod: 'Moderator', user: 'User' };
const ROLE_COLOR = { admin: '#F59E0B', mod: '#60A5FA', user: Colors.fg3 };

export default function Sidebar({ navigation, active = 'games', user, isAdmin, role = 'user' }) {
  const { width } = useWindowDimensions();
  if (width < 768) return null;

  const initial = (user?.displayName || user?.email || '?')[0]?.toUpperCase() ?? 'U';

  const visibleSections = SECTIONS
    .filter((s) => s.roles.includes(role))
    .map((s) => ({
      ...s,
      items: s.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((s) => s.items.length > 0);

  return (
    <View style={styles.sidebar}>
      <View style={styles.brand}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>T</Text>
        </View>
        <Text style={styles.brandName}>
          tubertools<Text style={styles.brandDim}>.app</Text>
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {visibleSections.map((section) => (
          <View key={section.title}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item) => {
              const IconComp = ICON_MAP[item.icon];
              const isActive = active === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.item, isActive && styles.itemActive]}
                  onPress={() => navigation?.navigate(item.screen)}
                  activeOpacity={0.7}
                >
                  {isActive && <View style={styles.activeBar} />}
                  {IconComp && (
                    <IconComp
                      size={16}
                      color={isActive ? Colors.fg0 : Colors.fg2}
                      strokeWidth={2}
                    />
                  )}
                  <Text style={[styles.itemLabel, isActive && styles.itemLabelActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <View style={styles.userRow}>
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>{initial}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.displayName || user?.email?.split('@')[0] || 'User'}</Text>
          <Text style={[styles.userRole, { color: ROLE_COLOR[role] ?? Colors.fg3 }]}>
            {ROLE_LABEL[role] ?? role}
          </Text>
        </View>
        <ChevronDown size={14} color={Colors.fg3} strokeWidth={2} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 232,
    backgroundColor: Colors.bg1,
    borderRightWidth: 1,
    borderRightColor: Colors.borderSubtle,
    paddingHorizontal: 10,
    paddingVertical: 14,
    flexShrink: 0,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    marginBottom: 8,
  },
  brandMark: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: { color: Colors.accentFg, fontWeight: '800', fontSize: 13 },
  brandName: { fontWeight: '700', fontSize: 14, color: Colors.fg0 },
  brandDim: { color: Colors.fg3, fontWeight: '500' },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Colors.fg3,
    paddingHorizontal: 10,
    paddingTop: 14,
    paddingBottom: 6,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    position: 'relative',
  },
  itemActive: { backgroundColor: Colors.bg3 },
  activeBar: {
    position: 'absolute',
    left: 0, top: 8, bottom: 8, width: 2,
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
  itemLabel: { fontSize: 13, fontWeight: '500', color: Colors.fg1 },
  itemLabelActive: { color: Colors.fg0 },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    marginTop: 8,
  },
  userAvatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#6366F1',
    alignItems: 'center', justifyContent: 'center',
  },
  userAvatarText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  userInfo: { flex: 1 },
  userName: { fontSize: 12.5, fontWeight: '600', color: Colors.fg0 },
  userRole: { fontSize: 10.5 },
});
