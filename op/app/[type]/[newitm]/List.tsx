import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { GetContent } from '../../(api)/extract.api';
import { deleteTodoById } from '../../(api)/todo.api';
import { deleteNoteById } from '../../(api)/note.api';
import Animated, {
  FadeIn,
  FadeInDown,
  Layout,
  ZoomIn,
  SlideInRight,
  FlipInXDown
} from 'react-native-reanimated';
import axios from 'axios';

interface ListItem {
  id: string;
  title: string;
  name?: string;
  description?: string;
  due_date?: string;
  due_time?: string;
  completed?: boolean;
  content?: string;
}

interface BlurFadeProps {
  children: React.ReactNode;
  style?: any;
  duration?: number;
  delay?: number;
  yOffset?: number;
}

// Array of neon colors
const neonColors = [
  '#FF1493', // Deep Pink
  '#00FF00', // Neon Green  
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FFFF00', // Yellow
  '#FF4500', // Orange Red
  '#7FFF00', // Chartreuse
  '#FF69B4', // Hot Pink
  '#00FA9A', // Medium Spring Green
  '#40E0D0', // Turquoise
];

const getRandomNeonColor = () => {
  return neonColors[Math.floor(Math.random() * neonColors.length)];
};

const SkeletonItem = () => {
  const neonColor = useMemo(() => getRandomNeonColor(), []);
  
  return (
    <View style={[styles.skeletonItem, {
      backgroundColor: 'rgba(0,0,0,0.8)',
      borderRadius: 16,
      borderWidth: 2,
      borderColor: neonColor,
      shadowColor: neonColor,
      shadowOffset: {
        width: 0,
        height: 0,
      },
      shadowOpacity: 0.8,
      shadowRadius: 8,
      marginHorizontal : 20,
      elevation: 8,
    }]}>
      <View style={[styles.skeletonCircle, { backgroundColor: '#2d2d44' }]} />
      <View style={styles.skeletonContent}>
        <View style={[styles.skeletonTitle, { backgroundColor: '#2d2d44' }]} />
        <View style={[styles.skeletonDescription, { backgroundColor: '#2d2d44' }]} />
        <View style={[styles.skeletonDate, { backgroundColor: '#2d2d44' }]} />
      </View>
    </View>
  );
};

const List = () => {
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItemAdded, setNewItemAdded] = useState(false);
  const [selectedNote, setSelectedNote] = useState<ListItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showAll, setShowAll] = useState(true);
  const router = useRouter();
  const { type, newitm } = useLocalSearchParams();
  const listType = type || 'todo';
  const itemColors = useMemo(() => items.map(() => getRandomNeonColor()), [items.length]);

  const filteredItems = useMemo(() => {
    if (listType === 'todo' && !showAll) {
      return items.filter(item => !item.completed);
    }
    return items;
  }, [items, showAll, listType]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const data = await GetContent(listType === 'todo');
      
      
      if (data) {
        const formattedData = data.map((item: ListItem) => {
          if (item.due_date) {
            const date = new Date(item.due_date);
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            return {
              ...item,
              due_date: `${day}/${month}/${year}`
            };
          }
          return item;
        });

        if (newitm === 'yes') {
          const remainingItems = formattedData.slice(1);
          setItems(remainingItems);
          setLoading(false);
          
          setTimeout(() => {
            setItems(formattedData);
            setNewItemAdded(true);
          }, 500);
        } else {
          setItems(formattedData);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchData();
  }, [listType, newitm]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      if (listType === 'todo') {
        await deleteTodoById(id);
      } else {
        await deleteNoteById(id);
      }
      setItems(items.filter(item => item.id !== id));
    } catch (error) {
      console.error(`Error deleting ${listType}:`, error);
    }
  }, [items, listType]);

  const renderItem = useCallback(({ item, index }: { item: ListItem; index: number }) => {
    const shouldAnimate = newitm === 'yes' && index === 0 && newItemAdded;
    const animationDelay = shouldAnimate ? 0 : index * 100;
    const neonColor = itemColors[index];

    if (listType === 'todo') {
      return (
        <Animated.View
          entering={shouldAnimate ? ZoomIn.delay(animationDelay).springify() : FadeInDown.delay(animationDelay).springify()}
          layout={Layout.springify()}
          style={{
            marginVertical: 6,
            marginHorizontal: 16,
            backgroundColor: 'rgba(0,0,0,0.8)',
            borderRadius: 12,
            borderWidth: 2,
            borderColor: neonColor,
            shadowColor: neonColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <TouchableOpacity 
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
            }}
            onPress={() => toggleTodoComplete(item.id)}
          >
            <Animated.View
              entering={item.completed ? ZoomIn : undefined}
              style={{marginRight: 12}}
            >
              <MaterialCommunityIcons 
                name={item.completed ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"} 
                size={24} 
                color={neonColor}
                style={{
                  shadowColor: neonColor,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.5,
                  shadowRadius: 6,
                }}
              />
            </Animated.View>
            
            <View style={{flex: 1}}>
              <Text style={{
                fontSize: 16,
                fontWeight: '500',
                color: neonColor,
                fontFamily: 'Orbitron',
                textDecorationLine: item.completed ? 'line-through' : 'none',
              }}>
                {item.title || item.name}
              </Text>
              
              {item.description !== undefined && item.description !== '' && (
                <Text style={{
                  fontSize: 14,
                  color: '#fff',
                  marginTop: 4,
                }}>
                  {item.description}
                </Text>
              )}
              
              {item.due_date && item.due_time && (
                <Text style={{
                  fontSize: 12,
                  color: neonColor,
                  marginTop: 6,
                  opacity: 0.8,
                }}>
                  <FontAwesome5 name="clock" size={12} color={neonColor} /> {item.due_date} • {item.due_time}
                </Text>
              )}
            </View>

            <TouchableOpacity
              onPress={() => handleDelete(item.id)}
              style={{padding: 8}}
            >
              <MaterialCommunityIcons 
                name="delete-outline" 
                size={24} 
                color="#FF0000"
                style={{
                  shadowColor: '#FF0000',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.5,
                  shadowRadius: 6,
                }}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      );
    } else {
      return (
        <Animated.View
          entering={FlipInXDown.delay(animationDelay).springify()}
          layout={Layout.springify()}
          style={{
            borderWidth: 2,
            borderRadius: 16,
            borderColor: neonColor,
            backgroundColor: 'rgba(0,0,0,0.8)',
            shadowColor: neonColor,
            shadowOffset: {
              width: 0,
              height: 0,
            },
            shadowOpacity: 0.8,
            shadowRadius: 8,
            elevation: 8,
            marginVertical : 4,
            marginHorizontal : 12,
          }}
        >
          <TouchableOpacity 
            style={styles.noteItem}
            onPress={() => {
              setSelectedNote(item);
              setModalVisible(true);
            }}
          >
            <View style={styles.noteContent}>
              <Text style={{
                fontSize: 17,
                fontWeight: '600',
                color: neonColor,
                marginBottom: 4,
                fontFamily: 'Orbitron',
              }}>{item.title}</Text>
              <Text style={[styles.noteText, { color: '#fff' }]} numberOfLines={2}>
                {item.description}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => handleDelete(item.id)}
              style={{padding: 8}}
            >
              <MaterialCommunityIcons 
                name="delete-outline" 
                size={24} 
                color="#FF0000"
                style={{
                  shadowColor: '#FF0000',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.5,
                  shadowRadius: 6,
                }}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      );
    }
  }, [itemColors, newitm, newItemAdded, listType, handleDelete]);

  const toggleTodoComplete = useCallback(async (id: string) => {
    try {
      const response = await axios.post(`http://192.168.29.175:3000/todo/toggletodo/${id}`, {
        completed: !items.find(item => item.id === id)?.completed
      });
      
      if (response.status === 200) {
        setItems(items.map(item => 
          item.id === id ? { ...item, completed: !item.completed } : item
        ));
      }
    } catch (error) {
      console.error("Error toggling todo completion:", error);
    }
  }, [items]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: '#000' }]}>
        <Animated.View entering={FadeIn.duration(500)}>
          <View style={styles.headerContainer}>
            <TouchableOpacity   
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="#00f2fe" />
            </TouchableOpacity>
            <Text style={[styles.header, { 
              color: '#00f2fe',
            }]}>
              {listType === 'todo' ? '✨ Tasks' : '📝 Notes'}
            </Text>
          </View>
        </Animated.View>
        <FlatList
          data={[1,2,3]}
          renderItem={() => <SkeletonItem />}
          keyExtractor={(_, index) => index.toString()}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.8)',
          paddingHorizontal: 20,
        }}>
          <View style={{
            maxHeight: '80%',
            width: '100%',
            backgroundColor: '#000',
            borderRadius: 20,
            borderWidth: 2,
            borderColor: '#00f2fe',
            shadowColor: '#00f2fe',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 10,
          }}>
            <ScrollView 
              style={{ padding: 20 , paddingBottom : 0 }}
              showsVerticalScrollIndicator={false}
            >
              <Text style={{
                fontSize: 24,
                fontWeight: '600',
                color: '#00f2fe',
                marginBottom: 15,
                fontFamily: 'Orbitron',
              }}>{selectedNote?.title}</Text>
              <Text style={{
                fontSize: 16,
                color: '#fff',
                marginBottom: 20,
                lineHeight: 24,
              }}>{selectedNote?.description}</Text>
            </ScrollView>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={{
                alignSelf: 'flex-end',
                backgroundColor: 'rgba(0,242,254,0.2)',
                padding: 10,
                borderRadius: 10,
                margin: 20,
              }}
            >
              <Text style={{
                color: '#00f2fe',
                fontFamily: 'Orbitron',
              }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Animated.View entering={FadeIn.duration(500)}>
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons 
              name="arrow-left" 
              size={24} 
              color="#00f2fe"
              style={{
                shadowColor: '#00f2fe',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.5,
                shadowRadius: 6,
              }}
            />
          </TouchableOpacity>
          <Text style={[styles.header, { 
            color: '#00f2fe',
          }]}>
            {listType === 'todo' ? '✨ Tasks' : '📝 Notes'}
          </Text>
          {listType === 'todo' && (
            <TouchableOpacity
              onPress={() => setShowAll(!showAll)}
              style={{
                marginLeft: 'auto',
                backgroundColor: 'rgba(0,242,254,0.2)',
                padding: 8,
                borderRadius: 8,
              }}
            >
              <Text style={{
                color: '#00f2fe',
                fontFamily: 'Orbitron',
                fontSize: 12,
              }}>
                {showAll ? 'Show Active' : 'Show All'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        keyExtractor={item => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default List;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 20,
    paddingTop : 40,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  header: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2D3436',
    letterSpacing: 0.5,
  },
  list: {
    paddingTop :10,
    flex: 1,
    // padding:10
  },
  listContent: {
    paddingBottom: 20,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  completedItem: {
    opacity: 0.8,
    backgroundColor: '#F1F2F6',
  },
  checkboxContainer: {
    marginRight: 12,
    paddingTop: 2,
  },
  todoContent: {
    flex: 1,
  },
  todoText: {
    fontSize: 17,
    color: '#2D3436',
    marginBottom: 4,
  },
  todoDescription: {
    fontSize: 14,
    color: '#636E72',
    marginBottom: 4,
  },
  todoDueDate: {
    fontSize: 12,
    color: '#6C5CE7',
    fontWeight: '500',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#A4B0BE',
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 4,
  },
  noteText: {
    fontSize: 15,
    color: '#A4B0BE',
  },
  skeletonItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
  },
  skeletonCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0E0E0',
    marginRight: 12,
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonTitle: {
    height: 17,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 8,
    width: '80%',
  },
  skeletonDescription: {
    height: 14,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 8,
    width: '60%',
  },
  skeletonDate: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    width: '40%',
  },
});
