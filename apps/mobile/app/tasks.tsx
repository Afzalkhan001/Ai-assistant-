import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Modal,
    ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Colors, API_URL, StorageKeys } from '../constants';

interface Task {
    id: string;
    title: string;
    description?: string;
    status: 'pending' | 'completed' | 'skipped' | 'snoozed';
    scheduled_for?: string;
}

export default function TasksScreen() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        loadUserAndTasks();
    }, []);

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

        try {
            const response = await fetch(`${API_URL}/tasks?user_id=${user.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTaskTitle.trim() }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.task) {
                    setTasks(prev => [data.task, ...prev]);
                }
                setNewTaskTitle('');
                setShowModal(false);
            }
        } catch (error) {
            console.error('Error creating task:', error);
        }
    };

    const updateTaskStatus = async (taskId: string, newStatus: 'completed' | 'skipped') => {
        if (!user?.id) return;

        // Optimistic update
        setTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, status: newStatus } : t
        ));

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

    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
    });

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                {/* Date & Quote */}
                <Text style={styles.date}>{today}</Text>
                <View style={styles.quoteBox}>
                    <View style={styles.quoteLine} />
                    <Text style={styles.quoteText}>"Consistency is quiet work."</Text>
                </View>

                {/* Active Tasks */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Active Commitments</Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{activeTasks.length} remaining</Text>
                        </View>
                    </View>

                    {activeTasks.length === 0 ? (
                        <Text style={styles.emptyText}>No active commitments. Add one below!</Text>
                    ) : (
                        activeTasks.map(task => (
                            <View key={task.id} style={styles.taskRow}>
                                <View style={styles.taskIcon}>
                                    <Ionicons name="document-text-outline" size={18} color={Colors.textSecondary} />
                                </View>
                                <View style={styles.taskInfo}>
                                    <Text style={styles.taskTitle}>{task.title}</Text>
                                </View>
                                <View style={styles.taskActions}>
                                    <TouchableOpacity
                                        style={styles.actionBtn}
                                        onPress={() => updateTaskStatus(task.id, 'completed')}
                                    >
                                        <Ionicons name="checkmark" size={18} color={Colors.success} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.actionBtn}
                                        onPress={() => updateTaskStatus(task.id, 'skipped')}
                                    >
                                        <Ionicons name="close" size={18} color={Colors.error} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )}
                </View>

                {/* Completed */}
                {completedTasks.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Completed ✓</Text>
                        {completedTasks.map(task => (
                            <View key={task.id} style={[styles.taskRow, styles.taskRowDone]}>
                                <View style={[styles.taskIcon, styles.taskIconDone]}>
                                    <Ionicons name="checkmark" size={18} color={Colors.background} />
                                </View>
                                <Text style={styles.taskTitleDone}>{task.title}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Skipped */}
                {skippedTasks.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Skipped</Text>
                        {skippedTasks.map(task => (
                            <View key={task.id} style={[styles.taskRow, styles.taskRowSkipped]}>
                                <View style={[styles.taskIcon, styles.taskIconSkipped]}>
                                    <Ionicons name="close" size={18} color={Colors.error} />
                                </View>
                                <Text style={styles.taskTitleDone}>{task.title}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* FAB */}
            <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
                <Ionicons name="add" size={28} color={Colors.background} />
            </TouchableOpacity>

            {/* Add Task Modal */}
            <Modal visible={showModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>New Commitment</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="What will you commit to?"
                            placeholderTextColor={Colors.textPlaceholder}
                            value={newTaskTitle}
                            onChangeText={setNewTaskTitle}
                            autoFocus
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <Text style={styles.cancelBtn}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.addBtn} onPress={createTask}>
                                <Text style={styles.addBtnText}>Add</Text>
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
        backgroundColor: Colors.background,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    date: {
        color: Colors.textMuted,
        fontSize: 14,
        marginBottom: 8,
    },
    quoteBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    quoteLine: {
        width: 3,
        height: 20,
        backgroundColor: Colors.primary,
        marginRight: 12,
        borderRadius: 2,
    },
    quoteText: {
        color: Colors.textSecondary,
        fontSize: 14,
        fontStyle: 'italic',
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        color: Colors.textPrimary,
        fontSize: 16,
        fontWeight: '600',
    },
    badge: {
        backgroundColor: Colors.surface,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: Colors.textSecondary,
        fontSize: 12,
    },
    emptyText: {
        color: Colors.textMuted,
        textAlign: 'center',
        paddingVertical: 32,
    },
    taskRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        backgroundColor: Colors.surface,
        borderRadius: 12,
        marginBottom: 8,
    },
    taskRowDone: {
        opacity: 0.6,
    },
    taskRowSkipped: {
        opacity: 0.5,
        backgroundColor: `${Colors.error}10`,
    },
    taskIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: Colors.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    taskIconDone: {
        backgroundColor: Colors.success,
    },
    taskIconSkipped: {
        backgroundColor: `${Colors.error}30`,
    },
    taskInfo: {
        flex: 1,
    },
    taskTitle: {
        color: Colors.textPrimary,
        fontSize: 15,
    },
    taskTitleDone: {
        color: Colors.textSecondary,
        fontSize: 15,
        textDecorationLine: 'line-through',
        flex: 1,
    },
    taskActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: Colors.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: Colors.overlay,
        justifyContent: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: Colors.surface,
        borderRadius: 20,
        padding: 24,
    },
    modalTitle: {
        color: Colors.textPrimary,
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
    },
    modalInput: {
        backgroundColor: Colors.background,
        borderRadius: 12,
        padding: 16,
        color: Colors.textPrimary,
        fontSize: 16,
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 16,
    },
    cancelBtn: {
        color: Colors.textSecondary,
        fontSize: 16,
        padding: 12,
    },
    addBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 10,
    },
    addBtnText: {
        color: Colors.background,
        fontSize: 16,
        fontWeight: '700',
    },
});
