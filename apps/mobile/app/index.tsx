import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Task {
    id: string;
    title: string;
    category: string;
    done: boolean;
}

export default function TasksScreen() {
    const [showModal, setShowModal] = React.useState(false);
    const [newTask, setNewTask] = React.useState('');
    const [tasks, setTasks] = React.useState<Task[]>([
        { id: '1', title: 'Morning meditation', category: 'Health', done: true },
        { id: '2', title: 'Review project proposal', category: 'Work', done: false },
        { id: '3', title: 'Call with team', category: 'Work', done: false },
        { id: '4', title: 'Read for 30 minutes', category: 'Personal', done: false },
    ]);

    const toggleTask = (id: string) => {
        setTasks(tasks.map(t =>
            t.id === id ? { ...t, done: !t.done } : t
        ));
    };

    const addTask = () => {
        if (newTask.trim()) {
            setTasks([...tasks, {
                id: Date.now().toString(),
                title: newTask.trim(),
                category: 'General',
                done: false,
            }]);
            setNewTask('');
            setShowModal(false);
        }
    };

    const activeTasks = tasks.filter(t => !t.done);
    const completedTasks = tasks.filter(t => t.done);

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                {/* Quote */}
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

                    {activeTasks.map(task => (
                        <TouchableOpacity
                            key={task.id}
                            style={styles.taskRow}
                            onPress={() => toggleTask(task.id)}
                        >
                            <View style={styles.taskIcon}>
                                <Ionicons
                                    name={task.category === 'Work' ? 'briefcase' : task.category === 'Health' ? 'leaf' : 'book'}
                                    size={18}
                                    color="#94a3b8"
                                />
                            </View>
                            <View style={styles.taskInfo}>
                                <Text style={styles.taskTitle}>{task.title}</Text>
                                <Text style={styles.taskCategory}>{task.category}</Text>
                            </View>
                            <View style={styles.checkbox} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Completed Tasks */}
                {completedTasks.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Completed</Text>
                        {completedTasks.map(task => (
                            <TouchableOpacity
                                key={task.id}
                                style={styles.taskRow}
                                onPress={() => toggleTask(task.id)}
                            >
                                <View style={[styles.taskIcon, styles.taskIconDone]}>
                                    <Ionicons name="checkmark" size={18} color="#0f172a" />
                                </View>
                                <View style={styles.taskInfo}>
                                    <Text style={[styles.taskTitle, styles.taskTitleDone]}>{task.title}</Text>
                                    <Text style={styles.taskCategory}>{task.category}</Text>
                                </View>
                                <View style={[styles.checkbox, styles.checkboxDone]}>
                                    <Ionicons name="checkmark" size={14} color="#0f172a" />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* FAB */}
            <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
                <Ionicons name="add" size={28} color="#0f172a" />
            </TouchableOpacity>

            {/* Add Task Modal */}
            <Modal visible={showModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>New Commitment</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="What will you commit to?"
                            placeholderTextColor="#64748b"
                            value={newTask}
                            onChangeText={setNewTask}
                            autoFocus
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <Text style={styles.cancelBtn}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.addBtn} onPress={addTask}>
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
        backgroundColor: '#0f172a',
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    quoteBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    quoteLine: {
        width: 3,
        height: 20,
        backgroundColor: '#f97316',
        marginRight: 12,
        borderRadius: 2,
    },
    quoteText: {
        color: '#94a3b8',
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
        color: '#f8fafc',
        fontSize: 16,
        fontWeight: '600',
    },
    badge: {
        backgroundColor: '#334155',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: '#94a3b8',
        fontSize: 12,
    },
    taskRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#1e293b',
    },
    taskIcon: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#1e293b',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    taskIconDone: {
        backgroundColor: '#475569',
    },
    taskInfo: {
        flex: 1,
    },
    taskTitle: {
        color: '#f8fafc',
        fontSize: 15,
        marginBottom: 2,
    },
    taskTitleDone: {
        color: '#64748b',
        textDecorationLine: 'line-through',
    },
    taskCategory: {
        color: '#64748b',
        fontSize: 12,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#475569',
    },
    checkboxDone: {
        backgroundColor: '#f8fafc',
        borderColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#f97316',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 24,
    },
    modalTitle: {
        color: '#f8fafc',
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 16,
    },
    input: {
        backgroundColor: '#0f172a',
        borderRadius: 8,
        padding: 14,
        color: '#f8fafc',
        fontSize: 16,
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 16,
    },
    cancelBtn: {
        color: '#94a3b8',
        fontSize: 16,
        padding: 10,
    },
    addBtn: {
        backgroundColor: '#f97316',
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 8,
    },
    addBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
