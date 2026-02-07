import React, { useState, useEffect, useRef } from 'react';
import { Text, TextProps } from 'react-native';

interface Props extends TextProps {
  text: string;
  speed?: number; // Speed in ms per character
  onComplete?: () => void;
}

export default function TypewriterText({ text, speed = 30, onComplete, style, ...props }: Props) {
  const [displayedText, setDisplayedText] = useState('');
  const index = useRef(0);
  const timer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setDisplayedText('');
    index.current = 0;
    if (timer.current) clearInterval(timer.current);

    timer.current = setInterval(() => {
      if (index.current < text.length) {
        index.current++;
        setDisplayedText(text.substring(0, index.current));
      } else {
        if (timer.current) clearInterval(timer.current);
        if (onComplete) onComplete();
      }
    }, speed);

    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [text]);

  return <Text style={style} {...props}>{displayedText}</Text>;
}
