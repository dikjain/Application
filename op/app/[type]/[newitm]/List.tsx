import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GetContent } from '../../(api)/extract.api';
import Animated, {
  FadeIn,
  FadeInDown,
  Layout,
  ZoomIn,
  SlideInRight
} from 'react-native-reanimated';

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

const BlurFade = ({
  children,
  style,
  delay = 0,
}: BlurFadeProps) => {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify()}
      layout={Layout.springify()}
      style={[{
        borderWidth: 1,
        borderColor: '#00f2fe',
        borderRadius: 16,
        shadowColor: '#00f2fe',
        shadowOffset: {
          width: 0,
          height: 0,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
      }, style]}
    >
      {children}
    </Animated.View>
  );
};

const SkeletonItem = () => {
  return (
    <View style={[styles.skeletonItem, {
      backgroundColor: '#1a1a2e',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#00f2fe',
      shadowColor: '#00f2fe',
      shadowOffset: {
        width: 0,
        height: 0,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
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
  const router = useRouter();
  const { type, newitm } = useLocalSearchParams();
  const listType = type || 'todo';

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

  const renderItem = ({ item, index }: { item: ListItem; index: number }) => {
    const shouldAnimate = newitm === 'yes' && index === 0 && newItemAdded;
    const animationDelay = shouldAnimate ? 0 : index * 100;

    if (listType === 'todo') {
      return (
        <Animated.View
          entering={shouldAnimate ? ZoomIn.delay(animationDelay).springify() : FadeInDown.delay(animationDelay).springify()}
          layout={Layout.springify()}
          style={{
            marginVertical: 6,
            marginHorizontal: 16,
            backgroundColor: '#1a1a2e',
            borderRadius: 12,
            shadowColor: item.completed ? '#4834d4' : '#00f2fe',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 3,
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
              <Ionicons 
                name={item.completed ? "checkmark-circle" : "ellipse-outline"} 
                size={24} 
                color={item.completed ? "#4834d4" : "#00f2fe"}
              />
            </Animated.View>
            
            <View style={{flex: 1}}>
              <Text style={{
                fontSize: 16,
                fontWeight: '500',
                color: item.completed ? '#666' : '#fff',
                textDecorationLine: item.completed ? 'line-through' : 'none',
              }}>
                {item.title || item.name}
              </Text>
              
              {item.description && (
                <Text style={{
                  fontSize: 14,
                  color: item.completed ? '#555' : '#a8a8b3',
                  marginTop: 4,
                }}>
                  {item.description}
                </Text>
              )}
              
              {item.due_date && item.due_time && (
                <Text style={{
                  fontSize: 12,
                  color: item.completed ? '#555' : '#00f2fe',
                  marginTop: 6,
                  opacity: 0.8,
                }}>
                  {item.due_date} • {item.due_time}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>
      );
    } else {
      return (
        <Animated.View
          entering={SlideInRight.delay(animationDelay).springify()}
          layout={Layout.springify()}
          style={{
            borderWidth: 1,
            borderRadius: 16,
            borderColor: '#00f2fe',
            shadowColor: '#00f2fe',
            shadowOffset: {
              width: 0,
              height: 0,
            },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 5,
          }}
        >
          <TouchableOpacity style={[styles.noteItem, { backgroundColor: '#1a1a2e' }]}>
            <View style={styles.noteContent}>
              <Text style={[styles.noteTitle, { color: '#fff' }]}>{item.title}</Text>
              <Text style={[styles.noteText, { color: '#a8a8b3' }]} numberOfLines={2}>
                {item.content}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#00f2fe" />
          </TouchableOpacity>
        </Animated.View>
      );
    }
  };

  const toggleTodoComplete = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: '#0f0f1a' }]}>
        <Animated.View entering={FadeIn.duration(500)}>
          <View style={styles.headerContainer}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#00f2fe" />
            </TouchableOpacity>
            <Text style={[styles.header, { color: '#fff' }]}>
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
      <Animated.View entering={FadeIn.duration(500)}>
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#00f2fe" />
          </TouchableOpacity>
          <Text style={[styles.header, { color: '#fff' }]}>
            {listType === 'todo' ? '✨ Tasks' : '📝 Notes'}
          </Text>
        </View>
      </Animated.View>
      <FlatList
        data={items}
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
    flex: 1,
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
    backgroundColor: '#FFFFFF',
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
