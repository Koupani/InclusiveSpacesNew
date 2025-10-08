// components/FullScreenAutocomplete.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    TextInput,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Text,
    Dimensions,
    Keyboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { nodeNameMappingsPenteli } from './nodeNameMappingsPenteli';
import { nodeNameMappingsHamburg } from './nodeNameMappingsHamburg';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FullScreenAutocompleteProps {
    items: Array<{ id: number; name: string }>;
    selectedValue: number | null;
    onValueChange: (value: number | null) => void;
    placeholder: string;
    accessibilityLabel: string;
    onClose: () => void;
    visible: boolean;
    language: string;
    nodeData: Array<{ id: number; name: string }>;
    studyArea: string;
}

const removeDiacritics = (str: string) => {
    return str
        .normalize('NFD') // Normalize to decomposed form
        .replace(/[\u0300-\u036f]/g, '') // Remove all diacritics (both Greek and Latin)
        .replace(/ς/g, 'σ') // Treat final sigma as normal sigma
        .toLowerCase();
};

const FullScreenAutocomplete: React.FC<FullScreenAutocompleteProps> = ({
    items,
    selectedValue,
    onValueChange,
    placeholder,
    accessibilityLabel,
    onClose,
    visible,
    language,
    nodeData,
    studyArea 
}) => {
    const [searchText, setSearchText] = useState('');
    const [filteredItems, setFilteredItems] = useState(items);

     const nodeNameMappings = studyArea === 'hamburg' 
        ? nodeNameMappingsHamburg 
        : nodeNameMappingsPenteli;

    useEffect(() => {
        if (searchText) {
            const normalizedSearch = removeDiacritics(searchText);

            setFilteredItems(
                items.filter(item => {
                    // Check both original name and translated names
                    const originalMatch = removeDiacritics(item.name).includes(normalizedSearch);

                    // Check if there are translations available
                    const translations = nodeNameMappings[item.id] || {};
                    const translatedMatch = Object.values(translations).some(translation =>
                        removeDiacritics(translation).includes(normalizedSearch)
                    );

                    return originalMatch || translatedMatch;
                })
            );
        } else {
            setFilteredItems(items);
        }
    }, [searchText, items]);

    const handleSelect = (item: { id: number; name: string }) => {
        onValueChange(item.id);
        setSearchText('');
        Keyboard.dismiss();
        onClose();
    };

    const getNodeName = (nodeId: number, language: string): string => {
        try {
            // Check if nodeData exists and is an array
            if (!nodeData || !Array.isArray(nodeData)) {
                console.warn('nodeData is not a valid array');
                return '';
            }
            // Find the node with additional checks
            const node = nodeData.find((n) => n && typeof n === 'object' && n.id === nodeId);
            if (!node || !node.name) {
                console.warn(`Node with id ${nodeId} not found or missing name`);
                return '';
            }

            // Handle language-specific names
            if (language === 'el') {
                return node.name;
            } else if (language === 'en' || language === 'de') {
                return nodeNameMappings[nodeId]?.[language] || node.name;
            }
            return node.name;
        } catch (error) {
            console.error('Error in getNodeName:', error);
            return '';
        }
    };

    const highlightMatch = (text: string, search: string) => {
        if (!search) return text;

        const normalizedText = removeDiacritics(text);
        const normalizedSearch = removeDiacritics(search);
        const startIdx = normalizedText.indexOf(normalizedSearch);

        if (startIdx === -1) return text;

        const endIdx = startIdx + search.length;
        return (
            <>
                <Text>{text.substring(0, startIdx)}</Text>
                <Text style={{ fontWeight: 'bold', backgroundColor: 'yellow' }}>
                    {text.substring(startIdx, endIdx)}
                </Text>
                <Text>{text.substring(endIdx)}</Text>
            </>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {/* Header with back button and search input */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.backButton}>
                        <Icon name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <TextInput
                        style={styles.searchInput}
                        value={searchText}
                        onChangeText={setSearchText}
                        placeholder={placeholder}
                        placeholderTextColor="#888"
                        autoFocus={true}
                        accessibilityLabel={accessibilityLabel}
                    />
                </View>

                {/* Search results list */}
                <FlatList
                    data={filteredItems}
                    keyExtractor={(item) => item.id.toString()}
                    // renderItem={({ item }) => (
                    //     <TouchableOpacity
                    //         style={styles.resultItem}
                    //         onPress={() => handleSelect(item)}
                    //     >
                    //         {/* <Text style={styles.resultText}>{item.name}</Text> */}
                    //         <Text style={styles.resultText}>{getNodeName(item.id, language)}</Text>
                    //     </TouchableOpacity>
                    // )}
                    renderItem={({ item }) => 
                        (
                        <TouchableOpacity
                            style={styles.resultItem}
                            onPress={() => handleSelect(item)}
                        >
                            <Text style={styles.resultText}>
                                {highlightMatch(getNodeName(item.id, language), searchText)}
                            </Text>
                        </TouchableOpacity>
                    )}
                    keyboardShouldPersistTaps="always"
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No results found</Text>
                        </View>
                    }
                />
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: 50,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: {
        marginRight: 15,
    },
    searchInput: {
        flex: 1,
        height: 40,
        fontSize: 16,
        color: '#000',
    },
    resultItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    resultText: {
        fontSize: 16,
        color: '#000000',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
        color: '#888',
    },
});

export default FullScreenAutocomplete;