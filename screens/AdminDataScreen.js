import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { vtuberData, vtuberDataselect } from '../data/vtuberData';
import {
  syncVtubersToDatabase,
  fetchVtubersFromDatabase,
  addVtuber,
  updateVtuber,
  deleteVtuber,
  subscribeToVtubers,
  syncVtuberSelectionsToDatabase,
} from '../services/vtuberDatabaseService';

export default function AdminDataScreen({ navigation }) {
  const responsive = useResponsive();
  const [vtubers, setVtubers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ id: '', name: '', imageUrl: '' });
  const [syncStatus, setSyncStatus] = useState('');

  useEffect(() => {
    loadVtubersFromDatabase();
  }, []);

  const loadVtubersFromDatabase = async () => {
    setIsLoading(true);
    const data = await fetchVtubersFromDatabase();
    if (data.length > 0) {
      setVtubers(data);
    } else {
      setVtubers(vtuberData);
    }
    setIsLoading(false);
  };

  const handleSyncInitialData = async () => {
    setSyncStatus('กำลังซิงค์ข้อมูล...');
    setIsLoading(true);
    try {
      const result = await syncVtubersToDatabase(vtuberData);
      const selectResult = await syncVtuberSelectionsToDatabase(vtuberDataselect);

      if (result.success && selectResult.success) {
        setSyncStatus('ซิงค์ข้อมูลสำเร็จ! ✓');
        await loadVtubersFromDatabase();
        setTimeout(() => setSyncStatus(''), 2000);
      } else {
        setSyncStatus('ซิงค์ข้อมูลล้มเหลว');
      }
    } catch (error) {
      setSyncStatus('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAddModal = (vtuber = null) => {
    if (vtuber) {
      setEditingId(vtuber.id);
      setFormData({ ...vtuber });
    } else {
      setEditingId(null);
      setFormData({ id: Date.now().toString(), name: '', imageUrl: '' });
    }
    setShowAddModal(true);
  };

  const handleSaveVtuber = async () => {
    if (!formData.name || !formData.imageUrl) {
      Alert.alert('ข้อผิดพลาด', 'กรุณากรอกชื่อและ URL รูปภาพ');
      return;
    }

    setIsLoading(true);
    try {
      let result;
      if (editingId) {
        result = await updateVtuber(formData.id, {
          name: formData.name,
          imageUrl: formData.imageUrl,
        });
      } else {
        result = await addVtuber(formData);
      }

      if (result.success) {
        await loadVtubersFromDatabase();
        setShowAddModal(false);
        setSyncStatus(editingId ? 'อัปเดตสำเร็จ ✓' : 'เพิ่มข้อมูลสำเร็จ ✓');
        setTimeout(() => setSyncStatus(''), 2000);
      }
    } catch (error) {
      Alert.alert('ข้อผิดพลาด', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteVtuber = (id) => {
    Alert.alert('ลบข้อมูล', 'คุณแน่ใจหรือว่าต้องการลบ?', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ลบ',
        style: 'destructive',
        onPress: async () => {
          setIsLoading(true);
          try {
            const result = await deleteVtuber(id);
            if (result.success) {
              await loadVtubersFromDatabase();
              setSyncStatus('ลบสำเร็จ ✓');
              setTimeout(() => setSyncStatus(''), 2000);
            }
          } catch (error) {
            Alert.alert('ข้อผิดพลาด', error.message);
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  };

  const renderVtuberItem = ({ item }) => (
    <View style={styles.vtuberCard}>
      <View style={styles.cardContent}>
        <Text style={styles.cardName}>{item.name}</Text>
        <Text style={styles.cardId}>ID: {item.id}</Text>
        <Text style={styles.cardUrl} numberOfLines={2}>
          {item.imageUrl}
        </Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleOpenAddModal(item)}
        >
          <Text style={styles.buttonText}>แก้ไข</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteVtuber(item.id)}
        >
          <Text style={styles.buttonText}>ลบ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>จัดการข้อมูล VTuber</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← กลับ</Text>
        </TouchableOpacity>
      </View>

      {syncStatus !== '' && (
        <View style={styles.statusMessage}>
          <Text style={styles.statusText}>{syncStatus}</Text>
        </View>
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.primaryButton, isLoading && styles.disabledButton]}
          onPress={handleSyncInitialData}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'กำลังประมวลผล...' : 'ซิงค์ข้อมูลเริ่มต้น'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.successButton, isLoading && styles.disabledButton]}
          onPress={() => handleOpenAddModal()}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>+ เพิ่มข้อมูลใหม่</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.vtubersList}>
        <FlatList
          data={vtubers}
          renderItem={renderVtuberItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      </ScrollView>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingId ? 'แก้ไขข้อมูล VTuber' : 'เพิ่มข้อมูล VTuber ใหม่'}
            </Text>

            <Text style={styles.inputLabel}>ชื่อ</Text>
            <TextInput
              style={styles.input}
              placeholder="ใส่ชื่อ VTuber"
              placeholderTextColor="#666"
              value={formData.name}
              onChangeText={(text) =>
                setFormData({ ...formData, name: text })
              }
            />

            <Text style={styles.inputLabel}>URL รูปภาพ</Text>
            <TextInput
              style={styles.input}
              placeholder="ใส่ URL รูปภาพ"
              placeholderTextColor="#666"
              value={formData.imageUrl}
              onChangeText={(text) =>
                setFormData({ ...formData, imageUrl: text })
              }
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.buttonText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.saveButton,
                  isLoading && styles.disabledButton,
                ]}
                onPress={handleSaveVtuber}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'กำลังบันทึก...' : 'บันทึก'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  backButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  backButtonText: {
    fontSize: 14,
    color: '#FF6B9D',
  },
  statusMessage: {
    backgroundColor: '#1DB954',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#FF6B9D',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successButton: {
    flex: 1,
    backgroundColor: '#1DB954',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  vtubersList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
  vtuberCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B9D',
  },
  cardContent: {
    marginBottom: 12,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  cardId: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  cardUrl: {
    fontSize: 11,
    color: '#666',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#0099FF',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#FF4444',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#444',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#444',
  },
  saveButton: {
    backgroundColor: '#FF6B9D',
  },
});
