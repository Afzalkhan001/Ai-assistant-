import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { API_URL, StorageKeys } from '../constants';
import { haptics } from '../utils/haptics';

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
        haptics.success();

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

    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
    });

    if (isLoading) {
        return (
            <View className="flex-1 bg-[#0a0a0b] items-center justify-center">
                <ActivityIndicator size="large" color="#f59e0b" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-[#0a0a0b]">
            <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Date */}
                <Text className="text-sm text-zinc-500 mb-2">{today}</Text>

                {/* Quote */}
                <View className="flex-row items-center mb-8">
                    <View className="w-1 h-5 bg-[#f59e0b] rounded-full mr-3" />
                    <Text className="text-sm text-zinc-400 italic">"Consistency is quiet work."</Text>
                </View>

                {/* Active Commitments */}
                <View className="mb-8">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-base font-semibold text-white">Active Commitments</Text>
                        <View className="bg-[#18181b] px-3 py-1 rounded-full">
                            <Text className="text-xs text-zinc-400">{activeTasks.length} remaining</Text>
                        </View>
                    </View>

                    {activeTasks.length === 0 ? (
                        <Text className="text-center text-zinc-500 py-8">No active commitments. Add one below!</Text>
                    ) : (
                        activeTasks.map(task => (
                            <View key={task.id} className="flex-row items-center p-4 mb-2 bg-[#18181b] border border-white/5 rounded-2xl">
                                <View className="w-9 h-9 bg-[#18181b] border border-white/10 rounded-xl items-center justify-center mr-3">
                                    <Text className="text-zinc-400">○</Text>
                                </View>
                                <Text className="flex-1 text-white text-[15px]">{task.title}</Text>
                                <View className="flex-row gap-2">
                                    <TouchableOpacity
                                        onPress={() => updateTaskStatus(task.id, 'completed')}
                                        className="w-8 h-8 bg-[#10b981]/10 border border-[#10b981]/30 rounded-lg items-center justify-center"
                                    >
                                        <Text className="text-[#10b981]">✓</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => updateTaskStatus(task.id, 'skipped')}
                                        className="w-8 h-8 bg-red-500/10 border border-red-500/30 rounded-lg items-center justify-center"
                                    >
                                        <Text className="text-red-500">✕</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )}
                </View>

                {/* Completed */}
                {completedTasks.length > 0 && (
                    <View className="mb-8">
                        <Text className="text-base font-semibold text-white mb-4">Completed ✓</Text>
                        {completedTasks.map(task => (
                            <View key={task.id} className="flex-row items-center p-4 mb-2 bg-[#18181b]/50 border border-white/5 rounded-2xl opacity-60">
                                <View className="w-9 h-9 bg-[#10b981] rounded-xl items-center justify-center mr-3">
                                    <Text className="text-white">✓</Text>
                                </View>
                                <Text className="flex-1 text-zinc-400 line-through text-[15px]">{task.title}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Skipped */}
                {skippedTasks.length > 0 && (
                    <View className="mb-8">
                        <Text className="text-base font-semibold text-white mb-4">Skipped</Text>
                        {skippedTasks.map(task => (
                            <View key={task.id} className="flex-row items-center p-4 mb-2 bg-red-500/5 border border-red-500/20 rounded-2xl opacity-50">
                                <View className="w-9 h-9 bg-red-500/20 rounded-xl items-center justify-center mr-3">
                                    <Text className="text-red-500">✕</Text>
                                </View>
                                <Text className="flex-1 text-zinc-400 line-through text-[15px]">{task.title}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* FAB */}
            <TouchableOpacity
                onPress={() => {
                    haptics.buttonTap();
                    setShowModal(true);
                }}
                className="absolute bottom-6 right-6 w-14 h-14 bg-[#f59e0b] rounded-2xl items-center justify-center shadow-lg"
                style={{ shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12 }}
            >
                <Text className="text-2xl text-black">+</Text>
            </TouchableOpacity>

            {/* Add Task Modal */}
            <Modal visible={showModal} transparent animationType="fade">
                <View className="flex-1 bg-black/60 justify-center px-6">
                    <View className="bg-[#18181b] rounded-3xl p-6 border border-white/10">
                        <Text className="text-xl font-bold text-white mb-4">New Commitment</Text>
                        <TextInput
                            value={newTaskTitle}
                            onChangeText={setNewTaskTitle}
                            placeholder="What will you commit to?"
                            placeholderTextColor="#52525b"
                            className="bg-[#0a0a0b] border border-white/10 rounded-2xl px-5 py-4 text-white text-[15px] mb-6"
                            autoFocus
                        />
                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => {
                                    haptics.buttonTap();
                                    setShowModal(false);
                                    setNewTaskTitle('');
                                }}
                                className="flex-1 py-3 items-center"
                            >
                                <Text className="text-zinc-400 font-semibold">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={createTask}
                                className="flex-1 bg-[#f59e0b] py-3 rounded-xl items-center"
                            >
                                <Text className="text-black font-bold">Add</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
