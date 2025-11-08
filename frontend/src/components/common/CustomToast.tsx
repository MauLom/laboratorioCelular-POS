import React, { useEffect, useState } from "react";
import { Box } from "@chakra-ui/react";

export function CustomToast({ message, status }: { message: string; status: string }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const color = status === "success" ? "green.500" : status === "error" ? "red.500" : "blue.500";

  return (
    <Box
      position="fixed"
      top="20px"
      right="20px"
      bg={color}
      color="white"
      p="10px 20px"
      borderRadius="8px"
      zIndex={9999}
      boxShadow="lg"
    >
      {message}
    </Box>
  );
}