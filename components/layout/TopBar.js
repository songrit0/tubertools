import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Bell, Settings, Search } from 'lucide-react-native';
import { Colors } from '../../theme/colors';

export default function TopBar({ crumbs = [], live = false, showSearch = true, navigation }) {
  return (
    <View style={styles.topbar}>
      <View style={styles.crumbs}>
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <Text style={styles.sep}>/</Text>}
            <Text style={[styles.crumb, i === crumbs.length - 1 && styles.crumbNow]}>{c}</Text>
          </React.Fragment>
        ))}
      </View>

      <View style={{ flex: 1 }} />

      {showSearch && (
        <View style={styles.searchBox}>
          <Search size={14} color={Colors.fg2} strokeWidth={2} />
          <Text style={styles.searchText}>Search anything…</Text>
          <View style={styles.kbd}>
            <Text style={styles.kbdText}>⌘K</Text>
          </View>
        </View>
      )}

      {live && (
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      )}

      <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
        <Bell size={15} color={Colors.fg2} strokeWidth={2} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.iconBtn}
        activeOpacity={0.7}
        onPress={() => navigation?.navigate('Profile')}
      >
        <Settings size={15} color={Colors.fg2} strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  topbar: {
    height: 52,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
    backgroundColor: Colors.bg0,
    flexShrink: 0,
  },
  crumbs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sep: {
    color: Colors.fg4,
    fontSize: 13,
  },
  crumb: {
    fontSize: 13,
    color: Colors.fg2,
  },
  crumbNow: {
    color: Colors.fg0,
    fontWeight: '500',
  },
  searchBox: {
    maxWidth: 360,
    height: 32,
    backgroundColor: Colors.bg2,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 8,
  },
  searchText: {
    color: Colors.fg2,
    fontSize: 12.5,
    flex: 1,
  },
  kbd: {
    backgroundColor: Colors.bg3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  kbdText: {
    fontSize: 10,
    color: Colors.fg2,
    fontFamily: 'monospace',
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,71,87,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,71,87,0.3)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.live,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.live,
    letterSpacing: 0.5,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
