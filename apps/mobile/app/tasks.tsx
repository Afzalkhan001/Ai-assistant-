import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { API_URL, StorageKeys } from '../constants';
import { haptics } from '../utils/haptics';

interface Task {
    id: string;
    title: string;
    description?: string;
    status: 'pending' | 'completed' | 'skipped' | 'snoozed';
}

export default function TasksScreen() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [user, setUser] = useState<any>(null);

    useEffect(() => { loadUserAndTasks(); }, []);

    const loadUserAndTasks = async () => {
        try {
            const userStr = await AsyncStorage.getItem(StorageKeys.USER);
            if (userStr) {
                const userData = JSON.parse(userStr);
                setUser(userData);
                await loadTasks(userData.id);
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadTasks = async (userId: string) => {
        try {
            const response = await fetch(`${API_URL}/tasks/${userId}`);
            if (response.ok) {
                const data = await response.json();
                setTasks(data.tasks || []);
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    };

    const createTask = async () => {
        if (!newTaskTitle.trim() || !user?.id) return;
        haptics.success();
        try {
            const response = await fetch(`${API_URL}/tasks?user_id=${user.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTaskTitle.trim() }),
            });
            if (response.ok) {
                const data = await response.json();
                if (data.task) setTasks(prev => [data.task, ...prev]);
                setNewTaskTitle('');
                setShowModal(false);
            }
        } catch (error) {
            console.error('Error creating task:', error);
        }
    };

    const updateTaskStatus = async (taskId: string, newStatus: 'completed' | 'skipped') => {
        if (!user?.id) return;
        if (newStatus === 'completed') haptics.success();
        else haptics.warning();
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
        try {
            const task = tasks.find(t => t.id === taskId);
            await fetch(`${API_URL}/tasks/${taskId}?user_id=${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus, title: task?.title }),
            });
        } catch (error) {
            console.error('Error updating task:', error);
        }
    };

    const activeTasks = tasks.filter(t => t.status === 'pending' || t.status === 'snoozed');
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const skippedTasks = tasks.filter(t => t.status === 'skipped');
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

    if (isLoading) {
        return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#f59e0b" /></View>;
    }

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.date}>{today}</Text>
                <View style={styles.quoteRow}>
                    <View style={styles.quoteLine} />
                    <Text style={styles.quote}>"Consistency is quiet work."</Text>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Active Commitments</Text>
                        <View style={styles.badge}><Text style={styles.badgeText}>{activeTasks.length} remaining</Text></View>
                    </View>
                    {activeTasks.length === 0 ? (
                        <Text style={styles.emptyText}>No active commitments. Add one below!</Text>
                    ) : (
                        activeTasks.map((task, index) => (
                            <Animated.View key={task.id} entering={FadeInDown.delay(index * 50)}>
                                <View style={styles.taskCard}>
                                    <View style={styles.taskIcon}><Text style={styles.taskIconText}>○</Text></View>
                                    <Text style={styles.taskTitle}>{task.title}</Text>
                                    <View style={styles.taskActions}>
                                        <TouchableOpacity onPress={() => updateTaskStatus(task.id, 'completed')} style={styles.completeBtn}>
                                            <Text style={styles.completeBtnText}>✓</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => updateTaskStatus(task.id, 'skipped')} style={styles.skipBtn}>
                                            <Text style={styles.skipBtnText}>✕</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </Animated.View>
                        ))
                    )}
                </View>

                {completedTasks.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Completed ✓</Text>
                        {completedTasks.map(task => (
                            <View key={task.id} style={[styles.taskCard, styles.completedCard]}>
                                <View style={styles.completedIcon}><Text style={styles.completedIconText}>✓</Text></View>
                                <Text style={styles.completedTitle}>{task.title}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {skippedTasks.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Skipped</Text>
                        {skippedTasks.map(task => (
                            <View key={task.id} style={[styles.taskCard, styles.skippedCard]}>
                                <View style={styles.skippedIcon}><Text style={styles.skippedIconText}>✕</Text></View>
                                <Text style={styles.skippedTitle}>{task.title}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>

            <TouchableOpacity onPress={() => { haptics.buttonTap(); setShowModal(true); }} style={styles.fab}>
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>

            <Modal visible={showModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <Animated.View entering={FadeIn} style={styles.modalContent}>
                        <Text style={styles.modalTitle}>New Commitment</Text>
                        <TextInput value={newTaskTitle} onChangeText={setNewTaskTitle} placeholder="What will you commit to?" placeholderTextColor="#52525b" style={styles.modalInput} autoFocus />
                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => { haptics.buttonTap(); setShowModal(false); setNewTaskTitle(''); }} style={styles.cancelBtn}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={createTask} style={styles.addBtn}>
                                <Text style={styles.addText}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a0b' },
    loadingContainer: { flex: 1, backgroundColor: '#0a0a0b', alignItems: 'center', justifyContent: 'center' },
    scrollView: { flex: 1, paddingHorizontal: 24 },
    scrollContent: { paddingTop: 24, paddingBottom: 100 },
    date: { fontSize: 14, color: '#71717a', marginBottom: 8 },
    quoteRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
    quoteLine: { width: 4, height: 20, backgroundColor: '#f59e0b', borderRadius: 2, marginRight: 12 },
    quote: { fontSize: 14, color: '#a1a1aa', fontStyle: 'italic' },
    section: { marginBottom: 32 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
    badge: { backgroundColor: '#18181b', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
    badgeText: { fontSize: 12, color: '#a1a1aa' },
    emptyText: { textAlign: 'center', color: '#71717a', paddingVertical: 32 },
    taskCard: { flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 8, backgroundColor: '#18181b', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', borderRadius: 16 },
    taskIcon: { width: 36, height: 36, backgroundColor: '#18181b', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    taskIconText: { color: '#a1a1aa' },
    taskTitle: { flex: 1, color: '#fff', fontSize: 15 },
    taskActions: { flexDirection: 'row', gap: 8 },
    completeBtn: { width: 32, height: 32, backgroundColor: 'rgba(16,185,129,0.1)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    completeBtnText: { color: '#10b981' },
    skipBtn: { width: 32, height: 32, backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    skipBtnText: { color: '#ef4444' },
    completedCard: { backgroundColor: 'rgba(24,24,27,0.5)', opacity: 0.6 },
    completedIcon: { width: 36, height: 36, backgroundColor: '#10b981', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    completedIconText: { color: '#fff' },
    completedTitle: { flex: 1, color: '#a1a1aa', fontSize: 15, textDecorationLine: 'line-through' },
    skippedCard: { backgroundColor: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.2)', opacity: 0.5 },
    skippedIcon: { width: 36, height: 36, backgroundColor: 'rgba(239,68,68,0.2)', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    skippedIconText: { color: '#ef4444' },
    skippedTitle: { flex: 1, color: '#a1a1aa', fontSize: 15, textDecorationLine: 'line-through' },
    fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, backgroundColor: '#f59e0b', borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
    fabText: { fontSize: 24, color: '#000' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', paddingHorizontal: 24 },
    modalContent: { backgroundColor: '#18181b', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
    modalInput: { backgroundColor: '#0a0a0b', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 16, color: '#fff', fontSize: 15, marginBottom: 24 },
    modalActions: { flexDirection: 'row', gap: 12 },
    cancelBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
    cancelText: { color: '#a1a1aa', fontWeight: '600' },
    addBtn: { flex: 1, backgroundColor: '#f59e0b', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
    addText: { color: '#000', fontWeight: 'bold' },
});
