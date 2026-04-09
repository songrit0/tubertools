import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Image } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { Colors } from '../theme/colors';

export default function SelectionModal({ visible, vtuber, onConfirm, onCancel }) {
    if (!vtuber) return null;

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
            <View style={styles.overlay}>
                <View style={styles.card}>
                    {/* Close Button */}
                    <Pressable style={styles.closeBtn} onPress={onCancel}>
                        <X color={Colors.text} size={20} />
                    </Pressable>

                    {/* Title */}
                    <Text style={styles.title}>ยืนยันการเลือก</Text>

                    {/* Avatar */}
                    <View style={styles.avatarContainer}>
                        <Image source={{ uri: vtuber.imageUrl }} style={styles.avatar} />
                    </View>

                    {/* Character Name */}
                    <Text style={styles.name}>{vtuber.name}</Text>
                    <Text style={styles.subtitle}>คุณแน่ใจหรือไม่ว่าจะเข้าสู่ระบบด้วย VTuber นี้?</Text>

                    {/* Action Buttons */}
                    <View style={styles.buttonContainer}>
                        <Pressable
                            style={({ pressed }) => [styles.button, styles.cancelButton, pressed && { opacity: 0.7 }]}
                            onPress={onCancel}
                        >
                            <Text style={styles.buttonText}>ยกเลิก</Text>
                        </Pressable>

                        <Pressable
                            style={({ pressed }) => [styles.button, styles.confirmButton, pressed && { opacity: 0.8 }]}
                            onPress={onConfirm}
                        >
                            <Text style={styles.buttonTextconfirm}>ยืนยัน</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: '#1E1E1E',
        width: '100%',
        maxWidth: 380,
        borderRadius: 20,
        padding: 28,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2A2A2A',
    },
    closeBtn: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#2A2A2A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        color: Colors.text,
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    avatarContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#141414',
        borderWidth: 3,
        borderColor: Colors.accent,
        padding: 2,
        marginBottom: 20,
        overflow: 'hidden',
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 68,
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 6,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginBottom: 28,
        textAlign: 'center',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    cancelButton: {
        backgroundColor: '#C0392B',
        borderWidth: 1,
        borderColor: '#8B2E24',
    },
    confirmButton: {
        backgroundColor: Colors.accent,
        borderWidth: 1,
        borderColor: '#FF8C42',
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    buttonTextconfirm: {
        color: '#000',
        fontWeight: '600',
        fontSize: 14,
    },
});
