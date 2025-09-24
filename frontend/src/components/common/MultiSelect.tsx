import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Text,
  VStack,
  HStack,
  Portal,
} from '@chakra-ui/react';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  maxW?: string;
  isLoading?: boolean;
  loadingText?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selectedValues,
  onChange,
  placeholder = "Seleccionar opciones",
  maxW = "200px",
  isLoading = false,
  loadingText = "Cargando..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggleOption = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onChange(newValues);
  };

  const handleSelectAll = () => {
    if (selectedValues.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map(option => option.value));
    }
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) {
      return placeholder;
    }
    if (selectedValues.length === 1) {
      const option = options.find(opt => opt.value === selectedValues[0]);
      return option?.label || selectedValues[0];
    }
    if (selectedValues.length === options.length) {
      return "Todas seleccionadas";
    }
    return `${selectedValues.length} seleccionadas`;
  };

  return (
    <Box position="relative" ref={containerRef} maxW={maxW}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        w="100%"
        h="auto"
        p={2}
        border="1px solid"
        borderColor="gray.300"
        rounded="md"
        bg="white"
        color="black"
        fontWeight="normal"
        fontSize="sm"
        justifyContent="space-between"
        _hover={{ bg: "gray.50" }}
        _active={{ bg: "gray.100" }}
      >
        <HStack w="100%" justify="space-between">
          <Text 
            textAlign="left" 
            flex="1" 
            overflow="hidden" 
            whiteSpace="nowrap" 
            textOverflow="ellipsis"
          >
            {getDisplayText()}
          </Text>
          <Text fontSize="xs" color="gray.500">
            {isOpen ? "▲" : "▼"}
          </Text>
        </HStack>
      </Button>

      {isOpen && (
        <Portal>
          <Box
            position="absolute"
            top="100%"
            left={0}
            right={0}
            zIndex={1000}
            bg="white"
            border="1px solid"
            borderColor="gray.300"
            borderTop="none"
            rounded="md"
            roundedTop="none"
            shadow="lg"
            maxH="200px"
            overflowY="auto"
          >
            <VStack gap={0} align="stretch">
              {isLoading ? (
                <Box p={3} textAlign="center">
                  <Text fontSize="sm" color="gray.500">
                    {loadingText}
                  </Text>
                </Box>
              ) : (
                <>
                  {options.length > 1 && (
                    <>
                      <Box
                        p={2}
                        cursor="pointer"
                        _hover={{ bg: "gray.50" }}
                        onClick={handleSelectAll}
                        borderBottom="1px solid"
                        borderColor="gray.100"
                      >
                        <HStack>
                          <input
                            type="checkbox"
                            checked={selectedValues.length === options.length}
                            onChange={handleSelectAll}
                            style={{ margin: 0 }}
                          />
                          <Text fontSize="sm" fontWeight="medium">
                            Seleccionar todas
                          </Text>
                        </HStack>
                      </Box>
                    </>
                  )}
                  {options.map((option) => (
                    <Box
                      key={option.value}
                      p={2}
                      cursor="pointer"
                      _hover={{ bg: "gray.50" }}
                      onClick={() => handleToggleOption(option.value)}
                    >
                      <HStack>
                        <input
                          type="checkbox"
                          checked={selectedValues.includes(option.value)}
                          onChange={() => handleToggleOption(option.value)}
                          style={{ margin: 0 }}
                        />
                        <Text fontSize="sm">{option.label}</Text>
                      </HStack>
                    </Box>
                  ))}
                </>
              )}
            </VStack>
          </Box>
        </Portal>
      )}
    </Box>
  );
};

export default MultiSelect;